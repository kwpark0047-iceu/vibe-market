import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowUpDown,
  Database,
  ExternalLink,
  GitCommitHorizontal,
  GitPullRequest,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
} from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  CreatorMilestoneKind,
  GitHubMilestonesPayload,
  ProjectMilestoneRecord,
  TimelineEntry,
  TimelineFilterMode,
  TimelineSortOrder,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import type { MakerVerificationInfo } from '../lib/makerVerification';
import {
  buildTimelineEntries,
  computeGapDaysBetweenEntries,
  computeTimelineCadence,
  filterTimelineEntries,
  formatTimelineDateShort,
  summarizeTimelineCounts,
} from '../lib/projectTimeline';
import { formatActivityTimestamp } from '../lib/communityActivity';
import { validateMilestoneLogInput } from '../lib/validation';

const ADMIN_EMAIL = 'kwpark0047@iceu.kr';

interface ProjectMilestoneTimelineProps {
  project: CatalogProject;
  makerVerification: MakerVerificationInfo;
  language: AppLanguage;
  user: User | null;
  creatorMilestones: ReadonlyArray<ProjectMilestoneRecord>;
  milestonesLoading?: boolean;
  onCreateMilestone: (payload: {
    kind: CreatorMilestoneKind;
    versionTag: string;
    title: string;
    summary: string;
    externalUrl: string;
    occurredAtIso: string;
  }) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onSignIn: () => void;
  onOpenClaimForm: () => void;
}

function getSourceDotColor(source: TimelineEntry['source']): string {
  switch (source) {
    case 'github_release':
      return '#16a34a';
    case 'github_commit':
      return '#64748b';
    case 'creator_log':
      return '#2563eb';
    case 'catalog_event':
      return '#d97706';
  }
}

function renderEntryIcon(entry: TimelineEntry) {
  if (entry.source === 'github_release') {
    return <Tag className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />;
  }
  if (entry.source === 'github_commit') {
    return (
      <GitCommitHorizontal className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
    );
  }
  if (entry.source === 'creator_log') {
    switch (entry.kind) {
      case 'launch':
        return <Rocket className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />;
      case 'release':
        return <Tag className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />;
      case 'feature':
        return <Sparkles className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />;
      case 'fix':
        return <Wrench className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />;
      default:
        return (
          <GitPullRequest className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
        );
    }
  }
  if (entry.kind === 'verified') {
    return <ShieldCheck className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />;
  }
  return <Database className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />;
}

function getSourceNodeClass(source: TimelineEntry['source']): string {
  switch (source) {
    case 'github_release':
      return 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/70';
    case 'github_commit':
      return 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900';
    case 'creator_log':
      return 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/70';
    case 'catalog_event':
      return 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/70';
  }
}

