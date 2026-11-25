import * as d3 from 'd3';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import { computeFreshnessState } from './catalogEngine';

export type VibeScoreTier = 'quiet' | 'warm' | 'active' | 'thriving';

export interface VibeScorePillar {
  id: 'affinity' | 'momentum' | 'traction' | 'health';
  score: number;
  maxScore: number;
  ratio: number;
}

export interface VibeScoreBreakdown {
  score: number;
  tier: VibeScoreTier;
  pillars: {
    affinity: VibeScorePillar;
    momentum: VibeScorePillar;
    traction: VibeScorePillar;
    health: VibeScorePillar;
  };
  positiveActivityCount: number;
  reportCount: number;
  reportPenalty: number;
  isGithubSynced: boolean;
  effectiveLikes: number;
  effectiveBookmarks: number;
}

export interface VibeScoreInput {
  project: CatalogProject;
  allProjects: ReadonlyArray<CatalogProject>;
  activities?: ReadonlyArray<ProjectActivityRecord>;
  isLiked?: boolean;
  isBookmarked?: boolean;
  nowMs?: number;
}

export interface VibeGaugeTick {
  value: number;
  angleRad: number;
  innerX: number;
  innerY: number;
  outerX: number;
  outerY: number;
  labelX: number;
  labelY: number;
}

export interface VibeGaugeSegment {
  tier: VibeScoreTier;
  startValue: number;
  endValue: number;
  path: string;
}

