import * as d3 from 'd3';
import type {
  CatalogProject,
  ContentType,
  GitHubAiTrendingRepo,
  OwnershipClaimRecord,
  SearchFilters,
} from '../types/vibeatlas';
import { resolveMakerVerification } from './makerVerification';
import { loadAllStarSnapshots } from './trendingStars';
import { sanitizeExternalUrl } from './validation';

const DAY_MS = 86_400_000;

export type ScatterQuadrant =
  | 'ecosystem_leaders'
  | 'active_builders'
  | 'established_steady'
  | 'emerging_niche';

export type ScatterScope = 'ecosystem' | 'directory' | 'verified_makers';

export type ScatterPointSource =
  | 'directory'
  | 'directory_enriched'
  | 'github_ecosystem';

export interface ScatterTypeColor {
  fill: string;
  stroke: string;
  dot: string;
}

export interface DiscoveryScatterCandidate {
  id: string;
  name: string;
  slug: string;
  fullName: string;
  description: string;
  contentType: ContentType;
  sourceKind: ScatterPointSource;
  githubStars: number;
  githubForks: number;
  dailyStars: number;
  activityFrequency: number;
  recencyDays: number | null;
  communitySignals: number;
  isVerifiedMaker: boolean;
  htmlUrl: string;
  primaryLanguage: string;
  matchedCatalogProject: CatalogProject | null;
}

export interface DiscoveryScatterPoint extends DiscoveryScatterCandidate {
  quadrant: ScatterQuadrant;
  x: number;
  y: number;
  radius: number;
}

export interface ScatterAxisTick {
  value: number;
  label: string;
  pos: number;
}

export interface DiscoveryScatterPlotLayout {
  points: DiscoveryScatterPoint[];
  totalCandidates: number;
  medianStars: number;
  medianActivity: number;
  thresholdX: number;
  thresholdY: number;
  maxStarsDomain: number;
  xTicks: ScatterAxisTick[];
  yTicks: ScatterAxisTick[];
  quadrantCounts: Record<ScatterQuadrant, number>;
  typeCounts: Partial<Record<ContentType, number>>;
}

export interface BuildScatterDatasetOptions {
  filteredProjects: ReadonlyArray<CatalogProject>;
  liveTrendingRepos?: ReadonlyArray<GitHubAiTrendingRepo>;
  filters?: Partial<SearchFilters>;
  scope?: ScatterScope;
  typeFilter?: ContentType | 'all';
  claims?: ReadonlyArray<OwnershipClaimRecord>;
  snapshotsByRepo?: Record<string, Record<string, number>>;
  storage?: Storage | null;
  nowMs?: number;
  maxEcosystemExtras?: number;
}

