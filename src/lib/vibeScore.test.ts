import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import {
  buildVibeGaugeGeometry,
  classifyVibeScoreTier,
  computeProjectVibeScore,
} from './vibeScore';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'p-1',
    slug: 'project-one',
    name: 'Project One',
    tagline: 'Test tagline',
    taglineKo: '테스트 소개',
    description: 'Detailed description of a developer tool.',
    descriptionKo: '개발자 도구 상세 설명입니다.',
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
    provenanceSource: 'github_sync',
    liveDemoUrl: '',
    websiteUrl: '',
    githubRepo: 'org/repo',
    githubUrl: 'https://github.com/org/repo',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'u1',
    githubStars: 0,
    githubForks: 0,
    likesCount: 40,
    bookmarksCount: 80,
    lastSyncedAt: '',
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-11-18T00:00:00.000Z',
    isCuratedSeed: true,
    historicalSignals: [
      { date: '2026-11-05', githubStarsDelta: 0, internalLikes: 12, internalBookmarks: 20 },
      { date: '2026-11-12', githubStarsDelta: 0, internalLikes: 24, internalBookmarks: 48 },
      { date: '2026-11-19', githubStarsDelta: 0, internalLikes: 40, internalBookmarks: 80 },
    ],
    ...overrides,
  };
}

function makeActivity(
  id: string,
  type: ProjectActivityRecord['type'],
  source: ProjectActivityRecord['source'] = 'firestore'
): ProjectActivityRecord {
  return {
    id,
    projectId: 'p-1',
    projectSlug: 'project-one',
    actorUid: `actor-${id}`,
    actorName: 'Member',
    actorHandle: '',
    type,
    reportReason: type === 'report' ? 'stale_metadata' : '',
    createdAtIso: '2026-11-20T00:00:00.000Z',
    source,
  };
}

const FIXED_NOW = Date.parse('2026-11-22T00:00:00.000Z');

test('classifyVibeScoreTier maps thresholds cleanly', () => {
  assert.equal(classifyVibeScoreTier(0), 'quiet');
  assert.equal(classifyVibeScoreTier(24), 'quiet');
  assert.equal(classifyVibeScoreTier(25), 'warm');
  assert.equal(classifyVibeScoreTier(49), 'warm');
  assert.equal(classifyVibeScoreTier(50), 'active');
  assert.equal(classifyVibeScoreTier(74), 'active');
  assert.equal(classifyVibeScoreTier(75), 'thriving');
  assert.equal(classifyVibeScoreTier(100), 'thriving');
});

test('high-engagement synced & verified project earns thriving Vibe Score', () => {
  const topProject = makeProject({
    likesCount: 65,
    bookmarksCount: 140,
    githubStars: 12400,
    githubForks: 1650,
    lastSyncedAt: '2026-11-20T12:00:00.000Z',
  });
  const peerLow = makeProject({
    id: 'p-2',
    slug: 'low',
    likesCount: 3,
    bookmarksCount: 5,
    githubStars: 50,
    githubForks: 4,
    lastSyncedAt: '2026-11-20T12:00:00.000Z',
  });

  const result = computeProjectVibeScore({
    project: topProject,
    allProjects: [topProject, peerLow],
    nowMs: FIXED_NOW,
  });

  assert.ok(result.score >= 80, `Expected thriving score >= 80, got ${result.score}`);
  assert.equal(result.tier, 'thriving');
  assert.equal(result.isGithubSynced, true);
  assert.equal(result.pillars.traction.score, 25);
});

test('unsynced GitHub project honestly sets traction pillar to 0 without fabricating star points', () => {
  const unsynced = makeProject({
    githubStars: 0,
    githubForks: 0,
    lastSyncedAt: '',
  });
  const synced = makeProject({
    ...unsynced,
    githubStars: 4000,
    githubForks: 450,
    lastSyncedAt: '2026-11-20T12:00:00.000Z',
  });

  const unsyncedRes = computeProjectVibeScore({
    project: unsynced,
    allProjects: [unsynced],
    nowMs: FIXED_NOW,
  });
  const syncedRes = computeProjectVibeScore({
    project: synced,
    allProjects: [synced],
    nowMs: FIXED_NOW,
  });

  assert.equal(unsyncedRes.isGithubSynced, false);
  assert.equal(unsyncedRes.pillars.traction.score, 0);
  assert.ok(syncedRes.score > unsyncedRes.score);
});

test('sentiment reports reduce Vibe Score transparently while live likes/bookmarks boost momentum', () => {
  const base = makeProject();

  const neutral = computeProjectVibeScore({
    project: base,
    allProjects: [base],
    nowMs: FIXED_NOW,
  });

  const withPositiveInteractions = computeProjectVibeScore({
    project: base,
    allProjects: [base],
    activities: [
      makeActivity('a1', 'like', 'local'),
      makeActivity('a2', 'bookmark', 'local'),
    ],
    isLiked: true,
    isBookmarked: true,
    nowMs: FIXED_NOW,
  });

  const withReports = computeProjectVibeScore({
    project: base,
    allProjects: [base],
    activities: [makeActivity('r1', 'report'), makeActivity('r2', 'report')],
    nowMs: FIXED_NOW,
  });

  assert.ok(
    withPositiveInteractions.score > neutral.score,
    `Expected like/bookmark to boost score (${withPositiveInteractions.score} > ${neutral.score})`
  );
  assert.equal(withReports.reportCount, 2);
  assert.equal(withReports.reportPenalty, 8);
  assert.equal(withReports.score, Math.max(0, neutral.score - 8));
});

test('low-engagement unverified stale project scores in Quiet tier', () => {
  const low = makeProject({
    likesCount: 1,
    bookmarksCount: 2,
    verificationStatus: 'unverified',
    updatedAtIso: '2025-01-10T00:00:00.000Z',
    lastSyncedAt: '',
    historicalSignals: [],
  });

  const res = computeProjectVibeScore({
    project: low,
    allProjects: [low],
    nowMs: FIXED_NOW,
  });

  assert.ok(res.score < 25, `Expected quiet score < 25, got ${res.score}`);
  assert.equal(res.tier, 'quiet');
});

test('buildVibeGaugeGeometry builds valid D3 semicircular SVG paths and needle positions', () => {
  const g0 = buildVibeGaugeGeometry(0);
  const g50 = buildVibeGaugeGeometry(50);
  const g100 = buildVibeGaugeGeometry(100);
  const gOver = buildVibeGaugeGeometry(140);

  assert.ok(g0.trackPath.startsWith('M'), 'trackPath should be an SVG path');
  assert.equal(g0.activePath, '');
  assert.ok(g0.needleTipX < 0, 'score 0 needle points left');
  assert.ok(Math.abs(g0.needleTipY) < 1e-6, 'score 0 needle rests on horizontal baseline');

  assert.ok(g50.activePath.startsWith('M'));
  assert.ok(Math.abs(g50.needleTipX) < 1e-6, 'score 50 needle points straight up');
  assert.ok(g50.needleTipY < 0, 'score 50 needle points upward in SVG Y coordinates');

  assert.ok(g100.needleTipX > 0, 'score 100 needle points right');
  assert.equal(gOver.clampedScore, 100);
  assert.equal(g100.segments.length, 4);
  assert.deepEqual(
    g100.ticks.map((t) => t.value),
    [0, 25, 50, 75, 100]
  );
});
