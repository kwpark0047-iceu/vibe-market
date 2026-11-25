import type { CatalogProject } from '../types/vibeatlas';
import { buildHistoricalGrowthSeries, STAR_SNAPSHOTS_STORAGE_KEY } from './starHistory';
import { computeWeeklyStarGain, loadAllStarSnapshots } from './trendingStars';

export type GrowthVelocityMetric = 'star_growth_30d' | 'star_growth_7d' | 'signal_velocity';

export interface VelocitySeriesPoint {
  date: string;
  shortDate: string;
  dailyDelta: number;
  cumulativeValue: number;
}

export interface ProjectVelocityEntry {
  project: CatalogProject;
  rank: number;
  metric: GrowthVelocityMetric;
  totalDelta: number;
  dailyVelocity: number;
  currentTotal: number;
  windowDays: number;
  series: VelocitySeriesPoint[];
}

export interface GrowthVelocitySummary {
  metric: GrowthVelocityMetric;
  recommendedMetric: GrowthVelocityMetric;
  hasStarGrowth30d: boolean;
  hasStarGrowth7d: boolean;
  totalProjectsEvaluated: number;
  entries: ProjectVelocityEntry[];
  maxDelta: number;
  maxVelocity: number;
}

export interface ComputeVelocityOptions {
  metric?: GrowthVelocityMetric;
  limit?: number;
  nowMs?: number;
  snapshotsByRepo?: Record<string, Record<string, number>>;
  storage?: Storage | null;
}

const DAY_MS = 86_400_000;

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return isoDate.slice(5, 10) || isoDate;
}