export function ProjectMilestoneTimeline({
  project,
  makerVerification,
  language,
  user,
  creatorMilestones,
  milestonesLoading = false,
  onCreateMilestone,
  onDeleteMilestone,
  onSignIn,
  onOpenClaimForm,
}: ProjectMilestoneTimelineProps) {
  const copy = UI_STRINGS[language].detail;

  const [filterMode, setFilterMode] = useState<TimelineFilterMode>('all');
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>('newest');
  const [composerOpen, setComposerOpen] = useState<boolean>(false);

  const [githubData, setGithubData] = useState<GitHubMilestonesPayload | null>(null);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [kind, setKind] = useState<CreatorMilestoneKind>('release');
  const [versionTag, setVersionTag] = useState<string>('');
  const [occurredDate, setOccurredDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = Boolean(user?.email && user.email === ADMIN_EMAIL);
  const isOwner = Boolean(user && !project.isCuratedSeed && project.ownerUid === user.uid);
  const canPublishCreatorLog = Boolean(user && (isOwner || isAdmin));

  useEffect(() => {
    setFilterMode('all');
    setComposerOpen(false);
    setFormError(null);
    setGithubData(null);
    setGithubError(null);

    if (!project.githubRepo) {
      setGithubLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setGithubLoading(true);

    const load = async () => {
      try {
        const resp = await fetch(
          `/api/github/milestones?repo=${encodeURIComponent(project.githubRepo)}`,
          { signal: controller.signal }
        );
        const json = (await resp.json()) as GitHubMilestonesPayload & { error?: string };
        if (cancelled) return;
        if (!resp.ok) {
          setGithubError(json.error || `HTTP ${resp.status}`);
          return;
        }
        setGithubData(json);
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setGithubError(err instanceof Error ? err.message : 'Failed to load repository milestones');
        }
      } finally {
        if (!cancelled) setGithubLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project.id, project.githubRepo]);

  const allEntries = useMemo(
    () =>
      buildTimelineEntries({
        project,
        makerVerification,
        language,
        githubMilestones: githubData,
        creatorMilestones,
        sortOrder,
      }),
    [project, makerVerification, language, githubData, creatorMilestones, sortOrder]
  );

  const counts = useMemo(() => summarizeTimelineCounts(allEntries), [allEntries]);
  const visibleEntries = useMemo(
    () => filterTimelineEntries(allEntries, filterMode),
    [allEntries, filterMode]
  );

  const cadence = useMemo(() => computeTimelineCadence(allEntries), [allEntries]);

  const sourceLabelMap: Record<TimelineEntry['source'], string> = {
    github_release: copy.timelineSourceRelease,
    github_commit: copy.timelineSourceCommit,
    creator_log: copy.timelineSourceCreator,
    catalog_event: copy.timelineSourceCatalog,
  };

  const creatorKindLabelMap: Record<CreatorMilestoneKind, string> = {
    release: copy.timelineKindRelease,
    launch: copy.timelineKindLaunch,
    feature: copy.timelineKindFeature,
    update: copy.timelineKindUpdate,
    fix: copy.timelineKindFix,
  };

  const filterTabs: Array<{ id: TimelineFilterMode; label: string; count: number }> = [
    { id: 'all', label: copy.timelineFilterAll, count: counts.all },
    { id: 'releases', label: copy.timelineFilterReleases, count: counts.releases },
    { id: 'commits', label: copy.timelineFilterCommits, count: counts.commits },
    { id: 'creator_logs', label: copy.timelineFilterCreatorLogs, count: counts.creatorLogs },
  ];

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const check = validateMilestoneLogInput(
      {
        kind,
        versionTag,
        title,
        summary,
        externalUrl,
        occurredDate,
      },
      language
    );
    if (!check.success) {
      setFormError(check.summaryMessage);
      return;
    }

    setPublishing(true);
    try {
      await onCreateMilestone({
        kind: check.data.kind,
        versionTag: check.data.versionTag,
        title: check.data.title,
        summary: check.data.summary,
        externalUrl: check.data.externalUrl,
        occurredAtIso: `${check.data.occurredDate}T12:00:00.000Z`,
      });
      setTitle('');
      setVersionTag('');
      setSummary('');
      setExternalUrl('');
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish milestone');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    setDeletingId(milestoneId);
    try {
      await onDeleteMilestone(milestoneId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      aria-labelledby="project-timeline-heading"
      data-testid="project-milestone-timeline"
      className="scroll-mt-24 rounded-xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="project-timeline-heading"
            className="text-sm font-bold text-slate-900 dark:text-white"
          >
            {copy.timelineTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.timelineSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="timeline-sort-toggle"
            onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{sortOrder === 'newest' ? copy.timelineSortNewest : copy.timelineSortOldest}</span>
          </button>

          <button
            type="button"
            data-testid="timeline-add-toggle"
            aria-expanded={composerOpen}
            onClick={() => setComposerOpen((prev) => !prev)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              composerOpen
                ? 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                : 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{composerOpen ? copy.timelineCloseComposer : copy.timelineAddButton}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label={copy.timelineTitle}
        className="mt-3 flex flex-wrap items-center gap-1.5"
      >
        {filterTabs.map((tab) => {
          const isActive = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`timeline-filter-${tab.id}`}
              onClick={() => setFilterMode(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* D3 ScaleTime Temporal Cadence Strip */}
      {cadence && cadence.markers.length > 1 && (
        <div
          data-testid="timeline-cadence-strip"
          className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-semibold">{copy.timelineCadenceLabel}</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {cadence.startDate} — {cadence.endDate} ({cadence.spanDays}
                {copy.timelineSpanDaysSuffix})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                {copy.timelineSourceRelease}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
                {copy.timelineSourceCommit}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                {copy.timelineSourceCreator}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
                {copy.timelineSourceCatalog}
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 720 22"
            preserveAspectRatio="xMidYMid meet"
            className="mt-1.5 h-5 w-full overflow-visible"
            role="img"
            aria-label={copy.timelineCadenceLabel}
          >
            <line
              x1="28"
              y1="11"
              x2="692"
              y2="11"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-slate-300 dark:text-slate-700"
            />
            {cadence.markers.map((marker) => (
              <circle
                key={marker.id}
                cx={Number((marker.xPercent * 7.2).toFixed(1))}
                cy={11}
                r={marker.source === 'github_commit' ? 3.5 : 5.2}
                fill={getSourceDotColor(marker.source)}
                fillOpacity={marker.source === 'github_commit' ? 0.72 : 0.95}
                stroke="white"
                strokeWidth="1"
                className="dark:stroke-slate-950"
              >
                <title>{`${marker.dateLabel} · ${marker.title}`}</title>
              </circle>
            ))}
          </svg>
        </div>
      )}

      {/* Collapsible Creator Milestone Composer */}
      {composerOpen && (
        <div
          data-testid="timeline-composer-panel"
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          {!user ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {copy.timelineAuthNoticeSignedOut}
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="shrink-0 whitespace-nowrap rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
              >
                {copy.timelineSignInCta}
              </button>
            </div>
          ) : !canPublishCreatorLog ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {copy.timelineAuthNoticeNotOwner}
              </p>
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  onOpenClaimForm();
                }}
                className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copy.timelineClaimCta}
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handlePublish(e)} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="milestone-kind"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {copy.timelineKindLabel}
                  </label>
                  <select
                    id="milestone-kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as CreatorMilestoneKind)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="release">{copy.timelineKindRelease}</option>
                    <option value="launch">{copy.timelineKindLaunch}</option>
                    <option value="feature">{copy.timelineKindFeature}</option>
                    <option value="update">{copy.timelineKindUpdate}</option>
                    <option value="fix">{copy.timelineKindFix}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="milestone-version"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {copy.timelineVersionLabel}
                  </label>
                  <input
                    id="milestone-version"
                    type="text"
                    maxLength={40}
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="v1.4.0"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="milestone-date"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {copy.timelineDateLabel}
                  </label>
                  <input
                    id="milestone-date"
                    type="date"
                    value={occurredDate}
                    onChange={(e) => setOccurredDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="milestone-title"
                  className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  {copy.timelineEntryTitleLabel}
                </label>
                <input
                  id="milestone-title"
                  type="text"
                  maxLength={140}
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="milestone-summary"
                  className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  {copy.timelineSummaryLabel}
                </label>
                <textarea
                  id="milestone-summary"
                  rows={2}
                  maxLength={800}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="milestone-url"
                  className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  {copy.timelineUrlLabel}
                </label>
                <input
                  id="milestone-url"
                  type="url"
                  maxLength={500}
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/releases/tag/v1.4.0"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-400">
                  {formError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={publishing}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {publishing ? copy.timelinePublishingButton : copy.timelinePublishButton}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Notices */}
      {githubError && project.githubRepo && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {copy.timelineRepoErrorNotice}
        </p>
      )}
      {!project.githubRepo && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {copy.timelineNoRepoNote}
        </p>
      )}

      {/* Vertical Timeline Spine & Nodes */}
      <div className="mt-4">
        {(githubLoading || milestonesLoading) && visibleEntries.length <= 2 ? (
          <div className="space-y-3 py-2" aria-busy="true">
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.timelineLoadingLabel}</p>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div
            data-testid="project-timeline-empty"
            className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900/40"
          >
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {copy.timelineEmptyTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {filterMode === 'creator_logs' ? copy.timelineEmptyCreatorBody : copy.timelineEmptyBody}
            </p>
          </div>
        ) : (
          <ol data-testid="project-milestone-timeline-list" className="relative space-y-0">
            {visibleEntries.map((entry, idx) => {
              const prevEntry = idx > 0 ? visibleEntries[idx - 1] : undefined;
              const gapDays = computeGapDaysBetweenEntries(prevEntry, entry);
              const isLast = idx === visibleEntries.length - 1;
              const canDeleteEntry = Boolean(
                entry.creatorRecord &&
                  user &&
                  (entry.creatorRecord.authorUid === user.uid || isAdmin)
              );

              return (
                <li key={entry.id} data-testid={`timeline-entry-${entry.source}`} className="relative">
                  {gapDays > 0 && (
                    <div className="relative flex items-center py-2 pl-10">
                      <span
                        aria-hidden="true"
                        className="absolute top-0 bottom-0 left-3.5 w-px border-l border-dashed border-slate-300 dark:border-slate-700"
                      />
                      <span className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                        +{gapDays}
                        {copy.timelineGapSuffix}
                      </span>
                    </div>
                  )}

                  <div className={`relative flex gap-3.5 ${isLast ? 'pb-1' : 'pb-4'}`}>
                    {/* Vertical Spine Rail */}
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="absolute top-7 bottom-0 left-3.5 w-px bg-slate-200 dark:bg-slate-800"
                      />
                    )}

                    {/* Node Marker */}
                    <span
                      className={`relative z-10 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${getSourceNodeClass(
                        entry.source
                      )}`}
                    >
                      {renderEntryIcon(entry)}
                    </span>

                    {/* Event Content Card (Single-elevation 1px hairline border) */}
                    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {entry.source === 'creator_log' && entry.creatorRecord
                              ? `${sourceLabelMap[entry.source]} · ${
                                  creatorKindLabelMap[entry.creatorRecord.kind]
                                }`
                              : sourceLabelMap[entry.source]}
                          </span>

                          {entry.versionTag && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                                {entry.versionTag}
                              </span>
                            </>
                          )}

                          {entry.actorLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{entry.actorLabel}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <time
                            dateTime={entry.timestampIso}
                            title={entry.timestampIso}
                            className="whitespace-nowrap font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                          >
                            {(() => {
                              const shortDate = formatTimelineDateShort(entry.timestampIso);
                              const relative = formatActivityTimestamp(entry.timestampIso, language);
                              return relative && relative !== shortDate
                                ? `${shortDate} · ${relative}`
                                : shortDate;
                            })()}
                          </time>

                          {canDeleteEntry && entry.creatorRecord && (
                            <button
                              type="button"
                              disabled={deletingId === entry.creatorRecord.id}
                              aria-label={`${copy.timelineDeleteButton}: ${entry.title}`}
                              onClick={() => void handleDelete(entry.creatorRecord!.id)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="mt-1 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
                        {entry.title}
                      </h4>

                      {entry.summary && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {entry.summary}
                        </p>
                      )}

                      {entry.externalUrl && (
                        <div className="mt-2">
                          <a
                            href={entry.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400"
                          >
                            <span>{copy.timelineExternalLink}</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
