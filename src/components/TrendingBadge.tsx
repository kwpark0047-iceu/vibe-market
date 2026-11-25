import { TrendingUp } from 'lucide-react';
import { UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import type { EngagementTrendingInfo } from '../lib/trendingEngagement';
import type { TrendingProjectInfo } from '../lib/trendingStars';
import type { AppLanguage } from '../types/vibeatlas';

interface TrendingBadgeProps {
  language: AppLanguage;
  engagementTrending?: EngagementTrendingInfo;
  starTrending?: TrendingProjectInfo;
  variant?: 'card' | 'detail';
  className?: string;
}

export function TrendingBadge({
  language,
  engagementTrending,
  starTrending,
  variant = 'card',
  className = '',
}: TrendingBadgeProps) {
  const copy = UI_STRINGS[language].card;

  const hasEngagement = Boolean(engagementTrending && engagementTrending.totalGained7d > 0);
  const hasStars = Boolean(starTrending && starTrending.starsGained7d > 0);

  if (!hasEngagement && !hasStars) return null;

  let tooltip = '';
  let metricLabel = '';

  if (hasEngagement && engagementTrending) {
    tooltip = copy.trendingEngagementTooltip
      .replace('{likes}', engagementTrending.likesGained7d.toLocaleString())
      .replace('{bookmarks}', engagementTrending.bookmarksGained7d.toLocaleString())
      .replace('{total}', engagementTrending.totalGained7d.toLocaleString());
    metricLabel = `+${formatCompactCount(engagementTrending.totalGained7d)}`;
  } else if (starTrending) {
    tooltip = copy.trending7dTooltip.replace(
      '{count}',
      starTrending.starsGained7d.toLocaleString()
    );
    metricLabel = `+${formatCompactCount(starTrending.starsGained7d)}`;
  }

  const sizeClass = variant === 'detail' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[11px]';
  const iconClass = variant === 'detail' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <span
      data-testid="trending-badge"
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-orange-300 bg-orange-50/95 font-semibold leading-none text-orange-900 dark:border-orange-800/80 dark:bg-orange-950/60 dark:text-orange-200 ${sizeClass} ${className}`.trim()}
    >
      <TrendingUp className={`${iconClass} shrink-0`} aria-hidden="true" />
      <span>{copy.trendingBadge}</span>
      <span className="font-mono tabular-nums">{metricLabel}</span>
    </span>
  );
}
