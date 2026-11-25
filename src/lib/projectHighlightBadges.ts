import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import { computeStarGainsMap } from './trendingStars';
import { sanitizeExternalUrl } from './validation';

export type ProjectHighlightBadgeKind = 'featured' | 'new_arrival' | 'high_activity';

export type HighActivitySignalReason =
  | 'github_stars_7d'
  | 'community_signals_7d'
  | 'recent_repo_surge'
  | 'live_interactions';

export interface ProjectHighlightBadge {
  kind: ProjectHighlightBadgeKind;
  priority: number;
  metricValue?: number;
  reason?: HighActivitySignalReason;
  referenceDate?: string;
}

export interface CatalogHighlightContext {
  featuredIds: ReadonlySet<string>;
  starGains7d: ReadonlyMap<string, number>;
  nowMs: number;
}

export interface ResolveHighlightBadgesOptions {
  context?: CatalogHighlightContext;
  starsGained7d?: number;
  activities?: ReadonlyArray<ProjectActivityRecord>;
  nowMs?: number;
  maxBadges?: number;
  newArrivalWindowDays?: number;
  highActivitySignalThreshold?: number;
  highActivityStarThreshold?: number;
}

const DAY_MS = 86_400_000;
const DEFAULT_NEW_ARRIVAL_WINDOW_DAYS = 14;
const LIVE_SUBMISSION_NEW_WINDOW_DAYS = 21;
const DEFAULT_HIGH_ACTIVITY_SIGNAL_THRESHOLD = 40;
const DEFAULT_HIGH_ACTIVITY_STAR_THRESHOLD = 100;
const DEFAULT_FEATURED_LIMIT = 3;

function parseIsoMs(iso: string): number {
  if (!iso || !iso.trim()) return Number.NaN;
  return Date.parse(iso);
}

function formatDateShort(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Measures the 7-day net internal community engagement growth (likes + bookmarks delta)
 * plus recent daily GitHub star deltas stored on historicalSignals.
 */
export function computeRecentSignalMomentum(project: CatalogProject): {
  internalDelta7d: number;
  starDelta7d: number;
} {
  const points = project.historicalSignals ?? [];
  if (points.length === 0) {
    return { internalDelta7d: 0, starDelta7d: 0 };
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const recentWindow = sorted.slice(-Math.min(7, sorted.length));
  const latest = recentWindow[recentWindow.length - 1];
  const windowStartIdx = Math.max(0, sorted.length - recentWindow.length - 1);
  const baseline = sorted[windowStartIdx];

  const baselineTotal = Math.max(
    0,
    (Number(baseline.internalLikes) || 0) + (Number(baseline.internalBookmarks) || 0)
  );
  const latestTotal = Math.max(
    0,
    (Number(latest.internalLikes) || 0) + (Number(latest.internalBookmarks) || 0)
  );

  const internalDelta7d = Math.max(0, latestTotal - baselineTotal);
  const starDelta7d = recentWindow.reduce(
    (sum, pt) => sum + Math.max(0, Number(pt.githubStarsDelta) || 0),
    0
  );

  return { internalDelta7d, starDelta7d };
}

function computeFeaturedStandingScore(project: CatalogProject, nowMs: number): number {
  if (project.verificationStatus !== 'verified') return -1;

  const updatedMs = parseIsoMs(project.updatedAtIso);
  const ageDays = Number.isNaN(updatedMs) ? 999 : (nowMs - updatedMs) / DAY_MS;
  // Stale, long-unmaintained listings should not occupy editorial Featured slots
  if (ageDays > 90 && !project.isFeatured) return -1;

  const engagement =
    Math.max(0, project.likesCount) * 2 + Math.max(0, project.bookmarksCount) * 3;
  const starBoost = project.lastSyncedAt ? Math.log1p(Math.max(0, project.githubStars)) * 18 : 0;
  const liveDemoBonus = sanitizeExternalUrl(project.liveDemoUrl) ? 12 : 0;
  const websiteBonus = sanitizeExternalUrl(project.websiteUrl) ? 8 : 0;
  const repoBonus = project.githubRepo.trim() ? 10 : 0;
  const bilingualBonus = project.taglineKo.trim() && project.tagline.trim() ? 6 : 0;
  const makerBonus =
    project.provenanceSource === 'maker_submitted' && project.isCuratedSeed === false ? 45 : 0;

  return engagement + starBoost + liveDemoBonus + websiteBonus + repoBonus + bilingualBonus + makerBonus;
}

/**
 * Computes catalog-wide context so 'Featured' remains selective (capped to top flagship picks)
 * and 'High Activity' incorporates 7-day recorded GitHub star snapshots.
 */
export function computeCatalogHighlightContext(
  projects: ReadonlyArray<CatalogProject>,
  options: {
    nowMs?: number;
    featuredLimit?: number;
    snapshotsByRepo?: Record<string, Record<string, number>>;
    storage?: Storage | null;
  } = {}
): CatalogHighlightContext {
  const nowMs = options.nowMs ?? Date.now();
  const featuredLimit = Math.max(1, options.featuredLimit ?? DEFAULT_FEATURED_LIMIT);
  const starGains7d = computeStarGainsMap([...projects], {
    nowMs,
    windowDays: 7,
    snapshotsByRepo: options.snapshotsByRepo,
    storage: options.storage,
  });

  const featuredIds = new Set<string>();

  // 1. Explicit editorial or top-3 leaderboard ranks always qualify
  for (const project of projects) {
    if (project.isFeatured === true) {
      featuredIds.add(project.id);
    } else if (
      typeof project.leaderboardRank === 'number' &&
      project.leaderboardRank > 0 &&
      project.leaderboardRank <= 3
    ) {
      featuredIds.add(project.id);
    }
  }

  // 2. Fill remaining Featured flagship slots from top verified catalog entries
  if (featuredIds.size < featuredLimit) {
    const candidates = projects
      .filter((p) => !featuredIds.has(p.id))
      .map((project) => ({
        project,
        score: computeFeaturedStandingScore(project, nowMs),
      }))
      .filter((item) => item.score >= 120)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.project.id.localeCompare(b.project.id);
      });

    for (const candidate of candidates) {
      if (featuredIds.size >= featuredLimit) break;
      featuredIds.add(candidate.project.id);
    }
  }

  return {
    featuredIds,
    starGains7d,
    nowMs,
  };
}

