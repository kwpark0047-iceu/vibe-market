import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, ProjectActivityRecord } from '../types/vibeatlas';
import {
  buildProjectInsightsChartGeometry,
  computeProjectInsights,
} from './projectInsights';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'proj-insights-1',
    slug: 'proj-insights-1',
    name: 'Insights Test Project',
    tagline: 'Test tagline',
    taglineKo: '테스트 소개',
    description: 'Test description',
    descriptionKo: '테스트 설명',
    contentType: 'ai_tool',
    categories: ['Developer Tools'],
    techStack: ['TypeScript', 'D3'],
    developmentPlatform: 'cursor',
    hostingProvider: 'vercel',
    backendTech: 'firebase',
    country: 'KR',
    language: 'bilingual',
    license: 'MIT',
    pricingModel: 'free',
    verificationStatus: 'verified',
    provenanceSource: 'maker_submitted',
    liveDemoUrl: '',
    websiteUrl: '',
    githubRepo: '',
    githubUrl: '',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'owner-1',
    githubStars: 0,
    githubForks: 0,
    likesCount: 24,
    bookmarksCount: 60,
    lastSyncedAt: '',
    createdAtIso: '2026-11-01T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
    historicalSignals: [
      { date: '2026-11-12', githubStarsDelta: 0, internalLikes: 10, internalBookmarks: 20 },
      { date: '2026-11-13', githubStarsDelta: 0, internalLikes: 12, internalBookmarks: 24 },
      { date: '2026-11-14', githubStarsDelta: 0, internalLikes: 14, internalBookmarks: 30 },
      { date: '2026-11-15', githubStarsDelta: 0, internalLikes: 15, internalBookmarks: 33 },
      { date: '2026-11-16', githubStarsDelta: 0, internalLikes: 17, internalBookmarks: 37 },
      { date: '2026-11-17', githubStarsDelta: 0, internalLikes: 18, internalBookmarks: 41 },
      { date: '2026-11-18', githubStarsDelta: 0, internalLikes: 19, internalBookmarks: 45 },
      { date: '2026-11-19', githubStarsDelta: 0, internalLikes: 20, internalBookmarks: 50 },
      { date: '2026-11-20', githubStarsDelta: 0, internalLikes: 24, internalBookmarks: 60 },
    ],
    ...overrides,
  };
}

test('computeProjectInsights extracts exact 7-day likes, bookmarks, share %, and peak day from historicalSignals', () => {
  const project = makeProject();
  const summary = computeProjectInsights({
    project,
    activities: [],
    nowMs: Date.parse('2026-11-25T12:00:00.000Z'),
  });

  // Anchors to latest recorded snapshot week (2026-11-14 .. 2026-11-20) when no newer live events exist
  assert.equal(summary.days.length, 7);
  assert.equal(summary.windowStartDate, '2026-11-14');
  assert.equal(summary.windowEndDate, '2026-11-20');

  // Prior day (11-13) had likes=12, bookmarks=24 -> final day (11-20) has likes=24, bookmarks=60
  assert.equal(summary.likes7d, 12);
  assert.equal(summary.bookmarks7d, 36);
  assert.equal(summary.total7d, 48);
  assert.equal(summary.bookmarkSharePct, 75);
  assert.equal(summary.likeSharePct, 25);
  assert.equal(summary.peakDay?.date, '2026-11-20');
  assert.equal(summary.peakDay?.dailyLikes, 4);
  assert.equal(summary.peakDay?.dailyBookmarks, 10);
  assert.equal(summary.hasActivityInWindow, true);
  assert.equal(summary.dataSource, 'signals_and_live');
});

