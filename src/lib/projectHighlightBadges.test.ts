import test from 'node:test';
import assert from 'node:assert/strict';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import {
  computeCatalogHighlightContext,
  computeRecentSignalMomentum,
  resolveProjectHighlightBadges,
} from './projectHighlightBadges';

const REFERENCE_NOW_MS = Date.parse('2026-11-24T12:00:00.000Z');

function makeBaseProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'test-proj',
    slug: 'test-proj',
    name: 'Test Project',
    tagline: 'Test tagline for project',
    taglineKo: '테스트 프로젝트 소개',
    description: 'Detailed test description with sufficient length.',
    descriptionKo: '테스트 상세 설명입니다.',
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
    liveDemoUrl: 'https://example.com/demo',
    websiteUrl: 'https://example.com',
    githubRepo: 'org/test-proj',
    githubUrl: 'https://github.com/org/test-proj',
    thumbnailUrl: '',
    makerName: 'Test Maker',
    makerHandle: '@testmaker',
    ownerUid: 'user-1',
    githubStars: 0,
    githubForks: 0,
    likesCount: 10,
    bookmarksCount: 20,
    lastSyncedAt: '',
    createdAtIso: '2026-09-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    isCuratedSeed: true,
    ...overrides,
  };
}

test('computeCatalogHighlightContext selectively marks top flagship projects as Featured', () => {
  const ctx = computeCatalogHighlightContext(CURATED_SEED_PROJECTS, {
    nowMs: REFERENCE_NOW_MS,
    storage: null,
  });

  assert.equal(ctx.featuredIds.size, 3);
  assert.equal(ctx.featuredIds.has('anthropic-agent-skills'), true);
  assert.equal(ctx.featuredIds.has('mcp-reference-servers'), true);
  assert.equal(ctx.featuredIds.has('cline-coding-agent'), true);
  assert.equal(ctx.featuredIds.has('bolt-vite-starter-kit'), false);
});

test('explicit isFeatured and top-3 leaderboardRank qualify for Featured badge without catalog context', () => {
  const featured = makeBaseProject({ id: 'feat', isFeatured: true });
  const topRank = makeBaseProject({ id: 'rank2', leaderboardRank: 2 });
  const rankTen = makeBaseProject({ id: 'rank10', leaderboardRank: 10 });

  assert.deepEqual(
    resolveProjectHighlightBadges(featured, { nowMs: REFERENCE_NOW_MS }).map((b) => b.kind),
    ['featured']
  );
  assert.deepEqual(
    resolveProjectHighlightBadges(topRank, { nowMs: REFERENCE_NOW_MS }).map((b) => b.kind),
    ['featured']
  );
  assert.deepEqual(
    resolveProjectHighlightBadges(rankTen, { nowMs: REFERENCE_NOW_MS }).map((b) => b.kind),
    []
  );
});

test('New Arrival triggers strictly for projects created within the recency window', () => {
  const recentSeed = makeBaseProject({
    createdAtIso: '2026-11-16T10:00:00.000Z', // 8 days prior to REFERENCE_NOW_MS
  });
  const liveRecent = makeBaseProject({
    isCuratedSeed: false,
    createdAtIso: '2026-11-05T10:00:00.000Z', // 19 days prior (within 21d window for live submissions)
  });
  const olderSeed = makeBaseProject({
    createdAtIso: '2026-10-15T10:00:00.000Z', // 40 days prior
  });

  const recentBadges = resolveProjectHighlightBadges(recentSeed, { nowMs: REFERENCE_NOW_MS });
  assert.equal(recentBadges.length, 1);
  assert.equal(recentBadges[0].kind, 'new_arrival');
  assert.equal(recentBadges[0].referenceDate, '2026-11-16');

  const liveBadges = resolveProjectHighlightBadges(liveRecent, { nowMs: REFERENCE_NOW_MS });
  assert.equal(liveBadges.some((b) => b.kind === 'new_arrival'), true);

  const oldBadges = resolveProjectHighlightBadges(olderSeed, { nowMs: REFERENCE_NOW_MS });
  assert.equal(oldBadges.some((b) => b.kind === 'new_arrival'), false);
});

