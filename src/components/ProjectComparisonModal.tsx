import { useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  GitFork,
  Heart,
  HelpCircle,
  Star,
  X,
} from 'lucide-react';
import type { AppLanguage, CatalogProject } from '../types/vibeatlas';
import {
  BACKEND_LABELS,
  CONTENT_TYPE_LABELS,
  HOSTING_LABELS,
  PLATFORM_LABELS,
  PRICING_LABELS,
  UI_STRINGS,
} from '../data/i18n';
import {
  computeFreshnessState,
  detectMissingFields,
  formatCompactCount,
} from '../lib/catalogEngine';
import { computeComparisonLeaders } from '../lib/projectComparison';
import { sanitizeExternalUrl } from '../lib/validation';

interface ProjectComparisonModalProps {
  isOpen: boolean;
  projects: CatalogProject[];
  language: AppLanguage;
  onClose: () => void;
  onRemoveProject: (projectId: string) => void;
  onClearAll: () => void;
  onOpenDetail: (project: CatalogProject) => void;
}

export function ProjectComparisonModal({
  isOpen,
  projects,
  language,
  onClose,
  onRemoveProject,
  onClearAll,
  onOpenDetail,
}: ProjectComparisonModalProps) {
  const copy = UI_STRINGS[language].compare;
  const cardCopy = UI_STRINGS[language].card;
  const detailCopy = UI_STRINGS[language].detail;

  const leaders = useMemo(() => computeComparisonLeaders(projects), [projects]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || projects.length === 0) return null;

  const renderVerificationCell = (project: CatalogProject) => {
    const provenanceLabel =
      project.provenanceSource === 'github_sync'
        ? 'GitHub Sync'
        : project.provenanceSource === 'maker_submitted'
          ? 'Maker Submitted'
          : 'Editorial';

    const statusNode =
      project.verificationStatus === 'verified' ? (
        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{cardCopy.verifiedLabel}</span>
        </span>
      ) : project.verificationStatus === 'pending' ? (
        <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{cardCopy.pendingLabel}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{cardCopy.unverifiedLabel}</span>
        </span>
      );

    return (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {statusNode}
        <span aria-hidden="true" className="text-slate-400">
          ·
        </span>
        <span className="text-slate-600 dark:text-slate-300">{provenanceLabel}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      data-testid="compare-projects-modal"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2
                id="compare-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {copy.modalTitle}
              </h2>
              <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {projects.length} / 3
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {copy.modalSubtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copy.clearButton}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.closeButton}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              <span>{copy.closeButton}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-44 min-w-[160px] border-r border-slate-200 bg-slate-50 px-4 py-3.5 align-top text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                >
                  {copy.colAttribute}
                </th>
                {projects.map((project) => {
                  const tagline =
                    language === 'ko' && project.taglineKo
                      ? project.taglineKo
                      : project.tagline;
                  return (
                    <th
                      key={project.id}
                      scope="col"
                      className="min-w-[210px] border-r border-slate-200 px-4 py-3.5 align-top last:border-r-0 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDetail(project);
                          }}
                          className="text-left text-sm font-bold text-slate-900 hover:text-blue-700 hover:underline dark:text-white dark:hover:text-blue-400"
                        >
                          {project.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveProject(project.id)}
                          aria-label={`${copy.removeAction}: ${project.name}`}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 line-clamp-2 font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                        {tagline}
                      </p>
                      <p className="mt-1.5 font-normal text-[11px] text-slate-500 dark:text-slate-400">
                        {project.makerName}
                        {project.makerHandle ? ` · ${project.makerHandle}` : ''}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Section: GitHub Metrics */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/50">
                <th
                  colSpan={projects.length + 1}
                  scope="colgroup"
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                >
                  {copy.sectionGithub}
                </th>
              </tr>

              {/* Row: GitHub Stars */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowGithubStars}
                </th>
                {projects.map((project) => {
                  const isHighest = leaders.highestStarsId === project.id;
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      {project.githubRepo && project.lastSyncedAt ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            <span>{project.githubStars.toLocaleString()}</span>
                          </span>
                          {isHighest && (
                            <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {copy.highestBadge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {project.githubRepo ? cardCopy.notSynced : copy.notAvailable}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: GitHub Forks */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowGithubForks}
                </th>
                {projects.map((project) => {
                  const isHighest = leaders.highestForksId === project.id;
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      {project.githubRepo && project.lastSyncedAt ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-mono font-medium tabular-nums text-slate-800 dark:text-slate-200">
                            <GitFork className="h-3.5 w-3.5 text-slate-400" />
                            <span>{project.githubForks.toLocaleString()}</span>
                          </span>
                          {isHighest && (
                            <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {copy.highestBadge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {project.githubRepo ? cardCopy.notSynced : copy.notAvailable}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: License */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowLicense}
                </th>
                {projects.map((project) => {
                  const missing = detectMissingFields(project).includes('license');
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      {missing ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          {cardCopy.missingLicense}
                        </span>
                      ) : (
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {project.license}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: GitHub Repository */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowRepository}
                </th>
                {projects.map((project) => {
                  const safeGh = sanitizeExternalUrl(project.githubUrl);
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      {project.githubRepo && safeGh ? (
                        <a
                          href={safeGh}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-blue-700 hover:underline dark:text-blue-400"
                        >
                          <span className="break-all">{project.githubRepo}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {copy.notAvailable}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Last Synced */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowLastSynced}
                </th>
                {projects.map((project) => {
                  const freshness = computeFreshnessState(project.lastSyncedAt);
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      {project.lastSyncedAt ? (
                        <span
                          className={`font-mono tabular-nums ${
                            freshness === 'stale'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {project.lastSyncedAt.slice(0, 10)}
                          {freshness === 'stale' ? ` (${cardCopy.staleLabel})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {cardCopy.notSynced}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Section: Metadata & Tech Stack */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/50">
                <th
                  colSpan={projects.length + 1}
                  scope="colgroup"
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                >
                  {copy.sectionMetadata}
                </th>
              </tr>

              {/* Row: Content Type */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowContentType}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 text-slate-800 last:border-r-0 dark:border-slate-800 dark:text-slate-200"
                  >
                    {CONTENT_TYPE_LABELS[language][project.contentType]}
                  </td>
                ))}
              </tr>

              {/* Row: Categories */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowCategories}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 leading-relaxed text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                  >
                    {project.categories.length > 0
                      ? project.categories.join(' · ')
                      : copy.notAvailable}
                  </td>
                ))}
              </tr>

              {/* Row: Development Platform */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowPlatform}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 text-slate-800 last:border-r-0 dark:border-slate-800 dark:text-slate-200"
                  >
                    {PLATFORM_LABELS[project.developmentPlatform]}
                  </td>
                ))}
              </tr>

              {/* Row: Hosting & Backend */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowHostingBackend}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                  >
                    {HOSTING_LABELS[project.hostingProvider]} ·{' '}
                    {BACKEND_LABELS[project.backendTech]}
                  </td>
                ))}
              </tr>

              {/* Row: Tech Stack */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowTechStack}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 leading-relaxed text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                  >
                    {project.techStack.length > 0
                      ? project.techStack.join(' · ')
                      : copy.notAvailable}
                  </td>
                ))}
              </tr>

              {/* Row: Pricing Model */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowPricing}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 text-slate-800 last:border-r-0 dark:border-slate-800 dark:text-slate-200"
                  >
                    {PRICING_LABELS[language][project.pricingModel]}
                  </td>
                ))}
              </tr>

              {/* Row: Verification & Provenance */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowVerification}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                  >
                    {renderVerificationCell(project)}
                  </td>
                ))}
              </tr>

              {/* Row: Country & Language */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowCountryLang}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 font-mono text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
                  >
                    {project.country} · {project.language.toUpperCase()}
                  </td>
                ))}
              </tr>

              {/* Row: Updated At */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowUpdatedAt}
                </th>
                {projects.map((project) => {
                  const isLatest = leaders.mostRecentUpdateId === project.id;
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {project.updatedAtIso
                            ? project.updatedAtIso.slice(0, 10)
                            : copy.notAvailable}
                        </span>
                        {isLatest && (
                          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                            {copy.latestBadge}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Section: Community Signals & Links */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/50">
                <th
                  colSpan={projects.length + 1}
                  scope="colgroup"
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                >
                  {copy.sectionCommunity}
                </th>
              </tr>

              {/* Row: Engagement */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowEngagement}
                </th>
                {projects.map((project) => (
                  <td
                    key={project.id}
                    className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          leaders.highestLikesId === project.id
                            ? 'font-semibold text-rose-700 dark:text-rose-400'
                            : ''
                        }`}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        {formatCompactCount(project.likesCount)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          leaders.highestBookmarksId === project.id
                            ? 'font-semibold text-blue-700 dark:text-blue-400'
                            : ''
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {formatCompactCount(project.bookmarksCount)}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: External Links & Inspect */}
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copy.rowLinks}
                </th>
                {projects.map((project) => {
                  const safeDemo = sanitizeExternalUrl(project.liveDemoUrl);
                  const safeSite = sanitizeExternalUrl(project.websiteUrl);
                  return (
                    <td
                      key={project.id}
                      className="border-r border-slate-200 px-4 py-3 last:border-r-0 dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDetail(project);
                          }}
                          className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-md bg-slate-900 px-2.5 text-[11px] font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {copy.openDetail}
                        </button>
                        {safeDemo && (
                          <a
                            href={safeDemo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <span>{detailCopy.liveDemo}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {!safeDemo && safeSite && (
                          <a
                            href={safeSite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <span>{detailCopy.officialWebsite}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
