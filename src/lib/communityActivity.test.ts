import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCommunityActivitiesByType,
  formatActivityTimestamp,
  loadLocalProjectActivities,
  mergeAndSortCommunityActivities,
  recordLocalProjectActivity,
  removeLocalProjectActivity,
  summarizeCommunityActivityCounts,
} from './communityActivity';
import type { ProjectActivityRecord, ProjectReportRecord } from '../types/vibeatlas';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

test('mergeAndSortCommunityActivities orders events newest-first and deduplicates firestore vs local records', () => {
  const firestoreActivities: ProjectActivityRecord[] = [
    {
      id: 'act_like_p1_u1',
      projectId: 'p1',
      projectSlug: 'demo',
      actorUid: 'u1',
      actorName: 'Minjun',
      actorHandle: '@minjun',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-22T09:00:00.000Z',
      source: 'firestore',
    },
    {
      id: 'act_like_other',
      projectId: 'p2',
      projectSlug: 'other',
      actorUid: 'u2',
      actorName: 'Hana',
      actorHandle: '@hana',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-22T12:00:00.000Z',
      source: 'firestore',
    },
  ];

  const localActivities: ProjectActivityRecord[] = [
    {
      id: 'local_like_p1_u1',
      projectId: 'p1',
      projectSlug: 'demo',
      actorUid: 'u1',
      actorName: 'Minjun',
      actorHandle: '@minjun',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-22T08:59:00.000Z',
      source: 'local',
    },
    {
      id: 'local_bookmark_p1_guest',
      projectId: 'p1',
      projectSlug: 'demo',
      actorUid: 'guest',
      actorName: 'Guest',
      actorHandle: '',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-22T10:30:00.000Z',
      source: 'local',
    },
  ];

  const userReports: ProjectReportRecord[] = [
    {
      id: 'r99',
      projectId: 'p1',
      projectSlug: 'demo',
      reporterUid: 'u1',
      reason: 'broken_link',
      details: 'Demo returns 404',
      status: 'open',
      createdAtIso: '2026-11-22T11:15:00.000Z',
    },
  ];

  const merged = mergeAndSortCommunityActivities({
    projectId: 'p1',
    firestoreActivities,
    localActivities,
    userReports,
    currentUserLabel: { uid: 'u1', name: 'Minjun', handle: '@minjun' },
  });

  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((m) => m.type),
    ['report', 'bookmark', 'like']
  );
  assert.equal(merged[0].reportReason, 'broken_link');
  assert.equal(merged[2].source, 'firestore');
});

test('filterCommunityActivitiesByType and summarizeCommunityActivityCounts count interactions accurately', () => {
  const sample: ProjectActivityRecord[] = [
    {
      id: '1',
      projectId: 'p1',
      projectSlug: 's',
      actorUid: 'a',
      actorName: 'A',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-22T10:00:00.000Z',
      source: 'firestore',
    },
    {
      id: '2',
      projectId: 'p1',
      projectSlug: 's',
      actorUid: 'b',
      actorName: 'B',
      actorHandle: '',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-22T09:00:00.000Z',
      source: 'local',
    },
    {
      id: '3',
      projectId: 'p1',
      projectSlug: 's',
      actorUid: 'c',
      actorName: 'C',
      actorHandle: '',
      type: 'report',
      reportReason: 'stale_metadata',
      createdAtIso: '2026-11-22T08:00:00.000Z',
      source: 'firestore',
    },
  ];

  assert.deepEqual(summarizeCommunityActivityCounts(sample), {
    all: 3,
    like: 1,
    bookmark: 1,
    report: 1,
  });
  assert.equal(filterCommunityActivitiesByType(sample, 'all').length, 3);
  assert.equal(filterCommunityActivitiesByType(sample, 'like').length, 1);
  assert.equal(filterCommunityActivitiesByType(sample, 'bookmark').length, 1);
  assert.equal(filterCommunityActivitiesByType(sample, 'report').length, 1);
});

test('recordLocalProjectActivity and removeLocalProjectActivity persist and clean up cleanly', () => {
  const storage = createMemoryStorage();
  recordLocalProjectActivity(
    {
      id: 'local_like_p1_guest',
      projectId: 'p1',
      projectSlug: 'demo',
      actorUid: 'guest',
      actorName: 'Guest',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-22T10:00:00.000Z',
    },
    storage
  );
  recordLocalProjectActivity(
    {
      id: 'local_bookmark_p1_guest',
      projectId: 'p1',
      projectSlug: 'demo',
      actorUid: 'guest',
      actorName: 'Guest',
      actorHandle: '',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-22T10:01:00.000Z',
    },
    storage
  );

  assert.equal(loadLocalProjectActivities(storage).length, 2);

  removeLocalProjectActivity({ projectId: 'p1', type: 'like', actorUid: 'guest' }, storage);
  const remaining = loadLocalProjectActivities(storage);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].type, 'bookmark');
});

test('formatActivityTimestamp localizes relative times across ko, en, zh, ja', () => {
  const now = Date.parse('2026-11-22T12:00:00.000Z');
  assert.equal(formatActivityTimestamp('2026-11-22T11:59:35.000Z', 'ko', now), '방금 전');
  assert.equal(formatActivityTimestamp('2026-11-22T11:55:00.000Z', 'en', now), '5m ago');
  assert.equal(formatActivityTimestamp('2026-11-22T10:00:00.000Z', 'zh', now), '2 小时前');
  assert.equal(formatActivityTimestamp('2026-11-20T12:00:00.000Z', 'ja', now), '2日前');
  assert.equal(formatActivityTimestamp('2026-10-01T12:00:00.000Z', 'en', now), '2026-10-01');
});
