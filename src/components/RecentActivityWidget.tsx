import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bookmark,
  Clock,
  Heart,
  Pause,
  Play,
  Rocket,
} from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  ProjectActivityRecord,
} from '../types/vibeatlas';
import { PLATFORM_LABELS, UI_STRINGS } from '../data/i18n';
import { formatActivityTimestamp } from '../lib/communityActivity';
import {
  buildPlatformActivityFeed,
  type PlatformFeedItemType,
} from '../lib/recentPlatformFeed';

interface RecentActivityWidgetProps {
  language: AppLanguage;
  projects: ReadonlyArray<CatalogProject>;
  firestoreActivities?: ReadonlyArray<ProjectActivityRecord>;
  localActivities?: ReadonlyArray<ProjectActivityRecord>;
  onOpenDetail: (project: CatalogProject) => void;
}

export function RecentActivityWidget({
  language,
  projects,
  firestoreActivities = [],
  localActivities = [],
  onOpenDetail,
}: RecentActivityWidgetProps) {
  const homeCopy = UI_STRINGS[language].home;

  const [filterType, setFilterType] = useState<'all' | PlatformFeedItemType>('all');
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollRemainderRef = useRef(0);
  const prevTopItemIdRef = useRef<string | null>(null);

  const feed = useMemo(
    () =>
      buildPlatformActivityFeed({
        projects,
        firestoreActivities,
        localActivities,
        filterType,
        limit: 24,
      }),
    [projects, firestoreActivities, localActivities, filterType]
  );

  const projectById = useMemo(() => {
    const map = new Map<string, CatalogProject>();
    for (const p of projects) {
      map.set(p.id, p);
      map.set(p.slug, p);
    }
    return map;
  }, [projects]);

  const filterTabs: Array<{
    id: 'all' | PlatformFeedItemType;
    label: string;
    count: number;
  }> = [
    { id: 'all', label: homeCopy.recentActivityFilterAll, count: feed.counts.all },
    {
      id: 'submission',
      label: homeCopy.recentActivityFilterSubmissions,
      count: feed.counts.submission,
    },
    { id: 'like', label: homeCopy.recentActivityFilterLikes, count: feed.counts.like },
    {
      id: 'bookmark',
      label: homeCopy.recentActivityFilterBookmarks,
      count: feed.counts.bookmark,
    },
  ];

  // Jump viewport back to top when a brand-new live interaction lands at index 0
  const topItemId = feed.items[0]?.id ?? null;
  const topItemIsLive = Boolean(feed.items[0]?.isLiveEvent);
  useEffect(() => {
    if (prevTopItemIdRef.current && topItemId && prevTopItemIdRef.current !== topItemId && topItemIsLive) {
      const el = viewportRef.current;
      if (el) {
        el.scrollTop = 0;
        scrollRemainderRef.current = 0;
      }
    }
    prevTopItemIdRef.current = topItemId;
  }, [topItemId, topItemIsLive]);

  // Continuous gentle vertical auto-scroll with automatic pause on hover, focus, or reduced-motion
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || feed.items.length <= 4) return;
    if (isUserPaused || isHoverPaused || isFocusPaused) return;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let rafId = 0;
    let lastTs = 0;
    const pixelsPerSecond = 24;

    const step = (ts: number) => {
      if (lastTs > 0 && el.scrollHeight > el.clientHeight + 4) {
        const dt = Math.min(100, ts - lastTs);
        scrollRemainderRef.current += (dt * pixelsPerSecond) / 1000;
        const wholePx = Math.floor(scrollRemainderRef.current);
        if (wholePx >= 1) {
          scrollRemainderRef.current -= wholePx;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
            el.scrollTop = 0;
          } else {
            el.scrollTop += wholePx;
          }
        }
      }
      lastTs = ts;
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [feed.items.length, filterType, isUserPaused, isHoverPaused, isFocusPaused]);

  const autoScrollActive = !isUserPaused && !isHoverPaused && !isFocusPaused && feed.items.length > 4;

  return (
    <section
      aria-labelledby="home-recent-activity-heading"
      data-testid="home-recent-activity"
      data-autoscroll={autoScrollActive ? 'running' : 'paused'}
      className="mx-auto max-w-7xl px-4 sm:px-6"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2
                id="home-recent-activity-heading"
                className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white"
              >
                <Activity className="h-5 w-5 shrink-0 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                <span>{homeCopy.recentActivityTitle}</span>
              </h2>
              <span className="font-mono text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                · {feed.counts.all} {homeCopy.recentActivityLiveCountSuffix}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
              {homeCopy.recentActivitySubtitle}
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <div
              role="tablist"
              aria-label={homeCopy.recentActivityTitle}
              className="flex w-full max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-auto dark:border-slate-800 dark:bg-slate-950"
            >
              {filterTabs.map((tab) => {
                const isActive = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setFilterType(tab.id);
                      if (viewportRef.current) {
                        viewportRef.current.scrollTop = 0;
                        scrollRemainderRef.current = 0;
                      }
                    }}
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-2.5 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-pressed={!isUserPaused}
              onClick={() => setIsUserPaused((prev) => !prev)}
              data-testid="recent-activity-scroll-toggle"
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                !isUserPaused
                  ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {isUserPaused ? (
                <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {isUserPaused
                  ? homeCopy.recentActivityAutoScrollPaused
                  : homeCopy.recentActivityAutoScrollOn}
              </span>
            </button>
          </div>
        </div>

        {/* Scrolling Feed Container */}
        {feed.items.length === 0 ? (
          <div
            data-testid="recent-activity-empty"
            className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {homeCopy.recentActivityEmptyTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {homeCopy.recentActivityEmptyBody}
            </p>
            {filterType !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {homeCopy.recentActivityShowAllButton}
              </button>
            )}
          </div>
        ) : (
          <div
            ref={viewportRef}
            data-testid="recent-activity-viewport"
            onMouseEnter={() => setIsHoverPaused(true)}
            onMouseLeave={() => setIsHoverPaused(false)}
            onFocusCapture={() => setIsFocusPaused(true)}
            onBlurCapture={() => setIsFocusPaused(false)}
            className="mt-4 h-[284px] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <ol
              data-testid="recent-activity-feed"
              className="divide-y divide-slate-100 dark:divide-slate-800/80"
            >
              {feed.items.map((item) => {
                const targetProject =
                  projectById.get(item.projectId) ?? projectById.get(item.projectSlug);

                const rawActor = item.actorName.trim();
                const actorDisplay =
                  rawActor && rawActor !== 'Guest'
                    ? rawActor
                    : item.deltaCount
                      ? homeCopy.recentActivityCommunityActor
                      : homeCopy.recentActivityGuestActor;

                let actionVerb = homeCopy.recentActivityActionLiked;
                let typeLabel = homeCopy.recentActivityFilterLikes;
                let iconEl = (
                  <Heart
                    className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400"
                    aria-hidden="true"
                  />
                );
                let iconBoxClass =
                  'border-rose-200 bg-rose-50 dark:border-rose-900/80 dark:bg-rose-950/60';

                if (item.type === 'submission') {
                  actionVerb = homeCopy.recentActivityActionSubmitted;
                  typeLabel = homeCopy.recentActivityFilterSubmissions;
                  iconEl = (
                    <Rocket
                      className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  );
                  iconBoxClass =
                    'border-emerald-200 bg-emerald-50 dark:border-emerald-900/80 dark:bg-emerald-950/60';
                } else if (item.type === 'bookmark') {
                  actionVerb = homeCopy.recentActivityActionBookmarked;
                  typeLabel = homeCopy.recentActivityFilterBookmarks;
                  iconEl = (
                    <Bookmark
                      className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400"
                      aria-hidden="true"
                    />
                  );
                  iconBoxClass =
                    'border-blue-200 bg-blue-50 dark:border-blue-900/80 dark:bg-blue-950/60';
                }

                return (
                  <li
                    key={item.id}
                    data-testid={`recent-activity-item-${item.type}`}
                    className={`flex min-h-[56px] items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-white dark:hover:bg-slate-900/80 ${
                      item.isLiveEvent ? 'bg-blue-50/30 dark:bg-blue-950/15' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${iconBoxClass}`}
                      >
                        {iconEl}
                      </span>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="line-clamp-2 break-words text-xs leading-snug text-slate-700 sm:truncate sm:text-sm dark:text-slate-200">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {actorDisplay}
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-300">{actionVerb}</span>{' '}
                          <button
                            type="button"
                            disabled={!targetProject}
                            onClick={() => targetProject && onOpenDetail(targetProject)}
                            className="inline break-words text-left font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400"
                          >
                            {item.projectName}
                          </button>
                        </p>

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{typeLabel}</span>
                          {typeof item.deltaCount === 'number' && item.deltaCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono font-medium tabular-nums text-slate-700 dark:text-slate-300">
                                +{item.deltaCount} {homeCopy.recentActivityDeltaSuffix}
                              </span>
                            </>
                          )}
                          {item.platformKey && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{PLATFORM_LABELS[item.platformKey]}</span>
                            </>
                          )}
                          {item.isLiveEvent && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {homeCopy.recentActivityLiveLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <time
                        dateTime={item.timestampIso}
                        title={item.timestampIso}
                        className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                      >
                        <Clock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>{formatActivityTimestamp(item.timestampIso, language)}</span>
                      </time>

                      {targetProject && (
                        <button
                          type="button"
                          onClick={() => onOpenDetail(targetProject)}
                          aria-label={`${homeCopy.recentActivityOpenProject}: ${item.projectName}`}
                          className="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
                        >
                          <span>{homeCopy.recentActivityOpenProject}</span>
                          <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
