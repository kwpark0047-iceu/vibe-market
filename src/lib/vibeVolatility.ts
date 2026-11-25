import * as d3 from 'd3';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import { buildHistoricalGrowthSeries } from './starHistory';
import { computeProjectVibeScore } from './vibeScore';

export type StarTrackingStatus = 'tracked' | 'baseline_single_snapshot' | 'unsynced';

export type SentimentPaceVerdict =
  | 'keeping_pace'
  | 'sentiment_leading'
  | 'adoption_outpacing'
  | 'unsynced'
  | 'baseline_awaiting_history';

export type VolatilityChartMode = 'pace_overlay' | 'daily_swing';

export interface VibeVolatilityPoint {
  index: number;
  date: string;
  shortDate: string;
  vibeScore: number;
  vibeDelta: number;
  rollingStdDev: number;
  bandLower: number;
  bandUpper: number;
  githubStars: number;
  githubStarsDelta: number;
  starGrowthRatePct: number;
  internalLikes: number;
  internalBookmarks: number;
}

export interface VibeVolatilityAnalysis {
  points: VibeVolatilityPoint[];
  currentVibeScore: number;
  startVibeScore: number;
  netVibeDelta: number;
  volatilityStdDev: number;
  maxDailySwing: number;
  starTrackingStatus: StarTrackingStatus;
  totalStars: number;
  starDelta14d: number;
  starGrowthRatePct14d: number;
  avgDailyStarRatePct: number;
  paceVerdict: SentimentPaceVerdict;
  paceGapScore: number;
}

export interface ComputeVibeVolatilityInput {
  project: CatalogProject;
  allProjects: ReadonlyArray<CatalogProject>;
  activities?: ReadonlyArray<ProjectActivityRecord>;
  isLiked?: boolean;
  isBookmarked?: boolean;
  recordedSnapshots?: Record<string, number>;
  nowMs?: number;
}

export interface VibeVolatilityPlotPoint extends VibeVolatilityPoint {
  x: number;
  vibeY: number;
  bandTopY: number;
  bandBottomY: number;
  starRateY: number;
  vibeSwingY: number;
}

