import { useMemo, useState } from 'react';
import { Activity, Bookmark, Clock, Flag, Heart } from 'lucide-react';
import type {
  AppLanguage,
  CommunityActivityType,
  ProjectActivityRecord,
  ProjectReportRecord,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import {
  filterCommunityActivitiesByType,
  formatActivityTimestamp,
  summarizeCommunityActivityCounts,
} from '../lib/communityActivity';

interface ProjectCommunityActivityProps {
  language: AppLanguage;
  activities: ReadonlyArray<ProjectActivityRecord>;
  loading?: boolean;
  error?: string | null;
}

export function ProjectCommunityActivity({
  language,
  activities,
  loading = false,
  error = null,
}: ProjectCommunityActivityProps) {
  const [filterType, setFilterType] = useState<'all' | CommunityActivityType>('all');
  const copy = UI_STRINGS[language].detail;

  const counts = useMemo(() => summarizeCommunityActivityCounts(activities), [activities]);
  const visibleActivities = useMemo(
    () => filterCommunityActivitiesByType(activities, filterType),
    [activities, filterType]
  );

  const reasonLabelMap: Record<ProjectReportRecord['reason'], string> = {
    broken_link: copy.activityReasonBrokenLink,
    stale_metadata: copy.activityReasonStaleMetadata,
    misattribution: copy.activityReasonMisattribution,
    spam: copy.activityReasonSpam,
    security_concern: copy.activityReasonSecurityConcern,
  };

  const filterTabs: Array<{
    id: 'all' | CommunityActivityType;
    label: string;
    count: number;
  }> = [
    { id: 'all', label: copy.activityFilterAll, count: counts.all },
    { id: 'like', label: copy.activityFilterLikes, count: counts.like },
    { id: 'bookmark', label: copy.activityFilterBookmarks, count: counts.bookmark },
    { id: 'report', label: copy.activityFilterReports, count: counts.report },
  ];

  return (
    <section
      aria-labelledby="community-activity-heading"
      data-testid="community-activity-section"
      className="rounded-xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="community-activity-heading"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
          >
            <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <span>{copy.communityActivityTitle}</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.communityActivitySubtitle}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={copy.communityActivityTitle}
          className="flex flex-wrap items-center gap-1.5"
        >
          {filterTabs.map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterType(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
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
      </div>

      {error && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {copy.activityErrorNotice}
        </p>
      )}

      <div className="mt-4">
        {loading && visibleActivities.length === 0 ? (
          <div className="space-y-2 py-2" aria-busy="true">
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.activityLoadingLabel}</p>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-11 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : visibleActivities.length === 0 ? (
          <div
            data-testid="community-activity-empty"
            className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900/40"
          >
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {copy.activityEmptyTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {copy.activityEmptySubtitle}
            </p>
          </div>
        ) : (
          <ol
            data-testid="community-activity-feed"
            className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/40 dark:divide-slate-800/80 dark:border-slate-800 dark:bg-slate-900/40"
          >
            {visibleActivities.map((item) => {
              const actorDisplay =
                item.actorUid === 'guest' || !item.actorName
                  ? copy.activityGuestActor
                  : item.actorName;

              let actionText = copy.activityActionLike;
              let iconEl = <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />;
              let iconBgClass = 'bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900';

              if (item.type === 'bookmark') {
                actionText = copy.activityActionBookmark;
                iconEl = <Bookmark className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />;
                iconBgClass = 'bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-900';
              } else if (item.type === 'report') {
                actionText = copy.activityActionReport;
                iconEl = <Flag className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
                iconBgClass = 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900';
              }

              const reasonText =
                item.type === 'report' && item.reportReason
                  ? reasonLabelMap[item.reportReason] || item.reportReason
                  : '';

              return (
                <li
                  key={item.id}
                  data-testid={`community-activity-item-${item.type}`}
                  className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-xs"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${iconBgClass}`}
                    >
                      {iconEl}
                    </span>
                    <div className="min-w-0">
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {actorDisplay}
                        </span>{' '}
                        <span>{actionText}</span>
                        {reasonText && (
                          <span className="ml-1.5 inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            {reasonText}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <time
                    dateTime={item.createdAtIso}
                    title={item.createdAtIso}
                    className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                  >
                    <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span>{formatActivityTimestamp(item.createdAtIso, language)}</span>
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
