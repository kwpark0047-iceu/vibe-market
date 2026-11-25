import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Flame,
  TrendingUp,
} from 'lucide-react';
import type { AppLanguage, CatalogProject } from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import {
  computeProjectGrowthVelocities,
  type GrowthVelocityMetric,
  type VelocitySeriesPoint,
} from '../lib/growthVelocity';

interface TrendingVelocityChartProps {
  language: AppLanguage;
  projects: CatalogProject[];
  snapshotRevision?: number;
  onOpenDetail: (project: CatalogProject) => void;
}

function truncateLabel(name: string, maxChars: number): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1)}…`;
}

export function TrendingVelocityChart({
  language,
  projects,
  snapshotRevision = 0,
  onOpenDetail,
}: TrendingVelocityChartProps) {
  const copy = UI_STRINGS[language].trendingSection;
  const [collapsed, setCollapsed] = useState(false);
  const [metricOverride, setMetricOverride] = useState<GrowthVelocityMetric | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  const barXAxisRef = useRef<SVGGElement | null>(null);
  const sparkXAxisRef = useRef<SVGGElement | null>(null);
  const sparkYAxisRef = useRef<SVGGElement | null>(null);

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

  const summary = useMemo(
    () =>
      computeProjectGrowthVelocities(projects, {
        metric: metricOverride ?? undefined,
        limit: 6,
      }),
    [projects, metricOverride, snapshotRevision]
  );

  const activeMetric = summary.metric;
  const entries = summary.entries;

  const spotlightEntry = useMemo(() => {
    if (entries.length === 0) return null;
    if (hoveredProjectId) {
      const hovered = entries.find((e) => e.project.id === hoveredProjectId);
      if (hovered) return hovered;
    }
    if (selectedProjectId) {
      const chosen = entries.find((e) => e.project.id === selectedProjectId);
      if (chosen) return chosen;
    }
    return entries[0];
  }, [entries, hoveredProjectId, selectedProjectId]);

  // Bar chart D3 dimensions & scales
  const barSvgWidth = 548;
  const barSvgHeight = Math.max(150, entries.length * 34 + 44);
  const barMargin = { top: 8, right: 124, bottom: 28, left: 158 };
  const barInnerWidth = barSvgWidth - barMargin.left - barMargin.right;
  const barInnerHeight = barSvgHeight - barMargin.top - barMargin.bottom;

  const { yBandScale, xBarScale } = useMemo(() => {
    const domainIds = entries.map((e) => e.project.id);
    const yScale = d3
      .scaleBand<string>()
      .domain(domainIds)
      .range([0, barInnerHeight])
      .padding(0.28);

    const maxDelta = Math.max(1, d3.max(entries, (e) => e.totalDelta) ?? 1);
    const xScale = d3
      .scaleLinear()
      .domain([0, maxDelta * 1.08])
      .range([0, barInnerWidth])
      .nice();

    return { yBandScale: yScale, xBarScale: xScale };
  }, [entries, barInnerHeight, barInnerWidth]);

  // Trajectory chart D3 dimensions & scales
  const sparkSvgWidth = 360;
  const sparkSvgHeight = 192;
  const sparkMargin = { top: 12, right: 14, bottom: 26, left: 40 };
  const sparkInnerWidth = sparkSvgWidth - sparkMargin.left - sparkMargin.right;
  const sparkInnerHeight = sparkSvgHeight - sparkMargin.top - sparkMargin.bottom;

  const sparkSeries = spotlightEntry?.series ?? [];

  const { txScale, tyScale, linePath, areaPath } = useMemo(() => {
    const labels = sparkSeries.map((pt) => pt.shortDate);
    const xScale = d3
      .scalePoint<string>()
      .domain(labels)
      .range([0, sparkInnerWidth])
      .padding(0.15);

    const maxVal = Math.max(1, d3.max(sparkSeries, (pt) => pt.cumulativeValue) ?? 1);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal])
      .range([sparkInnerHeight, 0])
      .nice();

    const lineGen = d3
      .line<VelocitySeriesPoint>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y((d) => yScale(d.cumulativeValue))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<VelocitySeriesPoint>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y0(sparkInnerHeight)
      .y1((d) => yScale(d.cumulativeValue))
      .curve(d3.curveMonotoneX);

    return {
      txScale: xScale,
      tyScale: yScale,
      linePath: sparkSeries.length >= 2 ? lineGen(sparkSeries) ?? '' : '',
      areaPath: sparkSeries.length >= 2 ? areaGen(sparkSeries) ?? '' : '',
    };
  }, [sparkSeries, sparkInnerWidth, sparkInnerHeight]);

  // Render D3 axes cleanly into SVG refs
  useEffect(() => {
    if (!barXAxisRef.current || entries.length === 0) return;
    const axis = d3
      .axisBottom(xBarScale)
      .ticks(4)
      .tickSizeOuter(0)
      .tickFormat((val) => `+${formatCompactCount(Number(val))}`);

    const g = d3.select(barXAxisRef.current);
    g.call(axis);
    g.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    g.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    g.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');
  }, [xBarScale, entries.length, isDark]);

  useEffect(() => {
    if (!sparkXAxisRef.current || !sparkYAxisRef.current || sparkSeries.length === 0) return;

    const tickDates =
      sparkSeries.length <= 3
        ? sparkSeries.map((pt) => pt.shortDate)
        : [
            sparkSeries[0].shortDate,
            sparkSeries[Math.floor((sparkSeries.length - 1) / 2)].shortDate,
            sparkSeries[sparkSeries.length - 1].shortDate,
          ];

    const xAxis = d3.axisBottom(txScale).tickValues(tickDates).tickSizeOuter(0);
    const xg = d3.select(sparkXAxisRef.current);
    xg.call(xAxis);
    xg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    xg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');

    const yAxis = d3
      .axisLeft(tyScale)
      .ticks(4)
      .tickSizeOuter(0)
      .tickFormat((val) => `+${formatCompactCount(Number(val))}`);
    const yg = d3.select(sparkYAxisRef.current);
    yg.call(yAxis);
    yg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    yg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    yg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');
  }, [txScale, tyScale, sparkSeries, isDark]);

  const metricTabs: Array<{ id: GrowthVelocityMetric; label: string }> = [
    { id: 'star_growth_30d', label: copy.tabStar30d },
    { id: 'star_growth_7d', label: copy.tabStar7d },
    { id: 'signal_velocity', label: copy.tabSignalVelocity },
  ];

  const isStarMode = activeMetric === 'star_growth_30d' || activeMetric === 'star_growth_7d';
  const unitLabel = isStarMode ? copy.unitStars : copy.unitSignals;

  return (
    <section
      aria-labelledby="discover-trending-heading"
      data-testid="discover-trending-section"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h2
                id="discover-trending-heading"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {copy.title}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? copy.toggleExpand : copy.toggleCollapse}
            onClick={() => setCollapsed((prev) => !prev)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 sm:hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label={copy.title}
            className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
          >
            {metricTabs.map((tab) => {
              const selected = activeMetric === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`velocity-tab-${tab.id}`}
                  onClick={() => {
                    setMetricOverride(tab.id);
                    setHoveredProjectId(null);
                    setSelectedProjectId(null);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-xs ${
                    selected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? copy.toggleExpand : copy.toggleCollapse}
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 sm:inline-flex dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4">
          {!summary.hasStarGrowth30d && activeMetric === 'signal_velocity' && (
            <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
              {copy.fallbackNote}
            </p>
          )}

          {entries.length === 0 ? (
            <div
              data-testid="trending-empty-state"
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-7 text-center dark:border-slate-700 dark:bg-slate-950/50"
            >
              <TrendingUp className="mx-auto h-6 w-6 text-slate-400 dark:text-slate-500" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {isStarMode && projects.length > 0 ? copy.emptyStarTitle : copy.emptyFilteredTitle}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
                {isStarMode && projects.length > 0 ? copy.emptyStarBody : copy.emptyFilteredBody}
              </p>
              {isStarMode && projects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMetricOverride('signal_velocity')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {copy.switchToSignalButton}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 lg:grid-cols-12 dark:border-slate-800">
              {/* Left: D3 Ranked Horizontal Velocity Bars */}
              <div className="lg:col-span-7">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {copy.chartHeading}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                    +{unitLabel} · {unitLabel}
                    {copy.perDaySuffix}
                  </span>
                </div>

                <div className="w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`}
                    role="img"
                    aria-label={copy.chartHeading}
                    data-testid="d3-velocity-bar-chart"
                    className="h-auto w-full select-none"
                  >
                    <g transform={`translate(${barMargin.left},${barMargin.top})`}>
                      {/* Vertical Gridlines */}
                      {xBarScale.ticks(4).map((tickVal) => {
                        const tx = xBarScale(tickVal);
                        return (
                          <line
                            key={tickVal}
                            x1={tx}
                            x2={tx}
                            y1={0}
                            y2={barInnerHeight}
                            stroke={isDark ? '#1e293b' : '#f1f5f9'}
                            strokeWidth={1}
                          />
                        );
                      })}

                      {/* Ranked Bars */}
                      {entries.map((entry) => {
                        const yPos = yBandScale(entry.project.id) ?? 0;
                        const bandH = yBandScale.bandwidth();
                        const barW = Math.max(4, xBarScale(entry.totalDelta));
                        const isSpot = spotlightEntry?.project.id === entry.project.id;
                        const trackFill = isDark ? '#0f172a' : '#f8fafc';
                        const barFill = isSpot
                          ? isDark
                            ? '#3b82f6'
                            : '#1d4ed8'
                          : isDark
                            ? '#2563eb'
                            : '#60a5fa';

                        return (
                          <g
                            key={entry.project.id}
                            data-testid={`velocity-bar-${entry.project.slug}`}
                            tabIndex={0}
                            role="button"
                            aria-label={`#${entry.rank} ${entry.project.name}: +${entry.totalDelta} ${unitLabel} (${entry.dailyVelocity.toFixed(1)}${copy.perDaySuffix})`}
                            className="cursor-pointer focus:outline-none"
                            onMouseEnter={() => setHoveredProjectId(entry.project.id)}
                            onMouseLeave={() => setHoveredProjectId(null)}
                            onFocus={() => setSelectedProjectId(entry.project.id)}
                            onClick={() => setSelectedProjectId(entry.project.id)}
                            onDoubleClick={() => onOpenDetail(entry.project)}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault();
                                setSelectedProjectId(entry.project.id);
                              }
                            }}
                          >
                            {/* Full-width subtle background track */}
                            <rect
                              x={0}
                              y={yPos}
                              width={barInnerWidth}
                              height={bandH}
                              rx={4}
                              fill={trackFill}
                              stroke={isSpot ? (isDark ? '#475569' : '#cbd5e1') : 'none'}
                              strokeWidth={1}
                            />

                            {/* D3 Velocity Value Bar */}
                            <rect
                              x={0}
                              y={yPos}
                              width={barW}
                              height={bandH}
                              rx={4}
                              fill={barFill}
                            />

                            {/* Left Project Rank + Label */}
                            <text
                              x={-8}
                              y={yPos + bandH / 2}
                              dy="0.35em"
                              textAnchor="end"
                              fill={
                                isSpot
                                  ? isDark
                                    ? '#f8fafc'
                                    : '#0f172a'
                                  : isDark
                                    ? '#cbd5e1'
                                    : '#334155'
                              }
                              fontWeight={isSpot ? 700 : 500}
                              fontSize={11}
                            >
                              #{entry.rank} {truncateLabel(entry.project.name, 17)}
                            </text>

                            {/* Right Monospace Velocity Readout */}
                            <text
                              x={barInnerWidth + 10}
                              y={yPos + bandH / 2}
                              dy="0.35em"
                              textAnchor="start"
                              fill={
                                isSpot
                                  ? isDark
                                    ? '#93c5fd'
                                    : '#1d4ed8'
                                  : isDark
                                    ? '#94a3b8'
                                    : '#475569'
                              }
                              fontSize={10.5}
                              fontWeight={600}
                              style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                            >
                              +{formatCompactCount(entry.totalDelta)} ({entry.dailyVelocity.toFixed(1)}
                              {copy.perDaySuffix})
                            </text>
                          </g>
                        );
                      })}

                      {/* D3 Bottom Axis */}
                      <g
                        ref={barXAxisRef}
                        transform={`translate(0,${barInnerHeight})`}
                      />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Right: D3 Trajectory Curve for Spotlighted Rising Project */}
              <div className="border-t border-slate-200 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0 dark:border-slate-800">
                {spotlightEntry && (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {copy.trajectoryHeading} · #{spotlightEntry.rank}
                        </span>
                        <h3
                          data-testid="spotlight-project-name"
                          className="truncate text-sm font-bold text-slate-900 dark:text-white"
                        >
                          {spotlightEntry.project.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(spotlightEntry.project)}
                        className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>{copy.inspectButton}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Three Tabular KPI Numbers (no boxes inside boxes, simple hairline grid) */}
                    <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 py-2 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.periodDeltaLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          +{spotlightEntry.totalDelta.toLocaleString()}
                        </dd>
                      </div>
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.dailyVelocityLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold tabular-nums text-blue-700 dark:text-blue-400">
                          {spotlightEntry.dailyVelocity.toFixed(1)}
                          {copy.perDaySuffix}
                        </dd>
                      </div>
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.currentTotalLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                          {spotlightEntry.currentTotal.toLocaleString()}
                        </dd>
                      </div>
                    </dl>

                    {/* D3 Area + Line Trajectory Chart */}
                    <div className="mt-3 w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${sparkSvgWidth} ${sparkSvgHeight}`}
                        role="img"
                        aria-label={`${spotlightEntry.project.name} ${copy.trajectoryHeading}`}
                        data-testid="d3-velocity-sparkline"
                        className="h-auto w-full select-none"
                      >
                        <defs>
                          <linearGradient id="velocityAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor={isDark ? '#3b82f6' : '#1d4ed8'}
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="100%"
                              stopColor={isDark ? '#3b82f6' : '#1d4ed8'}
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <g transform={`translate(${sparkMargin.left},${sparkMargin.top})`}>
                          {tyScale.ticks(4).map((tVal) => (
                            <line
                              key={tVal}
                              x1={0}
                              x2={sparkInnerWidth}
                              y1={tyScale(tVal)}
                              y2={tyScale(tVal)}
                              stroke={isDark ? '#1e293b' : '#f1f5f9'}
                              strokeWidth={1}
                            />
                          ))}

                          {areaPath && <path d={areaPath} fill="url(#velocityAreaGrad)" />}
                          {linePath && (
                            <path
                              d={linePath}
                              fill="none"
                              stroke={isDark ? '#60a5fa' : '#1d4ed8'}
                              strokeWidth={2.25}
                            />
                          )}

                          {sparkSeries.map((pt) => {
                            const cx = txScale(pt.shortDate) ?? 0;
                            const cy = tyScale(pt.cumulativeValue);
                            return (
                              <circle
                                key={pt.date}
                                cx={cx}
                                cy={cy}
                                r={sparkSeries.length <= 2 ? 4 : 2.75}
                                fill={isDark ? '#93c5fd' : '#1d4ed8'}
                                stroke={isDark ? '#0f172a' : '#ffffff'}
                                strokeWidth={1.5}
                              >
                                <title>{`${pt.date}: +${pt.cumulativeValue.toLocaleString()} (+${pt.dailyDelta})`}</title>
                              </circle>
                            );
                          })}

                          <g
                            ref={sparkXAxisRef}
                            transform={`translate(0,${sparkInnerHeight})`}
                          />
                          <g ref={sparkYAxisRef} />
                        </g>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
