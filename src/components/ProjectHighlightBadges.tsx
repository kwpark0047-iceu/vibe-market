import { Activity, Award, Rocket } from 'lucide-react';
import { UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import type {
  ProjectHighlightBadge,
  ProjectHighlightBadgeKind,
} from '../lib/projectHighlightBadges';
import type { AppLanguage } from '../types/vibeatlas';

interface ProjectHighlightBadgesProps {
  badges: ReadonlyArray<ProjectHighlightBadge>;
  language: AppLanguage;
  variant?: 'card' | 'detail';
  className?: string;
}

const BADGE_STYLE_MAP: Record<ProjectHighlightBadgeKind, string> = {
  featured:
    'border-blue-200 bg-blue-50/90 text-blue-800 dark:border-blue-800/80 dark:bg-blue-950/60 dark:text-blue-200',
  new_arrival:
    'border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200',
  high_activity:
    'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-200',
};

function resolveBadgeText(
  badge: ProjectHighlightBadge,
  language: AppLanguage
): { label: string; tooltip: string } {
  const copy = UI_STRINGS[language].highlights;

  if (badge.kind === 'featured') {
    return {
      label: copy.featured,
      tooltip: copy.featuredTooltip,
    };
  }

  if (badge.kind === 'new_arrival') {
    const dateText = badge.referenceDate || '';
    const tooltip = dateText
      ? copy.newArrivalTooltip.replace('{date}', dateText)
      : copy.newArrivalTooltip.replace(' ({date})', '').replace(' ({date})', '').replace('{date}', '');
    return {
      label: copy.newArrival,
      tooltip,
    };
  }

  // high_activity
  let tooltip = copy.highActivityTooltip;
  if (badge.reason === 'github_stars_7d' && typeof badge.metricValue === 'number' && badge.metricValue > 0) {
    tooltip = copy.highActivityStarsTooltip.replace('{count}', formatCompactCount(badge.metricValue));
  } else if (
    badge.reason === 'community_signals_7d' &&
    typeof badge.metricValue === 'number' &&
    badge.metricValue > 0
  ) {
    tooltip = copy.highActivitySignalsTooltip.replace('{count}', String(badge.metricValue));
  }

  return {
    label: copy.highActivity,
    tooltip,
  };
}

function BadgeIcon({
  kind,
  sizeClass,
}: {
  kind: ProjectHighlightBadgeKind;
  sizeClass: string;
}) {
  if (kind === 'featured') {
    return <Award className={`${sizeClass} shrink-0`} aria-hidden="true" />;
  }
  if (kind === 'new_arrival') {
    return <Rocket className={`${sizeClass} shrink-0`} aria-hidden="true" />;
  }
  return <Activity className={`${sizeClass} shrink-0`} aria-hidden="true" />;
}

export function ProjectHighlightBadges({
  badges,
  language,
  variant = 'card',
  className = '',
}: ProjectHighlightBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const copy = UI_STRINGS[language].highlights;
  const paddingClass = variant === 'detail' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[11px]';
  const iconClass = variant === 'detail' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <div
      data-testid={variant === 'detail' ? 'detail-highlight-badges' : 'card-highlight-badges'}
      aria-label={copy.containerLabel}
      className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}
    >
      {badges.map((badge) => {
        const { label, tooltip } = resolveBadgeText(badge, language);
        return (
          <span
            key={badge.kind}
            data-testid={`highlight-badge-${badge.kind}`}
            title={tooltip}
            aria-label={tooltip}
            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border font-semibold leading-none ${paddingClass} ${BADGE_STYLE_MAP[badge.kind]}`}
          >
            <BadgeIcon kind={badge.kind} sizeClass={iconClass} />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