function buildStarWindowSeries(
  project: CatalogProject,
  repoSnapshots: Record<string, number>,
  windowDays: number,
  nowMs: number
): VelocitySeriesPoint[] {
  const todayUtc = new Date(nowMs);
  const todayStartMs = Date.UTC(
    todayUtc.getUTCFullYear(),
    todayUtc.getUTCMonth(),
    todayUtc.getUTCDate()
  );
  const windowStartMs = todayStartMs - (windowDays - 1) * DAY_MS;
  const windowEndMs = todayStartMs + DAY_MS;

  // Prefer multi-day snapshot timeline when >= 2 snapshots exist inside or overlapping the window
  const snapPoints = Object.entries(repoSnapshots)
    .map(([date, stars]) => ({
      date,
      ms: Date.parse(`${date}T00:00:00.000Z`),
      stars,
    }))
    .filter((item) => Number.isFinite(item.ms) && item.ms >= windowStartMs - 7 * DAY_MS && item.ms <= windowEndMs)
    .sort((a, b) => a.ms - b.ms);

  if (snapPoints.length >= 2) {
    const baseStars = snapPoints[0].stars;
    return snapPoints.map((pt, idx) => {
      const prevStars = idx === 0 ? pt.stars : snapPoints[idx - 1].stars;
      return {
        date: pt.date,
        shortDate: formatShortDate(pt.date),
        dailyDelta: Math.max(0, pt.stars - prevStars),
        cumulativeValue: Math.max(0, pt.stars - baseStars),
      };
    });
  }

  // Otherwise use historicalSignals daily deltas within windowDays
  const rawSignals = (project.historicalSignals ?? [])
    .filter((pt) => {
      const ms = Date.parse(`${pt.date}T00:00:00.000Z`);
      return Number.isFinite(ms) && ms >= windowStartMs && ms <= windowEndMs;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  return rawSignals.map((pt) => {
    const delta = Math.max(0, Number(pt.githubStarsDelta) || 0);
    running += delta;
    return {
      date: pt.date,
      shortDate: formatShortDate(pt.date),
      dailyDelta: delta,
      cumulativeValue: running,
    };
  });
}

function computeSignalVelocityEntry(
  project: CatalogProject,
  nowMs: number
): Omit<ProjectVelocityEntry, 'rank'> {
  const hist = buildHistoricalGrowthSeries(project);
  const points = hist.points;

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    const startTotal = first.internalLikes + first.internalBookmarks;
    const endTotal = last.internalLikes + last.internalBookmarks;
    const currentTotal = Math.max(endTotal, project.likesCount + project.bookmarksCount);
    const totalDelta = Math.max(0, endTotal - startTotal);
    const spanMs = Math.max(
      DAY_MS,
      Date.parse(`${last.date}T00:00:00.000Z`) - Date.parse(`${first.date}T00:00:00.000Z`)
    );
    const windowDays = Math.max(1, Math.round(spanMs / DAY_MS) + 1);
    const dailyVelocity = Number((totalDelta / windowDays).toFixed(2));

    const series: VelocitySeriesPoint[] = points.map((pt, idx) => {
      const val = pt.internalLikes + pt.internalBookmarks;
      const prevVal =
        idx === 0 ? val : points[idx - 1].internalLikes + points[idx - 1].internalBookmarks;
      return {
        date: pt.date,
        shortDate: pt.shortDate,
        dailyDelta: Math.max(0, val - prevVal),
        cumulativeValue: Math.max(0, val - startTotal),
      };
    });

    return {
      project,
      metric: 'signal_velocity',
      totalDelta,
      dailyVelocity,
      currentTotal,
      windowDays,
      series,
    };
  }

  // Fallback for projects without historicalSignals (e.g., newly submitted or Top 100 Web Apps)
  const currentTotal = Math.max(0, project.likesCount + project.bookmarksCount);
  const createdMs = Date.parse(project.createdAtIso);
  const ageDays = Number.isFinite(createdMs)
    ? Math.min(30, Math.max(1, Math.round((nowMs - createdMs) / DAY_MS)))
    : 14;
  const dailyVelocity = Number((currentTotal / ageDays).toFixed(2));

  return {
    project,
    metric: 'signal_velocity',
    totalDelta: currentTotal,
    dailyVelocity,
    currentTotal,
    windowDays: ageDays,
    series: [
      {
        date: (project.createdAtIso || new Date(nowMs).toISOString()).slice(0, 10),
        shortDate: formatShortDate(
          (project.createdAtIso || new Date(nowMs).toISOString()).slice(0, 10)
        ),
        dailyDelta: currentTotal,
        cumulativeValue: currentTotal,
      },
    ],
  };
}

/**
 * Computes ranked project growth velocity entries across a 30-day or 7-day star growth window,
 * or verified VibeAtlas community signal velocity, using only recorded snapshots & signals.
 */
export function computeProjectGrowthVelocities(
  projects: CatalogProject[],
  options: ComputeVelocityOptions = {}
): GrowthVelocitySummary {
  const nowMs = options.nowMs ?? Date.now();
  const limit = Math.max(1, options.limit ?? 6);
  const allSnapshots =
    options.snapshotsByRepo ??
    (options.storage !== undefined
      ? loadAllStarSnapshots(options.storage)
      : loadAllStarSnapshots());

  // Evaluate availability across all candidate projects so callers can recommend or switch cleanly
  const star30List: Omit<ProjectVelocityEntry, 'rank'>[] = [];
  const star7List: Omit<ProjectVelocityEntry, 'rank'>[] = [];

  for (const project of projects) {
    const repoKey = project.githubRepo.trim().toLowerCase();
    const repoSnaps = repoKey ? allSnapshots[repoKey] ?? {} : {};
    const snapDays = Object.keys(repoSnaps).sort();
    const latestSnapStars =
      snapDays.length > 0 ? Math.max(0, Number(repoSnaps[snapDays[snapDays.length - 1]]) || 0) : 0;
    const resolvedCurrentStars = Math.max(0, project.githubStars, latestSnapStars);

    const gain30 = computeWeeklyStarGain(project, repoSnaps, nowMs, 30);
    if (gain30 > 0) {
      const series = buildStarWindowSeries(project, repoSnaps, 30, nowMs);
      star30List.push({
        project,
        metric: 'star_growth_30d',
        totalDelta: gain30,
        dailyVelocity: Number((gain30 / 30).toFixed(2)),
        currentTotal: resolvedCurrentStars,
        windowDays: 30,
        series,
      });
    }

    const gain7 = computeWeeklyStarGain(project, repoSnaps, nowMs, 7);
    if (gain7 > 0) {
      const series = buildStarWindowSeries(project, repoSnaps, 7, nowMs);
      star7List.push({
        project,
        metric: 'star_growth_7d',
        totalDelta: gain7,
        dailyVelocity: Number((gain7 / 7).toFixed(2)),
        currentTotal: resolvedCurrentStars,
        windowDays: 7,
        series,
      });
    }
  }

  const hasStarGrowth30d = star30List.length > 0;
  const hasStarGrowth7d = star7List.length > 0;
  const recommendedMetric: GrowthVelocityMetric = hasStarGrowth30d
    ? 'star_growth_30d'
    : hasStarGrowth7d
      ? 'star_growth_7d'
      : 'signal_velocity';

  const activeMetric = options.metric ?? recommendedMetric;

  let rawEntries: Omit<ProjectVelocityEntry, 'rank'>[];
  if (activeMetric === 'star_growth_30d') {
    rawEntries = star30List;
  } else if (activeMetric === 'star_growth_7d') {
    rawEntries = star7List;
  } else {
    rawEntries = projects
      .map((project) => computeSignalVelocityEntry(project, nowMs))
      .filter((entry) => entry.totalDelta > 0);
  }

  rawEntries.sort((a, b) => {
    if (b.totalDelta !== a.totalDelta) return b.totalDelta - a.totalDelta;
    if (b.dailyVelocity !== a.dailyVelocity) return b.dailyVelocity - a.dailyVelocity;
    if (b.project.githubStars !== a.project.githubStars) {
      return b.project.githubStars - a.project.githubStars;
    }
    return a.project.id.localeCompare(b.project.id);
  });

  const entries: ProjectVelocityEntry[] = rawEntries.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  let maxDelta = 0;
  let maxVelocity = 0;
  for (const entry of entries) {
    if (entry.totalDelta > maxDelta) maxDelta = entry.totalDelta;
    if (entry.dailyVelocity > maxVelocity) maxVelocity = entry.dailyVelocity;
  }

  return {
    metric: activeMetric,
    recommendedMetric,
    hasStarGrowth30d,
    hasStarGrowth7d,
    totalProjectsEvaluated: projects.length,
    entries,
    maxDelta,
    maxVelocity,
  };
}

export { STAR_SNAPSHOTS_STORAGE_KEY };