export interface BuildScatterLayoutOptions {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export const CONTENT_TYPE_ORDER: readonly ContentType[] = [
  'ai_agent',
  'mcp_server',
  'ai_tool',
  'web_app',
  'open_source',
  'ai_skill',
  'template',
] as const;

export function getScatterTypeColor(type: ContentType, isDark: boolean): ScatterTypeColor {
  switch (type) {
    case 'ai_agent':
      return isDark
        ? { fill: 'rgba(129, 140, 248, 0.78)', stroke: '#c7d2fe', dot: '#818cf8' }
        : { fill: 'rgba(79, 70, 229, 0.78)', stroke: '#312e81', dot: '#4f46e5' };
    case 'mcp_server':
      return isDark
        ? { fill: 'rgba(45, 212, 191, 0.78)', stroke: '#99f6e4', dot: '#2dd4bf' }
        : { fill: 'rgba(13, 148, 136, 0.78)', stroke: '#134e4a', dot: '#0d9488' };
    case 'ai_tool':
      return isDark
        ? { fill: 'rgba(96, 165, 250, 0.78)', stroke: '#bfdbfe', dot: '#60a5fa' }
        : { fill: 'rgba(37, 99, 235, 0.78)', stroke: '#1e3a8a', dot: '#2563eb' };
    case 'web_app':
      return isDark
        ? { fill: 'rgba(52, 211, 153, 0.78)', stroke: '#a7f3d0', dot: '#34d399' }
        : { fill: 'rgba(5, 150, 105, 0.78)', stroke: '#064e3b', dot: '#059669' };
    case 'open_source':
      return isDark
        ? { fill: 'rgba(167, 139, 250, 0.78)', stroke: '#ddd6fe', dot: '#a78bfa' }
        : { fill: 'rgba(124, 58, 237, 0.78)', stroke: '#4c1d95', dot: '#7c3aed' };
    case 'ai_skill':
      return isDark
        ? { fill: 'rgba(251, 191, 36, 0.80)', stroke: '#fde68a', dot: '#fbbf24' }
        : { fill: 'rgba(217, 119, 6, 0.82)', stroke: '#78350f', dot: '#d97706' };
    case 'template':
      return isDark
        ? { fill: 'rgba(251, 113, 133, 0.78)', stroke: '#fecdd3', dot: '#fb7185' }
        : { fill: 'rgba(225, 29, 72, 0.78)', stroke: '#881337', dot: '#e11d48' };
  }
}

export function inferContentTypeFromGitHubRepo(
  repo: Pick<GitHubAiTrendingRepo, 'name' | 'fullName' | 'description' | 'topics'>
): ContentType {
  const haystack = `${repo.fullName} ${repo.name} ${repo.description} ${(repo.topics ?? []).join(' ')}`.toLowerCase();
  if (
    haystack.includes('mcp') ||
    haystack.includes('model-context-protocol') ||
    haystack.includes('context-protocol')
  ) {
    return 'mcp_server';
  }
  if (
    haystack.includes('skill') ||
    haystack.includes('prompt-library') ||
    haystack.includes('prompts') ||
    haystack.includes('claude-code')
  ) {
    return 'ai_skill';
  }
  if (
    haystack.includes('template') ||
    haystack.includes('starter') ||
    haystack.includes('boilerplate')
  ) {
    return 'template';
  }
  if (
    haystack.includes('webapp') ||
    haystack.includes('web-app') ||
    haystack.includes('dashboard') ||
    haystack.includes('frontend')
  ) {
    return 'web_app';
  }
  if (
    haystack.includes('agent') ||
    haystack.includes('autonomous') ||
    haystack.includes('multi-agent') ||
    haystack.includes('autogen') ||
    haystack.includes('crew')
  ) {
    return 'ai_agent';
  }
  if (
    haystack.includes('framework') ||
    haystack.includes('sdk') ||
    haystack.includes('runtime') ||
    haystack.includes('engine') ||
    haystack.includes('library')
  ) {
    return 'open_source';
  }
  return 'ai_tool';
}

export function formatStarTickCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1000) {
    const k = value / 1000;
    return k >= 10 || Number.isInteger(k) ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export interface ActivityFrequencyInput {
  updatedAtIso?: string;
  lastSyncedAt?: string;
  pushedAt?: string;
  dailyStars?: number;
  forks?: number;
  openIssues?: number;
  likesCount?: number;
  bookmarksCount?: number;
  recentSignalDelta?: number;
  nowMs?: number;
}

export interface ActivityFrequencyResult {
  activityFrequency: number;
  recencyDays: number | null;
  communitySignals: number;
}

export function computeActivityFrequency(
  input: ActivityFrequencyInput
): ActivityFrequencyResult {
  const nowMs =
    typeof input.nowMs === 'number' && Number.isFinite(input.nowMs)
      ? input.nowMs
      : Date.now();

  const candidateTimestamps = [
    input.pushedAt,
    input.lastSyncedAt,
    input.updatedAtIso,
  ]
    .map((raw) => (raw ? Date.parse(raw) : NaN))
    .filter((ms) => Number.isFinite(ms) && ms > 0);

  let recencyDays: number | null = null;
  let recencyScore = 4;
  if (candidateTimestamps.length > 0) {
    const newestMs = Math.max(...candidateTimestamps);
    const ageHours = Math.max(0, (nowMs - newestMs) / 3_600_000);
    const ageDays = ageHours / 24;
    recencyDays = Math.round(ageDays);
    // Smooth hourly decay (~18-day half-life) so active repos separate by exact push cadence
    recencyScore = Math.round(35 * Math.exp(-ageHours / (24 * 18)));
  }

  const dailyStars = Math.max(0, Number(input.dailyStars) || 0);
  const forks = Math.max(0, Number(input.forks) || 0);
  const openIssues = Math.max(0, Number(input.openIssues) || 0);

  // Up to 48 pts from daily star rate + active issue/fork maintenance without early plateauing
  let velocityScore = 0;
  if (dailyStars > 0) {
    const ratePart = 36 * clampZeroOne(Math.log1p(dailyStars) / Math.log1p(650));
    const issuePart = 12 * clampZeroOne(Math.log1p(openIssues) / Math.log1p(1200));
    velocityScore = Math.min(48, Math.round(ratePart + issuePart));
  } else if (forks > 0 || openIssues > 0) {
    const forkPart = 9 * clampZeroOne(Math.log1p(forks) / Math.log1p(8000));
    const issuePart = 7 * clampZeroOne(Math.log1p(openIssues) / Math.log1p(400));
    velocityScore = Math.min(16, Math.round(forkPart + issuePart));
  }

  // Up to 17 pts from VibeAtlas community interactions & 14d signal cadence
  const likes = Math.max(0, Number(input.likesCount) || 0);
  const bookmarks = Math.max(0, Number(input.bookmarksCount) || 0);
  const recentDelta = Math.max(0, Number(input.recentSignalDelta) || 0);
  const weightedSignals = likes + 1.35 * bookmarks + 1.4 * recentDelta;
  const communityScore =
    weightedSignals > 0
      ? Math.min(17, Math.round(17 * clampZeroOne(Math.log1p(weightedSignals) / Math.log1p(420))))
      : 0;

  const total = Math.max(0, Math.min(100, recencyScore + velocityScore + communityScore));

  return {
    activityFrequency: total,
    recencyDays,
    communitySignals: Math.round(likes + bookmarks),
  };
}

function clampZeroOne(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
}

function estimateCatalogDailyStars(
  project: CatalogProject,
  repoSnaps: Record<string, number>,
  nowMs: number
): number {
  const snapList = Object.entries(repoSnaps)
    .map(([day, count]) => ({
      ms: Date.parse(`${day}T00:00:00.000Z`),
      count: Number(count),
    }))
    .filter((entry) => Number.isFinite(entry.ms) && Number.isFinite(entry.count) && entry.count >= 0)
    .sort((a, b) => a.ms - b.ms);

  if (snapList.length >= 2) {
    const latest = snapList[snapList.length - 1]!;
    const prev = snapList[snapList.length - 2]!;
    const delta = latest.count - prev.count;
    if (delta > 0) {
      const spanDays = Math.max(1, Math.round((latest.ms - prev.ms) / DAY_MS));
      return Math.max(1, Math.round(delta / spanDays));
    }
  }

  const stars = Math.max(0, Number(project.githubStars) || 0);
  if (stars > 0 && project.createdAtIso) {
    const createdMs = Date.parse(project.createdAtIso);
    if (Number.isFinite(createdMs)) {
      const ageDays = Math.max(1, Math.round((nowMs - createdMs) / DAY_MS));
      return Math.max(1, Math.round(stars / ageDays));
    }
  }

  return 0;
}

function computeRecentSignalDelta(project: CatalogProject): number {
  const signals = project.historicalSignals;
  if (!Array.isArray(signals) || signals.length < 2) return 0;
  const first = signals[0]!;
  const last = signals[signals.length - 1]!;
  const startTotal = Math.max(0, first.internalLikes + first.internalBookmarks);
  const endTotal = Math.max(0, last.internalLikes + last.internalBookmarks);
  return Math.max(0, endTotal - startTotal);
}

function hasDirectoryOnlyFacetFilters(filters?: Partial<SearchFilters>): boolean {
  if (!filters) return false;
  return Boolean(
    (filters.category && filters.category !== 'all') ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.platform && filters.platform !== 'all') ||
      (filters.hosting && filters.hosting !== 'all') ||
      (filters.backend && filters.backend !== 'all') ||
      (filters.country && filters.country !== 'all') ||
      (filters.lang && filters.lang !== 'all') ||
      (filters.pricing && filters.pricing !== 'all') ||
      (filters.verified && filters.verified !== 'all')
  );
}

