import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject } from '../types/vibeatlas.ts';
import {
  computeStarGainsMap,
  computeWeeklyStarGain,
  loadAllStarSnapshots,
  selectTrendingProjects7d,
} from './trendingStars.ts';
import { sortProjects } from './catalogEngine.ts';
import { recordStarSnapshot } from './starHistory.ts';

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Project 1',
    tagline: 'Tagline',
    taglineKo: '소개',
    description: 'Description',
    descriptionKo: '설명',
    contentType: 'mcp_server',
    categories: ['MCP'],
    techStack: ['TypeScript'],
    developmentPlatform: 'cursor',
    hostingProvider: 'vercel',
    backendTech: 'nodejs',
    country: 'KR',
    language: 'bilingual',
    license: 'MIT',
    pricingModel: 'open_source',
    verificationStatus: 'verified',
    provenanceSource: 'github_sync',
    liveDemoUrl: '',
    websiteUrl: '',
    githubRepo: 'org/p1',
    githubUrl: 'https://github.com/org/p1',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'u1',
    githubStars: 1000,
    githubForks: 100,
    likesCount: 10,
    bookmarksCount: 20,
    lastSyncedAt: '2026-11-22T00:00:00.000Z',
    createdAtIso: '2026-11-01T00:00:00.000Z',
    updatedAtIso: '2026-11-22T00:00:00.000Z',
    ...overrides,
  };
}

test('computeWeeklyStarGain sums only historicalSignals within the last 7 days', () => {
  const nowMs = Date.parse('2026-11-22T10:00:00.000Z');
  const project = makeProject({
    historicalSignals: [
      // Outside 7-day window (Nov 16 - Nov 22)
      { date: '2026-11-12', githubStarsDelta: 900, internalLikes: 5, internalBookmarks: 10 },
      { date: '2026-11-15', githubStarsDelta: 400, internalLikes: 5, internalBookmarks: 10 },
      // Inside 7-day window
      { date: '2026-11-16', githubStarsDelta: 120, internalLikes: 5, internalBookmarks: 10 },
      { date: '2026-11-20', githubStarsDelta: 230, internalLikes: 5, internalBookmarks: 10 },
      { date: '2026-11-22', githubStarsDelta: 50, internalLikes: 5, internalBookmarks: 10 },
    ],
  });

  assert.equal(computeWeeklyStarGain(project, {}, nowMs, 7), 400);
});

test('computeWeeklyStarGain derives 7-day delta from multi-day snapshots cleanly', () => {
  const nowMs = Date.parse('2026-11-22T10:00:00.000Z');
  const project = makeProject({ githubRepo: 'org/snap' });

  // Snapshot before 7d window + latest inside window
  const withPriorBaseline = {
    '2026-11-15': 2000,
    '2026-11-19': 2350,
    '2026-11-22': 2750,
  };
  assert.equal(computeWeeklyStarGain(project, withPriorBaseline, nowMs, 7), 750);

  // Snapshots only inside 7d window
  const inWindowOnly = {
    '2026-11-18': 1100,
    '2026-11-22': 1420,
  };
  assert.equal(computeWeeklyStarGain(project, inWindowOnly, nowMs, 7), 320);

  // Stale snapshots all older than 7 days yield 0
  const staleSnapshots = {
    '2026-11-01': 100,
    '2026-11-10': 500,
  };
  assert.equal(computeWeeklyStarGain(project, staleSnapshots, nowMs, 7), 0);

  // Single snapshot yields 0
  assert.equal(computeWeeklyStarGain(project, { '2026-11-22': 500 }, nowMs, 7), 0);
});

test('selectTrendingProjects7d ranks projects by 7-day star gain and picks top N', () => {
  const nowMs = Date.parse('2026-11-22T10:00:00.000Z');
  const storage = makeMemoryStorage();

  recordStarSnapshot('org/alpha', '2026-11-15T12:00:00.000Z', 5000, storage);
  recordStarSnapshot('org/alpha', '2026-11-22T12:00:00.000Z', 6800, storage); // +1800

  recordStarSnapshot('org/beta', '2026-11-16T12:00:00.000Z', 2000, storage);
  recordStarSnapshot('org/beta', '2026-11-21T12:00:00.000Z', 2400, storage); // +400

  const projects: CatalogProject[] = [
    makeProject({ id: 'alpha', githubRepo: 'org/alpha', githubStars: 6800 }),
    makeProject({ id: 'beta', githubRepo: 'org/beta', githubStars: 2400 }),
    makeProject({
      id: 'gamma',
      githubRepo: 'org/gamma',
      githubStars: 12000,
      historicalSignals: [
        { date: '2026-11-20', githubStarsDelta: 950, internalLikes: 0, internalBookmarks: 0 },
      ],
    }),
    makeProject({
      id: 'delta',
      githubRepo: 'org/delta',
      githubStars: 30000,
      historicalSignals: [
        { date: '2026-11-19', githubStarsDelta: 150, internalLikes: 500, internalBookmarks: 900 },
      ],
    }),
    makeProject({ id: 'zero', githubRepo: 'org/zero', githubStars: 99000 }),
  ];

  const snapshots = loadAllStarSnapshots(storage);
  const trending = selectTrendingProjects7d(projects, {
    nowMs,
    maxBadges: 3,
    snapshotsByRepo: snapshots,
  });

  assert.equal(trending.size, 3);
  assert.deepEqual(trending.get('alpha'), { rank: 1, starsGained7d: 1800 });
  assert.deepEqual(trending.get('gamma'), { rank: 2, starsGained7d: 950 });
  assert.deepEqual(trending.get('beta'), { rank: 3, starsGained7d: 400 });
  assert.equal(trending.has('delta'), false);
  assert.equal(trending.has('zero'), false);

  const gains = computeStarGainsMap(projects, { nowMs, snapshotsByRepo: snapshots });
  const sorted = sortProjects(projects, 'trending_7d', '', gains);
  assert.deepEqual(
    sorted.map((p) => p.id),
    ['alpha', 'gamma', 'beta', 'delta', 'zero']
  );
});
