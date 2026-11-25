import * as d3 from 'd3';
import type { DailyStarRateSource, GitHubAiTrendingRepo } from '../types/vibeatlas';

const DAY_MS = 86_400_000;

export interface DailyStarMetricInput {
  stars: number;
  createdAt?: string;
  pushedAt?: string;
  snapshots?: Record<string, number>;
  nowMs?: number;
}

export interface DailyStarMetricResult {
  dailyStars: number;
  dailyRateSource: DailyStarRateSource;
  ageDays: number;
}

export interface BubbleColorPalette {
  fill: string;
  activeFill: string;
  stroke: string;
  activeStroke: string;
  textColor: string;
  subTextColor: string;
  dotColor: string;
}

export interface BubbleLabelLayout {
  showName: boolean;
  showMetric: boolean;
  displayName: string;
  nameFontSize: number;
  metricFontSize: number;
}

export interface TrendingBubbleNode {
  repo: GitHubAiTrendingRepo;
  rank: number;
  x: number;
  y: number;
  r: number;
  palette: BubbleColorPalette;
  labelLayout: BubbleLabelLayout;
  dailyStarsFormatted: string;
}

export interface BuildTrendingBubblePackOptions {
  width: number;
  height: number;
  padding?: number;
  isDark?: boolean;
}

export function formatDailyRateCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 10000) return `${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function computeDailyStarMetric(input: DailyStarMetricInput): DailyStarMetricResult {
  const stars = Math.max(0, Math.round(Number(input.stars) || 0));
  const nowMs = typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();

  const createdMs = input.createdAt ? Date.parse(input.createdAt) : NaN;
  const ageDays = Number.isFinite(createdMs)
    ? Math.max(1, Math.round((nowMs - createdMs) / DAY_MS))
    : 365;

  const snapEntries = Object.entries(input.snapshots ?? {})
    .map(([date, val]) => ({
      date,
      ms: Date.parse(`${date}T00:00:00.000Z`),
      stars: Number(val) || 0,
    }))
    .filter((entry) => Number.isFinite(entry.ms))
    .sort((a, b) => a.ms - b.ms);

  if (snapEntries.length >= 2) {
    const latest = snapEntries[snapEntries.length - 1]!;
    const previous = snapEntries[snapEntries.length - 2]!;
    const delta = latest.stars - previous.stars;
    if (delta > 0) {
      const daysSpan = Math.max(1, Math.round((latest.ms - previous.ms) / DAY_MS));
      return {
        dailyStars: Math.max(1, Math.round(delta / daysSpan)),
        dailyRateSource: 'snapshot_24h',
        ageDays,
      };
    }
  }

  return {
    dailyStars: stars > 0 ? Math.max(1, Math.round(stars / ageDays)) : 0,
    dailyRateSource: 'daily_velocity_rate',
    ageDays,
  };
}

export function extractTrendingLanguages(
  items: ReadonlyArray<GitHubAiTrendingRepo>,
  maxCount: number = 6
): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const lang = (item.language || '').trim();
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxCount)
    .map(([lang]) => lang);
}

export function filterAndRankTrendingRepos(
  items: ReadonlyArray<GitHubAiTrendingRepo>,
  options?: { language?: string; limit?: number }
): GitHubAiTrendingRepo[] {
  const languageFilter = (options?.language ?? 'all').trim().toLowerCase();
  const limit = Math.max(1, options?.limit ?? 24);

  const filtered = items.filter((item) => {
    if (!languageFilter || languageFilter === 'all') return true;
    return (item.language || '').trim().toLowerCase() === languageFilter;
  });

  return [...filtered]
    .sort(
      (a, b) =>
        b.dailyStars - a.dailyStars ||
        b.stars - a.stars ||
        a.fullName.localeCompare(b.fullName)
    )
    .slice(0, limit)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
}

export function getTrendingLanguageColor(language: string, isDark: boolean): BubbleColorPalette {
  const key = (language || '').trim().toLowerCase();

  if (key === 'python') {
    return isDark
      ? {
          fill: 'rgba(79, 70, 229, 0.28)',
          activeFill: 'rgba(99, 102, 241, 0.44)',
          stroke: '#6366f1',
          activeStroke: '#a5b4fc',
          textColor: '#eef2ff',
          subTextColor: '#a5b4fc',
          dotColor: '#818cf8',
        }
      : {
          fill: 'rgba(224, 231, 255, 0.92)',
          activeFill: 'rgba(199, 210, 254, 1)',
          stroke: '#4f46e5',
          activeStroke: '#3730a3',
          textColor: '#312e81',
          subTextColor: '#4338ca',
          dotColor: '#4f46e5',
        };
  }

  if (key === 'typescript') {
    return isDark
      ? {
          fill: 'rgba(2, 132, 199, 0.28)',
          activeFill: 'rgba(56, 189, 248, 0.42)',
          stroke: '#0ea5e9',
          activeStroke: '#7dd3fc',
          textColor: '#f0f9ff',
          subTextColor: '#7dd3fc',
          dotColor: '#38bdf8',
        }
      : {
          fill: 'rgba(224, 242, 254, 0.92)',
          activeFill: 'rgba(186, 230, 253, 1)',
          stroke: '#0284c7',
          activeStroke: '#0369a1',
          textColor: '#0c4a6e',
          subTextColor: '#0369a1',
          dotColor: '#0284c7',
        };
  }

  if (key === 'javascript') {
    return isDark
      ? {
          fill: 'rgba(202, 138, 4, 0.26)',
          activeFill: 'rgba(250, 204, 21, 0.36)',
          stroke: '#eab308',
          activeStroke: '#fde047',
          textColor: '#fefce8',
          subTextColor: '#fde047',
          dotColor: '#facc15',
        }
      : {
          fill: 'rgba(254, 249, 195, 0.92)',
          activeFill: 'rgba(254, 240, 138, 1)',
          stroke: '#ca8a04',
          activeStroke: '#a16207',
          textColor: '#713f12',
          subTextColor: '#a16207',
          dotColor: '#ca8a04',
        };
  }

  if (key === 'rust') {
    return isDark
      ? {
          fill: 'rgba(194, 65, 12, 0.28)',
          activeFill: 'rgba(251, 146, 60, 0.38)',
          stroke: '#ea580c',
          activeStroke: '#fdba74',
          textColor: '#fff7ed',
          subTextColor: '#fdba74',
          dotColor: '#fb923c',
        }
      : {
          fill: 'rgba(255, 237, 213, 0.92)',
          activeFill: 'rgba(254, 215, 170, 1)',
          stroke: '#c2410c',
          activeStroke: '#9a3412',
          textColor: '#7c2d12',
          subTextColor: '#9a3412',
          dotColor: '#ea580c',
        };
  }

  if (key === 'go') {
    return isDark
      ? {
          fill: 'rgba(5, 150, 105, 0.28)',
          activeFill: 'rgba(52, 211, 153, 0.38)',
          stroke: '#10b981',
          activeStroke: '#6ee7b7',
          textColor: '#ecfdf5',
          subTextColor: '#6ee7b7',
          dotColor: '#34d399',
        }
      : {
          fill: 'rgba(209, 250, 229, 0.92)',
          activeFill: 'rgba(167, 243, 208, 1)',
          stroke: '#059669',
          activeStroke: '#047857',
          textColor: '#064e3b',
          subTextColor: '#047857',
          dotColor: '#059669',
        };
  }

  if (key === 'c++' || key === 'c' || key === 'jupyter notebook' || key === 'java') {
    return isDark
      ? {
          fill: 'rgba(109, 40, 217, 0.24)',
          activeFill: 'rgba(139, 92, 246, 0.38)',
          stroke: '#8b5cf6',
          activeStroke: '#c4b5fd',
          textColor: '#f5f3ff',
          subTextColor: '#c4b5fd',
          dotColor: '#a78bfa',
        }
      : {
          fill: 'rgba(237, 233, 254, 0.92)',
          activeFill: 'rgba(221, 214, 254, 1)',
          stroke: '#6d28d9',
          activeStroke: '#5b21b6',
          textColor: '#4c1d95',
          subTextColor: '#5b21b6',
          dotColor: '#7c3aed',
        };
  }

  return isDark
    ? {
        fill: 'rgba(51, 65, 85, 0.45)',
        activeFill: 'rgba(71, 85, 105, 0.65)',
        stroke: '#64748b',
        activeStroke: '#cbd5e1',
        textColor: '#f8fafc',
        subTextColor: '#cbd5e1',
        dotColor: '#94a3b8',
      }
    : {
        fill: 'rgba(241, 245, 249, 0.95)',
        activeFill: 'rgba(226, 232, 240, 1)',
        stroke: '#64748b',
        activeStroke: '#334155',
        textColor: '#0f172a',
        subTextColor: '#334155',
        dotColor: '#475569',
      };
}

export function getBubbleLabelLayout(radius: number, name: string): BubbleLabelLayout {
  const showName = radius >= 24;
  const showMetric = radius >= 34;
  const nameFontSize = Math.max(9.5, Math.min(13.5, Math.round((radius * 0.26) * 10) / 10));
  const metricFontSize = Math.max(8.5, Math.min(11, Math.round((radius * 0.2) * 10) / 10));

  const approxCharWidth = nameFontSize * 0.62;
  const maxWidth = Math.max(0, radius * 1.62);
  const maxChars = Math.max(4, Math.floor(maxWidth / approxCharWidth));

  const trimmed = name.trim();
  const displayName =
    trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, Math.max(3, maxChars - 1))}…`;

  return {
    showName,
    showMetric,
    displayName,
    nameFontSize,
    metricFontSize,
  };
}