function repoMatchesQueryAndThresholds(
  repo: GitHubAiTrendingRepo,
  inferredType: ContentType,
  filters: Partial<SearchFilters> | undefined,
  nowMs: number
): boolean {
  if (!filters) return true;
  if (filters.type && filters.type !== 'all' && inferredType !== filters.type) {
    return false;
  }
  if (filters.minStars && filters.minStars > 0 && repo.stars < filters.minStars) {
    return false;
  }
  if (filters.license && filters.license !== 'all') {
    if ((repo.license || '').toLowerCase() !== filters.license.toLowerCase()) {
      return false;
    }
  }
  if (filters.updatedWithinDays && filters.updatedWithinDays > 0 && repo.pushedAt) {
    const pushedMs = Date.parse(repo.pushedAt);
    if (Number.isFinite(pushedMs)) {
      const cutoffMs = nowMs - filters.updatedWithinDays * DAY_MS;
      if (pushedMs < cutoffMs) return false;
    }
  }
  const q = (filters.q ?? '').trim().toLowerCase();
  if (q) {
    const haystack = [
      repo.name,
      repo.fullName,
      repo.description,
      repo.language,
      ...(repo.topics ?? []),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function buildDiscoveryScatterDataset(
  options: BuildScatterDatasetOptions
): DiscoveryScatterCandidate[] {
  const nowMs =
    typeof options.nowMs === 'number' && Number.isFinite(options.nowMs)
      ? options.nowMs
      : Date.now();
  const scope: ScatterScope = options.scope ?? 'ecosystem';
  const typeFilter: ContentType | 'all' = options.typeFilter ?? 'all';
  const claims = options.claims ?? [];
  const maxEcosystemExtras = Math.max(0, options.maxEcosystemExtras ?? 42);

  const allSnapshots =
    options.snapshotsByRepo ??
    (options.storage !== undefined
      ? loadAllStarSnapshots(options.storage)
      : loadAllStarSnapshots());

  const liveByRepo = new Map<string, GitHubAiTrendingRepo>();
  for (const repo of options.liveTrendingRepos ?? []) {
    const key = (repo.fullName || '').trim().toLowerCase();
    if (key && !liveByRepo.has(key)) {
      liveByRepo.set(key, repo);
    }
  }

  const candidates: DiscoveryScatterCandidate[] = [];
  const seenRepos = new Set<string>();

  for (const project of options.filteredProjects) {
    const repoKey = (project.githubRepo || '').trim().toLowerCase();
    if (repoKey) seenRepos.add(repoKey);

    const liveMatch = repoKey ? liveByRepo.get(repoKey) : undefined;
    const repoSnaps = repoKey ? allSnapshots[repoKey] ?? {} : {};
    const verification = resolveMakerVerification(project, claims);

    const resolvedStars = Math.max(
      0,
      Number(project.githubStars) || 0,
      liveMatch ? Math.max(0, Number(liveMatch.stars) || 0) : 0
    );
    const resolvedForks = Math.max(
      0,
      Number(project.githubForks) || 0,
      liveMatch ? Math.max(0, Number(liveMatch.forks) || 0) : 0
    );
    const dailyStars =
      liveMatch && liveMatch.dailyStars > 0
        ? Math.round(liveMatch.dailyStars)
        : estimateCatalogDailyStars(project, repoSnaps, nowMs);

    const activity = computeActivityFrequency({
      updatedAtIso: project.updatedAtIso,
      lastSyncedAt: project.lastSyncedAt,
      pushedAt: liveMatch?.pushedAt || '',
      dailyStars,
      forks: resolvedForks,
      openIssues: liveMatch?.openIssues ?? 0,
      likesCount: project.likesCount,
      bookmarksCount: project.bookmarksCount,
      recentSignalDelta: computeRecentSignalDelta(project),
      nowMs,
    });

    const sourceKind: ScatterPointSource =
      liveMatch && project.githubStars === 0 ? 'directory_enriched' : 'directory';

    const resolvedUrl =
      sanitizeExternalUrl(project.githubUrl || project.liveDemoUrl || project.websiteUrl) ?? '';

    candidates.push({
      id: `dir-${project.id}`,
      name: project.name,
      slug: project.slug,
      fullName: project.githubRepo || project.makerHandle || project.slug,
      description: project.taglineKo || project.tagline,
      contentType: project.contentType,
      sourceKind,
      githubStars: resolvedStars,
      githubForks: resolvedForks,
      dailyStars,
      activityFrequency: activity.activityFrequency,
      recencyDays: activity.recencyDays,
      communitySignals: activity.communitySignals,
      isVerifiedMaker: verification.isClaimedByMaker,
      htmlUrl: resolvedUrl,
      primaryLanguage: liveMatch?.language || project.techStack[0] || '',
      matchedCatalogProject: project,
    });
  }

  // Merge live AI GitHub ecosystem repositories when viewing Ecosystem scope
  // and no directory-exclusive facet filters (like Lovable / Korean Builders) are narrowed.
  const canAppendEcosystem =
    scope === 'ecosystem' &&
    !hasDirectoryOnlyFacetFilters(options.filters) &&
    maxEcosystemExtras > 0;

  if (canAppendEcosystem) {
    let added = 0;
    for (const repo of options.liveTrendingRepos ?? []) {
      if (added >= maxEcosystemExtras) break;
      const key = (repo.fullName || '').trim().toLowerCase();
      if (!key || seenRepos.has(key)) continue;

      const inferredType = inferContentTypeFromGitHubRepo(repo);
      if (!repoMatchesQueryAndThresholds(repo, inferredType, options.filters, nowMs)) {
        continue;
      }

      seenRepos.add(key);
      const activity = computeActivityFrequency({
        pushedAt: repo.pushedAt,
        dailyStars: repo.dailyStars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        nowMs,
      });

      candidates.push({
        id: `gh-${repo.id}`,
        name: repo.name || repo.fullName,
        slug: '',
        fullName: repo.fullName,
        description: repo.description,
        contentType: inferredType,
        sourceKind: 'github_ecosystem',
        githubStars: Math.max(0, Number(repo.stars) || 0),
        githubForks: Math.max(0, Number(repo.forks) || 0),
        dailyStars: Math.max(0, Math.round(Number(repo.dailyStars) || 0)),
        activityFrequency: activity.activityFrequency,
        recencyDays: activity.recencyDays,
        communitySignals: 0,
        isVerifiedMaker: false,
        htmlUrl: sanitizeExternalUrl(repo.htmlUrl) ?? `https://github.com/${repo.fullName}`,
        primaryLanguage: (repo.language || '').trim(),
        matchedCatalogProject: null,
      });
      added += 1;
    }
  }

  return candidates.filter((item) => {
    if (scope === 'verified_makers' && !item.isVerifiedMaker) {
      return false;
    }
    if (typeFilter !== 'all' && item.contentType !== typeFilter) {
      return false;
    }
    return true;
  });
}

export function classifyScatterQuadrant(
  stars: number,
  activityFrequency: number,
  medianStars: number,
  medianActivity: number
): ScatterQuadrant {
  const highStars = stars >= medianStars;
  const highActivity = activityFrequency >= medianActivity;
  if (highStars && highActivity) return 'ecosystem_leaders';
  if (!highStars && highActivity) return 'active_builders';
  if (highStars && !highActivity) return 'established_steady';
  return 'emerging_niche';
}

function computeNumericMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function buildDiscoveryScatterLayout(
  candidates: ReadonlyArray<DiscoveryScatterCandidate>,
  options: BuildScatterLayoutOptions
): DiscoveryScatterPlotLayout {
  const margin = options.margin ?? { top: 20, right: 24, bottom: 40, left: 48 };
  const innerWidth = Math.max(120, options.width - margin.left - margin.right);
  const innerHeight = Math.max(120, options.height - margin.top - margin.bottom);

  const quadrantCounts: Record<ScatterQuadrant, number> = {
    ecosystem_leaders: 0,
    active_builders: 0,
    established_steady: 0,
    emerging_niche: 0,
  };
  const typeCounts: Partial<Record<ContentType, number>> = {};

  const observedMaxStars = d3.max(candidates, (c) => c.githubStars) ?? 0;
  const maxStarsDomain = Math.max(1000, Math.ceil(observedMaxStars * 1.15));

  const xScale = d3
    .scaleSymlog()
    .constant(35)
    .domain([0, maxStarsDomain])
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

  const positiveStars = candidates
    .map((c) => c.githubStars)
    .filter((stars) => stars > 0);
  const rawMedianStars =
    positiveStars.length >= 3 ? computeNumericMedian(positiveStars) : 1000;
  const medianStars = Math.max(250, Math.min(25000, rawMedianStars));

  const rawMedianActivity =
    candidates.length >= 3
      ? computeNumericMedian(candidates.map((c) => c.activityFrequency))
      : 50;
  const medianActivity = Math.max(35, Math.min(72, rawMedianActivity));

  const thresholdX = xScale(medianStars);
  const thresholdY = yScale(medianActivity);

  // Subtle deterministic radial anti-collision pass so identical coordinates remain individually clickable
  const placed: DiscoveryScatterPoint[] = [];
  const sortedCandidates = [...candidates].sort(
    (a, b) => b.githubStars - a.githubStars || b.activityFrequency - a.activityFrequency
  );

  for (const candidate of sortedCandidates) {
    const baseX = xScale(candidate.githubStars);
    const baseY = yScale(candidate.activityFrequency);
    const radius = candidate.matchedCatalogProject
      ? candidate.isVerifiedMaker
        ? 7.5
        : 6.5
      : Math.max(4.8, Math.min(8.5, 4.5 + Math.sqrt(Math.max(1, candidate.dailyStars)) * 0.28));

    let px = baseX;
    let py = baseY;

    // Micro-nudge within 8px max only if sitting right on top of an earlier point
    for (let step = 0; step < 8; step += 1) {
      const overlaps = placed.some(
        (other) => Math.hypot(other.x - px, other.y - py) < other.radius + radius - 1.5
      );
      if (!overlaps) break;
      const angle = step * 1.35;
      const dist = 3.5 + step * 1.1;
      px = Math.max(radius + 1, Math.min(innerWidth - radius - 1, baseX + Math.cos(angle) * dist));
      py = Math.max(radius + 1, Math.min(innerHeight - radius - 1, baseY + Math.sin(angle) * dist));
    }

    const quadrant = classifyScatterQuadrant(
      candidate.githubStars,
      candidate.activityFrequency,
      medianStars,
      medianActivity
    );
    quadrantCounts[quadrant] += 1;
    typeCounts[candidate.contentType] = (typeCounts[candidate.contentType] ?? 0) + 1;

    placed.push({
      ...candidate,
      quadrant,
      x: px,
      y: py,
      radius,
    });
  }

  const candidateXTickValues = [0, 100, 1000, 10000, 50000, 100000, 250000];
  const xTicks: ScatterAxisTick[] = [];
  for (const val of candidateXTickValues) {
    if (val > maxStarsDomain * 1.02) continue;
    const pos = xScale(val);
    const prev = xTicks[xTicks.length - 1];
    if (prev && Math.abs(pos - prev.pos) < 38) continue;
    xTicks.push({
      value: val,
      label: formatStarTickCompact(val),
      pos,
    });
  }

  const yTicks: ScatterAxisTick[] = [0, 25, 50, 75, 100].map((val) => ({
    value: val,
    label: String(val),
    pos: yScale(val),
  }));

  return {
    points: placed,
    totalCandidates: candidates.length,
    medianStars,
    medianActivity,
    thresholdX,
    thresholdY,
    maxStarsDomain,
    xTicks,
    yTicks,
    quadrantCounts,
    typeCounts,
  };
}
