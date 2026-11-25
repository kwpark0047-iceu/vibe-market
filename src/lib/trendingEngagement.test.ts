import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import {
  computeEngagementTrendingScoresMap,
  computeProjectEngagementGrowth7d,
  rankTrendingByEngagement7d,
  selectTrendingByEngagement7d,
} from './trendingEngagement';
import { sortProjects } from './catalogEngine';

const NOW_MS = Date.parse('2026-11-25T10:00:00.000Z');

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Project 1',
    tagline: 'Tagline',
    taglineKo: '소개',
    description: 'Description',
    descriptionKo: '설명',
    contentType: 'ai_tool',
    categories: ['AI Agent'],
    techStack: ['TypeScript'],
    developmentPlatform: 'cursor',
    hostingProvider: 'vercel',
    backendTech: 'nodejs',
    country: 'KR',
    language: 'bilingual',
    license: 'MIT',
    pricingModel: 'open_source',
    verificationStatus: 'verified',
    provenanceSource: 'maker_submitted',
    liveDemoUrl: '',
    websiteUrl: '',
    githubRepo: 'org/p1',
    githubUrl: 'https://github.com/org/p1',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'u1',
    githubStars: 5000,
    githubForks: 100,
    likesCount: 40,
    bookmarksCount: 80,
    lastSyncedAt: '2026-11-25T00:00:00.000Z',
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-11-25T00:00:00.000Z',
    ...overrides,
  };
}

test('computeProjectEngagementGrowth7d isolates 7-day likes and bookmarks delta from historicalSignals', () => {
  const project = makeProject({
    likesCount: 65,
    bookmarksCount: 120,
    githubStars: 99999, // must never bleed into internal engagement growth
    historicalSignals: [
      // Prior to 7-day window (Nov 19 - Nov 25)
      { date: '2026-11-10', githubStarsDelta: 1000, internalLikes: 10, internalBookmarks: 20 },
      { date: '2026-11-18', githubStarsDelta: 1500, internalLikes: 45, internalBookmarks: 85 },
      // Inside 7-day window
      { date: '2026-11-22', githubStarsDelta: 200, internalLikes: 55, internalBookmarks: 102 },
      { date: '2026-11-25', githubStarsDelta: 300, internalLikes: 65, internalBookmarks: 120 },
    ],
  });

  const growth = computeProjectEngagementGrowth7d(project, { nowMs: NOW_MS });
  // Latest (65, 120) minus baseline before window (45, 85) => +20 likes, +35 bookmarks
  assert.equal(growth.likesGained7d, 20);
  assert.equal(growth.bookmarksGained7d, 35);
  assert.equal(growth.totalGained7d, 55);
  assert.equal(growth.source, 'signals_7d');
  assert.ok(growth.trendingScore > 70);
});

test('computeProjectEngagementGrowth7d combines post-snapshot live likes/bookmarks without double counting', () => {
  const project = makeProject({
    id: 'live-combo',
    slug: 'live-combo',
    likesCount: 34,
    bookmarksCount: 52,
    historicalSignals: [
      { date: '2026-11-18', githubStarsDelta: 0, internalLikes: 28, internalBookmarks: 44 },
      { date: '2026-11-20', githubStarsDelta: 0, internalLikes: 32, internalBookmarks: 50 },
    ],
  });

  const activities: ProjectActivityRecord[] = [
    // Prior to latest snapshot day 2026-11-20 -> already reflected in snapshot
    {
      id: 'old-like',
      projectId: 'live-combo',
      projectSlug: 'live-combo',
      actorUid: 'u1',
      actorName: 'U1',
      actorHandle: '@u1',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-20T05:00:00.000Z',
      source: 'local',
    },
    // After 2026-11-20 -> fresh real-time user engagement!
    {
      id: 'new-like-1',
      projectId: 'live-combo',
      projectSlug: 'live-combo',
      actorUid: 'u2',
      actorName: 'U2',
      actorHandle: '@u2',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-25T02:00:00.000Z',
      source: 'local',
    },
    {
      id: 'new-bookmark-1',
      projectId: 'live-combo',
      projectSlug: 'live-combo',
      actorUid: 'u3',
      actorName: 'U3',
      actorHandle: '@u3',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-25T03:00:00.000Z',
      source: 'local',
    },
  ];

  const growth = computeProjectEngagementGrowth7d(project, {
    nowMs: NOW_MS,
    activities,
  });

  // 32 - 28 = 4 signal likes + 1 post-snapshot like = 5
  assert.equal(growth.likesGained7d, 5);
  // 50 - 44 = 6 signal bookmarks + 1 post-snapshot bookmark = 7
  assert.equal(growth.bookmarksGained7d, 7);
  assert.equal(growth.totalGained7d, 12);
});

test('rankTrendingByEngagement7d and sortProjects rank by 7d likes & bookmark growth over GitHub stars', () => {
  const highStarsStaleEngagement = makeProject({
    id: 'mega-stars-flat',
    githubStars: 85000,
    likesCount: 500,
    bookmarksCount: 900,
    historicalSignals: [
      { date: '2026-11-18', githubStarsDelta: 500, internalLikes: 500, internalBookmarks: 900 },
      { date: '2026-11-25', githubStarsDelta: 500, internalLikes: 500, internalBookmarks: 900 },
    ],
  });

  const risingBookmarks = makeProject({
    id: 'rising-bookmarks',
    githubStars: 120,
    likesCount: 30,
    bookmarksCount: 60,
    historicalSignals: [
      { date: '2026-11-18', githubStarsDelta: 0, internalLikes: 20, internalBookmarks: 30 },
      { date: '2026-11-25', githubStarsDelta: 0, internalLikes: 30, internalBookmarks: 60 },
    ],
  });

  const risingLikes = makeProject({
    id: 'rising-likes',
    githubStars: 400,
    likesCount: 35,
    bookmarksCount: 25,
    historicalSignals: [
      { date: '2026-11-18', githubStarsDelta: 0, internalLikes: 15, internalBookmarks: 20 },
      { date: '2026-11-25', githubStarsDelta: 0, internalLikes: 35, internalBookmarks: 25 },
    ],
  });

  const freshLaunch = makeProject({
    id: 'fresh-launch',
    githubStars: 0,
    likesCount: 6,
    bookmarksCount: 8,
    createdAtIso: '2026-11-23T08:00:00.000Z',
  });

  const catalog = [highStarsStaleEngagement, risingLikes, freshLaunch, risingBookmarks];
  const ranked = rankTrendingByEngagement7d(catalog, { nowMs: NOW_MS });

  assert.deepEqual(
    ranked.map((r) => r.project.id),
    ['rising-bookmarks', 'rising-likes', 'fresh-launch']
  );
  assert.equal(ranked[0].info.rank, 1);
  assert.equal(ranked[0].info.bookmarksGained7d, 30);

  const selected = selectTrendingByEngagement7d(catalog, { nowMs: NOW_MS, maxBadges: 2 });
  assert.equal(selected.size, 2);
  assert.equal(selected.has('rising-bookmarks'), true);
  assert.equal(selected.has('rising-likes'), true);
  assert.equal(selected.has('mega-stars-flat'), false);

  const scoresMap = computeEngagementTrendingScoresMap(catalog, { nowMs: NOW_MS });
  const sorted = sortProjects(catalog, 'trending_7d', '', undefined, scoresMap);
  assert.deepEqual(
    sorted.map((p) => p.id),
    ['rising-bookmarks', 'rising-likes', 'fresh-launch', 'mega-stars-flat']
  );
});