export interface VibeGaugeGeometry {
  clampedScore: number;
  trackPath: string;
  activePath: string;
  segments: VibeGaugeSegment[];
  ticks: VibeGaugeTick[];
  needleAngleRad: number;
  needleTipX: number;
  needleTipY: number;
  needleBaseLeftX: number;
  needleBaseLeftY: number;
  needleBaseRightX: number;
  needleBaseRightY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function classifyVibeScoreTier(score: number): VibeScoreTier {
  if (score >= 75) return 'thriving';
  if (score >= 50) return 'active';
  if (score >= 25) return 'warm';
  return 'quiet';
}

export function computeProjectVibeScore({
  project,
  allProjects,
  activities = [],
  isLiked = false,
  isBookmarked = false,
  nowMs = Date.now(),
}: VibeScoreInput): VibeScoreBreakdown {
  const affinityWeight = (p: CatalogProject) =>
    Math.max(0, p.likesCount) + 1.35 * Math.max(0, p.bookmarksCount);

  const projectPositiveLikes = activities.filter((a) => a.type === 'like').length;
  const projectPositiveBookmarks = activities.filter((a) => a.type === 'bookmark').length;
  const hasLocalLike = activities.some((a) => a.type === 'like' && a.source === 'local');
  const hasLocalBookmark = activities.some((a) => a.type === 'bookmark' && a.source === 'local');

  // Curated seeds already have +1 applied in App.tsx when guest-liked; non-seed listings rely on local/isLiked state
  const extraLike = isLiked && !project.isCuratedSeed && !hasLocalLike ? 1 : 0;
  const extraBookmark = isBookmarked && !project.isCuratedSeed && !hasLocalBookmark ? 1 : 0;

  const effectiveLikes = Math.max(0, project.likesCount + extraLike);
  const effectiveBookmarks = Math.max(0, project.bookmarksCount + extraBookmark);
  const currentAffinityRaw = effectiveLikes + 1.35 * effectiveBookmarks;

  const maxAffinity = Math.max(
    40,
    currentAffinityRaw,
    ...allProjects.map((item) => affinityWeight(item))
  );
  const affinityScore = Math.round(
    clamp(Math.log1p(currentAffinityRaw) / Math.log1p(maxAffinity), 0, 1) * 35
  );

  // Pillar 2: Recent Activity Momentum (0-25) from 14-day internal signal delta + live community interactions
  const sortedSignals = [...(project.historicalSignals ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  let historicalMomentum = 0;
  if (sortedSignals.length >= 2) {
    const first = sortedSignals[0];
    const last = sortedSignals[sortedSignals.length - 1];
    const firstTotal = Math.max(0, first.internalLikes + first.internalBookmarks);
    const lastTotal = Math.max(0, last.internalLikes + last.internalBookmarks);
    const growthDelta = Math.max(0, lastTotal - firstTotal);
    const midIdx = Math.floor(sortedSignals.length / 2);
    const mid = sortedSignals[midIdx];
    const recentHalfDelta = Math.max(
      0,
      lastTotal - Math.max(0, mid.internalLikes + mid.internalBookmarks)
    );
    const combinedGrowth = growthDelta * 0.6 + recentHalfDelta * 0.8;
    historicalMomentum = Math.round(
      clamp(Math.log1p(combinedGrowth) / Math.log1p(80), 0, 1) * 18
    );
  } else if (sortedSignals.length === 1) {
    const only = sortedSignals[0];
    const baseline = Math.max(0, only.internalLikes + only.internalBookmarks);
    historicalMomentum = Math.round(clamp(Math.log1p(baseline) / Math.log1p(120), 0, 1) * 9);
  }

  let positiveActivityCount = projectPositiveLikes + projectPositiveBookmarks;
  if (isLiked && projectPositiveLikes === 0) positiveActivityCount += 1;
  if (isBookmarked && projectPositiveBookmarks === 0) positiveActivityCount += 1;

  const liveMomentumBonus = Math.min(7, positiveActivityCount * 2);
  const momentumScore = Math.min(25, historicalMomentum + liveMomentumBonus);

  // Pillar 3: Ecosystem Traction (0-25) strictly from synced external GitHub telemetry
  const isGithubSynced = Boolean(project.lastSyncedAt && project.githubRepo);
  let tractionScore = 0;
  if (isGithubSynced) {
    const tractionWeight = (p: CatalogProject) =>
      Math.max(0, p.githubStars) + 2 * Math.max(0, p.githubForks);
    const currentTractionRaw = tractionWeight(project);
    const syncedPeers = allProjects.filter((p) => Boolean(p.lastSyncedAt && p.githubRepo));
    const maxTraction = Math.max(
      500,
      currentTractionRaw,
      ...syncedPeers.map((p) => tractionWeight(p))
    );
    tractionScore = Math.round(
      clamp(Math.log1p(currentTractionRaw) / Math.log1p(maxTraction), 0, 1) * 25
    );
  }

  // Pillar 4: Trust & Freshness Health (0-15)
  const verificationPoints =
    project.verificationStatus === 'verified'
      ? 8
      : project.verificationStatus === 'pending'
        ? 4
        : 1;

  const freshness = computeFreshnessState(project.lastSyncedAt, nowMs);
  let freshnessPoints = 1;
  if (freshness === 'fresh') {
    freshnessPoints = 7;
  } else {
    const updatedMs = Date.parse(project.updatedAtIso);
    if (!Number.isNaN(updatedMs)) {
      const ageDays = Math.max(0, (nowMs - updatedMs) / (1000 * 60 * 60 * 24));
      if (ageDays <= 30) freshnessPoints = 5;
      else if (ageDays <= 90) freshnessPoints = 3;
    }
  }
  const healthScore = Math.min(15, verificationPoints + freshnessPoints);

  const reportCount = activities.filter((a) => a.type === 'report').length;
  const reportPenalty = Math.min(24, reportCount * 4);

  const rawScore = affinityScore + momentumScore + tractionScore + healthScore - reportPenalty;
  const score = Math.round(clamp(rawScore, 0, 100));

  return {
    score,
    tier: classifyVibeScoreTier(score),
    pillars: {
      affinity: {
        id: 'affinity',
        score: affinityScore,
        maxScore: 35,
        ratio: affinityScore / 35,
      },
      momentum: {
        id: 'momentum',
        score: momentumScore,
        maxScore: 25,
        ratio: momentumScore / 25,
      },
      traction: {
        id: 'traction',
        score: tractionScore,
        maxScore: 25,
        ratio: tractionScore / 25,
      },
      health: {
        id: 'health',
        score: healthScore,
        maxScore: 15,
        ratio: healthScore / 15,
      },
    },
    positiveActivityCount,
    reportCount,
    reportPenalty,
    isGithubSynced,
    effectiveLikes,
    effectiveBookmarks,
  };
}

export function buildVibeGaugeGeometry(
  score: number,
  options: {
    outerRadius?: number;
    innerRadius?: number;
  } = {}
): VibeGaugeGeometry {
  const outerRadius = options.outerRadius ?? 104;
  const innerRadius = options.innerRadius ?? 78;
  const clampedScore = clamp(Number.isFinite(score) ? score : 0, 0, 100);

  const angleScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([-Math.PI / 2, Math.PI / 2])
    .clamp(true);

  const arcGenerator = d3
    .arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(4);

  const segmentArcGenerator = d3
    .arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(outerRadius + 4)
    .outerRadius(outerRadius + 8)
    .cornerRadius(2);

  const trackPath =
    arcGenerator({
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    }) ?? '';

  const needleAngleRad = angleScale(clampedScore);
  const activePath =
    clampedScore > 0
      ? arcGenerator({
          startAngle: -Math.PI / 2,
          endAngle: needleAngleRad,
        }) ?? ''
      : '';

  const tierBounds: Array<{ tier: VibeScoreTier; startValue: number; endValue: number }> = [
    { tier: 'quiet', startValue: 0, endValue: 24.2 },
    { tier: 'warm', startValue: 25.8, endValue: 49.2 },
    { tier: 'active', startValue: 50.8, endValue: 74.2 },
    { tier: 'thriving', startValue: 75.8, endValue: 100 },
  ];

  const segments: VibeGaugeSegment[] = tierBounds.map((seg) => ({
    tier: seg.tier,
    startValue: seg.startValue,
    endValue: seg.endValue,
    path:
      segmentArcGenerator({
        startAngle: angleScale(seg.startValue),
        endAngle: angleScale(seg.endValue),
      }) ?? '',
  }));

  const tickValues = [0, 25, 50, 75, 100];
  const ticks: VibeGaugeTick[] = tickValues.map((value) => {
    const angleRad = angleScale(value);
    const sinA = Math.sin(angleRad);
    const cosA = Math.cos(angleRad);
    return {
      value,
      angleRad,
      innerX: (innerRadius - 6) * sinA,
      innerY: -(innerRadius - 6) * cosA,
      outerX: innerRadius * sinA,
      outerY: -innerRadius * cosA,
      labelX: (outerRadius + 21) * sinA,
      labelY: -(outerRadius + 21) * cosA,
    };
  });

  const needleTipRadius = innerRadius - 10;
  const needleTipX = needleTipRadius * Math.sin(needleAngleRad);
  const needleTipY = -needleTipRadius * Math.cos(needleAngleRad);
  const perpX = Math.cos(needleAngleRad) * 3.5;
  const perpY = Math.sin(needleAngleRad) * 3.5;

  return {
    clampedScore,
    trackPath,
    activePath,
    segments,
    ticks,
    needleAngleRad,
    needleTipX,
    needleTipY,
    needleBaseLeftX: -perpX,
    needleBaseLeftY: -perpY,
    needleBaseRightX: perpX,
    needleBaseRightY: perpY,
  };
}
