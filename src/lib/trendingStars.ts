import type { CatalogProject } from '../types/vibeatlas';
import { loadStarSnapshots, STAR_SNAPSHOTS_STORAGE_KEY } from './starHistory';

export interface TrendingProjectInfo {
  rank: number;
  starsGained7d: number;
}

export interface SelectTrendingOptions {
  nowMs?: number;
  windowDays?: number;
  maxBadges?: number;
  snapshotsByRepo?: Record<string, Record<string, number>>;
  storage?: Storage | null;
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

export function loadAllStarSnapshots(
  storage: Storage | null | undefined = typeof window !== 'undefined' ? window.localStorage : null
): Record<string, Record<string, number>> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STAR_SNAPSHOTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const result: Record<string, Record<string, number>> = {};
    for (const [repoKey, entries] of Object.entries(parsed as Record<string, unknown>)) {
      if (!entries || typeof entries !== 'object') continue;
      const validDays: Record<string, number> = {};
      for (const [day, count] of Object.entries(entries as Record<string, unknown>)) {
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(day) &&
          typeof count === 'number' &&
          Number.isFinite(count) &&
          count >= 0
        ) {
          validDays[day] = count;
        }
      }
      if (Object.keys(validDays).length > 0) {
        result[repoKey.toLowerCase()] = validDays;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function computeWeeklyStarGain(
  project: CatalogProject,
  repoSnapshots: Record<string, number> = {},
  nowMs: number = Date.now(),
  windowDays: number = 7
): number {
  const safeWindowDays = Math.max(1, Math.floor(windowDays));
  const todayUtcMs = toUtcDayStartMs(nowMs);
  const windowStartMs = todayUtcMs - (safeWindowDays - 1) * DAY_MS;
  // Allow +1 UTC day tolerance for callers/timezones slightly ahead of UTC midnight
  const windowEndMs = todayUtcMs + DAY_MS;

  // 1. Sum historicalSignals deltas strictly within the 7-day window
  let signalDelta7d = 0;
  if (Array.isArray(project.historicalSignals)) {
    for (const pt of project.historicalSignals) {
      const dayMs = parseIsoDayMs(pt.date);
      if (dayMs === null) continue;
      if (dayMs >= windowStartMs && dayMs <= windowEndMs) {
        signalDelta7d += Math.max(0, Number(pt.githubStarsDelta) || 0);
      }
    }
  }

  // 2. Derive delta from recorded multi-day star snapshots overlapping the 7-day window
  let snapshotDelta7d = 0;
  const sortedSnapshots = Object.entries(repoSnapshots)
    .map(([day, count]) => ({ dayMs: parseIsoDayMs(day), count }))
    .filter(
      (item): item is { dayMs: number; count: number } =>
        item.dayMs !== null && Number.isFinite(item.count) && item.count >= 0
    )
    .sort((a, b) => a.dayMs - b.dayMs);

  if (sortedSnapshots.length >= 2) {
    const inWindow = sortedSnapshots.filter(
      (item) => item.dayMs >= windowStartMs && item.dayMs <= windowEndMs
    );

    if (inWindow.length > 0) {
      const latestInWindow = inWindow[inWindow.length - 1];
      const beforeWindow = sortedSnapshots.filter((item) => item.dayMs < windowStartMs);

      if (beforeWindow.length > 0) {
        // Use the most recent baseline snapshot right before the 7-day window started
        const baseline = beforeWindow[beforeWindow.length - 1];
        snapshotDelta7d = Math.max(0, latestInWindow.count - baseline.count);
      } else if (inWindow.length >= 2) {
        // Multiple snapshots captured inside the 7-day window
        const earliestInWindow = inWindow[0];
        snapshotDelta7d = Math.max(0, latestInWindow.count - earliestInWindow.count);
      }
    }
  }

  return Math.max(signalDelta7d, snapshotDelta7d);
}

export function computeStarGainsMap(
  projects: CatalogProject[],
  options: Omit<SelectTrendingOptions, 'maxBadges'> = {}
): Map<string, number> {
  const nowMs = options.nowMs ?? Date.now();
  const windowDays = options.windowDays ?? 7;
  const allSnapshots =
    options.snapshotsByRepo ??
    (options.storage !== undefined
      ? loadAllStarSnapshots(options.storage)
      : loadAllStarSnapshots());

  const gains = new Map<string, number>();
  for (const project of projects) {
    const repoKey = project.githubRepo.trim().toLowerCase();
    const repoSnaps = repoKey
      ? allSnapshots[repoKey] ??
        (options.snapshotsByRepo ? {} : loadStarSnapshots(project.githubRepo, options.storage))
      : {};
    const gained = computeWeeklyStarGain(project, repoSnaps, nowMs, windowDays);
    gains.set(project.id, gained);
  }
  return gains;
}

export function selectTrendingProjects7d(
  projects: CatalogProject[],
  options: SelectTrendingOptions = {}
): Map<string, TrendingProjectInfo> {
  const maxBadges = Math.max(1, options.maxBadges ?? 3);
  const gainsMap = computeStarGainsMap(projects, options);

  const ranked = projects
    .map((project) => ({
      project,
      starsGained7d: gainsMap.get(project.id) ?? 0,
    }))
    .filter((entry) => entry.starsGained7d > 0)
    .sort((a, b) => {
      if (b.starsGained7d !== a.starsGained7d) {
        return b.starsGained7d - a.starsGained7d;
      }
      if (b.project.githubStars !== a.project.githubStars) {
        return b.project.githubStars - a.project.githubStars;
      }
      return a.project.id.localeCompare(b.project.id);
    });

  const trending = new Map<string, TrendingProjectInfo>();
  if (ranked.length === 0) return trending;

  const cutoffGain =
    ranked.length >= maxBadges ? ranked[maxBadges - 1].starsGained7d : ranked[ranked.length - 1].starsGained7d;

  for (let i = 0; i < ranked.length; i += 1) {
    const entry = ranked[i];
    if (i < maxBadges || entry.starsGained7d >= cutoffGain) {
      trending.set(entry.project.id, {
        rank: i + 1,
        starsGained7d: entry.starsGained7d,
      });
    } else {
      break;
    }
  }

  return trending;
}
