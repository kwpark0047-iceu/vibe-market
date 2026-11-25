import type {
  CatalogProject,
  GitHubAiTrendingRepo,
} from '../types/vibeatlas';
import { findCatalogProjectByRepo } from './githubLeaderboard';
import { loadStarSnapshots } from './starHistory';
import { loadAllStarSnapshots } from './trendingStars';

export type Trending24hSourceKind =
  | 'catalog_snapshot_24h'
  | 'github_snapshot_24h'
  | 'github_daily_velocity';

export interface Trending24hEntry {
  id: string;
  rank: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string;
  totalStars: number;
  starsGained24h: number;
  growthPct24h: number | null;
  sourceKind: Trending24hSourceKind;
  matchedCatalogProject: CatalogProject | null;
  pushedAt: string;
}

export interface SelectTrending24hOptions {
  catalogProjects: ReadonlyArray<CatalogProject>;
  liveTrendingRepos: ReadonlyArray<GitHubAiTrendingRepo>;
  languageFilter?: string;
  limit?: number;
  nowMs?: number;
  snapshotsByRepo?: Record<string, Record<string, number>>;
  storage?: Storage | null;
}

export interface Trending24hSummary {
  entries: Trending24hEntry[];
  availableLanguages: string[];
  totalCandidates: number;
  maxGain24h: number;
  hasExact24hSnapshots: boolean;
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

export function computeGrowthPct24h(starsGained24h: number, totalStars: number): number | null {
  if (!Number.isFinite(starsGained24h) || starsGained24h <= 0) return null;
  if (!Number.isFinite(totalStars) || totalStars <= 0) return null;
  const priorStars = totalStars - starsGained24h;
  if (priorStars <= 0) return null;
  const pct = (starsGained24h / priorStars) * 100;
  return Number(pct.toFixed(pct >= 10 ? 0 : 1));
}

export function computeCatalog24hStarGain(
  project: CatalogProject,
  repoSnapshots: Record<string, number> = {},
  nowMs: number = Date.now()
): { gain24h: number; totalStars: number; isExact24hSnapshot: boolean } {
  const todayUtcMs = toUtcDayStartMs(nowMs);
  const windowStartMs = todayUtcMs - DAY_MS;
  const windowEndMs = todayUtcMs + DAY_MS;

  let signalGain24h = 0;
  if (Array.isArray(project.historicalSignals) && project.historicalSignals.length > 0) {
    const recentSignals = project.historicalSignals
      .map((pt) => ({ dayMs: parseIsoDayMs(pt.date), delta: Math.max(0, Number(pt.githubStarsDelta) || 0) }))
      .filter((item): item is { dayMs: number; delta: number } => item.dayMs !== null)
      .filter((item) => item.dayMs >= windowStartMs && item.dayMs <= windowEndMs)
      .sort((a, b) => b.dayMs - a.dayMs);

    if (recentSignals.length > 0) {
      signalGain24h = recentSignals[0]!.delta;
    }
  }

  let snapshotGain24h = 0;
  let latestSnapshotStars = 0;
  const sortedSnaps = Object.entries(repoSnapshots)
    .map(([day, count]) => ({ dayMs: parseIsoDayMs(day), count: Number(count) }))
    .filter(
      (item): item is { dayMs: number; count: number } =>
        item.dayMs !== null && Number.isFinite(item.count) && item.count >= 0
    )
    .sort((a, b) => a.dayMs - b.dayMs);

  if (sortedSnaps.length > 0) {
    latestSnapshotStars = sortedSnaps[sortedSnaps.length - 1]!.count;
  }

  if (sortedSnaps.length >= 2) {
    const latest = sortedSnaps[sortedSnaps.length - 1]!;
    const prev = sortedSnaps[sortedSnaps.length - 2]!;
    const daySpan = Math.max(1, Math.round((latest.dayMs - prev.dayMs) / DAY_MS));
    if (latest.dayMs >= windowStartMs && daySpan <= 2 && latest.count > prev.count) {
      snapshotGain24h = Math.max(1, Math.round((latest.count - prev.count) / daySpan));
    }
  }

  const gain24h = Math.max(signalGain24h, snapshotGain24h);
  const totalStars = Math.max(0, Number(project.githubStars) || 0, latestSnapshotStars);
  return {
    gain24h,
    totalStars,
    isExact24hSnapshot: gain24h > 0,
  };
}

export function selectTrending24hProjects(
  options: SelectTrending24hOptions
): Trending24hSummary {
  const nowMs = options.nowMs ?? Date.now();
  const limit = Math.max(1, options.limit ?? 6);
  const languageFilter = (options.languageFilter ?? 'all').trim().toLowerCase();

  const allSnapshots =
    options.snapshotsByRepo ??
    (options.storage !== undefined
      ? loadAllStarSnapshots(options.storage)
      : loadAllStarSnapshots());

  const byRepoKey = new Map<string, Trending24hEntry>();

  // 1. Evaluate catalog projects with recorded 24h GitHub star snapshots/signals
  for (const project of options.catalogProjects) {
    const repoKey = (project.githubRepo || '').trim().toLowerCase();
    if (!repoKey) continue;

    const repoSnaps =
      allSnapshots[repoKey] ??
      (options.snapshotsByRepo ? {} : loadStarSnapshots(project.githubRepo, options.storage));

    const { gain24h, totalStars } = computeCatalog24hStarGain(project, repoSnaps, nowMs);
    if (gain24h <= 0) continue;

    byRepoKey.set(repoKey, {
      id: `cat-${project.id}`,
      rank: 0,
      name: project.name,
      fullName: project.githubRepo,
      description: project.taglineKo || project.tagline,
      htmlUrl: project.githubUrl || `https://github.com/${project.githubRepo}`,
      language: project.techStack[0] || '',
      totalStars,
      starsGained24h: gain24h,
      growthPct24h: computeGrowthPct24h(gain24h, totalStars),
      sourceKind: 'catalog_snapshot_24h',
      matchedCatalogProject: project,
      pushedAt: project.lastSyncedAt || project.updatedAtIso,
    });
  }

  // 2. Merge live GitHub trending repositories from /api/github/ai-trending
  for (const repo of options.liveTrendingRepos) {
    const repoKey = (repo.fullName || '').trim().toLowerCase();
    if (!repoKey || repo.dailyStars <= 0) continue;

    const matchedCatalog = findCatalogProjectByRepo(options.catalogProjects, repo.fullName);
    const existing = byRepoKey.get(repoKey);

    if (existing) {
      // Keep exact catalog 24h snapshot if larger/equal; otherwise enrich metadata & stars
      const nextStars = Math.max(existing.totalStars, repo.stars);
      const nextGain =
        repo.dailyRateSource === 'snapshot_24h'
          ? Math.max(existing.starsGained24h, repo.dailyStars)
          : existing.starsGained24h;
      byRepoKey.set(repoKey, {
        ...existing,
        language: repo.language || existing.language,
        totalStars: nextStars,
        starsGained24h: nextGain,
        growthPct24h: computeGrowthPct24h(nextGain, nextStars),
        description: existing.description || repo.description,
        pushedAt: repo.pushedAt || existing.pushedAt,
      });
      continue;
    }

    const totalStars = Math.max(0, Number(repo.stars) || 0);
    const gain24h = Math.max(0, Math.round(Number(repo.dailyStars) || 0));
    byRepoKey.set(repoKey, {
      id: `gh-${repo.id}`,
      rank: 0,
      name: repo.name || repo.fullName,
      fullName: repo.fullName,
      description: repo.description,
      htmlUrl: repo.htmlUrl || `https://github.com/${repo.fullName}`,
      language: (repo.language || '').trim(),
      totalStars,
      starsGained24h: gain24h,
      growthPct24h: computeGrowthPct24h(gain24h, totalStars),
      sourceKind:
        repo.dailyRateSource === 'snapshot_24h'
          ? 'github_snapshot_24h'
          : 'github_daily_velocity',
      matchedCatalogProject: matchedCatalog,
      pushedAt: repo.pushedAt || '',
    });
  }

  const allCandidates = Array.from(byRepoKey.values());

  // Extract top languages before filtering
  const langCounts = new Map<string, { label: string; count: number }>();
  for (const item of allCandidates) {
    const lang = item.language.trim();
    if (!lang) continue;
    const key = lang.toLowerCase();
    const prev = langCounts.get(key);
    langCounts.set(key, {
      label: prev ? prev.label : lang,
      count: (prev?.count ?? 0) + 1,
    });
  }
  const availableLanguages = Array.from(langCounts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5)
    .map((x) => x.label);

  const filtered = allCandidates.filter((item) => {
    if (!languageFilter || languageFilter === 'all') return true;
    return item.language.trim().toLowerCase() === languageFilter;
  });

  filtered.sort((a, b) => {
    if (b.starsGained24h !== a.starsGained24h) return b.starsGained24h - a.starsGained24h;
    if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
    return a.fullName.localeCompare(b.fullName);
  });

  const entries = filtered.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const maxGain24h = entries.reduce((max, item) => Math.max(max, item.starsGained24h), 0);
  const hasExact24hSnapshots = entries.some(
    (item) =>
      item.sourceKind === 'catalog_snapshot_24h' ||
      item.sourceKind === 'github_snapshot_24h'
  );

  return {
    entries,
    availableLanguages,
    totalCandidates: filtered.length,
    maxGain24h,
    hasExact24hSnapshots,
  };
}
