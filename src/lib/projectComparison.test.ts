import assert from 'node:assert/strict';
import test from 'node:test';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject } from '../types/vibeatlas';
import {
  computeComparisonLeaders,
  MAX_COMPARE_PROJECTS,
  resolveComparedProjects,
  toggleCompareProjectId,
} from './projectComparison';

function makeProject(
  id: string,
  overrides: Partial<CatalogProject> = {}
): CatalogProject {
  return {
    ...CURATED_SEED_PROJECTS[0],
    id,
    slug: id,
    name: `Project ${id}`,
    ...overrides,
  };
}

test('toggleCompareProjectId adds, removes, and enforces max 3 project limit', () => {
  let state: string[] = [];

  const r1 = toggleCompareProjectId(state, 'a');
  assert.equal(r1.limitReached, false);
  assert.deepEqual(r1.nextIds, ['a']);
  state = r1.nextIds;

  const r2 = toggleCompareProjectId(state, 'b');
  const r3 = toggleCompareProjectId(r2.nextIds, 'c');
  assert.equal(r3.limitReached, false);
  assert.deepEqual(r3.nextIds, ['a', 'b', 'c']);
  assert.equal(r3.nextIds.length, MAX_COMPARE_PROJECTS);

  // Adding a 4th item should be rejected cleanly with limitReached=true
  const r4 = toggleCompareProjectId(r3.nextIds, 'd');
  assert.equal(r4.limitReached, true);
  assert.deepEqual(r4.nextIds, ['a', 'b', 'c']);

  // Removing an existing item works even when at limit
  const r5 = toggleCompareProjectId(r4.nextIds, 'b');
  assert.equal(r5.limitReached, false);
  assert.deepEqual(r5.nextIds, ['a', 'c']);
});

test('resolveComparedProjects preserves selection order and dedupes across lists', () => {
  const p1 = makeProject('p1', { name: 'Primary P1' });
  const p2 = makeProject('p2', { name: 'Primary P2' });
  const p3 = makeProject('p3', { name: 'Fallback P3' });

  const resolved = resolveComparedProjects(['p3', 'missing', 'p1'], [p1, p2], [p3]);
  assert.deepEqual(
    resolved.map((p) => p.id),
    ['p3', 'p1']
  );
  assert.equal(resolved[1].name, 'Primary P1');
});

test('computeComparisonLeaders identifies unique leaders and returns null for ties or unsynced stats', () => {
  const p1 = makeProject('p1', {
    lastSyncedAt: '2026-11-20T10:00:00.000Z',
    githubStars: 12000,
    githubForks: 900,
    likesCount: 40,
    bookmarksCount: 80,
    updatedAtIso: '2026-11-18T10:00:00.000Z',
  });
  const p2 = makeProject('p2', {
    lastSyncedAt: '', // Unsynced stars should not win stars leader
    githubStars: 50000,
    githubForks: 1500,
    likesCount: 40, // Tied with p1
    bookmarksCount: 120,
    updatedAtIso: '2026-11-22T10:00:00.000Z',
  });

  const leaders = computeComparisonLeaders([p1, p2]);
  assert.equal(leaders.highestStarsId, 'p1');
  assert.equal(leaders.highestForksId, 'p1');
  assert.equal(leaders.highestLikesId, null);
  assert.equal(leaders.highestBookmarksId, 'p2');
  assert.equal(leaders.mostRecentUpdateId, 'p2');
});
