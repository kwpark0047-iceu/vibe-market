import type {
  AppLanguage,
  CommunityActivityType,
  ProjectActivityRecord,
  ProjectReportRecord,
} from '../types/vibeatlas';

export const LOCAL_ACTIVITY_STORAGE_KEY = 'vibeatlas_local_activity_v1';
const MAX_LOCAL_ACTIVITY_ENTRIES = 200;

export function parseTimestampMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function loadLocalProjectActivities(
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null
): ProjectActivityRecord[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid: ProjectActivityRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Partial<ProjectActivityRecord>;
      if (
        typeof rec.id === 'string' &&
        typeof rec.projectId === 'string' &&
        typeof rec.projectSlug === 'string' &&
        (rec.type === 'like' || rec.type === 'bookmark' || rec.type === 'report') &&
        typeof rec.createdAtIso === 'string'
      ) {
        valid.push({
          id: rec.id,
          projectId: rec.projectId,
          projectSlug: rec.projectSlug,
          actorUid: typeof rec.actorUid === 'string' ? rec.actorUid : 'guest',
          actorName: typeof rec.actorName === 'string' && rec.actorName ? rec.actorName : 'Guest',
          actorHandle: typeof rec.actorHandle === 'string' ? rec.actorHandle : '',
          type: rec.type,
          reportReason: rec.type === 'report' && rec.reportReason ? rec.reportReason : '',
          createdAtIso: rec.createdAtIso,
          source: 'local',
        });
      }
    }
    return valid;
  } catch {
    return [];
  }
}

function saveLocalProjectActivities(
  list: ProjectActivityRecord[],
  storage: Pick<Storage, 'setItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null
): void {
  if (!storage) return;
  try {
    const bounded = list
      .slice()
      .sort((a, b) => parseTimestampMs(b.createdAtIso) - parseTimestampMs(a.createdAtIso))
      .slice(0, MAX_LOCAL_ACTIVITY_ENTRIES);
    storage.setItem(LOCAL_ACTIVITY_STORAGE_KEY, JSON.stringify(bounded));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function recordLocalProjectActivity(
  entry: Omit<ProjectActivityRecord, 'source'>,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null
): ProjectActivityRecord[] {
  const current = loadLocalProjectActivities(storage).filter((item) => item.id !== entry.id);
  const next: ProjectActivityRecord[] = [{ ...entry, source: 'local' }, ...current];
  saveLocalProjectActivities(next, storage);
  return next;
}

export function removeLocalProjectActivity(
  params: { projectId: string; type: 'like' | 'bookmark'; actorUid?: string },
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null
): ProjectActivityRecord[] {
  const actorTarget = params.actorUid || 'guest';
  const current = loadLocalProjectActivities(storage);
  const next = current.filter(
    (item) =>
      !(
        item.projectId === params.projectId &&
        item.type === params.type &&
        item.actorUid === actorTarget
      )
  );
  saveLocalProjectActivities(next, storage);
  return next;
}

export function mergeAndSortCommunityActivities(params: {
  projectId: string;
  firestoreActivities: ReadonlyArray<ProjectActivityRecord>;
  localActivities: ReadonlyArray<ProjectActivityRecord>;
  userReports?: ReadonlyArray<ProjectReportRecord>;
  currentUserLabel?: { uid: string; name: string; handle: string } | null;
  limit?: number;
}): ProjectActivityRecord[] {
  const {
    projectId,
    firestoreActivities,
    localActivities,
    userReports = [],
    currentUserLabel = null,
    limit = 40,
  } = params;

  const byId = new Map<string, ProjectActivityRecord>();
  const activeActorKeys = new Set<string>();

  for (const act of firestoreActivities) {
    if (act.projectId !== projectId) continue;
    byId.set(act.id, act);
    if (act.type === 'like' || act.type === 'bookmark') {
      activeActorKeys.add(`${act.type}:${act.actorUid}`);
    }
  }

  for (const rep of userReports) {
    if (rep.projectId !== projectId) continue;
    const firestoreReportActivityId = `act_report_${rep.id}`;
    if (byId.has(firestoreReportActivityId)) continue;
    byId.set(`rep_${rep.id}`, {
      id: `rep_${rep.id}`,
      projectId: rep.projectId,
      projectSlug: rep.projectSlug,
      actorUid: rep.reporterUid,
      actorName:
        currentUserLabel && currentUserLabel.uid === rep.reporterUid
          ? currentUserLabel.name
          : 'VibeAtlas Member',
      actorHandle:
        currentUserLabel && currentUserLabel.uid === rep.reporterUid ? currentUserLabel.handle : '',
      type: 'report',
      reportReason: rep.reason,
      createdAtIso: rep.createdAtIso,
      source: 'firestore',
    });
  }

  for (const localAct of localActivities) {
    if (localAct.projectId !== projectId) continue;
    if (localAct.type === 'like' || localAct.type === 'bookmark') {
      const actorKey = `${localAct.type}:${localAct.actorUid}`;
      if (activeActorKeys.has(actorKey)) continue;
      activeActorKeys.add(actorKey);
    }
    if (!byId.has(localAct.id)) {
      byId.set(localAct.id, localAct);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => parseTimestampMs(b.createdAtIso) - parseTimestampMs(a.createdAtIso))
    .slice(0, Math.max(1, limit));
}

export function filterCommunityActivitiesByType(
  activities: ReadonlyArray<ProjectActivityRecord>,
  filterType: 'all' | CommunityActivityType
): ProjectActivityRecord[] {
  if (filterType === 'all') return [...activities];
  return activities.filter((item) => item.type === filterType);
}

export function summarizeCommunityActivityCounts(
  activities: ReadonlyArray<ProjectActivityRecord>
): { all: number; like: number; bookmark: number; report: number } {
  let like = 0;
  let bookmark = 0;
  let report = 0;
  for (const item of activities) {
    if (item.type === 'like') like += 1;
    else if (item.type === 'bookmark') bookmark += 1;
    else if (item.type === 'report') report += 1;
  }
  return {
    all: activities.length,
    like,
    bookmark,
    report,
  };
}

export function formatActivityTimestamp(
  iso: string,
  language: AppLanguage,
  nowMs: number = Date.now()
): string {
  const ts = parseTimestampMs(iso);
  if (!ts) return '—';

  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSec < 60) {
    switch (language) {
      case 'ko':
        return '방금 전';
      case 'zh':
        return '刚刚';
      case 'ja':
        return 'たった今';
      default:
        return 'Just now';
    }
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    switch (language) {
      case 'ko':
        return `${diffMin}분 전`;
      case 'zh':
        return `${diffMin} 分钟前`;
      case 'ja':
        return `${diffMin}分前`;
      default:
        return `${diffMin}m ago`;
    }
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    switch (language) {
      case 'ko':
        return `${diffHour}시간 전`;
      case 'zh':
        return `${diffHour} 小时前`;
      case 'ja':
        return `${diffHour}時間前`;
      default:
        return `${diffHour}h ago`;
    }
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 14) {
    switch (language) {
      case 'ko':
        return `${diffDay}일 전`;
      case 'zh':
        return `${diffDay} 天前`;
      case 'ja':
        return `${diffDay}日前`;
      default:
        return `${diffDay}d ago`;
    }
  }

  return new Date(ts).toISOString().slice(0, 10);
}
