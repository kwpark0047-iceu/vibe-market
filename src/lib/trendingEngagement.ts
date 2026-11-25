import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';

export type EngagementTrendingSource = 'signals_7d' | 'live_activity' | 'launch_momentum';

export interface EngagementTrendingInfo {
  rank: number;
  likesGained7d: number;
  bookmarksGained7d: number;
  totalGained7d: number;
  growthRatePct7d: number;
  trendingScore: number;
  source: EngagementTrendingSource;
}

export interface ComputeEngagementTrendingOptions {
  nowMs?: number;
  activities?: ReadonlyArray<ProjectActivityRecord>;
  windowDays?: number;
  maxBadges?: number;
  minTotalGained7d?: number;
}

const DAY_MS = 86_400_000;

function toUtcDayStartMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseIsoDayMs(dayStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayStr)) return null;
  const parsed = Date.parse(`${dayStr}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseTimestampMs(iso: string): number | null {
  if (!iso || !iso.trim()) return null;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Computes a project's 7-day growth in internal likes & bookmarks strictly without mixing
 * external GitHub star counts. Combines:
 * 1) Cumulative 7-day delta from `historicalSignals`
 * 2) Live `ProjectActivityRecord` likes/bookmarks recorded after the latest signal snapshot
 *    (or across the 7d window when no signal snapshots cover it)
 * 3) Launch momentum when a project was created within the 7d window without prior history
 */
export function computeProjectEngagementGrowth7d(
  project: CatalogProject,
  options: Omit<ComputeEngagementTrendingOptions, 'maxBadges' | 'minTotalGained7d'> = {}
): Omit<EngagementTrendingInfo, 'rank'> {
  const nowMs = options.nowMs ?? Date.now();
  const safeWindowDays = Math.max(1, Math.floor(options.windowDays ?? 7));
  const todayUtcMs = toUtcDayStartMs(nowMs);
  const windowStartMs = todayUtcMs - (safeWindowDays - 1) * DAY_MS;
  const windowEndMs = todayUtcMs + DAY_MS;

  const sortedSignals = [...(project.historicalSignals ?? [])]
    .map((pt) => ({
      dayMs: parseIsoDayMs(pt.date),
      likes: Math.max(0, Number(pt.internalLikes) || 0),
      bookmarks: Math.max(0, Number(pt.internalBookmarks) || 0),
    }))
    .filter((item): item is { dayMs: number; likes: number; bookmarks: number } => item.dayMs !== null)
    .sort((a, b) => a.dayMs - b.dayMs);

  const inWindowSignals = sortedSignals.filter(
    (item) => item.dayMs >= windowStartMs && item.dayMs <= windowEndMs
  );

  let signalLikes7d = 0;
  let signalBookmarks7d = 0;
  let accelBonus = 0;
  let latestSignalDayEndMs = 0;

  if (inWindowSignals.length > 0) {
    const latest = inWindowSignals[inWindowSignals.length - 1];
    const beforeWindow = sortedSignals.filter((item) => item.dayMs < windowStartMs);
    const baseline =
      beforeWindow.length > 0 ? beforeWindow[beforeWindow.length - 1] : inWindowSignals[0];

    signalLikes7d = Math.max(0, latest.likes - baseline.likes);
    signalBookmarks7d = Math.max(0, latest.bookmarks - baseline.bookmarks);
    latestSignalDayEndMs = latest.dayMs + DAY_MS - 1;

    // Measure recent 3-day acceleration vs the start of the 7d window
    const recent3dCutoff = Math.max(windowStartMs, latest.dayMs - 2 * DAY_MS);
    const midAnchor =
      inWindowSignals.find((item) => item.dayMs >= recent3dCutoff) ?? inWindowSignals[0];
    const recentLikes = Math.max(0, latest.likes - midAnchor.likes);
    const recentBookmarks = Math.max(0, latest.bookmarks - midAnchor.bookmarks);
    accelBonus = (recentLikes + recentBookmarks * 1.5) * 0.25;
  }

  // Count live likes & bookmarks within the 7-day window
  let liveLikes7d = 0;
  let liveBookmarks7d = 0;
  let postSignalLikes = 0;
  let postSignalBookmarks = 0;

  for (const act of options.activities ?? []) {
    const matchesProject =
      act.projectId === project.id ||
      (Boolean(project.slug) && Boolean(act.projectSlug) && act.projectSlug === project.slug);
    if (!matchesProject) continue;
    if (act.type !== 'like' && act.type !== 'bookmark') continue;

    const actMs = parseTimestampMs(act.createdAtIso);
    if (actMs === null || actMs < windowStartMs || actMs > windowEndMs) continue;

    if (act.type === 'like') {
      liveLikes7d += 1;
      if (latestSignalDayEndMs > 0 && actMs > latestSignalDayEndMs) {
        postSignalLikes += 1;
      }
    } else {
      liveBookmarks7d += 1;
      if (latestSignalDayEndMs > 0 && actMs > latestSignalDayEndMs) {
        postSignalBookmarks += 1;
      }
    }
  }

  const createdMs = parseTimestampMs(project.createdAtIso);
  const isLaunchedInWindow =
    createdMs !== null && createdMs >= windowStartMs && createdMs <= windowEndMs;
  const hasMultiDaySignals = sortedSignals.length >= 2 && latestSignalDayEndMs > 0;

  let likesGained7d = 0;
  let bookmarksGained7d = 0;
  let source: EngagementTrendingSource = 'signals_7d';

  if (latestSignalDayEndMs > 0) {
    likesGained7d = signalLikes7d + postSignalLikes;
    bookmarksGained7d = signalBookmarks7d + postSignalBookmarks;
    source = postSignalLikes + postSignalBookmarks > 0 && signalLikes7d + signalBookmarks7d === 0
      ? 'live_activity'
      : 'signals_7d';
  } else if (isLaunchedInWindow && !hasMultiDaySignals) {
    likesGained7d = Math.max(Math.max(0, project.likesCount), liveLikes7d);
    bookmarksGained7d = Math.max(Math.max(0, project.bookmarksCount), liveBookmarks7d);
    source = liveLikes7d + liveBookmarks7d > 0 ? 'live_activity' : 'launch_momentum';
  } else {
    likesGained7d = liveLikes7d;
    bookmarksGained7d = liveBookmarks7d;
    source = 'live_activity';
  }

  const totalGained7d = likesGained7d + bookmarksGained7d;
  const baselineTotal = Math.max(
    1,
    Math.max(0, project.likesCount - likesGained7d) +
      Math.max(0, project.bookmarksCount - bookmarksGained7d)
  );
  const growthRatePct7d =
    totalGained7d > 0 ? Math.round((totalGained7d / baselineTotal) * 100) : 0;

  const liveBoost =
    latestSignalDayEndMs > 0
      ? (postSignalLikes * 1.0 + postSignalBookmarks * 1.5) * 0.25
      : (liveLikes7d * 1.0 + liveBookmarks7d * 1.5) * 0.25;

  const trendingScore =
    totalGained7d > 0
      ? Number(
          (likesGained7d * 1.0 + bookmarksGained7d * 1.5 + accelBonus + liveBoost).toFixed(2)
        )
      : 0;

  return {
    likesGained7d,
    bookmarksGained7d,
    totalGained7d,
    growthRatePct7d,
    trendingScore,
    source,
  };
}

/**
 * Ranks catalog projects strictly by 7-day likes & bookmark growth velocity.
 */
export function rankTrendingByEngagement7d(
  projects: ReadonlyArray<CatalogProject>,
  options: Omit<ComputeEngagementTrendingOptions, 'maxBadges'> = {}
): Array<{ project: CatalogProject; info: EngagementTrendingInfo }> {
  const minTotal = Math.max(1, options.minTotalGained7d ?? 1);

  const scored = projects
    .map((project) => ({
      project,
      metrics: computeProjectEngagementGrowth7d(project, options),
    }))
    .filter((entry) => entry.metrics.totalGained7d >= minTotal && entry.metrics.trendingScore > 0)
    .sort((a, b) => {
      if (b.metrics.trendingScore !== a.metrics.trendingScore) {
        return b.metrics.trendingScore - a.metrics.trendingScore;
      }
      if (b.metrics.totalGained7d !== a.metrics.totalGained7d) {
        return b.metrics.totalGained7d - a.metrics.totalGained7d;
      }
      if (b.metrics.growthRatePct7d !== a.metrics.growthRatePct7d) {
        return b.metrics.growthRatePct7d - a.metrics.growthRatePct7d;
      }
      const totalB = b.project.bookmarksCount + b.project.likesCount;
      const totalA = a.project.bookmarksCount + a.project.likesCount;
      if (totalB !== totalA) return totalB - totalA;
      return a.project.id.localeCompare(b.project.id);
    });

  return scored.map((entry, idx) => ({
    project: entry.project,
    info: {
      rank: idx + 1,
      ...entry.metrics,
    },
  }));
}

/**
 * Produces a lookup map of trending scores for every project in the catalog
 * (used by catalog sorting when `sort === 'trending_7d'`).
 */
export function computeEngagementTrendingScoresMap(
  projects: ReadonlyArray<CatalogProject>,
  options: Omit<ComputeEngagementTrendingOptions, 'maxBadges' | 'minTotalGained7d'> = {}
): Map<string, number> {
  const map = new Map<string, number>();
  for (const project of projects) {
    const metrics = computeProjectEngagementGrowth7d(project, options);
    map.set(project.id, metrics.trendingScore);
  }
  return map;
}

/**
 * Selects the top N trending projects based on 7-day growth in likes & bookmarks
 * so project cards display crisp 'Trending' badges without badge spam.
 */
export function selectTrendingByEngagement7d(
  projects: ReadonlyArray<CatalogProject>,
  options: ComputeEngagementTrendingOptions = {}
): Map<string, EngagementTrendingInfo> {
  const maxBadges = Math.max(1, options.maxBadges ?? 3);
  const ranked = rankTrendingByEngagement7d(projects, options);
  const selected = new Map<string, EngagementTrendingInfo>();
  if (ranked.length === 0) return selected;

  const cutoffScore =
    ranked.length >= maxBadges
      ? ranked[maxBadges - 1].info.trendingScore
      : ranked[ranked.length - 1].info.trendingScore;

  for (let i = 0; i < ranked.length; i += 1) {
    const entry = ranked[i];
    if (i < maxBadges || entry.info.trendingScore >= cutoffScore) {
      selected.set(entry.project.id, entry.info);
    } else {
      break;
    }
  }

  return selected;
}
