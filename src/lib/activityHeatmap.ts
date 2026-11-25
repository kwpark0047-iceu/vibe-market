import type { AppLanguage, CatalogProject } from '../types/vibeatlas';

export type HeatmapActivityMode = 'submissions' | 'updates';

export interface HeatmapCell {
  dayIndex: number; // 0 = Monday .. 6 = Sunday (UTC)
  hour: number; // 0..23 (UTC)
  count: number;
  projectIds: string[];
  projectNames: string[];
}

export interface PeakHeatmapSlot {
  dayIndex: number;
  hour: number;
  count: number;
}

export interface ActivityHeatmapMatrix {
  mode: HeatmapActivityMode;
  totalProjectsAnalyzed: number;
  totalEvents: number;
  maxCount: number;
  activeCellsCount: number;
  cells: HeatmapCell[];
  dayTotals: number[];
  hourTotals: number[];
  peakSlot: PeakHeatmapSlot | null;
  busiestDayIndex: number | null;
}

export const WEEKDAY_SHORT_LABELS: Record<AppLanguage, readonly string[]> = {
  ko: ['월', '화', '수', '목', '금', '토', '일'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  ja: ['月', '火', '水', '木', '金', '土', '日'],
};

export const WEEKDAY_FULL_LABELS: Record<AppLanguage, readonly string[]> = {
  ko: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  zh: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  ja: ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'],
};

/**
 * Converts JS Date.getUTCDay() (0=Sun..6=Sat) into Monday-first index (0=Mon..6=Sun).
 */
export function toMondayFirstDayIndex(utcDay: number): number {
  return (utcDay + 6) % 7;
}

/**
 * Formats an integer hour (0..23) as a two-digit UTC hour window label, e.g. "09:00–09:59 UTC".
 */
export function formatUtcHourWindow(hour: number): string {
  const safeHour = Math.max(0, Math.min(23, Math.floor(hour)));
  const hh = String(safeHour).padStart(2, '0');
  return `${hh}:00–${hh}:59 UTC`;
}

/**
 * Formats an integer hour (0..23) as compact two-digit hour label, e.g. "09:00".
 */
export function formatCompactHour(hour: number): string {
  const safeHour = Math.max(0, Math.min(23, Math.floor(hour)));
  return `${String(safeHour).padStart(2, '0')}:00`;
}

/**
 * Aggregates CatalogProject[] timestamps into a deterministic 7-day × 24-hour (UTC) matrix.
 * Supports `submissions` (`createdAtIso`) and `updates` (`updatedAtIso`, falling back to `createdAtIso`).
 */
export function buildActivityHeatmapMatrix(
  projects: CatalogProject[],
  mode: HeatmapActivityMode = 'submissions'
): ActivityHeatmapMatrix {
  const cells: HeatmapCell[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      cells.push({
        dayIndex,
        hour,
        count: 0,
        projectIds: [],
        projectNames: [],
      });
    }
  }

  const dayTotals = new Array<number>(7).fill(0);
  const hourTotals = new Array<number>(24).fill(0);
  let totalEvents = 0;

  for (const project of projects) {
    const rawIso =
      mode === 'submissions'
        ? project.createdAtIso || project.updatedAtIso
        : project.updatedAtIso || project.createdAtIso;
    if (!rawIso) continue;

    const timestampMs = Date.parse(rawIso);
    if (!Number.isFinite(timestampMs)) continue;

    const date = new Date(timestampMs);
    const dayIndex = toMondayFirstDayIndex(date.getUTCDay());
    const hour = date.getUTCHours();
    const cell = cells[dayIndex * 24 + hour];

    cell.count += 1;
    cell.projectIds.push(project.id);
    if (cell.projectNames.length < 4 && project.name) {
      cell.projectNames.push(project.name);
    }

    dayTotals[dayIndex] += 1;
    hourTotals[hour] += 1;
    totalEvents += 1;
  }

  let maxCount = 0;
  let activeCellsCount = 0;
  let peakSlot: PeakHeatmapSlot | null = null;

  for (const cell of cells) {
    if (cell.count > 0) {
      activeCellsCount += 1;
    }
    if (cell.count > maxCount) {
      maxCount = cell.count;
      peakSlot = {
        dayIndex: cell.dayIndex,
        hour: cell.hour,
        count: cell.count,
      };
    }
  }

  let busiestDayIndex: number | null = null;
  let busiestDayCount = 0;
  for (let i = 0; i < dayTotals.length; i += 1) {
    if (dayTotals[i] > busiestDayCount) {
      busiestDayCount = dayTotals[i];
      busiestDayIndex = i;
    }
  }

  return {
    mode,
    totalProjectsAnalyzed: projects.length,
    totalEvents,
    maxCount,
    activeCellsCount,
    cells,
    dayTotals,
    hourTotals,
    peakSlot,
    busiestDayIndex,
  };
}