/**
 * Resolves ordered highlight badges ('featured', 'high_activity', 'new_arrival')
 * for a single project card using verifiable project metadata & activity signals.
 */
export function resolveProjectHighlightBadges(
  project: CatalogProject,
  options: ResolveHighlightBadgesOptions = {}
): ProjectHighlightBadge[] {
  const nowMs = options.nowMs ?? options.context?.nowMs ?? Date.now();
  const maxBadges = Math.max(1, options.maxBadges ?? 2);
  const newArrivalDays = Math.max(
    1,
    options.newArrivalWindowDays ??
      (project.isCuratedSeed === false
        ? LIVE_SUBMISSION_NEW_WINDOW_DAYS
        : DEFAULT_NEW_ARRIVAL_WINDOW_DAYS)
  );
  const signalThreshold = Math.max(
    1,
    options.highActivitySignalThreshold ?? DEFAULT_HIGH_ACTIVITY_SIGNAL_THRESHOLD
  );
  const starThreshold = Math.max(
    1,
    options.highActivityStarThreshold ?? DEFAULT_HIGH_ACTIVITY_STAR_THRESHOLD
  );

  const badges: ProjectHighlightBadge[] = [];

  // 1. Featured
  const isContextFeatured = options.context
    ? options.context.featuredIds.has(project.id)
    : project.isFeatured === true ||
      (typeof project.leaderboardRank === 'number' &&
        project.leaderboardRank > 0 &&
        project.leaderboardRank <= 3);

  if (isContextFeatured) {
    badges.push({
      kind: 'featured',
      priority: 1,
      metricValue: project.leaderboardRank,
    });
  }

  // 2. High Activity (measured exclusively from real velocity/engagement telemetry)
  const stars7d =
    options.starsGained7d ?? options.context?.starGains7d.get(project.id) ?? 0;
  const { internalDelta7d, starDelta7d } = computeRecentSignalMomentum(project);
  const effectiveStars7d = Math.max(stars7d, starDelta7d);
  const livePositiveActions = (options.activities ?? []).filter(
    (act) => act.type === 'like' || act.type === 'bookmark'
  ).length;
  const updatedMs = parseIsoMs(project.updatedAtIso);
  const updatedAgeDays = Number.isNaN(updatedMs)
    ? Number.POSITIVE_INFINITY
    : (nowMs - updatedMs) / DAY_MS;

  if (effectiveStars7d >= starThreshold) {
    badges.push({
      kind: 'high_activity',
      priority: 2,
      metricValue: effectiveStars7d,
      reason: 'github_stars_7d',
    });
  } else if (internalDelta7d >= signalThreshold) {
    badges.push({
      kind: 'high_activity',
      priority: 2,
      metricValue: internalDelta7d,
      reason: 'community_signals_7d',
    });
  } else if (
    Boolean(project.lastSyncedAt) &&
    project.githubStars >= 5000 &&
    updatedAgeDays >= -1 &&
    updatedAgeDays <= 3
  ) {
    badges.push({
      kind: 'high_activity',
      priority: 2,
      metricValue: project.githubStars,
      reason: 'recent_repo_surge',
    });
  } else if (livePositiveActions >= 3) {
    badges.push({
      kind: 'high_activity',
      priority: 2,
      metricValue: livePositiveActions,
      reason: 'live_interactions',
    });
  }

  // 3. New Arrival (launched within the configured recency window)
  const createdMs = parseIsoMs(project.createdAtIso);
  if (!Number.isNaN(createdMs)) {
    const ageMs = nowMs - createdMs;
    if (ageMs >= -DAY_MS && ageMs <= newArrivalDays * DAY_MS) {
      badges.push({
        kind: 'new_arrival',
        priority: 3,
        referenceDate: formatDateShort(createdMs),
      });
    }
  }

  badges.sort((a, b) => a.priority - b.priority);
  return badges.slice(0, maxBadges);
}
