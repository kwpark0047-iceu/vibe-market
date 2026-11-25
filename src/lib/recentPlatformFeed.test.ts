import test from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import { buildPlatformActivityFeed } from './recentPlatformFeed';

function makeLiveProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    ...CURATED_SEED_PROJECTS[0],
    id: 'live-proj-1',
    slug: 'live-proj-1',
    name: 'Live Test Submission',
    makerName: 'Minjun Park',
    makerHandle: '@minjun',
    isCuratedSeed: false,
    provenanceSource: 'maker_submitted',
    createdAtIso: '2026-11-25T06:00:00.000Z',
    updatedAtIso: '2026-11-25T06:00:00.000Z',
    ...overrides,
  };
}

test('buildPlatformActivityFeed prioritizes live Firestore/local likes & bookmarks and recent submissions chronologically', () => {
  const liveProj = makeLiveProject();
  const projects = [liveProj, ...CURATED_SEED_PROJECTS];

  const firestoreActivities: ProjectActivityRecord[] = [
    {
      id: 'fs-like-1',
      projectId: CURATED_SEED_PROJECTS[0].id,
      projectSlug: CURATED_SEED_PROJECTS[0].slug,
      actorUid: 'u1',
      actorName: 'Jiwon Kim',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-25T06:30:00.000Z',
      source: 'firestore',
    },
    {
      id: 'fs-rep-1',
      projectId: CURATED_SEED_PROJECTS[0].id,
      projectSlug: CURATED_SEED_PROJECTS[0].slug,
      actorUid: 'u2',
      actorName: 'Mod Reporter',
      actorHandle: '',
      type: 'report',
      reportReason: 'broken_link',
      createdAtIso: '2026-11-25T06:35:00.000Z',
      source: 'firestore',
    },
  ];

  const localActivities: ProjectActivityRecord[] = [
    {
      id: 'loc-bm-1',
      projectId: CURATED_SEED_PROJECTS[1].id,
      projectSlug: CURATED_SEED_PROJECTS[1].slug,
      actorUid: 'guest',
      actorName: '',
      actorHandle: '',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-25T06:32:00.000Z',
      source: 'local',
    },
  ];

  const result = buildPlatformActivityFeed({
    projects,
    firestoreActivities,
    localActivities,
    nowMs: Date.parse('2026-11-25T06:35:00.000Z'),
  });

  // Should exclude 'report' from HomePage engagement feed
  assert.equal(result.items.some((i) => i.id.includes('fs-rep-1')), false);

  // Top 3 items should be chronological: local bookmark (06:32), firestore like (06:30), live submission (06:00)
  assert.equal(result.items[0].type, 'bookmark');
  assert.equal(result.items[0].projectId, CURATED_SEED_PROJECTS[1].id);
  assert.equal(result.items[1].type, 'like');
  assert.equal(result.items[1].actorName, 'Jiwon Kim');
  assert.equal(result.items[2].type, 'submission');
  assert.equal(result.items[2].projectId, liveProj.id);
  assert.equal(result.items[2].isLiveEvent, true);
});

test('buildPlatformActivityFeed deduplicates identical local and firestore actor interactions and respects filterType', () => {
  const firestoreLike: ProjectActivityRecord = {
    id: 'act_like_mcp_u9',
    projectId: CURATED_SEED_PROJECTS[0].id,
    projectSlug: CURATED_SEED_PROJECTS[0].slug,
    actorUid: 'u9',
    actorName: 'Hana Lee',
    actorHandle: '',
    type: 'like',
    reportReason: '',
    createdAtIso: '2026-11-25T05:00:00.000Z',
    source: 'firestore',
  };

  const duplicateLocalLike: ProjectActivityRecord = {
    ...firestoreLike,
    id: 'local_like_mcp_u9',
    source: 'local',
  };

  const allRes = buildPlatformActivityFeed({
    projects: CURATED_SEED_PROJECTS,
    firestoreActivities: [firestoreLike],
    localActivities: [duplicateLocalLike],
    filterType: 'all',
    limit: 30,
  });

  const matchingActorLikes = allRes.items.filter(
    (item) =>
      item.type === 'like' &&
      item.projectId === CURATED_SEED_PROJECTS[0].id &&
      item.actorName === 'Hana Lee'
  );
  assert.equal(matchingActorLikes.length, 1);
  assert.ok(allRes.counts.submission > 0);
  assert.ok(allRes.counts.like > 0);
  assert.ok(allRes.counts.bookmark > 0);

  const onlySubs = buildPlatformActivityFeed({
    projects: CURATED_SEED_PROJECTS,
    firestoreActivities: [firestoreLike],
    filterType: 'submission',
  });
  assert.ok(onlySubs.items.length > 0);
  assert.ok(onlySubs.items.every((item) => item.type === 'submission'));
  assert.equal(onlySubs.counts.all, allRes.counts.all);
});
