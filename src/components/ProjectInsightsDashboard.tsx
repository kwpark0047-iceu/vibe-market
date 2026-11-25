import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, Bookmark, Heart } from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  ProjectActivityRecord,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import {
  buildProjectInsightsChartGeometry,
  computeProjectInsights,
  type InsightsChartMode,
} from '../lib/projectInsights';

interface ProjectInsightsDashboardProps {
  project: CatalogProject;
  activities: ReadonlyArray<ProjectActivityRecord>;
  language: AppLanguage;
  isLiked: boolean;
  isBookmarked: boolean;
  onToggleLike?: (project: CatalogProject) => void;
  onToggleBookmark?: (project: CatalogProject) => void;
}

export function ProjectInsightsDashboard({
  project,
  activities,
  language,
  isLiked,
  isBookmarked,
  onToggleLike,
  onToggleBookmark,
}: ProjectInsightsDashboardProps) {
  const copy = UI_STRINGS[language].detail;
  const cardCopy = UI_STRINGS[language].card;
  const gradientPrefix = useId().replace(/:/g, '');

  const [mode, setMode] = useState<InsightsChartMode>('daily');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  const xAxisRef = useRef<SVGGElement | null>(null);
  const yAxisRef = useRef<SVGGElement | null>(null);

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
      computeProjectInsights({
        project,
        activities,
      }),
    [project, activities]
  );

  useEffect(() => {
    setHoveredIdx(null);
    setSelectedIdx(null);
  }, [project.id, summary.windowEndDate]);

  const geometry = useMemo(
    () =>
      buildProjectInsightsChartGeometry(summary, mode, {
        width: 600,
        height: 216,
      }),
    [summary, mode]
  );

  const activeDayIndex = useMemo(() => {
    const len = geometry.plottedDays.length;
    if (len === 0) return -1;
    if (hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < len) return hoveredIdx;
    if (selectedIdx !== null && selectedIdx >= 0 && selectedIdx < len) return selectedIdx;
    return len - 1;
  }, [geometry.plottedDays.length, hoveredIdx, selectedIdx]);

  const activeDay =
    activeDayIndex >= 0 ? (geometry.plottedDays[activeDayIndex] ?? null) : null;

  // Render D3 axes cleanly
  useEffect(() => {
    if (!xAxisRef.current || !yAxisRef.current || geometry.plottedDays.length === 0) {
      return;
    }

    const xAxis = d3.axisBottom(geometry.xBand).tickSizeOuter(0);
    const xg = d3.select(xAxisRef.current);
    xg.call(xAxis);
    xg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10.5px');

    const yAxis = d3
      .axisLeft(geometry.yScale)
      .tickValues(geometry.yTicks)
      .tickSizeOuter(0)
      .tickFormat((v) => `${Number(v).toLocaleString()}`);
    const yg = d3.select(yAxisRef.current);
    yg.call(yAxis);
    yg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    yg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    yg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10.5px');
  }, [geometry, isDark]);

  const likeHex = isDark ? '#fb7185' : '#e11d48';
  const bookmarkHex = isDark ? '#60a5fa' : '#2563eb';
  const gridHex = isDark ? '#1e293b' : '#f1f5f9';
  const activeBandFill = isDark ? '#1e293b' : '#f8fafc';

  const hasChartableData =
    summary.hasActivityInWindow ||
    summary.currentLikesTotal > 0 ||
    summary.currentBookmarksTotal > 0;

  return (
    <section
      aria-labelledby="project-insights-heading"
      data-testid="project-insights-dashboard"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header + Chart Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BarChart3
              className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
              aria-hidden="true"
            />
            <h3
              id="project-insights-heading"
              className="text-sm font-bold text-slate-900 dark:text-white"
            >
              {copy.insightsTitle}
            </h3>
            <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              · {summary.windowStartDate} – {summary.windowEndDate}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {copy.insightsSubtitle}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={copy.insightsTitle}
          className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'daily'}
            data-testid="insights-tab-daily"
            onClick={() => setMode('daily')}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'daily'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {copy.insightsModeDaily}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'cumulative'}
            data-testid="insights-tab-cumulative"
            onClick={() => setMode('cumulative')}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'cumulative'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {copy.insightsModeCumulative}
          </button>
        </div>
      </div>

      {/* 4-Column KPI Summary Strip (Tabular Figures) */}
      <dl className="mt-4 grid grid-cols-2 gap-y-3 divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 py-2.5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.insightsKpiLikes7d}
          </dt>
          <dd
            data-testid="insights-kpi-likes"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-rose-700 dark:text-rose-400"
          >
            +{summary.likes7d.toLocaleString()}
            <span className="mt-0.5 block font-sans text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {copy.insightsTotalPrefix}:{' '}
              <span className="font-mono tabular-nums">
                {summary.currentLikesTotal.toLocaleString()}
              </span>
            </span>
          </dd>
        </div>

        <div className="px-3">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.insightsKpiBookmarks7d}
          </dt>
          <dd
            data-testid="insights-kpi-bookmarks"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-blue-700 dark:text-blue-400"
          >
            +{summary.bookmarks7d.toLocaleString()}
            <span className="mt-0.5 block font-sans text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {copy.insightsTotalPrefix}:{' '}
              <span className="font-mono tabular-nums">
                {summary.currentBookmarksTotal.toLocaleString()}
              </span>
            </span>
          </dd>
        </div>

        <div className="border-t border-slate-200 px-3 pt-2.5 sm:border-t-0 sm:pt-0 dark:border-slate-800">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.insightsKpiBookmarkShare}
          </dt>
          <dd
            data-testid="insights-kpi-share"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
          >
            {summary.bookmarkSharePct}%
            <span className="mt-0.5 block text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {summary.likeSharePct}% / {summary.bookmarkSharePct}%
            </span>
          </dd>
        </div>

        <div className="border-t border-slate-200 px-3 pt-2.5 sm:border-t-0 sm:pt-0 dark:border-slate-800">
          <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {copy.insightsKpiPeakDay}
          </dt>
          <dd
            data-testid="insights-kpi-peak"
            className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
          >
            {summary.peakDay ? (
              <>
                <span>
                  {summary.peakDay.shortDate} · +{summary.peakDay.totalDaily}
                </span>
                <span className="mt-0.5 block font-sans text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums">{summary.avgDailyEngagement}</span>{' '}
                  {copy.insightsAvgPerDay}
                </span>
              </>
            ) : (
              <span className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400">
                {copy.insightsNoPeakDay}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* Compact Likes vs Bookmarks Mix Distribution Bar */}
      {(summary.total7d > 0 ||
        summary.currentLikesTotal > 0 ||
        summary.currentBookmarksTotal > 0) && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-medium">{copy.insightsMixTitle}</span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {cardCopy.internalLikes} {summary.likeSharePct}% · {cardCopy.internalBookmarks}{' '}
              {summary.bookmarkSharePct}%
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div
              className="h-full bg-rose-600 transition-all duration-200 dark:bg-rose-400"
              style={{ width: `${summary.likeSharePct}%` }}
            />
            <div
              className="h-full bg-blue-600 transition-all duration-200 dark:bg-blue-400"
              style={{ width: `${summary.bookmarkSharePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Chart Canvas or Empty State */}
      {!hasChartableData ? (
        <div
          data-testid="insights-empty-state"
          className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-950/40"
        >
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {copy.insightsEmptyTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.insightsEmptyHint}
          </p>
          {(onToggleLike || onToggleBookmark) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {onToggleLike && (
                <button
                  type="button"
                  onClick={() => onToggleLike(project)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
                  <span>{cardCopy.likeAction}</span>
                </button>
              )}
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(project)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current text-blue-600' : ''}`}
                  />
                  <span>{cardCopy.bookmarkAction}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Inline Legend + Scrub Instruction */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={
                    mode === 'daily'
                      ? 'inline-block h-2.5 w-2.5 rounded-xs bg-rose-600 dark:bg-rose-400'
                      : 'inline-block h-0.5 w-4 bg-rose-600 dark:bg-rose-400'
                  }
                />
                <span>{cardCopy.internalLikes}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={
                    mode === 'daily'
                      ? 'inline-block h-2.5 w-2.5 rounded-xs bg-blue-600 dark:bg-blue-400'
                      : 'inline-block h-0.5 w-4 bg-blue-600 dark:bg-blue-400'
                  }
                />
                <span>{cardCopy.internalBookmarks}</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {copy.insightsScrubHint}
            </span>
          </div>

          {/* D3 SVG Chart */}
          <div className="mt-2 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              role="img"
              aria-label={copy.insightsTitle}
              data-testid="d3-project-insights-chart"
              className="h-auto w-full select-none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id={`${gradientPrefix}-likes`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={likeHex} stopOpacity={isDark ? 0.28 : 0.2} />
                  <stop offset="95%" stopColor={likeHex} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`${gradientPrefix}-bookmarks`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={bookmarkHex} stopOpacity={isDark ? 0.28 : 0.2} />
                  <stop offset="95%" stopColor={bookmarkHex} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <g transform={`translate(${geometry.margin.left},${geometry.margin.top})`}>
                <text
                  x={0}
                  y={-7}
                  textAnchor="start"
                  fill={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  fontWeight={600}
                >
                  {copy.insightsAxisCount}
                </text>

                {/* Horizontal Gridlines */}
                {geometry.yTicks.map((tickVal) => {
                  const yPos = geometry.yScale(tickVal);
                  return (
                    <line
                      key={tickVal}
                      x1={0}
                      x2={geometry.innerWidth}
                      y1={yPos}
                      y2={yPos}
                      stroke={gridHex}
                      strokeWidth={1}
                    />
                  );
                })}

                {/* Active Day Column Backdrop */}
                {activeDay && (
                  <rect
                    x={activeDay.bandX - 2}
                    y={0}
                    width={geometry.xBand.bandwidth() + 4}
                    height={geometry.innerHeight}
                    rx={4}
                    fill={activeBandFill}
                  />
                )}

                {mode === 'daily' ? (
                  <>
                    {/* Grouped Daily Likes & Bookmarks Bars */}
                    {geometry.plottedDays.map((pt) => {
                      const isActive = activeDay?.index === pt.index;
                      return (
                        <g key={`bars-${pt.date}`}>
                          <rect
                            data-testid={`insights-like-bar-${pt.index}`}
                            x={pt.likeBarX}
                            y={pt.dailyLikes > 0 ? pt.likeBarY : geometry.innerHeight - 1}
                            width={pt.barWidth}
                            height={pt.dailyLikes > 0 ? pt.likeBarHeight : 1}
                            rx={2}
                            fill={likeHex}
                            fillOpacity={pt.dailyLikes > 0 ? (isActive ? 1 : 0.82) : 0.2}
                          />
                          <rect
                            data-testid={`insights-bookmark-bar-${pt.index}`}
                            x={pt.bookmarkBarX}
                            y={
                              pt.dailyBookmarks > 0 ? pt.bookmarkBarY : geometry.innerHeight - 1
                            }
                            width={pt.barWidth}
                            height={pt.dailyBookmarks > 0 ? pt.bookmarkBarHeight : 1}
                            rx={2}
                            fill={bookmarkHex}
                            fillOpacity={pt.dailyBookmarks > 0 ? (isActive ? 1 : 0.82) : 0.2}
                          />
                          {isActive && pt.dailyLikes > 0 && (
                            <text
                              x={pt.likeBarX + pt.barWidth / 2}
                              y={Math.max(10, pt.likeBarY - 5)}
                              textAnchor="middle"
                              fill={likeHex}
                              fontSize={9.5}
                              fontWeight={600}
                              fontFamily="var(--font-mono)"
                            >
                              {pt.dailyLikes}
                            </text>
                          )}
                          {isActive && pt.dailyBookmarks > 0 && (
                            <text
                              x={pt.bookmarkBarX + pt.barWidth / 2}
                              y={Math.max(10, pt.bookmarkBarY - 5)}
                              textAnchor="middle"
                              fill={bookmarkHex}
                              fontSize={9.5}
                              fontWeight={600}
                              fontFamily="var(--font-mono)"
                            >
                              {pt.dailyBookmarks}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Cumulative 7d Area & Trajectory Lines */}
                    {geometry.cumBookmarksAreaPath && (
                      <path
                        data-testid="insights-cum-bookmarks-area"
                        d={geometry.cumBookmarksAreaPath}
                        fill={`url(#${gradientPrefix}-bookmarks)`}
                      />
                    )}
                    {geometry.cumLikesAreaPath && (
                      <path
                        data-testid="insights-cum-likes-area"
                        d={geometry.cumLikesAreaPath}
                        fill={`url(#${gradientPrefix}-likes)`}
                      />
                    )}
                    {geometry.cumBookmarksLinePath && (
                      <path
                        data-testid="insights-cum-bookmarks-line"
                        d={geometry.cumBookmarksLinePath}
                        fill="none"
                        stroke={bookmarkHex}
                        strokeWidth={2.25}
                      />
                    )}
                    {geometry.cumLikesLinePath && (
                      <path
                        data-testid="insights-cum-likes-line"
                        d={geometry.cumLikesLinePath}
                        fill="none"
                        stroke={likeHex}
                        strokeWidth={2.25}
                      />
                    )}

                    {geometry.plottedDays.map((pt) => {
                      const isActive = activeDay?.index === pt.index;
                      return (
                        <g key={`dots-${pt.date}`}>
                          <circle
                            cx={pt.bandCenterX}
                            cy={pt.cumBookmarksY}
                            r={isActive ? 4.5 : 3}
                            fill={bookmarkHex}
                            stroke={isDark ? '#0f172a' : '#ffffff'}
                            strokeWidth={1.5}
                          />
                          <circle
                            cx={pt.bandCenterX}
                            cy={pt.cumLikesY}
                            r={isActive ? 4.5 : 3}
                            fill={likeHex}
                            stroke={isDark ? '#0f172a' : '#ffffff'}
                            strokeWidth={1.5}
                          />
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Keyboard & Mouse Accessible Day Columns */}
                {geometry.plottedDays.map((pt) => (
                  <g
                    key={`hit-${pt.date}`}
                    role="button"
                    tabIndex={0}
                    data-testid={`insights-day-col-${pt.index}`}
                    aria-label={`${pt.date}: ${cardCopy.internalLikes} +${pt.dailyLikes} (${pt.cumulativeLikes}), ${cardCopy.internalBookmarks} +${pt.dailyBookmarks} (${pt.cumulativeBookmarks})`}
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
                      x={pt.bandX - 4}
                      y={0}
                      width={geometry.xBand.bandwidth() + 8}
                      height={geometry.innerHeight}
                      fill="transparent"
                    />
                  </g>
                ))}

                {/* D3 Axes */}
                <g ref={xAxisRef} transform={`translate(0,${geometry.innerHeight})`} />
                <g ref={yAxisRef} />
              </g>
            </svg>
          </div>

          {/* Selected / Hovered Day Inspector Bar */}
          {activeDay && (
            <div
              data-testid="insights-inspector-bar"
              className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800"
            >
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                {copy.insightsDateLabel}: {activeDay.date}
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
                <span className="text-rose-700 dark:text-rose-400">
                  {cardCopy.internalLikes}: +{activeDay.dailyLikes} ({copy.insightsTotalPrefix}{' '}
                  {activeDay.cumulativeLikes})
                </span>
                <span className="text-blue-700 dark:text-blue-400">
                  {cardCopy.internalBookmarks}: +{activeDay.dailyBookmarks} (
                  {copy.insightsTotalPrefix} {activeDay.cumulativeBookmarks})
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {copy.insightsCombinedLabel}: +{activeDay.totalDaily}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