test('computeProjectInsights incorporates post-snapshot live likes and bookmarks and ignores moderation reports', () => {
  const project = makeProject({ likesCount: 26, bookmarksCount: 61 });
  const activities: ProjectActivityRecord[] = [
    {
      id: 'act-like-1',
      projectId: project.id,
      projectSlug: project.slug,
      actorUid: 'u1',
      actorName: 'User One',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-25T08:00:00.000Z',
      source: 'firestore',
    },
    {
      id: 'act-like-2',
      projectId: project.id,
      projectSlug: project.slug,
      actorUid: 'u2',
      actorName: 'User Two',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-25T09:00:00.000Z',
      source: 'local',
    },
    {
      id: 'act-bm-1',
      projectId: project.id,
      projectSlug: project.slug,
      actorUid: 'u1',
      actorName: 'User One',
      actorHandle: '',
      type: 'bookmark',
      reportReason: '',
      createdAtIso: '2026-11-25T09:15:00.000Z',
      source: 'firestore',
    },
    {
      id: 'act-report-ignored',
      projectId: project.id,
      projectSlug: project.slug,
      actorUid: 'u3',
      actorName: 'Reporter',
      actorHandle: '',
      type: 'report',
      reportReason: 'stale_metadata',
      createdAtIso: '2026-11-25T10:00:00.000Z',
      source: 'firestore',
    },
  ];

  const summary = computeProjectInsights({
    project,
    activities,
    nowMs: Date.parse('2026-11-25T12:00:00.000Z'),
  });

  // Anchors to today when live activities land after latest signal date
  assert.equal(summary.windowStartDate, '2026-11-19');
  assert.equal(summary.windowEndDate, '2026-11-25');

  const todayPoint = summary.days[6];
  assert.equal(todayPoint.date, '2026-11-25');
  assert.equal(todayPoint.dailyLikes, 2);
  assert.equal(todayPoint.dailyBookmarks, 1);
  assert.equal(todayPoint.cumulativeLikes, 26);
  assert.equal(todayPoint.cumulativeBookmarks, 61);
  assert.equal(todayPoint.isLiveActivityDay, true);
});

test('computeProjectInsights handles newly launched projects without double-counting pre-live totals', () => {
  const freshProject = makeProject({
    id: 'fresh-proj',
    slug: 'fresh-proj',
    likesCount: 3,
    bookmarksCount: 2,
    createdAtIso: '2026-11-23T10:00:00.000Z',
    historicalSignals: [],
  });
  const liveActivities: ProjectActivityRecord[] = [
    {
      id: 'fresh-like-today',
      projectId: 'fresh-proj',
      projectSlug: 'fresh-proj',
      actorUid: 'guest',
      actorName: '',
      actorHandle: '',
      type: 'like',
      reportReason: '',
      createdAtIso: '2026-11-25T04:00:00.000Z',
      source: 'local',
    },
  ];

  const summary = computeProjectInsights({
    project: freshProject,
    activities: liveActivities,
    nowMs: Date.parse('2026-11-25T12:00:00.000Z'),
  });

  // 2 pre-live likes on 11-23 + 1 live like on 11-25 = 3 total likes (zero double-counting!)
  assert.equal(summary.likes7d, 3);
  assert.equal(summary.bookmarks7d, 2);
  const launchDay = summary.days.find((d) => d.date === '2026-11-23');
  const today = summary.days.find((d) => d.date === '2026-11-25');
  assert.equal(launchDay?.dailyLikes, 2);
  assert.equal(launchDay?.dailyBookmarks, 2);
  assert.equal(today?.dailyLikes, 1);
  assert.equal(today?.cumulativeLikes, 3);
});

test('computeProjectInsights honestly reports empty state when a project has zero engagement', () => {
  const emptyProject = makeProject({
    likesCount: 0,
    bookmarksCount: 0,
    historicalSignals: [],
    createdAtIso: '2026-10-01T00:00:00.000Z',
  });

  const summary = computeProjectInsights({
    project: emptyProject,
    activities: [],
    nowMs: Date.parse('2026-11-25T12:00:00.000Z'),
  });

  assert.equal(summary.hasActivityInWindow, false);
  assert.equal(summary.total7d, 0);
  assert.equal(summary.peakDay, null);
  assert.equal(summary.dataSource, 'empty');
});

test('buildProjectInsightsChartGeometry builds bounded D3 coordinates and valid SVG paths', () => {
  const summary = computeProjectInsights({
    project: makeProject(),
    nowMs: Date.parse('2026-11-25T12:00:00.000Z'),
  });

  const dailyGeom = buildProjectInsightsChartGeometry(summary, 'daily', { width: 600, height: 216 });
  assert.equal(dailyGeom.plottedDays.length, 7);
  for (const pt of dailyGeom.plottedDays) {
    assert.ok(Number.isFinite(pt.likeBarX));
    assert.ok(Number.isFinite(pt.likeBarY));
    assert.ok(Number.isFinite(pt.bookmarkBarX));
    assert.ok(Number.isFinite(pt.bookmarkBarY));
    assert.ok(pt.likeBarHeight >= 0);
    assert.ok(pt.bookmarkBarHeight >= 0);
  }

  const cumGeom = buildProjectInsightsChartGeometry(summary, 'cumulative', { width: 600, height: 216 });
  assert.ok(cumGeom.cumLikesLinePath.startsWith('M'));
  assert.ok(cumGeom.cumBookmarksLinePath.startsWith('M'));
  assert.ok(cumGeom.cumLikesAreaPath.startsWith('M'));
  assert.ok(cumGeom.cumBookmarksAreaPath.startsWith('M'));
});
