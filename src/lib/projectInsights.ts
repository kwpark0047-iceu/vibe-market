import * as d3 from 'd3';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';

export type InsightsChartMode = 'daily' | 'cumulative';

export interface ProjectInsightsDayPoint {
  index: number;
  date: string;
  shortDate: string;
  dailyLikes: number;
  dailyBookmarks: number;
  totalDaily: number;
  cumulativeLikes: number;
  cumulativeBookmarks: number;
  isLiveActivityDay: boolean;
}

export type InsightsDataSource =
  | 'signals_and_live'
  | 'live_activity'
  | 'launch_baseline'
  | 'empty';

export interface ProjectInsightsSummary {
  windowStartDate: string;
  windowEndDate: string;
  days: ProjectInsightsDayPoint[];
  likes7d: number;
  bookmarks7d: number;
  total7d: number;
  currentLikesTotal: number;
  currentBookmarksTotal: number;
  bookmarkSharePct: number;
  likeSharePct: number;
  peakDay: ProjectInsightsDayPoint | null;
  avgDailyEngagement: number;
  hasActivityInWindow: boolean;
  dataSource: InsightsDataSource;
}

export interface ProjectInsightsComputeInput {
  project: CatalogProject;
  activities?: ReadonlyArray<ProjectActivityRecord>;
  nowMs?: number;
}

export interface ProjectInsightsPlottedDay extends ProjectInsightsDayPoint {
  bandX: number;
  bandCenterX: number;
  likeBarX: number;
  likeBarY: number;
  likeBarHeight: number;
  bookmarkBarX: number;
  bookmarkBarY: number;
  bookmarkBarHeight: number;
  barWidth: number;
  cumLikesY: number;
  cumBookmarksY: number;
}

export interface ProjectInsightsGeometry {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  innerWidth: number;
  innerHeight: number;
  xBand: d3.ScaleBand<string>;
  yScale: d3.ScaleLinear<number, number>;
  yTicks: number[];
  maxY: number;
  plottedDays: ProjectInsightsPlottedDay[];
  cumLikesLinePath: string;
  cumLikesAreaPath: string;
  cumBookmarksLinePath: string;
  cumBookmarksAreaPath: string;
}

const DAY_MS = 86_400_000;

function toUtcDayStartMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function formatUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function formatShortDay(isoDay: string): string {
  const parts = isoDay.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return isoDay.slice(5, 10) || isoDay;
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
 * Builds an honest 7-day Likes & Bookmarks trend breakdown for a single project
 * by combining verified multi-day `historicalSignals` snapshots with live
 * Firestore & local `ProjectActivityRecord` interactions (excluding reports).
 */
export function computeProjectInsights({
  project,
  activities = [],
  nowMs = Date.now(),
}: ProjectInsightsComputeInput): ProjectInsightsSummary {
  const todayUtcMs = toUtcDayStartMs(nowMs);
  const currentLikesTotal = Math.max(0, Number(project.likesCount) || 0);
  const currentBookmarksTotal = Math.max(0, Number(project.bookmarksCount) || 0);

  // Deduplicate and parse historicalSignals ascending by day
  const signalMap = new Map<number, { likes: number; bookmarks: number }>();
  for (const pt of project.historicalSignals ?? []) {
    const dayMs = parseIsoDayMs(pt.date);
    if (dayMs === null) continue;
    signalMap.set(dayMs, {
      likes: Math.max(0, Number(pt.internalLikes) || 0),
      bookmarks: Math.max(0, Number(pt.internalBookmarks) || 0),
    });
  }
  const sortedSignalEntries = [...signalMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayMs, counts]) => ({ dayMs, ...counts }));

  const latestSignalDayMs =
    sortedSignalEntries.length > 0
      ? sortedSignalEntries[sortedSignalEntries.length - 1].dayMs
      : null;

  // Deduplicate and bucket matching like/bookmark activities by UTC day
  const seenActivityIds = new Set<string>();
  const liveLikesByDay = new Map<number, number>();
  const liveBookmarksByDay = new Map<number, number>();
  let latestLiveDayMs: number | null = null;

  for (const act of activities) {
    if (act.id && seenActivityIds.has(act.id)) continue;
    if (act.id) seenActivityIds.add(act.id);

    const matchesProject =
      act.projectId === project.id ||
      (Boolean(project.slug) && Boolean(act.projectSlug) && act.projectSlug === project.slug);
    if (!matchesProject) continue;
    if (act.type !== 'like' && act.type !== 'bookmark') continue;

    const actMs = parseTimestampMs(act.createdAtIso);
    if (actMs === null) continue;
    const actDayMs = toUtcDayStartMs(actMs);

    if (act.type === 'like') {
      liveLikesByDay.set(actDayMs, (liveLikesByDay.get(actDayMs) ?? 0) + 1);
    } else {
      liveBookmarksByDay.set(actDayMs, (liveBookmarksByDay.get(actDayMs) ?? 0) + 1);
    }
    if (latestLiveDayMs === null || actDayMs > latestLiveDayMs) {
      latestLiveDayMs = actDayMs;
    }
  }

  // Choose the 7-day window anchor:
  // - If live events arrived after the latest historical snapshot (or without signals),
  //   anchor to today (or latest live day if ahead).
  // - Otherwise, if historical signals exist, anchor to today when fresh (<= 1 day old)
  //   or to the latest recorded snapshot day so all 7 snapshot days render cleanly.
  let anchorEndDayMs = todayUtcMs;
  if (
    latestLiveDayMs !== null &&
    (latestSignalDayMs === null || latestLiveDayMs > latestSignalDayMs)
  ) {
    anchorEndDayMs = Math.max(todayUtcMs, latestLiveDayMs);
  } else if (latestSignalDayMs !== null) {
    anchorEndDayMs =
      todayUtcMs - latestSignalDayMs <= DAY_MS ? todayUtcMs : latestSignalDayMs;
  }

  const windowDaysMs: number[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    windowDaysMs.push(anchorEndDayMs - i * DAY_MS);
  }
  const windowStartMs = windowDaysMs[0];

  // Baseline immediately prior to the 7-day window
  const priorSignals = sortedSignalEntries.filter((e) => e.dayMs < windowStartMs);
  let runningLikes =
    priorSignals.length > 0 ? priorSignals[priorSignals.length - 1].likes : 0;
  let runningBookmarks =
    priorSignals.length > 0 ? priorSignals[priorSignals.length - 1].bookmarks : 0;

  const createdMs = parseTimestampMs(project.createdAtIso);
  const createdDayMs = createdMs !== null ? toUtcDayStartMs(createdMs) : null;

  // Sum live activities that occur outside/after historical signals so launch baseline isn't double-counted
  let totalUnrecordedLiveLikes = 0;
  let totalUnrecordedLiveBookmarks = 0;
  for (const dayMs of windowDaysMs) {
    const hasSigCover = signalMap.has(dayMs) && latestSignalDayMs !== null && dayMs <= latestSignalDayMs;
    if (!hasSigCover) {
      totalUnrecordedLiveLikes += liveLikesByDay.get(dayMs) ?? 0;
      totalUnrecordedLiveBookmarks += liveBookmarksByDay.get(dayMs) ?? 0;
    }
  }

  let usedSignals = false;
  let usedLive = false;

  const days: ProjectInsightsDayPoint[] = windowDaysMs.map((dayMs, index) => {
    const isoDate = formatUtcDay(dayMs);
    const sig = signalMap.get(dayMs);
    const liveLikes = liveLikesByDay.get(dayMs) ?? 0;
    const liveBookmarks = liveBookmarksByDay.get(dayMs) ?? 0;

    let dailyLikes = 0;
    let dailyBookmarks = 0;
    let isLiveActivityDay = false;

    if (sig && (latestSignalDayMs === null || dayMs <= latestSignalDayMs)) {
      usedSignals = true;
      dailyLikes = Math.max(0, sig.likes - runningLikes);
      dailyBookmarks = Math.max(0, sig.bookmarks - runningBookmarks);
      runningLikes = Math.max(runningLikes, sig.likes);
      runningBookmarks = Math.max(runningBookmarks, sig.bookmarks);
    } else if (
      sortedSignalEntries.length === 0 &&
      createdDayMs !== null &&
      dayMs === createdDayMs &&
      (currentLikesTotal > 0 || currentBookmarksTotal > 0 || liveLikes > 0 || liveBookmarks > 0)
    ) {
      // Newly created project within this 7-day window without prior signal series:
      // attribute pre-live baseline separately from live timestamped actions
      const preLiveLikes = Math.max(0, currentLikesTotal - totalUnrecordedLiveLikes);
      const preLiveBookmarks = Math.max(0, currentBookmarksTotal - totalUnrecordedLiveBookmarks);
      dailyLikes = preLiveLikes + liveLikes;
      dailyBookmarks = preLiveBookmarks + liveBookmarks;
      runningLikes += dailyLikes;
      runningBookmarks += dailyBookmarks;
      if (liveLikes > 0 || liveBookmarks > 0) {
        usedLive = true;
        isLiveActivityDay = true;
      }
    } else if (liveLikes > 0 || liveBookmarks > 0) {
      usedLive = true;
      isLiveActivityDay = true;
      dailyLikes = liveLikes;
      dailyBookmarks = liveBookmarks;
      runningLikes += dailyLikes;
      runningBookmarks += dailyBookmarks;
    }

    return {
      index,
      date: isoDate,
      shortDate: formatShortDay(isoDate),
      dailyLikes,
      dailyBookmarks,
      totalDaily: dailyLikes + dailyBookmarks,
      cumulativeLikes: runningLikes,
      cumulativeBookmarks: runningBookmarks,
      isLiveActivityDay,
    };
  });

  // If the project has totals higher than our carried-forward baseline on the final day
  // when there were no historical signals at all (e.g., seeded without signals and liked earlier),
  // keep cumulative curves anchored accurately at the end without inventing fake past daily spikes.
  if (days.length > 0 && sortedSignalEntries.length === 0 && !usedLive) {
    const hasLaunchBaseline = days.some((d) => d.totalDaily > 0);
    if (!hasLaunchBaseline && (currentLikesTotal > 0 || currentBookmarksTotal > 0)) {
      const last = days[days.length - 1];
      for (const d of days) {
        d.cumulativeLikes = currentLikesTotal;
        d.cumulativeBookmarks = currentBookmarksTotal;
      }
      last.cumulativeLikes = currentLikesTotal;
      last.cumulativeBookmarks = currentBookmarksTotal;
    }
  } else if (days.length > 0) {
    const last = days[days.length - 1];
    if (currentLikesTotal > last.cumulativeLikes) {
      const diff = currentLikesTotal - last.cumulativeLikes;
      last.cumulativeLikes = currentLikesTotal;
      if (usedLive && last.isLiveActivityDay) {
        // Keep exact live event count as recorded; only raise cumulative floor cleanly
      } else if (sortedSignalEntries.length === 0) {
        last.dailyLikes += diff;
        last.totalDaily = last.dailyLikes + last.dailyBookmarks;
      }
    }
    if (currentBookmarksTotal > last.cumulativeBookmarks) {
      last.cumulativeBookmarks = currentBookmarksTotal;
    }
  }

  let likes7d = 0;
  let bookmarks7d = 0;
  let peakDay: ProjectInsightsDayPoint | null = null;

  for (const day of days) {
    likes7d += day.dailyLikes;
    bookmarks7d += day.dailyBookmarks;
    if (
      day.totalDaily > 0 &&
      (peakDay === null ||
        day.totalDaily > peakDay.totalDaily ||
        (day.totalDaily === peakDay.totalDaily && day.index > peakDay.index))
    ) {
      peakDay = day;
    }
  }

  const total7d = likes7d + bookmarks7d;
  const hasActivityInWindow = total7d > 0;

  const mixLikes = hasActivityInWindow ? likes7d : currentLikesTotal;
  const mixBookmarks = hasActivityInWindow ? bookmarks7d : currentBookmarksTotal;
  const mixTotal = mixLikes + mixBookmarks;

  const bookmarkSharePct = mixTotal > 0 ? Math.round((mixBookmarks / mixTotal) * 100) : 0;
  const likeSharePct = mixTotal > 0 ? Math.max(0, 100 - bookmarkSharePct) : 0;

  let dataSource: InsightsDataSource = 'empty';
  if (usedSignals) {
    dataSource = 'signals_and_live';
  } else if (usedLive) {
    dataSource = 'live_activity';
  } else if (hasActivityInWindow) {
    dataSource = 'launch_baseline';
  }

  return {
    windowStartDate: days[0]?.date ?? formatUtcDay(windowStartMs),
    windowEndDate: days[days.length - 1]?.date ?? formatUtcDay(anchorEndDayMs),
    days,
    likes7d,
    bookmarks7d,
    total7d,
    currentLikesTotal,
    currentBookmarksTotal,
    bookmarkSharePct,
    likeSharePct,
    peakDay,
    avgDailyEngagement: Number((total7d / 7).toFixed(1)),
    hasActivityInWindow,
    dataSource,
  };
}

