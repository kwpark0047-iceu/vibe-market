import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  ProjectActivityRecord,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import {
  buildVibeGaugeGeometry,
  computeProjectVibeScore,
  type VibeScoreTier,
} from '../lib/vibeScore';

interface VibeScoreGaugeProps {
  project: CatalogProject;
  allProjects: ReadonlyArray<CatalogProject>;
  activities: ReadonlyArray<ProjectActivityRecord>;
  isLiked: boolean;
  isBookmarked: boolean;
  language: AppLanguage;
}

const TIER_COLORS: Record<
  VibeScoreTier,
  {
    lightStroke: string;
    darkStroke: string;
    lightTextClass: string;
    darkTextClass: string;
    barClass: string;
  }
> = {
  thriving: {
    lightStroke: '#059669',
    darkStroke: '#34d399',
    lightTextClass: 'text-emerald-700',
    darkTextClass: 'dark:text-emerald-400',
    barClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  active: {
    lightStroke: '#1d4ed8',
    darkStroke: '#60a5fa',
    lightTextClass: 'text-blue-700',
    darkTextClass: 'dark:text-blue-400',
    barClass: 'bg-blue-700 dark:bg-blue-400',
  },
  warm: {
    lightStroke: '#d97706',
    darkStroke: '#fbbf24',
    lightTextClass: 'text-amber-700',
    darkTextClass: 'dark:text-amber-400',
    barClass: 'bg-amber-600 dark:bg-amber-400',
  },
  quiet: {
    lightStroke: '#64748b',
    darkStroke: '#94a3b8',
    lightTextClass: 'text-slate-600',
    darkTextClass: 'dark:text-slate-300',
    barClass: 'bg-slate-500 dark:bg-slate-400',
  },
};

export function VibeScoreGauge({
  project,
  allProjects,
  activities,
  isLiked,
  isBookmarked,
  language,
}: VibeScoreGaugeProps) {
  const copy = UI_STRINGS[language].detail;
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const breakdown = useMemo(
    () =>
      computeProjectVibeScore({
        project,
        allProjects,
        activities,
        isLiked,
        isBookmarked,
      }),
    [project, allProjects, activities, isLiked, isBookmarked]
  );

  const outerRadius = 104;
  const innerRadius = 78;
  const geometry = useMemo(
    () => buildVibeGaugeGeometry(breakdown.score, { outerRadius, innerRadius }),
    [breakdown.score]
  );

  const tierLabels: Record<VibeScoreTier, string> = {
    thriving: copy.vibeScoreTierThriving,
    active: copy.vibeScoreTierActive,
    warm: copy.vibeScoreTierWarm,
    quiet: copy.vibeScoreTierQuiet,
  };

  const activeTierStyle = TIER_COLORS[breakdown.tier];
  const activeHex = isDark ? activeTierStyle.darkStroke : activeTierStyle.lightStroke;

  // Radial arc-tip pointer coordinates (positioned cleanly on the arc rim so center text stays unobstructed)
  const sinA = Math.sin(geometry.needleAngleRad);
  const cosA = Math.cos(geometry.needleAngleRad);
  const midRadius = (innerRadius + outerRadius) / 2;
  const markerCx = midRadius * sinA;
  const markerCy = -midRadius * cosA;
  const pointerBaseRadius = outerRadius + 11;
  const pointerTipRadius = outerRadius + 2;
  const perpX = cosA * 4.2;
  const perpY = sinA * 4.2;
  const tipX = pointerTipRadius * sinA;
  const tipY = -pointerTipRadius * cosA;
  const baseLeftX = pointerBaseRadius * sinA - perpX;
  const baseLeftY = -pointerBaseRadius * cosA - perpY;
  const baseRightX = pointerBaseRadius * sinA + perpX;
  const baseRightY = -pointerBaseRadius * cosA + perpY;

  const pillarRows = [
    {
      key: 'affinity' as const,
      label: copy.vibeScorePillarAffinity,
      pillar: breakdown.pillars.affinity,
      dimmed: false,
    },
    {
      key: 'momentum' as const,
      label: copy.vibeScorePillarMomentum,
      pillar: breakdown.pillars.momentum,
      dimmed: false,
    },
    {
      key: 'traction' as const,
      label: copy.vibeScorePillarTraction,
      pillar: breakdown.pillars.traction,
      dimmed: !breakdown.isGithubSynced,
    },
    {
      key: 'health' as const,
      label: copy.vibeScorePillarHealth,
      pillar: breakdown.pillars.health,
      dimmed: false,
    },
  ];

  return (
    <section
      aria-labelledby="vibe-score-heading"
      data-testid="vibe-score-section"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity
              className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
              aria-hidden="true"
            />
            <h3
              id="vibe-score-heading"
              className="text-sm font-bold text-slate-900 dark:text-white"
            >
              {copy.vibeScoreTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {copy.vibeScoreSubtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 md:grid-cols-12 md:items-center dark:border-slate-800">
        {/* Left: D3 Semicircular Gauge */}
        <div className="flex flex-col items-center justify-center md:col-span-5">
          <div className="w-full max-w-[290px]">
            <svg
              viewBox="-152 -140 304 164"
              role="img"
              aria-label={`${copy.vibeScoreTitle}: ${breakdown.score} ${copy.vibeScoreOutOf100} (${tierLabels[breakdown.tier]})`}
              data-testid="d3-vibe-score-gauge"
              className="h-auto w-full select-none"
            >
              {/* Threshold Zone Rim Bands (0-25, 25-50, 50-75, 75-100) */}
              {geometry.segments.map((seg) => {
                const segStyle = TIER_COLORS[seg.tier];
                const isCurrentTier = seg.tier === breakdown.tier;
                return (
                  <path
                    key={seg.tier}
                    d={seg.path}
                    fill={isDark ? segStyle.darkStroke : segStyle.lightStroke}
                    opacity={isCurrentTier ? 0.95 : isDark ? 0.24 : 0.22}
                  />
                );
              })}

              {/* Main 180-degree Track Arc */}
              <path
                d={geometry.trackPath}
                fill={isDark ? '#1e293b' : '#e2e8f0'}
              />

              {/* Active Score Arc */}
              {geometry.activePath && (
                <path
                  d={geometry.activePath}
                  fill={activeHex}
                />
              )}

              {/* Inner Tick Marks & Scale Labels */}
              {geometry.ticks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={tick.innerX}
                    y1={tick.innerY}
                    x2={tick.outerX}
                    y2={tick.outerY}
                    stroke={isDark ? '#475569' : '#94a3b8'}
                    strokeWidth={1.25}
                  />
                  <text
                    x={tick.labelX}
                    y={tick.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {tick.value}
                  </text>
                </g>
              ))}

              {/* Arc Pointer Marker & Radial Rim Indicator */}
              <polygon
                points={`${tipX},${tipY} ${baseLeftX},${baseLeftY} ${baseRightX},${baseRightY}`}
                fill={isDark ? '#f8fafc' : '#0f172a'}
              />
              <circle
                cx={markerCx}
                cy={markerCy}
                r={5.5}
                fill={isDark ? '#0f172a' : '#ffffff'}
                stroke={activeHex}
                strokeWidth={3}
              />

              {/* Centered Tabular Numeric Readout */}
              <text
                x={0}
                y={-34}
                textAnchor="middle"
                fill={isDark ? '#f8fafc' : '#0f172a'}
                fontSize={38}
                fontWeight={700}
                data-testid="vibe-score-value"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {breakdown.score}
              </text>
              <text
                x={0}
                y={-12}
                textAnchor="middle"
                fill={isDark ? '#94a3b8' : '#64748b'}
                fontSize={11}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {copy.vibeScoreOutOf100}
              </text>

              {/* Tier Sentiment Label along baseline */}
              <text
                x={0}
                y={12}
                textAnchor="middle"
                fill={activeHex}
                fontSize={13}
                fontWeight={700}
                data-testid="vibe-score-tier"
              >
                {tierLabels[breakdown.tier]}
              </text>
            </svg>
          </div>
        </div>

        {/* Right: Transparent 4-Pillar Engagement & Health Breakdown */}
        <div className="space-y-3 border-t border-slate-200 pt-4 md:col-span-7 md:border-t-0 md:border-l md:pl-5 md:pt-0 dark:border-slate-800">
          {pillarRows.map((row) => {
            const pct = Math.round(row.pillar.ratio * 100);
            return (
              <div key={row.key}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span
                    className={`truncate font-medium ${
                      row.dimmed
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {row.label}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                    {row.pillar.score}
                    <span className="text-slate-400 dark:text-slate-500">
                      /{row.pillar.maxScore}
                    </span>
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  role="progressbar"
                  aria-label={row.label}
                  aria-valuenow={row.pillar.score}
                  aria-valuemin={0}
                  aria-valuemax={row.pillar.maxScore}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      row.dimmed
                        ? 'bg-slate-300 dark:bg-slate-700'
                        : activeTierStyle.barClass
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {row.key === 'traction' && !breakdown.isGithubSynced && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {copy.vibeScoreUnsyncedNote}
                  </p>
                )}
              </div>
            );
          })}

          {breakdown.reportCount > 0 && (
            <div
              data-testid="vibe-score-report-penalty"
              className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-rose-700 dark:border-slate-800 dark:text-rose-400"
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {copy.vibeScoreReportsPenalty} ({breakdown.reportCount})
                </span>
              </span>
              <span className="font-mono font-semibold tabular-nums">
                -{breakdown.reportPenalty}
              </span>
            </div>
          )}

          <p className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {copy.vibeScoreFormulaNote}
          </p>
        </div>
      </div>
    </section>
  );
}