export interface VibeVolatilityGeometry {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  innerWidth: number;
  innerHeight: number;
  xScale: d3.ScalePoint<string>;
  vibeYScale: d3.ScaleLinear<number, number>;
  starRateYScale: d3.ScaleLinear<number, number>;
  swingYScale: d3.ScaleLinear<number, number>;
  vibeLinePath: string;
  volatilityBandPath: string;
  starRateLinePath: string;
  starRateAreaPath: string;
  swingZeroY: number;
  plotPoints: VibeVolatilityPlotPoint[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function activityDateKey(createdAtIso: string): string | null {
  if (!createdAtIso) return null;
  const parsed = Date.parse(createdAtIso);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Computes a deterministic multi-day Vibe Score + volatility trajectory alongside
 * external GitHub star growth rate using verified catalog/snapshot signals only.
 */
export function computeVibeVolatilityAnalysis({
  project,
  allProjects,
  activities = [],
  isLiked = false,
  isBookmarked = false,
  recordedSnapshots,
  nowMs = Date.now(),
}: ComputeVibeVolatilityInput): VibeVolatilityAnalysis {
  const historical = buildHistoricalGrowthSeries(project, recordedSnapshots);
  const rawPoints = historical.points;
  const pointCount = rawPoints.length;

  const hasTrackedStarDeltas = historical.hasStarHistoryDeltas;
  const isGithubSynced = Boolean((project.lastSyncedAt && project.githubRepo) || hasTrackedStarDeltas);

  const starTrackingStatus: StarTrackingStatus = hasTrackedStarDeltas
    ? 'tracked'
    : isGithubSynced || project.githubStars > 0
      ? 'baseline_single_snapshot'
      : 'unsynced';

  // Derive daily Vibe Score using cumulative signals up to day i so the final point
  // mirrors VibeScoreGauge's methodology accurately.
  const rawScores: number[] = [];

  for (let i = 0; i < pointCount; i += 1) {
    const pt = rawPoints[i];
    const isFinalDay = i === pointCount - 1;
    const dayEndMs = Date.parse(`${pt.date}T23:59:59.000Z`);
    const evalNowMs = isFinalDay ? nowMs : Number.isFinite(dayEndMs) ? dayEndMs : nowMs;

    const activitiesUpToDay = activities.filter((act) => {
      const actDay = activityDateKey(act.createdAtIso);
      if (!actDay) return isFinalDay;
      return actDay <= pt.date || (isFinalDay && act.source === 'local');
    });

    const slicedSignals = rawPoints.slice(0, i + 1).map((item) => ({
      date: item.date,
      githubStarsDelta: item.githubStarsDelta,
      internalLikes: item.internalLikes,
      internalBookmarks: item.internalBookmarks,
    }));

    const projectedProject: CatalogProject = {
      ...project,
      likesCount: isFinalDay ? Math.max(project.likesCount, pt.internalLikes) : pt.internalLikes,
      bookmarksCount: isFinalDay
        ? Math.max(project.bookmarksCount, pt.internalBookmarks)
        : pt.internalBookmarks,
      githubStars: isGithubSynced ? pt.githubStars : 0,
      githubForks: isGithubSynced
        ? project.githubStars > 0
          ? Math.round((project.githubForks * pt.githubStars) / project.githubStars)
          : project.githubForks
        : 0,
      historicalSignals: slicedSignals,
    };

    const scoreRes = computeProjectVibeScore({
      project: projectedProject,
      allProjects,
      activities: activitiesUpToDay,
      isLiked: isFinalDay ? isLiked : false,
      isBookmarked: isFinalDay ? isBookmarked : false,
      nowMs: evalNowMs,
    });
    rawScores.push(scoreRes.score);
  }

  const points: VibeVolatilityPoint[] = rawPoints.map((pt, idx) => {
    const vibeScore = rawScores[idx] ?? 0;
    const prevScore = idx === 0 ? vibeScore : rawScores[idx - 1] ?? vibeScore;
    const vibeDelta = idx === 0 ? 0 : vibeScore - prevScore;

    // Rolling 4-day window standard deviation of Vibe Score to visualize sentiment volatility envelope
    const winStart = Math.max(0, idx - 3);
    const windowScores = rawScores.slice(winStart, idx + 1);
    const rollingStdDev = windowScores.length >= 2 ? round2(d3.deviation(windowScores) ?? 0) : 0;

    const bandLower = round2(clamp(vibeScore - rollingStdDev, 0, 100));
    const bandUpper = round2(clamp(vibeScore + rollingStdDev, 0, 100));

    const prevStars = idx === 0 ? pt.githubStars : rawPoints[idx - 1]?.githubStars ?? pt.githubStars;
    let starGrowthRatePct = 0;
    if (starTrackingStatus === 'tracked' && pt.githubStarsDelta > 0) {
      if (prevStars > 0) {
        starGrowthRatePct = round2((pt.githubStarsDelta / prevStars) * 100);
      } else {
        starGrowthRatePct = 100;
      }
    }

    return {
      index: idx,
      date: pt.date,
      shortDate: pt.shortDate,
      vibeScore,
      vibeDelta,
      rollingStdDev,
      bandLower,
      bandUpper,
      githubStars: pt.githubStars,
      githubStarsDelta: pt.githubStarsDelta,
      starGrowthRatePct,
      internalLikes: pt.internalLikes,
      internalBookmarks: pt.internalBookmarks,
    };
  });

  const startVibeScore = points[0]?.vibeScore ?? 0;
  const currentVibeScore = points[points.length - 1]?.vibeScore ?? 0;
  const netVibeDelta = currentVibeScore - startVibeScore;

  const dailyDeltas = points.slice(1).map((p) => p.vibeDelta);
  const volatilityStdDev = dailyDeltas.length >= 2 ? round2(d3.deviation(dailyDeltas) ?? 0) : 0;
  const maxDailySwing =
    dailyDeltas.length > 0 ? Math.max(...dailyDeltas.map((d) => Math.abs(d))) : 0;

  const startStars = points[0]?.githubStars ?? 0;
  const totalStars = Math.max(project.githubStars, points[points.length - 1]?.githubStars ?? 0);
  const starDelta14d = historical.totalDelta14d;

  const starGrowthRatePct14d =
    starTrackingStatus === 'tracked' && starDelta14d > 0
      ? startStars > 0
        ? round2((starDelta14d / startStars) * 100)
        : 100
      : 0;

  const rateSamples = points.slice(1).map((p) => p.starGrowthRatePct);
  const avgDailyStarRatePct =
    rateSamples.length > 0 ? round2(d3.mean(rateSamples) ?? 0) : 0;

  // Compare normalized sentiment momentum against repository star adoption rate
  let paceVerdict: SentimentPaceVerdict;
  let paceGapScore = 0;

  if (starTrackingStatus === 'unsynced') {
    paceVerdict = 'unsynced';
  } else if (starTrackingStatus === 'baseline_single_snapshot') {
    paceVerdict = 'baseline_awaiting_history';
  } else {
    // Normalize 14d Vibe Score momentum (30pt climb ~= full stride) vs 14d star adoption rate (25% climb ~= full stride)
    const sentimentNorm = clamp(netVibeDelta / 30, -1, 1.5);
    const adoptionNorm = clamp(starGrowthRatePct14d / 25, 0, 1.5);
    const rawDiff = sentimentNorm - adoptionNorm;
    paceGapScore = round2(rawDiff);

    if (netVibeDelta < -2 && starDelta14d > 0) {
      paceVerdict = 'adoption_outpacing';
    } else if (rawDiff > 0.35 || (volatilityStdDev >= 4 && starGrowthRatePct14d < 5)) {
      paceVerdict = 'sentiment_leading';
    } else if (rawDiff < -0.35) {
      paceVerdict = 'adoption_outpacing';
    } else {
      paceVerdict = 'keeping_pace';
    }
  }

  return {
    points,
    currentVibeScore,
    startVibeScore,
    netVibeDelta,
    volatilityStdDev,
    maxDailySwing,
    starTrackingStatus,
    totalStars,
    starDelta14d,
    starGrowthRatePct14d,
    avgDailyStarRatePct,
    paceVerdict,
    paceGapScore,
  };
}

export function buildVibeVolatilityGeometry(
  analysis: VibeVolatilityAnalysis,
  options: { width?: number; height?: number } = {}
): VibeVolatilityGeometry {
  const width = options.width ?? 620;
  const height = options.height ?? 248;
  const margin = { top: 24, right: 48, bottom: 28, left: 38 };
  const innerWidth = Math.max(120, width - margin.left - margin.right);
  const innerHeight = Math.max(80, height - margin.top - margin.bottom);

  const labels = analysis.points.map((p) => p.shortDate);
  const xScale = d3
    .scalePoint<string>()
    .domain(labels)
    .range([0, innerWidth])
    .padding(0.2);

  const vibeYScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

  const maxStarRate = Math.max(2, d3.max(analysis.points, (p) => p.starGrowthRatePct) ?? 0);
  const starRateYScale = d3
    .scaleLinear()
    .domain([0, maxStarRate * 1.15])
    .range([innerHeight, 0])
    .nice();

  const maxAbsSwing = Math.max(
    4,
    d3.max(analysis.points, (p) => Math.abs(p.vibeDelta)) ?? 4
  );
  const swingBound = Math.ceil(maxAbsSwing * 1.15);
  const swingYScale = d3
    .scaleLinear()
    .domain([-swingBound, swingBound])
    .range([innerHeight, 0])
    .nice();

  const vibeLineGen = d3
    .line<VibeVolatilityPoint>()
    .x((d) => xScale(d.shortDate) ?? 0)
    .y((d) => vibeYScale(d.vibeScore))
    .curve(d3.curveMonotoneX);

  const volatilityBandGen = d3
    .area<VibeVolatilityPoint>()
    .x((d) => xScale(d.shortDate) ?? 0)
    .y0((d) => vibeYScale(d.bandLower))
    .y1((d) => vibeYScale(d.bandUpper))
    .curve(d3.curveMonotoneX);

  const starRateLineGen = d3
    .line<VibeVolatilityPoint>()
    .x((d) => xScale(d.shortDate) ?? 0)
    .y((d) => starRateYScale(d.starGrowthRatePct))
    .curve(d3.curveMonotoneX);

  const starRateAreaGen = d3
    .area<VibeVolatilityPoint>()
    .x((d) => xScale(d.shortDate) ?? 0)
    .y0(innerHeight)
    .y1((d) => starRateYScale(d.starGrowthRatePct))
    .curve(d3.curveMonotoneX);

  const hasEnough = analysis.points.length >= 2;
  const vibeLinePath = hasEnough ? vibeLineGen(analysis.points) ?? '' : '';
  const volatilityBandPath = hasEnough ? volatilityBandGen(analysis.points) ?? '' : '';
  const starRateLinePath = hasEnough ? starRateLineGen(analysis.points) ?? '' : '';
  const starRateAreaPath = hasEnough ? starRateAreaGen(analysis.points) ?? '' : '';

  const plotPoints: VibeVolatilityPlotPoint[] = analysis.points.map((pt) => ({
    ...pt,
    x: xScale(pt.shortDate) ?? 0,
    vibeY: vibeYScale(pt.vibeScore),
    bandTopY: vibeYScale(pt.bandUpper),
    bandBottomY: vibeYScale(pt.bandLower),
    starRateY: starRateYScale(pt.starGrowthRatePct),
    vibeSwingY: swingYScale(pt.vibeDelta),
  }));

  return {
    width,
    height,
    margin,
    innerWidth,
    innerHeight,
    xScale,
    vibeYScale,
    starRateYScale,
    swingYScale,
    vibeLinePath,
    volatilityBandPath,
    starRateLinePath,
    starRateAreaPath,
    swingZeroY: swingYScale(0),
    plotPoints,
  };
}
