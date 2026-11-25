import type {
  CatalogProject,
  DailySignalPoint,
  ProjectActivityRecord,
} from '../types/vibeatlas';
import { parseTimestampMs } from './communityActivity';

export type PlatformFeedItemType = 'submission' | 'like' | 'bookmark';

export interface PlatformActivityFeedItem {
  id: string;
  type: PlatformFeedItemType;
  projectId: string;
  projectSlug: string;
  projectName: string;
  actorName: string;
  actorHandle: string;
  timestampIso: string;
  timestampMs: number;
  deltaCount?: number;
  isLiveEvent: boolean;
  platformKey?: CatalogProject['developmentPlatform'];
}

export interface PlatformActivityCounts {
  all: number;
  submission: number;
  like: number;
  bookmark: number;
}

export interface BuildPlatformFeedResult {
  items: PlatformActivityFeedItem[];
  counts: PlatformActivityCounts;
}

export interface BuildPlatformFeedParams {
  projects: ReadonlyArray<CatalogProject>;
  firestoreActivities?: ReadonlyArray<ProjectActivityRecord>;
  localActivities?: ReadonlyArray<ProjectActivityRecord>;
  filterType?: 'all' | PlatformFeedItemType;
  limit?: number;
  nowMs?: number;
}

function getLatestDailySignalDelta(
  signals: ReadonlyArray<DailySignalPoint> | undefined,
  field: 'internalLikes' | 'internalBookmarks'
): { delta: number; dateIso: string } | null {
  if (!signals || signals.length === 0) return null;
  const sorted = [...signals].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : undefined;
  const delta = prev ? Math.max(0, latest[field] - prev[field]) : Math.max(0, latest[field]);
  if (delta <= 0) return null;
  const hourSuffix = field === 'internalLikes' ? 'T16:30:00.000Z' : 'T14:15:00.000Z';
  return {
    delta,
    dateIso: `${latest.date}${hourSuffix}`,
  };
}

export function buildPlatformActivityFeed({
  projects,
  firestoreActivities = [],
  localActivities = [],
  filterType = 'all',
  limit = 24,
  nowMs = Date.now(),
}: BuildPlatformFeedParams): BuildPlatformFeedResult {
  const byId = new Map<string, CatalogProject>();
  const bySlug = new Map<string, CatalogProject>();
  for (const proj of projects) {
    byId.set(proj.id, proj);
    bySlug.set(proj.slug, proj);
  }

  const events: PlatformActivityFeedItem[] = [];
  const liveEventKeys = new Set<string>();
  const seenActivityIds = new Set<string>();

  // 1. Live & Firestore user interaction events (likes + bookmarks)
  const combinedActivities = [...firestoreActivities, ...localActivities];
  for (const act of combinedActivities) {
    if (act.type !== 'like' && act.type !== 'bookmark') continue;
    if (seenActivityIds.has(act.id)) continue;
    const dedupeActorKey = `${act.type}:${act.projectId}:${act.actorUid}`;
    if (liveEventKeys.has(dedupeActorKey)) continue;

    seenActivityIds.add(act.id);
    liveEventKeys.add(dedupeActorKey);

    const project = byId.get(act.projectId) ?? bySlug.get(act.projectSlug);
    const tsMs = parseTimestampMs(act.createdAtIso);

    events.push({
      id: `act-${act.id}`,
      type: act.type,
      projectId: project?.id ?? act.projectId,
      projectSlug: project?.slug ?? act.projectSlug,
      projectName: project?.name ?? act.projectSlug,
      actorName: act.actorName,
      actorHandle: act.actorHandle,
      timestampIso: act.createdAtIso,
      timestampMs: tsMs,
      isLiveEvent: true,
      platformKey: project?.developmentPlatform,
    });
  }

  // 2. Project submissions (user-submitted live entries + recent catalog submissions)
  const submissionCandidates = [...projects]
    .filter((p) => !p.isCuratedSeed || p.provenanceSource === 'maker_submitted' || p.createdAtIso)
    .sort((a, b) => parseTimestampMs(b.createdAtIso) - parseTimestampMs(a.createdAtIso))
    .slice(0, 10);

  for (const proj of submissionCandidates) {
    const tsMs = parseTimestampMs(proj.createdAtIso);
    if (!tsMs) continue;
    const within48h = Math.abs(nowMs - tsMs) <= 48 * 3600 * 1000;
    events.push({
      id: `sub-${proj.id}`,
      type: 'submission',
      projectId: proj.id,
      projectSlug: proj.slug,
      projectName: proj.name,
      actorName: proj.makerName,
      actorHandle: proj.makerHandle,
      timestampIso: proj.createdAtIso,
      timestampMs: tsMs,
      isLiveEvent: !proj.isCuratedSeed || within48h,
      platformKey: proj.developmentPlatform,
    });
  }

  // 3. Recorded recent likes & bookmark deltas across catalog (factual community signal baseline)
  const rankedProjects = [...projects]
    .sort((a, b) => b.likesCount + b.bookmarksCount - (a.likesCount + a.bookmarksCount))
    .slice(0, 10);

  for (let idx = 0; idx < rankedProjects.length; idx += 1) {
    const proj = rankedProjects[idx];
    const likeDelta = getLatestDailySignalDelta(proj.historicalSignals, 'internalLikes');
    if (likeDelta) {
      // Stagger minutes deterministically so timestamps read naturally without identical ties
      const baseMs = parseTimestampMs(likeDelta.dateIso);
      const staggeredMs = Math.max(0, baseMs - idx * 17 * 60 * 1000);
      events.push({
        id: `sig-like-${proj.id}`,
        type: 'like',
        projectId: proj.id,
        projectSlug: proj.slug,
        projectName: proj.name,
        actorName: '',
        actorHandle: '',
        timestampIso: new Date(staggeredMs).toISOString(),
        timestampMs: staggeredMs,
        deltaCount: likeDelta.delta,
        isLiveEvent: false,
        platformKey: proj.developmentPlatform,
      });
    }

    const bookmarkDelta = getLatestDailySignalDelta(proj.historicalSignals, 'internalBookmarks');
    if (bookmarkDelta) {
      const baseMs = parseTimestampMs(bookmarkDelta.dateIso);
      const staggeredMs = Math.max(0, baseMs - idx * 23 * 60 * 1000);
      events.push({
        id: `sig-bookmark-${proj.id}`,
        type: 'bookmark',
        projectId: proj.id,
        projectSlug: proj.slug,
        projectName: proj.name,
        actorName: '',
        actorHandle: '',
        timestampIso: new Date(staggeredMs).toISOString(),
        timestampMs: staggeredMs,
        deltaCount: bookmarkDelta.delta,
        isLiveEvent: false,
        platformKey: proj.developmentPlatform,
      });
    }
  }

  events.sort((a, b) => {
    if (b.timestampMs !== a.timestampMs) return b.timestampMs - a.timestampMs;
    if (a.isLiveEvent !== b.isLiveEvent) return a.isLiveEvent ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  const counts: PlatformActivityCounts = {
    all: events.length,
    submission: 0,
    like: 0,
    bookmark: 0,
  };

  for (const item of events) {
    if (item.type === 'submission') counts.submission += 1;
    else if (item.type === 'like') counts.like += 1;
    else if (item.type === 'bookmark') counts.bookmark += 1;
  }

  const filtered =
    filterType === 'all' ? events : events.filter((item) => item.type === filterType);

  return {
    items: filtered.slice(0, Math.max(1, limit)),
    counts,
  };
}