interface HierarchyDatum {
  repo?: GitHubAiTrendingRepo;
  children?: HierarchyDatum[];
}

export function buildTrendingBubblePack(
  items: ReadonlyArray<GitHubAiTrendingRepo>,
  options: BuildTrendingBubblePackOptions
): TrendingBubbleNode[] {
  if (items.length === 0) return [];

  const width = Math.max(120, options.width);
  const height = Math.max(120, options.height);
  const padding = options.padding ?? 6;
  const isDark = Boolean(options.isDark);

  const rootData: HierarchyDatum = {
    children: items.map((repo) => ({ repo })),
  };

  const root = d3
    .hierarchy<HierarchyDatum>(rootData)
    .sum((datum) => (datum.repo ? Math.max(1, datum.repo.dailyStars) : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const packedRoot = d3
    .pack<HierarchyDatum>()
    .size([width, height])
    .padding(padding)(root);

  return packedRoot
    .leaves()
    .filter((leaf): leaf is d3.HierarchyCircularNode<HierarchyDatum> & { data: { repo: GitHubAiTrendingRepo } } =>
      Boolean(leaf.data.repo)
    )
    .map((leaf, index) => {
      const repo = leaf.data.repo;
      return {
        repo,
        rank: repo.rank > 0 ? repo.rank : index + 1,
        x: leaf.x,
        y: leaf.y,
        r: leaf.r,
        palette: getTrendingLanguageColor(repo.language, isDark),
        labelLayout: getBubbleLabelLayout(leaf.r, repo.name),
        dailyStarsFormatted: formatDailyRateCompact(repo.dailyStars),
      };
    });
}