test('High Activity detects 7-day GitHub star surges, internal community signal bursts, and live interactions', () => {
  const starSurging = makeBaseProject({
    githubStars: 2400,
    lastSyncedAt: '2026-11-24T00:00:00.000Z',
  });
  const starBadges = resolveProjectHighlightBadges(starSurging, {
    nowMs: REFERENCE_NOW_MS,
    starsGained7d: 320,
  });
  assert.equal(starBadges[0].kind, 'high_activity');
  assert.equal(starBadges[0].reason, 'github_stars_7d');
  assert.equal(starBadges[0].metricValue, 320);

  const signalSurging = makeBaseProject({
    historicalSignals: [
      { date: '2026-11-10', githubStarsDelta: 0, internalLikes: 10, internalBookmarks: 20 },
      { date: '2026-11-14', githubStarsDelta: 0, internalLikes: 15, internalBookmarks: 30 },
      { date: '2026-11-20', githubStarsDelta: 0, internalLikes: 38, internalBookmarks: 68 },
    ],
  });
  const momentum = computeRecentSignalMomentum(signalSurging);
  assert.equal(momentum.internalDelta7d, 76);

  const signalBadges = resolveProjectHighlightBadges(signalSurging, { nowMs: REFERENCE_NOW_MS });
  assert.equal(signalBadges[0].kind, 'high_activity');
  assert.equal(signalBadges[0].reason, 'community_signals_7d');
  assert.equal(signalBadges[0].metricValue, 76);

  const activities: ProjectActivityRecord[] = [
    {
      id: 'a1',
      projectId: 'test-proj',
      projectSlug: 'test-proj',
      actorUid: 'u1',
      actorName: 'A',
      actorHandle: '@a',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-24T01:00:00.000Z',
      source: 'local',
    },
    {
      id: 'a2',
      projectId: 'test-proj',
      projectSlug: 'test-proj',
      actorUid: 'u2',
      actorName: 'B',
      actorHandle: '@b',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-24T02:00:00.000Z',
      source: 'local',
    },
    {
      id: 'a3',
      projectId: 'test-proj',
      projectSlug: 'test-proj',
      actorUid: 'u3',
      actorName: 'C',
      actorHandle: '@c',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-24T03:00:00.000Z',
      source: 'local',
    },
  ];
  const liveActivityProject = makeBaseProject();
  const liveActivityBadges = resolveProjectHighlightBadges(liveActivityProject, {
    nowMs: REFERENCE_NOW_MS,
    activities,
  });
  assert.equal(liveActivityBadges[0].kind, 'high_activity');
  assert.equal(liveActivityBadges[0].reason, 'live_interactions');
});

test('maxBadges caps rendered badges cleanly while preserving priority order', () => {
  const megaProject = makeBaseProject({
    isFeatured: true,
    createdAtIso: '2026-11-22T00:00:00.000Z',
  });

  const capped = resolveProjectHighlightBadges(megaProject, {
    nowMs: REFERENCE_NOW_MS,
    starsGained7d: 450,
    maxBadges: 2,
  });
  assert.deepEqual(
    capped.map((b) => b.kind),
    ['featured', 'high_activity']
  );

  const uncapped = resolveProjectHighlightBadges(megaProject, {
    nowMs: REFERENCE_NOW_MS,
    starsGained7d: 450,
    maxBadges: 3,
  });
  assert.deepEqual(
    uncapped.map((b) => b.kind),
    ['featured', 'high_activity', 'new_arrival']
  );
});

test('curated seed projects exhibit balanced, truthful highlight badges across the catalog', () => {
  const ctx = computeCatalogHighlightContext(CURATED_SEED_PROJECTS, {
    nowMs: REFERENCE_NOW_MS,
    storage: null,
  });

  const summary = CURATED_SEED_PROJECTS.map((project) => ({
    id: project.id,
    kinds: resolveProjectHighlightBadges(project, { context: ctx }).map((b) => b.kind),
  }));

  const skills = summary.find((s) => s.id === 'anthropic-agent-skills');
  const kFounder = summary.find((s) => s.id === 'seoul-vibe-ops-lovable');
  const boltKit = summary.find((s) => s.id === 'bolt-vite-starter-kit');

  assert.deepEqual(skills?.kinds, ['featured', 'high_activity']);
  assert.deepEqual(kFounder?.kinds, ['new_arrival']);
  assert.deepEqual(boltKit?.kinds, []);
});