/**
 * Generates D3 SVG scales, bar coordinates, cumulative line/area paths, and ticks
 * for the 7-day Project Insights chart.
 */
export function buildProjectInsightsChartGeometry(
  summary: ProjectInsightsSummary,
  mode: InsightsChartMode,
  dimensions: { width?: number; height?: number } = {}
): ProjectInsightsGeometry {
  const width = dimensions.width ?? 600;
  const height = dimensions.height ?? 216;
  const margin = { top: 20, right: 16, bottom: 28, left: 38 };
  const innerWidth = Math.max(180, width - margin.left - margin.right);
  const innerHeight = Math.max(100, height - margin.top - margin.bottom);

  const days = summary.days;
  const labels = days.map((d) => d.shortDate);

  const xBand = d3
    .scaleBand<string>()
    .domain(labels)
    .range([0, innerWidth])
    .paddingInner(0.32)
    .paddingOuter(0.16);

  const rawMax =
    mode === 'daily'
      ? d3.max(days, (d) => Math.max(d.dailyLikes, d.dailyBookmarks)) ?? 0
      : d3.max(days, (d) => Math.max(d.cumulativeLikes, d.cumulativeBookmarks)) ?? 0;

  const paddedMax = rawMax > 0 ? Math.ceil(rawMax * 1.18) : 4;
  const yScale = d3
    .scaleLinear()
    .domain([0, paddedMax])
    .nice(4)
    .range([innerHeight, 0]);

  const yTicks = yScale.ticks(4).filter((val) => Number.isInteger(val));
  const finalTicks =
    yTicks.length >= 2 ? yTicks : [0, Math.max(1, Math.round(paddedMax / 2)), paddedMax];

  const bandWidth = xBand.bandwidth();
  const barGap = Math.max(2, Math.min(6, bandWidth * 0.1));
  const barWidth = Math.max(6, Math.min(20, (bandWidth - barGap) / 2));

  const plottedDays: ProjectInsightsPlottedDay[] = days.map((day) => {
    const bandX = xBand(day.shortDate) ?? 0;
    const bandCenterX = bandX + bandWidth / 2;
    const groupWidth = barWidth * 2 + barGap;
    const groupStart = bandCenterX - groupWidth / 2;

    const likeBarY = yScale(day.dailyLikes);
    const likeBarHeight = Math.max(day.dailyLikes > 0 ? 3 : 0, innerHeight - likeBarY);

    const bookmarkBarY = yScale(day.dailyBookmarks);
    const bookmarkBarHeight = Math.max(
      day.dailyBookmarks > 0 ? 3 : 0,
      innerHeight - bookmarkBarY
    );

    return {
      ...day,
      bandX,
      bandCenterX,
      likeBarX: groupStart,
      likeBarY,
      likeBarHeight,
      bookmarkBarX: groupStart + barWidth + barGap,
      bookmarkBarY,
      bookmarkBarHeight,
      barWidth,
      cumLikesY: yScale(day.cumulativeLikes),
      cumBookmarksY: yScale(day.cumulativeBookmarks),
    };
  });

  const likesLineGen = d3
    .line<ProjectInsightsPlottedDay>()
    .x((d) => d.bandCenterX)
    .y((d) => d.cumLikesY)
    .curve(d3.curveMonotoneX);

  const likesAreaGen = d3
    .area<ProjectInsightsPlottedDay>()
    .x((d) => d.bandCenterX)
    .y0(innerHeight)
    .y1((d) => d.cumLikesY)
    .curve(d3.curveMonotoneX);

  const bookmarksLineGen = d3
    .line<ProjectInsightsPlottedDay>()
    .x((d) => d.bandCenterX)
    .y((d) => d.cumBookmarksY)
    .curve(d3.curveMonotoneX);

  const bookmarksAreaGen = d3
    .area<ProjectInsightsPlottedDay>()
    .x((d) => d.bandCenterX)
    .y0(innerHeight)
    .y1((d) => d.cumBookmarksY)
    .curve(d3.curveMonotoneX);

  return {
    width,
    height,
    margin,
    innerWidth,
    innerHeight,
    xBand,
    yScale,
    yTicks: finalTicks,
    maxY: yScale.domain()[1] ?? paddedMax,
    plottedDays,
    cumLikesLinePath: likesLineGen(plottedDays) ?? '',
    cumLikesAreaPath: likesAreaGen(plottedDays) ?? '',
    cumBookmarksLinePath: bookmarksLineGen(plottedDays) ?? '',
    cumBookmarksAreaPath: bookmarksAreaGen(plottedDays) ?? '',
  };
}
