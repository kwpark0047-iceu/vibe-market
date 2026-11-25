import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type {
  AppLanguage,
  CatalogProject,
  GitHubAiTrendingRepo,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import { findCatalogProjectByRepo } from '../lib/githubLeaderboard';
import {
  buildTrendingBubblePack,
  extractTrendingLanguages,
  filterAndRankTrendingRepos,
  getTrendingLanguageColor,
} from '../lib/githubTrendingBubbles';

interface GitHubTrendingBubbleChartProps {
  language: AppLanguage;
  catalogProjects: CatalogProject[];
  onOpenDetail: (project: CatalogProject) => void;
}

interface AiTrendingApiResponse {
  fetchedAt?: string;
  staleCache?: boolean;
  items?: GitHubAiTrendingRepo[];
  error?: string;
}

const BUBBLE_SVG_WIDTH = 470;
const BUBBLE_SVG_HEIGHT = 430;
const MAX_BUBBLES = 24;

function formatShortIsoDate(iso: string): string {
  if (!iso) return '—';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso.slice(0, 10);
  return new Date(parsed).toISOString().slice(0, 10);
}

export function GitHubTrendingBubbleChart({
  language,
  catalogProjects,
  onOpenDetail,
}: GitHubTrendingBubbleChartProps) {
  const copy = UI_STRINGS[language].githubTrendingBubble;
  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState<GitHubAiTrendingRepo[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [staleCache, setStaleCache] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [hoveredRepoId, setHoveredRepoId] = useState<number | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
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

  const loadTrendingRepos = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = forceRefresh
        ? '/api/github/ai-trending?refresh=1'
        : '/api/github/ai-trending';
      const resp = await fetch(url);
      const data = (await resp.json()) as AiTrendingApiResponse;
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
      setFetchedAt(data.fetchedAt || '');
      setStaleCache(Boolean(data.staleCache));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorTitle);
    } finally {
      setIsLoading(false);
    }
  }, [copy.errorTitle]);

  useEffect(() => {
    void loadTrendingRepos(false);
  }, [loadTrendingRepos]);

  const availableLanguages = useMemo(
    () => extractTrendingLanguages(items, 5),
    [items]
  );

  const visibleRepos = useMemo(
    () =>
      filterAndRankTrendingRepos(items, {
        language: selectedLanguage,
        limit: MAX_BUBBLES,
      }),
    [items, selectedLanguage]
  );

  const bubbleNodes = useMemo(
    () =>
      buildTrendingBubblePack(visibleRepos, {
        width: BUBBLE_SVG_WIDTH,
        height: BUBBLE_SVG_HEIGHT,
        padding: 5.5,
        isDark,
      }),
    [visibleRepos, isDark]
  );

  const spotlightNode = useMemo(() => {
    if (bubbleNodes.length === 0) return null;
    if (hoveredRepoId !== null) {
      const hovered = bubbleNodes.find((n) => n.repo.id === hoveredRepoId);
      if (hovered) return hovered;
    }
    if (selectedRepoId !== null) {
      const selected = bubbleNodes.find((n) => n.repo.id === selectedRepoId);
      if (selected) return selected;
    }
    return bubbleNodes[0]!;
  }, [bubbleNodes, hoveredRepoId, selectedRepoId]);

  const matchedCatalogProject = useMemo(() => {
    if (!spotlightNode) return null;
    return findCatalogProjectByRepo(catalogProjects, spotlightNode.repo.fullName);
  }, [catalogProjects, spotlightNode]);

  const hasSnapshotRate = useMemo(
    () => visibleRepos.some((repo) => repo.dailyRateSource === 'snapshot_24h'),
    [visibleRepos]
  );

  const legendLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const node of bubbleNodes) {
      langs.add(node.repo.language || 'Other');
    }
    return Array.from(langs).slice(0, 6);
  }, [bubbleNodes]);

  return (
    <section
      aria-labelledby="github-trending-bubble-heading"
      data-testid="github-trending-bubble-section"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles
              className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
              aria-hidden="true"
            />
            <h2
              id="github-trending-bubble-heading"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {copy.title}
            </h2>
            {bubbleNodes.length > 0 && (
              <span className="font-mono text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                · {bubbleNodes.length} {copy.reposCountLabel}
                {staleCache ? ` · ${copy.cachedNotice}` : ''}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {copy.subtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            data-testid="github-trending-refresh-btn"
            onClick={() => void loadTrendingRepos(true)}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? copy.refreshing : copy.refreshButton}</span>
          </button>

          <button
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? copy.toggleExpand : copy.toggleCollapse}
            onClick={() => setCollapsed((prev) => !prev)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4">
          {/* Language Filter Strip + Rate Provenance Note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div
              role="tablist"
              aria-label={copy.title}
              className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedLanguage === 'all'}
                data-testid="bubble-lang-all"
                onClick={() => {
                  setSelectedLanguage('all');
                  setHoveredRepoId(null);
                  setSelectedRepoId(null);
                }}
                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedLanguage === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {copy.allLanguages}
              </button>
              {availableLanguages.map((lang) => {
                const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
                return (
                  <button
                    key={lang}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`bubble-lang-${lang}`}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setHoveredRepoId(null);
                      setSelectedRepoId(null);
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {hasSnapshotRate ? copy.rateModeSnapshot : copy.rateModeVelocity}
              {fetchedAt ? ` · ${formatShortIsoDate(fetchedAt)}` : ''}
            </span>
          </div>

          {/* Content States */}
          {isLoading && items.length === 0 ? (
            <div
              data-testid="github-trending-loading"
              className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 lg:grid-cols-12 dark:border-slate-800"
            >
              <div className="flex h-[320px] flex-col items-center justify-center rounded-lg bg-slate-50 lg:col-span-7 dark:bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {copy.loadingLabel}
                </p>
              </div>
              <div className="h-[320px] animate-pulse rounded-lg bg-slate-50 lg:col-span-5 dark:bg-slate-950/60" />
            </div>
          ) : error && items.length === 0 ? (
            <div
              role="alert"
              data-testid="github-trending-error"
              className="rounded-lg border border-amber-200 bg-amber-50/70 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30"
            >
              <AlertCircle className="mx-auto h-6 w-6 text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {copy.errorTitle}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{error}</p>
              <button
                type="button"
                onClick={() => void loadTrendingRepos(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{copy.retryButton}</span>
              </button>
            </div>
          ) : bubbleNodes.length === 0 ? (
            <div
              data-testid="github-trending-empty"
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-950/50"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {copy.emptyTitle}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {copy.emptyBody}
              </p>
              <button
                type="button"
                onClick={() => setSelectedLanguage('all')}
                className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                {copy.resetLanguageButton}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-4 lg:grid-cols-12 dark:border-slate-800">
              {/* Left 7 Cols: D3 Packed Bubble Visualization */}
              <div className="lg:col-span-7">
                <div className="w-full overflow-hidden rounded-lg bg-slate-50/60 p-1.5 dark:bg-slate-950/50">
                  <svg
                    viewBox={`0 0 ${BUBBLE_SVG_WIDTH} ${BUBBLE_SVG_HEIGHT}`}
                    role="img"
                    aria-label={copy.title}
                    data-testid="d3-trending-bubble-svg"
                    className="mx-auto block h-auto w-full max-w-[470px] select-none"
                  >
                    <defs>
                      {bubbleNodes.map((node) => (
                        <clipPath key={`clip-${node.repo.id}`} id={`bubble-clip-${node.repo.id}`}>
                          <circle cx={node.x} cy={node.y} r={Math.max(1, node.r - 4)} />
                        </clipPath>
                      ))}
                    </defs>
                    {bubbleNodes.map((node) => {
                      const isActive = spotlightNode?.repo.id === node.repo.id;
                      const clipId = `bubble-clip-${node.repo.id}`;
                      return (
                        <g
                          key={node.repo.id}
                          data-testid={`trending-bubble-${node.repo.name}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`#${node.rank} ${node.repo.fullName}: +${node.repo.dailyStars.toLocaleString()}${copy.perDaySuffix} (${formatCompactCount(node.repo.stars)} total stars)`}
                          className="cursor-pointer focus:outline-none"
                          onMouseEnter={() => setHoveredRepoId(node.repo.id)}
                          onMouseLeave={() => setHoveredRepoId(null)}
                          onFocus={() => setSelectedRepoId(node.repo.id)}
                          onClick={() => setSelectedRepoId(node.repo.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setSelectedRepoId(node.repo.id);
                            }
                          }}
                        >
                          <title>
                            {`#${node.rank} ${node.repo.fullName}\n+${node.repo.dailyStars.toLocaleString()}${copy.perDaySuffix} · ★ ${node.repo.stars.toLocaleString()} (${node.repo.language || 'Unknown'})`}
                          </title>

                          {isActive && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.r + 3}
                              fill="none"
                              stroke={node.palette.activeStroke}
                              strokeWidth={1.75}
                              opacity={0.85}
                            />
                          )}

                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.r}
                            fill={isActive ? node.palette.activeFill : node.palette.fill}
                            stroke={isActive ? node.palette.activeStroke : node.palette.stroke}
                            strokeWidth={isActive ? 2 : 1.25}
                          />

                          {node.labelLayout.showName && (
                            <g clipPath={`url(#${clipId})`}>
                              <text
                                x={node.x}
                                y={node.labelLayout.showMetric ? node.y - 4 : node.y + 3.5}
                                textAnchor="middle"
                                fill={node.palette.textColor}
                                fontSize={node.labelLayout.nameFontSize}
                                fontWeight={isActive ? 700 : 600}
                              >
                                {node.labelLayout.displayName}
                              </text>
                              {node.labelLayout.showMetric && (
                                <text
                                  x={node.x}
                                  y={node.y + node.labelLayout.metricFontSize + 2}
                                  textAnchor="middle"
                                  fill={node.palette.subTextColor}
                                  fontSize={node.labelLayout.metricFontSize}
                                  fontWeight={600}
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  +{node.dailyStarsFormatted}★/d
                                </text>
                              )}
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Inline Legend + Interaction Hint */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {legendLanguages.map((lang) => {
                      const palette = getTrendingLanguageColor(lang, isDark);
                      return (
                        <span key={lang} className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: palette.dotColor }}
                            aria-hidden="true"
                          />
                          <span>{lang}</span>
                        </span>
                      );
                    })}
                  </div>
                  <span>{copy.clickHint}</span>
                </div>
              </div>

              {/* Right 5 Cols: Spotlight Repository Inspector + Top Daily Movers */}
              <div className="flex flex-col justify-between border-t border-slate-200 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0 dark:border-slate-800">
                {spotlightNode && (
                  <div data-testid="bubble-spotlight-inspector">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {spotlightNode.repo.ownerAvatarUrl ? (
                          <img
                            src={spotlightNode.repo.ownerAvatarUrl}
                            alt={spotlightNode.repo.ownerLogin}
                            className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {spotlightNode.repo.ownerLogin.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            #{spotlightNode.rank} · {spotlightNode.repo.language || 'Unknown'} ·{' '}
                            {spotlightNode.repo.license}
                          </p>
                          <h3
                            data-testid="bubble-spotlight-repo-name"
                            className="truncate text-sm font-bold text-slate-900 dark:text-white"
                          >
                            {spotlightNode.repo.fullName}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {spotlightNode.repo.description || '—'}
                    </p>

                    {/* Three Tabular KPI Cells */}
                    <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 py-2 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.dailyStarsLabel}
                        </dt>
                        <dd
                          data-testid="bubble-spotlight-daily-stars"
                          className="mt-0.5 font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400"
                        >
                          +{spotlightNode.repo.dailyStars.toLocaleString()}
                          {copy.perDaySuffix}
                        </dd>
                      </div>
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.totalStarsLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatCompactCount(spotlightNode.repo.stars)}
                        </dd>
                      </div>
                      <div className="px-2.5">
                        <dt className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {copy.forksLabel}
                        </dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {formatCompactCount(spotlightNode.repo.forks)}
                        </dd>
                      </div>
                    </dl>

                    {/* Unboxed inline metadata: topics + last push date */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate font-mono">
                        {spotlightNode.repo.topics.length > 0
                          ? spotlightNode.repo.topics
                              .slice(0, 4)
                              .map((t) => `#${t}`)
                              .join(' · ')
                          : '#ai'}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {copy.pushedLabel} {formatShortIsoDate(spotlightNode.repo.pushedAt)}
                      </span>
                    </div>

                    {/* Action Links */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={spotlightNode.repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        <span>{copy.openGithubButton}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {matchedCatalogProject && (
                        <button
                          type="button"
                          onClick={() => onOpenDetail(matchedCatalogProject)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <span>{copy.inspectVibeAtlasButton}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Compact Top Daily Movers Quick-Jump Strip */}
                {bubbleNodes.length > 1 && (
                  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {copy.topMoversHeading}
                    </p>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {bubbleNodes.slice(0, 4).map((node) => {
                        const isSelected = spotlightNode?.repo.id === node.repo.id;
                        return (
                          <li key={node.repo.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedRepoId(node.repo.id)}
                              className={`flex w-full items-center justify-between gap-2 py-1.5 text-left text-xs transition-colors ${
                                isSelected
                                  ? 'font-semibold text-blue-700 dark:text-blue-400'
                                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                <span className="mr-1.5 font-mono text-[11px] text-slate-400">
                                  #{node.rank}
                                </span>
                                {node.repo.fullName}
                              </span>
                              <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                +{node.dailyStarsFormatted}
                                {copy.perDaySuffix}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
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
