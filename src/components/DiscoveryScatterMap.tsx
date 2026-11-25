import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  ContentType,
  GitHubAiTrendingRepo,
  OwnershipClaimRecord,
  SearchFilters,
} from '../types/vibeatlas';
import { CONTENT_TYPE_LABELS, UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import {
  buildDiscoveryScatterDataset,
  buildDiscoveryScatterLayout,
  CONTENT_TYPE_ORDER,
  formatStarTickCompact,
  getScatterTypeColor,
  type DiscoveryScatterPoint,
  type ScatterQuadrant,
  type ScatterScope,
} from '../lib/discoveryScatter';
import { resolveMakerVerification } from '../lib/makerVerification';
import { MakerVerificationBadge } from './MakerVerificationBadge';

interface DiscoveryScatterMapProps {
  language: AppLanguage;
  filteredProjects: CatalogProject[];
  filters: SearchFilters;
  userClaims?: ReadonlyArray<OwnershipClaimRecord>;
  snapshotRevision?: number;
  onOpenDetail: (project: CatalogProject) => void;
  onResetFilters: () => void;
}

interface AiTrendingApiResponse {
  items?: GitHubAiTrendingRepo[];
}

const SVG_WIDTH = 620;
const SVG_HEIGHT = 384;
const PLOT_MARGIN = { top: 24, right: 26, bottom: 44, left: 52 };

function truncateText(value: string, maxChars: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1)}…`;
}

export function DiscoveryScatterMap({
  language,
  filteredProjects,
  filters,
  userClaims = [],
  snapshotRevision = 0,
  onOpenDetail,
  onResetFilters,
}: DiscoveryScatterMapProps) {
  const copy = UI_STRINGS[language].discoveryMap;
  const typeLabels = CONTENT_TYPE_LABELS[language];

  const [collapsed, setCollapsed] = useState(false);
  const [scope, setScope] = useState<ScatterScope>('ecosystem');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ContentType | 'all'>('all');
  const [liveRepos, setLiveRepos] = useState<GitHubAiTrendingRepo[]>([]);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const resp = await fetch('/api/github/ai-trending');
        if (!resp.ok) return;
        const data = (await resp.json()) as AiTrendingApiResponse;
        if (!cancelled && Array.isArray(data.items)) {
          setLiveRepos(data.items);
        }
      } catch {
        // Non-fatal fallback: directory projects still render cleanly on scatter plot
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build scope-level candidates before type chip filter so type counts stay visible across switches
  const scopeCandidates = useMemo(
    () =>
      buildDiscoveryScatterDataset({
        filteredProjects,
        liveTrendingRepos: liveRepos,
        filters,
        scope,
        typeFilter: 'all',
        claims: userClaims,
        maxEcosystemExtras: 42,
      }),
    [filteredProjects, liveRepos, filters, scope, userClaims, snapshotRevision]
  );

  const typeCountsInScope = useMemo(() => {
    const counts: Partial<Record<ContentType, number>> = {};
    for (const item of scopeCandidates) {
      counts[item.contentType] = (counts[item.contentType] ?? 0) + 1;
    }
    return counts;
  }, [scopeCandidates]);

  const activeCandidates = useMemo(() => {
    if (selectedTypeFilter === 'all') return scopeCandidates;
    return scopeCandidates.filter((item) => item.contentType === selectedTypeFilter);
  }, [scopeCandidates, selectedTypeFilter]);

  const innerWidth = SVG_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  const innerHeight = SVG_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;

  const layout = useMemo(
    () =>
      buildDiscoveryScatterLayout(activeCandidates, {
        width: SVG_WIDTH,
        height: SVG_HEIGHT,
        margin: PLOT_MARGIN,
      }),
    [activeCandidates]
  );

  // Render D3 numeric axes cleanly into SVG refs matching app theme
  useEffect(() => {
    if (!xAxisRef.current || !yAxisRef.current || layout.points.length === 0) return;

    const xScale = d3
      .scaleSymlog()
      .constant(35)
      .domain([0, layout.maxStarsDomain])
      .range([0, innerWidth]);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(layout.xTicks.map((t) => t.value))
      .tickSizeOuter(0)
      .tickFormat((val) => formatStarTickCompact(Number(val)));

    const xg = d3.select(xAxisRef.current);
    xg.call(xAxis);
    xg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    xg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    xg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 25, 50, 75, 100])
      .tickSizeOuter(0);

    const yg = d3.select(yAxisRef.current);
    yg.call(yAxis);
    yg.select('.domain').attr('stroke', isDark ? '#334155' : '#cbd5e1');
    yg.selectAll('.tick line').attr('stroke', isDark ? '#334155' : '#e2e8f0');
    yg.selectAll('.tick text')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');
  }, [layout, innerWidth, innerHeight, isDark]);

  const spotlightPoint: DiscoveryScatterPoint | null = useMemo(() => {
    if (layout.points.length === 0) return null;
    if (hoveredPointId) {
      const hovered = layout.points.find((pt) => pt.id === hoveredPointId);
      if (hovered) return hovered;
    }
    if (selectedPointId) {
      const selected = layout.points.find((pt) => pt.id === selectedPointId);
      if (selected) return selected;
    }
    // Prefer first directory/verified point with meaningful activity, else highest activity+stars
    const sortedForDefault = [...layout.points].sort((a, b) => {
      const aBoost = a.matchedCatalogProject ? 1 : 0;
      const bBoost = b.matchedCatalogProject ? 1 : 0;
      if (bBoost !== aBoost && layout.points.length <= 16) return bBoost - aBoost;
      return (
        b.activityFrequency * 2 +
        Math.log10(b.githubStars + 1) * 10 -
        (a.activityFrequency * 2 + Math.log10(a.githubStars + 1) * 10)
      );
    });
    return sortedForDefault[0] ?? layout.points[0]!;
  }, [layout.points, hoveredPointId, selectedPointId]);

  const spotlightVerification = useMemo(() => {
    if (!spotlightPoint?.matchedCatalogProject) return null;
    return resolveMakerVerification(spotlightPoint.matchedCatalogProject, userClaims);
  }, [spotlightPoint, userClaims]);

  // Select up to 3 landmark points only where the label box is completely clear of other dots and quadrant corner labels
  const landmarkIds = useMemo(() => {
    const ids = new Set<string>();
    const chosen: DiscoveryScatterPoint[] = [];
    const byPriority = [...layout.points].sort(
      (a, b) => b.githubStars + b.dailyStars * 25 - (a.githubStars + a.dailyStars * 25)
    );
    for (const pt of byPriority) {
      if (pt.id === spotlightPoint?.id) continue;
      if (chosen.length >= 3) break;
      if (pt.y < 30 || pt.y > innerHeight - 24 || pt.x > innerWidth - 96) continue;
      const boxHitsOtherDot = layout.points.some((other) => {
        if (other.id === pt.id) return false;
        const dx = other.x - pt.x;
        const dy = Math.abs(other.y - pt.y);
        return dx > -8 && dx < 92 && dy < other.radius + 11;
      });
      if (boxHitsOtherDot) continue;
      const tooCloseToChosen = chosen.some((prev) => Math.hypot(prev.x - pt.x, prev.y - pt.y) < 96);
      if (tooCloseToChosen) continue;
      chosen.push(pt);
      ids.add(pt.id);
    }
    return ids;
  }, [layout.points, spotlightPoint?.id, innerWidth, innerHeight]);

  const quadrantLabelMap: Record<ScatterQuadrant, string> = {
    ecosystem_leaders: copy.quadrantLeaders,
    active_builders: copy.quadrantActiveBuilders,
    established_steady: copy.quadrantEstablished,
    emerging_niche: copy.quadrantEmerging,
  };

  const quadrantButtons: ScatterQuadrant[] = [
    'ecosystem_leaders',
    'active_builders',
    'established_steady',
    'emerging_niche',
  ];

  const handleFocusQuadrant = (q: ScatterQuadrant) => {
    const match = layout.points
      .filter((pt) => pt.quadrant === q)
      .sort((a, b) => b.activityFrequency - a.activityFrequency || b.githubStars - a.githubStars)[0];
    if (match) {
      setHoveredPointId(null);
      setSelectedPointId(match.id);
    }
  };

  const scopeTabs: Array<{ id: ScatterScope; label: string }> = [
    { id: 'ecosystem', label: copy.scopeEcosystem },
    { id: 'directory', label: copy.scopeDirectory },
    { id: 'verified_makers', label: copy.scopeVerifiedMakers },
  ];

  const availableTypes = CONTENT_TYPE_ORDER.filter((t) => (typeCountsInScope[t] ?? 0) > 0);

  return (
    <section
      aria-labelledby="discover-scatter-heading"
      data-testid="discover-scatter-section"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Compass
                className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
                aria-hidden="true"
              />
              <h2
                id="discover-scatter-heading"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {copy.title}
              </h2>
              {layout.points.length > 0 && (
                <span
                  data-testid="scatter-node-count"
                  className="whitespace-nowrap font-mono text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400"
                >
                  <span className="hidden sm:inline" aria-hidden="true">· </span>
                  {layout.points.length} {copy.pointsCountLabel}
                </span>
              )}
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
            {scopeTabs.map((tab) => {
              const selected = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`scatter-scope-${tab.id}`}
                  onClick={() => {
                    setScope(tab.id);
                    setHoveredPointId(null);
                    setSelectedPointId(null);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs ${
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
          {/* Color Legend & Content-Type Filter Bar */}
          {scopeCandidates.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div
                role="group"
                aria-label={copy.allTypes}
                className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5"
              >
                <button
                  type="button"
                  data-testid="scatter-type-all"
                  aria-pressed={selectedTypeFilter === 'all'}
                  onClick={() => {
                    setSelectedTypeFilter('all');
                    setHoveredPointId(null);
                    setSelectedPointId(null);
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                    selectedTypeFilter === 'all'
                      ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{copy.allTypes}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      selectedTypeFilter === 'all' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {scopeCandidates.length}
                  </span>
                </button>

                {availableTypes.map((typeKey) => {
                  const palette = getScatterTypeColor(typeKey, isDark);
                  const isSelected = selectedTypeFilter === typeKey;
                  const count = typeCountsInScope[typeKey] ?? 0;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      data-testid={`scatter-type-${typeKey}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedTypeFilter(isSelected ? 'all' : typeKey);
                        setHoveredPointId(null);
                        setSelectedPointId(null);
                      }}
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: palette.dot }}
                        aria-hidden="true"
                      />
                      <span>{typeLabels[typeKey]}</span>
                      <span
                        className={`font-mono text-[10px] tabular-nums ${
                          isSelected
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="hidden text-[11px] text-slate-500 sm:inline dark:text-slate-400">
                {copy.medianGuideNote}
              </span>
            </div>
          )}

          {layout.points.length === 0 ? (
            <div
              data-testid="scatter-empty-state"
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-950/50"
            >
              <Compass className="mx-auto h-6 w-6 text-slate-400 dark:text-slate-500" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {copy.emptyTitle}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
                {copy.emptyBody}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {(selectedTypeFilter !== 'all' || scope !== 'ecosystem') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTypeFilter('all');
                      setScope('ecosystem');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {copy.resetMapFilter}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{copy.resetFiltersButton}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 lg:grid-cols-12 dark:border-slate-800">
              {/* Left 7 Cols: D3 Scatter Plot SVG */}
              <div className="lg:col-span-7">
                <div className="w-full overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/40 p-2 dark:border-slate-800/80 dark:bg-slate-950/50">
                  <svg
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    role="img"
                    aria-label={copy.title}
                    data-testid="d3-discovery-scatter-plot"
                    className="h-auto w-full select-none"
                  >
                    <g transform={`translate(${PLOT_MARGIN.left},${PLOT_MARGIN.top})`}>
                      {/* Plot background gridlines */}
                      {layout.xTicks.map((t) => (
                        <line
                          key={`gx-${t.value}`}
                          x1={t.pos}
                          x2={t.pos}
                          y1={0}
                          y2={innerHeight}
                          stroke={isDark ? '#1e293b' : '#e2e8f0'}
                          strokeWidth={0.8}
                        />
                      ))}
                      {layout.yTicks.map((t) => (
                        <line
                          key={`gy-${t.value}`}
                          x1={0}
                          x2={innerWidth}
                          y1={t.pos}
                          y2={t.pos}
                          stroke={isDark ? '#1e293b' : '#e2e8f0'}
                          strokeWidth={0.8}
                        />
                      ))}

                      {/* Quadrant Split Hairline Crosshairs */}
                      <line
                        x1={layout.thresholdX}
                        x2={layout.thresholdX}
                        y1={0}
                        y2={innerHeight}
                        stroke={isDark ? '#475569' : '#94a3b8'}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={layout.thresholdY}
                        y2={layout.thresholdY}
                        stroke={isDark ? '#475569' : '#94a3b8'}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />

                      {/* Subtle Quadrant Corner Labels */}
                      <text
                        x={6}
                        y={13}
                        fill={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={9.5}
                        fontWeight={600}
                      >
                        {copy.quadrantActiveBuilders}
                      </text>
                      <text
                        x={innerWidth - 6}
                        y={13}
                        textAnchor="end"
                        fill={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={9.5}
                        fontWeight={600}
                      >
                        {copy.quadrantLeaders}
                      </text>
                      <text
                        x={6}
                        y={innerHeight - 6}
                        fill={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={9.5}
                        fontWeight={600}
                      >
                        {copy.quadrantEmerging}
                      </text>
                      <text
                        x={innerWidth - 6}
                        y={innerHeight - 6}
                        textAnchor="end"
                        fill={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={9.5}
                        fontWeight={600}
                      >
                        {copy.quadrantEstablished}
                      </text>

                      {/* Non-active Scatter Nodes first */}
                      {layout.points
                        .filter((pt) => pt.id !== spotlightPoint?.id)
                        .map((pt) => {
                          const palette = getScatterTypeColor(pt.contentType, isDark);
                          const isLandmark = landmarkIds.has(pt.id);
                          return (
                            <g
                              key={pt.id}
                              data-testid={`scatter-node-${pt.id}`}
                              transform={`translate(${pt.x},${pt.y})`}
                              tabIndex={0}
                              role="button"
                              aria-label={`${pt.name}: ${pt.githubStars.toLocaleString()} stars, ${pt.activityFrequency}/100 activity`}
                              className="cursor-pointer focus:outline-none"
                              onMouseEnter={() => setHoveredPointId(pt.id)}
                              onMouseLeave={() => setHoveredPointId(null)}
                              onFocus={() => setSelectedPointId(pt.id)}
                              onClick={() => setSelectedPointId(pt.id)}
                              onDoubleClick={() => {
                                if (pt.matchedCatalogProject) {
                                  onOpenDetail(pt.matchedCatalogProject);
                                }
                              }}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  ev.preventDefault();
                                  setSelectedPointId(pt.id);
                                }
                              }}
                            >
                              {pt.isVerifiedMaker && (
                                <circle
                                  r={pt.radius + 3}
                                  fill="none"
                                  stroke={isDark ? '#34d399' : '#059669'}
                                  strokeWidth={1.3}
                                  opacity={0.85}
                                />
                              )}
                              <circle
                                r={pt.radius}
                                fill={palette.fill}
                                stroke={palette.stroke}
                                strokeWidth={1.2}
                              />
                              {isLandmark && (
                                <text
                                  x={pt.radius + 4}
                                  y={3}
                                  fontSize={9.5}
                                  fontWeight={500}
                                  fill={isDark ? '#cbd5e1' : '#334155'}
                                  stroke={isDark ? '#020617' : '#ffffff'}
                                  strokeWidth={2.5}
                                  paintOrder="stroke"
                                  className="pointer-events-none"
                                >
                                  {truncateText(pt.name, 14)}
                                </text>
                              )}
                              <title>{`${pt.name} (${pt.fullName})\nStars: ${pt.githubStars.toLocaleString()} · Activity: ${pt.activityFrequency}/100`}</title>
                            </g>
                          );
                        })}

                      {/* Active / Spotlighted Scatter Node rendered last on top */}
                      {spotlightPoint && (() => {
                        const palette = getScatterTypeColor(spotlightPoint.contentType, isDark);
                        const labelOnLeft = spotlightPoint.x > innerWidth - 115;
                        const labelY = spotlightPoint.y < 38 ? 20 : -spotlightPoint.radius - 7;
                        return (
                          <g
                            key={`active-${spotlightPoint.id}`}
                            data-testid={`scatter-node-${spotlightPoint.id}`}
                            data-spotlight="true"
                            transform={`translate(${spotlightPoint.x},${spotlightPoint.y})`}
                            tabIndex={0}
                            role="button"
                            aria-label={`${spotlightPoint.name}: ${spotlightPoint.githubStars.toLocaleString()} stars, ${spotlightPoint.activityFrequency}/100 activity`}
                            className="cursor-pointer focus:outline-none"
                            onMouseLeave={() => setHoveredPointId(null)}
                            onClick={() => setSelectedPointId(spotlightPoint.id)}
                            onDoubleClick={() => {
                              if (spotlightPoint.matchedCatalogProject) {
                                onOpenDetail(spotlightPoint.matchedCatalogProject);
                              }
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault();
                                if (spotlightPoint.matchedCatalogProject) {
                                  onOpenDetail(spotlightPoint.matchedCatalogProject);
                                }
                              }
                            }}
                          >
                            <circle
                              r={spotlightPoint.radius + 5}
                              fill="none"
                              stroke={isDark ? '#f8fafc' : '#0f172a'}
                              strokeWidth={1.6}
                              strokeDasharray="2 2"
                            />
                            <circle
                              r={spotlightPoint.radius + 1.5}
                              fill={palette.dot}
                              stroke={isDark ? '#0f172a' : '#ffffff'}
                              strokeWidth={2}
                            />
                            <text
                              x={labelOnLeft ? -spotlightPoint.radius - 6 : spotlightPoint.radius + 6}
                              y={labelY}
                              textAnchor={labelOnLeft ? 'end' : 'start'}
                              fontSize={10.5}
                              fontWeight={700}
                              fill={isDark ? '#f8fafc' : '#0f172a'}
                              stroke={isDark ? '#020617' : '#ffffff'}
                              strokeWidth={3}
                              paintOrder="stroke"
                              className="pointer-events-none"
                            >
                              {truncateText(spotlightPoint.name, 20)}
                            </text>
                            <title>{`${spotlightPoint.name} (${spotlightPoint.fullName})\nStars: ${spotlightPoint.githubStars.toLocaleString()} · Activity: ${spotlightPoint.activityFrequency}/100`}</title>
                          </g>
                        );
                      })()}

                      {/* D3 Bottom Axis + X Title */}
                      <g
                        ref={xAxisRef}
                        transform={`translate(0,${innerHeight})`}
                      />
                      <text
                        x={innerWidth / 2}
                        y={innerHeight + 34}
                        textAnchor="middle"
                        fill={isDark ? '#94a3b8' : '#475569'}
                        fontSize={10.5}
                        fontWeight={600}
                      >
                        {copy.xAxisLabel}
                      </text>

                      {/* D3 Left Axis + Y Title */}
                      <g ref={yAxisRef} />
                      <text
                        transform={`translate(${-36},${innerHeight / 2}) rotate(-90)`}
                        textAnchor="middle"
                        fill={isDark ? '#94a3b8' : '#475569'}
                        fontSize={10.5}
                        fontWeight={600}
                      >
                        {copy.yAxisLabel}
                      </text>
                    </g>
                  </svg>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {copy.interactionHint}
                </p>
              </div>

              {/* Right 5 Cols: Spotlight Node Inspector + Quadrant Jump */}
              <div className="flex flex-col justify-between border-t border-slate-200 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0 dark:border-slate-800">
                {spotlightPoint && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: getScatterTypeColor(
                              spotlightPoint.contentType,
                              isDark
                            ).dot,
                          }}
                          aria-hidden="true"
                        />
                        <span>{typeLabels[spotlightPoint.contentType]}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-blue-700 dark:text-blue-400">
                          {quadrantLabelMap[spotlightPoint.quadrant]}
                        </span>
                      </span>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {spotlightPoint.sourceKind === 'directory_enriched'
                          ? copy.sourceEnriched
                          : spotlightPoint.sourceKind === 'directory'
                            ? copy.sourceDirectory
                            : copy.sourceEcosystem}
                      </span>
                    </div>

                    <div className="mt-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          data-testid="scatter-spotlight-name"
                          className="truncate text-base font-bold text-slate-900 dark:text-white"
                        >
                          {spotlightPoint.name}
                        </h3>
                        <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                          {spotlightPoint.fullName}
                          {spotlightPoint.primaryLanguage
                            ? ` · ${spotlightPoint.primaryLanguage}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {spotlightVerification && spotlightVerification.isClaimedByMaker && (
                      <div className="mt-1.5">
                        <MakerVerificationBadge
                          verification={spotlightVerification}
                          language={language}
                          variant="inline"
                        />
                      </div>
                    )}

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {spotlightPoint.matchedCatalogProject
                        ? (language === 'ko'
                            ? spotlightPoint.matchedCatalogProject.taglineKo ||
                              spotlightPoint.matchedCatalogProject.tagline
                            : spotlightPoint.matchedCatalogProject.tagline) || '—'
                        : spotlightPoint.description || '—'}
                    </p>

                    {/* 2x2 Hairline Metric Grid */}
                    <dl className="mt-3.5 grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="px-3 py-2">
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.starsMetricLabel}
                        </dt>
                        <dd
                          data-testid="scatter-spotlight-stars"
                          className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                        >
                          {formatCompactCount(spotlightPoint.githubStars)}
                        </dd>
                      </div>
                      <div className="px-3 py-2">
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.activityMetricLabel}
                        </dt>
                        <dd
                          data-testid="scatter-spotlight-activity"
                          className="mt-0.5 font-mono text-sm font-bold tabular-nums text-blue-700 dark:text-blue-400"
                        >
                          {spotlightPoint.activityFrequency}
                          <span className="text-[11px] font-medium text-slate-400">/100</span>
                        </dd>
                      </div>
                      <div className="px-3 py-2">
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.dailyVelocityLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {spotlightPoint.dailyStars > 0
                            ? `+${spotlightPoint.dailyStars.toLocaleString()}/d`
                            : '—'}
                        </dd>
                      </div>
                      <div className="px-3 py-2">
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.recencyLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {spotlightPoint.recencyDays === null
                            ? '—'
                            : spotlightPoint.recencyDays === 0
                              ? copy.todayLabel
                              : `${spotlightPoint.recencyDays}${copy.daysAgoSuffix}`}
                        </dd>
                      </div>
                    </dl>

                    {/* Action Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {spotlightPoint.matchedCatalogProject && (
                        <button
                          type="button"
                          data-testid="scatter-inspect-btn"
                          onClick={() => onOpenDetail(spotlightPoint.matchedCatalogProject!)}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          <span>{copy.inspectButton}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {spotlightPoint.htmlUrl && (
                        <a
                          href={spotlightPoint.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <span>{copy.openGithubButton}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Quadrant Quick-Jump Summary */}
                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    {quadrantButtons.map((q) => {
                      const count = layout.quadrantCounts[q];
                      const isCurrentQuadrant = spotlightPoint?.quadrant === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          disabled={count === 0}
                          data-testid={`scatter-quadrant-${q}`}
                          onClick={() => handleFocusQuadrant(q)}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors disabled:opacity-40 ${
                            isCurrentQuadrant
                              ? 'border-blue-300 bg-blue-50/70 font-semibold text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className="truncate">{quadrantLabelMap[q]}</span>
                          <span className="font-mono text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
