import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RefreshCw, TrendingUp } from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  ProjectActivityRecord,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import {
  buildVibeVolatilityGeometry,
  computeVibeVolatilityAnalysis,
  type SentimentPaceVerdict,
  type VolatilityChartMode,
} from '../lib/vibeVolatility';

interface VibeVolatilityTrendChartProps {
  project: CatalogProject;
  allProjects: ReadonlyArray<CatalogProject>;
  activities: ReadonlyArray<ProjectActivityRecord>;
  isLiked: boolean;
  isBookmarked: boolean;
  isSyncing: boolean;
  onSyncSingleGithub: (project: CatalogProject) => void;
  language: AppLanguage;
}

const VERDICT_TEXT_CLASS: Record<SentimentPaceVerdict, string> = {
  keeping_pace: 'text-emerald-700 dark:text-emerald-400',
  sentiment_leading: 'text-blue-700 dark:text-blue-400',
  adoption_outpacing: 'text-amber-700 dark:text-amber-400',
  baseline_awaiting_history: 'text-slate-700 dark:text-slate-300',
  unsynced: 'text-slate-600 dark:text-slate-400',
};

export function VibeVolatilityTrendChart({
  project,
  allProjects,
  activities,
  isLiked,
  isBookmarked,
  isSyncing,
  onSyncSingleGithub,
  language,
}: VibeVolatilityTrendChartProps) {
  const copy = UI_STRINGS[language].detail;
  const cardCopy = UI_STRINGS[language].card;
  const [mode, setMode] = useState<VolatilityChartMode>('pace_overlay');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  const xAxisRef = useRef<SVGGElement | null>(null);
  const leftAxisRef = useRef<SVGGElement | null>(null);
  const rightAxisRef = useRef<SVGGElement | null>(null);

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

  // Reset scrubbed index when switching projects
  useEffect(() => {
    setHoveredIdx(null);
    setSelectedIdx(null);
  }, [project.id]);

  const analysis = useMemo(
    () =>
      computeVibeVolatilityAnalysis({
        project,
        allProjects,
        activities,
        isLiked,
        isBookmarked,
      }),
    [project, allProjects, activities, isLiked, isBookmarked]
  );

  const geometry = useMemo(
    () => buildVibeVolatilityGeometry(analysis, { width: 620, height: 248 }),
    [analysis]
  );

  const activePointIndex = useMemo(() => {
    const count = geometry.plotPoints.length;
    if (count === 0) return -1;
    if (hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < count) return hoveredIdx;
    if (selectedIdx !== null && selectedIdx >= 0 && selectedIdx < count) return selectedIdx;
    return count - 1;
  }, [geometry.plotPoints.length, hoveredIdx, selectedIdx]);

  const activePoint =
    activePointIndex >= 0 ? geometry.plotPoints[activePointIndex] ?? null : null;

  // Render D3 bottom, left, and right SVG axes cleanly
  useEffect(() => {
    if (
      !xAxisRef.current ||
      !leftAxisRef.current ||
      !rightAxisRef.current ||
      geometry.plotPoints.length === 0
    ) {
      return;
    }

    const pts = geometry.plotPoints;
    const midIdx = Math.floor((pts.length - 1) / 2);
    const tickLabels = Array.from(
      new Set([
        pts[0].shortDate,
        pts[Math.floor(pts.length / 4)]?.shortDate ?? pts[0].shortDate,
        pts[midIdx]?.shortDate ?? pts[0].shortDate,
        pts[Math.floor((pts.length * 3) / 4)]?.shortDate ?? pts[pts.length - 1].shortDate,
        pts[pts.length - 1].shortDate,
      ])
    );

    const xAxis = d3.axisBottom(geometry.xScale).tickValues(tickLabels).tickSizeOuter(0);
    const xg = d3.select(xAxisRef.current);
    xg.call(xAxis);
    xg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10.5px');

    const leftScale = mode === 'pace_overlay' ? geometry.vibeYScale : geometry.swingYScale;
    const leftAxis = d3
      .axisLeft(leftScale)
      .tickSizeOuter(0)
      .tickFormat((val) => {
        const num = Number(val);
        if (mode === 'daily_swing' && num > 0) return `+${num}`;
        return `${num}`;
      });
    if (mode === 'pace_overlay') {
      leftAxis.tickValues([0, 25, 50, 75, 100]);
    } else {
      leftAxis.ticks(4);
    }
    const lg = d3.select(leftAxisRef.current);
    lg.call(leftAxis);
    lg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    lg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    lg.selectAll('.tick text')
      .attr('fill', isDark ? '#93c5fd' : '#1d4ed8')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10.5px');

    const rightAxis = d3
      .axisRight(geometry.starRateYScale)
      .ticks(4)
      .tickSizeOuter(0)
      .tickFormat((val) => {
        const n = Number(val);
        return n >= 10 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`;
      });
    const rg = d3.select(rightAxisRef.current);
    rg.call(rightAxis);
    rg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    rg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    rg.selectAll('.tick text')
      .attr('fill', isDark ? '#fbbf24' : '#b45309')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10.5px');
  }, [geometry, mode, isDark]);

  const verdictCopyMap: Record<
    SentimentPaceVerdict,
    { label: string; description: string }
  > = {
    keeping_pace: {
      label: copy.volatilityVerdictKeepingPace,
      description: copy.volatilityVerdictKeepingPaceDesc,
    },
    sentiment_leading: {
      label: copy.volatilityVerdictSentimentLeading,
      description: copy.volatilityVerdictSentimentLeadingDesc,
    },
    adoption_outpacing: {
      label: copy.volatilityVerdictAdoptionOutpacing,
      description: copy.volatilityVerdictAdoptionOutpacingDesc,
    },
    baseline_awaiting_history: {
      label: copy.volatilityVerdictBaseline,
      description: copy.volatilityVerdictBaselineDesc,
    },
    unsynced: {
      label: copy.volatilityVerdictUnsynced,
      description: copy.volatilityVerdictUnsyncedDesc,
    },
  };

  const verdictInfo = verdictCopyMap[analysis.paceVerdict];
  const vibeHex = isDark ? '#60a5fa' : '#1d4ed8';
  const bandFillHex = isDark ? '#3b82f6' : '#2563eb';
  const starHex = isDark ? '#fbbf24' : '#d97706';
  const negSwingHex = isDark ? '#fb7185' : '#e11d48';
  const gridHex = isDark ? '#1e293b' : '#f1f5f9';

  const colHitWidth =
    geometry.plotPoints.length > 1
      ? geometry.innerWidth / Math.max(1, geometry.plotPoints.length - 1)
      : 32;

  return (
    <section
      aria-labelledby="vibe-volatility-heading"
      data-testid="vibe-volatility-section"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header + Mode Segmented Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
              aria-hidden="true"
            />
            <h3
              id="vibe-volatility-heading"
              className="text-sm font-bold text-slate-900 dark:text-white"
            >
              {copy.volatilityTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {copy.volatilitySubtitle}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={copy.volatilityTitle}
          className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'pace_overlay'}
            data-testid="volatility-tab-pace"
            onClick={() => setMode('pace_overlay')}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'pace_overlay'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {copy.volatilityModePace}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'daily_swing'}
            data-testid="volatility-tab-swing"
            onClick={() => setMode('daily_swing')}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'daily_swing'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {copy.volatilityModeSwing}
          </button>
        </div>
      </div>

      {/* 4-Column Tabular KPI Summary Strip */}
      <dl className="mt-4 grid grid-cols-2 gap-y-3 divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 py-2.5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.volatilityMetricStdDev}
          </dt>
          <dd
            data-testid="volatility-kpi-stddev"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
          >
            <span>±{analysis.volatilityStdDev.toFixed(1)}</span>
            <span className="mt-0.5 block text-[11px] font-normal whitespace-nowrap text-slate-500 dark:text-slate-400">
              {copy.volatilityMetricMaxSwing}: {analysis.maxDailySwing} pt
            </span>
          </dd>
        </div>

        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.volatilityMetricNetVibe}
          </dt>
          <dd
            data-testid="volatility-kpi-net-vibe"
            className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
              analysis.netVibeDelta >= 0
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {analysis.netVibeDelta >= 0 ? `+${analysis.netVibeDelta}` : analysis.netVibeDelta} pt
          </dd>
        </div>

        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.volatilityMetricStarRate}
          </dt>
          <dd
            data-testid="volatility-kpi-star-rate"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400"
          >
            {analysis.starTrackingStatus === 'tracked'
              ? `+${analysis.starGrowthRatePct14d.toFixed(1)}%`
              : analysis.starTrackingStatus === 'baseline_single_snapshot'
                ? `★ ${analysis.totalStars.toLocaleString()}`
                : cardCopy.notSynced}
          </dd>
        </div>

        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.volatilityVerdictLabel}
          </dt>
          <dd
            data-testid="volatility-pace-verdict"
            className={`mt-0.5 truncate text-xs font-bold ${VERDICT_TEXT_CLASS[analysis.paceVerdict]}`}
            title={verdictInfo.label}
          >
            {verdictInfo.label}
          </dd>
        </div>
      </dl>

      {/* Diagnostic Alignment Verdict Note + Optional Sync CTA */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-300">{verdictInfo.description}</p>
        {project.githubRepo && analysis.starTrackingStatus === 'unsynced' && (
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => onSyncSingleGithub(project)}
            data-testid="volatility-sync-github-btn"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? copy.syncing : copy.syncGithubNow}</span>
          </button>
        )}
      </div>

      {/* Inline Chart Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {mode === 'pace_overlay' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-0.5 w-4 bg-blue-700 dark:bg-blue-400"
                />
                <span>{copy.volatilityLegendVibeScore}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-4 rounded-xs bg-blue-600/20 dark:bg-blue-400/25"
                />
                <span>{copy.volatilityLegendBand}</span>
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-xs bg-blue-700 dark:bg-blue-400"
              />
              <span>{copy.volatilityLegendSwing}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-0 w-4 border-t-2 border-dashed border-amber-600 dark:border-amber-400"
            />
            <span>{copy.volatilityLegendStarRate}</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {copy.volatilityScrubHint}
        </span>
      </div>

      {/* D3 Dual-Trend Responsive SVG */}
      <div className="mt-2 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          role="img"
          aria-label={copy.volatilityTitle}
          data-testid="d3-vibe-volatility-chart"
          className="h-auto w-full select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <g transform={`translate(${geometry.margin.left},${geometry.margin.top})`}>
            {/* Axis Role Captions */}
            <text
              x={0}
              y={-11}
              textAnchor="start"
              fill={vibeHex}
              fontSize={10}
              fontWeight={600}
            >
              {mode === 'pace_overlay'
                ? copy.volatilityLeftAxisLabel
                : copy.volatilitySwingAxisLabel}
            </text>
            <text
              x={geometry.innerWidth}
              y={-11}
              textAnchor="end"
              fill={starHex}
              fontSize={10}
              fontWeight={600}
            >
              {copy.volatilityRightAxisLabel}
            </text>

            {/* Horizontal Gridlines */}
            {(mode === 'pace_overlay'
              ? [0, 25, 50, 75, 100]
              : geometry.swingYScale.ticks(4)
            ).map((tickVal) => {
              const yPos =
                mode === 'pace_overlay'
                  ? geometry.vibeYScale(tickVal)
                  : geometry.swingYScale(tickVal);
              const isZeroLine = mode === 'daily_swing' && tickVal === 0;
              return (
                <line
                  key={tickVal}
                  x1={0}
                  x2={geometry.innerWidth}
                  y1={yPos}
                  y2={yPos}
                  stroke={isZeroLine ? (isDark ? '#475569' : '#94a3b8') : gridHex}
                  strokeWidth={isZeroLine ? 1.25 : 1}
                  strokeDasharray={isZeroLine ? '3 3' : undefined}
                />
              );
            })}

            {/* Active Scrub Vertical Hairline */}
            {activePoint && (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={geometry.innerHeight}
                stroke={isDark ? '#475569' : '#cbd5e1'}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {mode === 'pace_overlay' ? (
              <>
                {/* Shaded Volatility Envelope (± rolling σ) */}
                {geometry.volatilityBandPath && (
                  <path
                    data-testid="vibe-volatility-band-path"
                    d={geometry.volatilityBandPath}
                    fill={bandFillHex}
                    fillOpacity={isDark ? 0.22 : 0.14}
                  />
                )}

                {/* Vibe Score Trajectory Line */}
                {geometry.vibeLinePath && (
                  <path
                    data-testid="vibe-volatility-score-path"
                    d={geometry.vibeLinePath}
                    fill="none"
                    stroke={vibeHex}
                    strokeWidth={2.4}
                  />
                )}
              </>
            ) : (
              <>
                {/* Daily Vibe Score Swing Bars around Zero */}
                {geometry.plotPoints.map((pt) => {
                  const barTop = Math.min(pt.vibeSwingY, geometry.swingZeroY);
                  const barHeight = Math.max(2, Math.abs(pt.vibeSwingY - geometry.swingZeroY));
                  const barW = Math.min(18, Math.max(8, colHitWidth * 0.42));
                  const isActive = activePoint?.index === pt.index;
                  const fill = pt.vibeDelta >= 0 ? vibeHex : negSwingHex;
                  return (
                    <rect
                      key={`swing-${pt.date}`}
                      x={pt.x - barW / 2}
                      y={barTop}
                      width={barW}
                      height={barHeight}
                      rx={2}
                      fill={fill}
                      fillOpacity={isActive ? 0.95 : 0.72}
                    />
                  );
                })}
              </>
            )}

            {/* Star Growth Rate Dashed Comparison Trend Line */}
            {geometry.starRateLinePath && (
              <path
                data-testid="vibe-volatility-star-rate-path"
                d={geometry.starRateLinePath}
                fill="none"
                stroke={starHex}
                strokeWidth={2}
                strokeDasharray={analysis.starTrackingStatus === 'tracked' ? '5 3' : '2 4'}
                opacity={analysis.starTrackingStatus === 'tracked' ? 0.95 : 0.6}
              />
            )}

            {/* Interactive Marker Dots & Keyboard-Accessible Hit Columns */}
            {geometry.plotPoints.map((pt) => {
              const isActive = activePoint?.index === pt.index;
              const primaryY = mode === 'pace_overlay' ? pt.vibeY : pt.vibeSwingY;

              return (
                <g
                  key={pt.date}
                  role="button"
                  tabIndex={0}
                  data-testid={`volatility-point-${pt.index}`}
                  aria-label={`${pt.date}: Vibe ${pt.vibeScore} (${pt.vibeDelta >= 0 ? `+${pt.vibeDelta}` : pt.vibeDelta}), ${copy.volatilityRightAxisLabel} ${pt.starGrowthRatePct.toFixed(1)}%`}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setHoveredIdx(pt.index)}
                  onFocus={() => setSelectedIdx(pt.index)}
                  onClick={() => setSelectedIdx(pt.index)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setSelectedIdx(pt.index);
                    }
                  }}
                >
                  <rect
                    x={pt.x - colHitWidth / 2}
                    y={0}
                    width={colHitWidth}
                    height={geometry.innerHeight}
                    fill="transparent"
                  />

                  <circle
                    cx={pt.x}
                    cy={pt.starRateY}
                    r={isActive ? 4.2 : 2.5}
                    fill={starHex}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={1.25}
                  />

                  <circle
                    cx={pt.x}
                    cy={primaryY}
                    r={isActive ? 4.8 : 3}
                    fill={mode === 'daily_swing' && pt.vibeDelta < 0 ? negSwingHex : vibeHex}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}

            {/* D3 Axes */}
            <g ref={xAxisRef} transform={`translate(0,${geometry.innerHeight})`} />
            <g ref={leftAxisRef} />
            <g ref={rightAxisRef} transform={`translate(${geometry.innerWidth},0)`} />
          </g>
        </svg>
      </div>

      {/* Selected / Hovered Point Inspector Bar */}
      {activePoint && (
        <div
          data-testid="volatility-inspector-bar"
          className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800"
        >
          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
            {copy.volatilityDateLabel}: {activePoint.date}
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
            <span className="text-blue-700 dark:text-blue-400">
              Vibe {activePoint.vibeScore}/100 (±{activePoint.rollingStdDev.toFixed(1)}σ)
            </span>
            <span
              className={
                activePoint.vibeDelta >= 0
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-rose-700 dark:text-rose-400'
              }
            >
              {copy.volatilityVibeDeltaLabel}:{' '}
              {activePoint.vibeDelta >= 0 ? `+${activePoint.vibeDelta}` : activePoint.vibeDelta}
            </span>
            <span className="text-amber-700 dark:text-amber-400">
              {copy.volatilityStarGainLabel}:{' '}
              {analysis.starTrackingStatus === 'tracked'
                ? `+${activePoint.githubStarsDelta.toLocaleString()} (${activePoint.starGrowthRatePct.toFixed(1)}%)`
                : analysis.starTrackingStatus === 'baseline_single_snapshot'
                  ? `★ ${activePoint.githubStars.toLocaleString()}`
                  : cardCopy.notSynced}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
