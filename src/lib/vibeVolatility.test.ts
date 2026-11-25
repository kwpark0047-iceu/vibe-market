import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, DailySignalPoint, ProjectActivityRecord } from '../types/vibeatlas';
import {
  buildVibeVolatilityGeometry,
  computeVibeVolatilityAnalysis,
} from './vibeVolatility';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'vp-1',
    slug: 'vibe-project',
    name: 'Vibe Project',
    tagline: 'Agentic workflow toolkit',
    taglineKo: '에이전트 워크플로우 툴킷',
    description: 'Open-source developer tool for agentic workflows.',
    descriptionKo: '에이전트 워크플로우를 위한 오픈소스 개발자 도구입니다.',
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
    githubRepo: 'org/vibe-project',
    githubUrl: 'https://github.com/org/vibe-project',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'u1',
    githubStars: 2000,
    githubForks: 180,
    likesCount: 45,
    bookmarksCount: 95,
    lastSyncedAt: '2026-11-20T12:00:00.000Z',
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
    isCuratedSeed: true,
    ...overrides,
  };
}

function buildSignals(
  starDeltas: number[],
  likesSeries: number[],
  bookmarksSeries: number[]
): DailySignalPoint[] {
  return starDeltas.map((delta, idx) => {
    const d = new Date(Date.UTC(2026, 10, 7 + idx));
    return {
      date: d.toISOString().slice(0, 10),
      githubStarsDelta: delta,
      internalLikes: likesSeries[idx] ?? 0,
      internalBookmarks: bookmarksSeries[idx] ?? 0,
    };
  });
}

const FIXED_NOW = Date.parse('2026-11-20T18:00:00.000Z');

test('identifies keeping_pace when Vibe Score rises proportionally alongside steady GitHub star growth', () => {
  const starDeltas = [0, 30, 32, 35, 34, 38, 40, 42, 44, 45, 48, 50, 52, 55];
  const likesSeries = [6, 8, 10, 13, 16, 20, 24, 28, 32, 36, 39, 41, 43, 45];
  const bookmarksSeries = [10, 14, 18, 24, 30, 38, 46, 54, 62, 70, 78, 84, 90, 95];

  const proj = makeProject({
    githubStars: 2500,
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: proj,
    allProjects: [proj],
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'tracked');
  assert.ok(analysis.netVibeDelta >= 8, `Expected rising Vibe Score, got ${analysis.netVibeDelta}`);
  assert.ok(analysis.starDelta14d > 500);
  assert.ok(analysis.starGrowthRatePct14d > 20);
  assert.equal(analysis.paceVerdict, 'keeping_pace');
  assert.equal(analysis.points.length, 14);
});

test('flags sentiment_leading and elevates volatilityStdDev when Vibe Score swings sharply while stars barely grow', () => {
  const starDeltas = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  const likesSeries = [2, 2, 2, 2, 2, 2, 4, 8, 14, 22, 30, 38, 44, 52];
  const bookmarksSeries = [3, 3, 3, 3, 3, 3, 6, 14, 26, 40, 58, 76, 92, 110];

  const proj = makeProject({
    githubStars: 5000,
    likesCount: 52,
    bookmarksCount: 110,
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: proj,
    allProjects: [proj],
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'tracked');
  assert.ok(analysis.volatilityStdDev > 0, 'Expected measurable Vibe Score volatility');
  assert.ok(analysis.starGrowthRatePct14d < 1);
  assert.equal(analysis.paceVerdict, 'sentiment_leading');
});

test('flags adoption_outpacing when repository stars surge while community sentiment lags or incurs reports', () => {
  const starDeltas = [0, 80, 90, 120, 140, 160, 180, 210, 240, 270, 300, 330, 360, 400];
  const likesSeries = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
  const bookmarksSeries = [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];

  const reportActivities: ProjectActivityRecord[] = [
    {
      id: 'rep-1',
      projectId: 'vp-1',
      projectSlug: 'vibe-project',
      actorUid: 'u-rep-1',
      actorName: 'Auditor',
      actorHandle: '',
      type: 'report',
      reportReason: 'stale_metadata',
      createdAtIso: '2026-11-19T12:00:00.000Z',
      source: 'firestore',
    },
    {
      id: 'rep-2',
      projectId: 'vp-1',
      projectSlug: 'vibe-project',
      actorUid: 'u-rep-2',
      actorName: 'Auditor 2',
      actorHandle: '',
      type: 'report',
      reportReason: 'broken_link',
      createdAtIso: '2026-11-20T09:00:00.000Z',
      source: 'firestore',
    },
  ];

  const proj = makeProject({
    githubStars: 4880,
    likesCount: 10,
    bookmarksCount: 15,
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const peer = makeProject({
    id: 'vp-peer',
    slug: 'peer',
    githubStars: 5000,
    likesCount: 80,
    bookmarksCount: 160,
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: proj,
    allProjects: [proj, peer],
    activities: reportActivities,
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'tracked');
  assert.ok(analysis.starGrowthRatePct14d > 100);
  assert.equal(analysis.paceVerdict, 'adoption_outpacing');
});

test('handles unsynced repositories honestly with zero star fabrication and unsynced verdict', () => {
  const starDeltas = new Array(14).fill(0);
  const likesSeries = [4, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18, 20, 22, 24];
  const bookmarksSeries = [8, 10, 12, 14, 17, 20, 23, 26, 29, 32, 35, 38, 42, 46];

  const unsynced = makeProject({
    githubStars: 0,
    githubForks: 0,
    lastSyncedAt: '',
    likesCount: 24,
    bookmarksCount: 46,
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: unsynced,
    allProjects: [unsynced],
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'unsynced');
  assert.equal(analysis.paceVerdict, 'unsynced');
  assert.equal(analysis.starDelta14d, 0);
  assert.ok(analysis.points.every((p) => p.githubStars === 0 && p.starGrowthRatePct === 0));
  assert.ok(analysis.currentVibeScore > 0);
});

test('handles single-day GitHub sync snapshot as baseline_awaiting_history without inventing past star deltas', () => {
  const starDeltas = new Array(14).fill(0);
  const likesSeries = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const bookmarksSeries = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];

  const singleSync = makeProject({
    githubStars: 1420,
    lastSyncedAt: '2026-11-20T10:00:00.000Z',
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: singleSync,
    allProjects: [singleSync],
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'baseline_single_snapshot');
  assert.equal(analysis.paceVerdict, 'baseline_awaiting_history');
  assert.equal(analysis.totalStars, 1420);
  assert.equal(analysis.starDelta14d, 0);
});

test('buildVibeVolatilityGeometry generates valid D3 SVG paths and bounded coordinates', () => {
  const starDeltas = [0, 10, 15, 22, 18, 25, 30, 28, 35, 40, 45, 50, 48, 60];
  const likesSeries = [5, 7, 9, 11, 13, 16, 18, 22, 25, 28, 31, 35, 39, 44];
  const bookmarksSeries = [12, 15, 19, 24, 28, 33, 39, 45, 51, 58, 65, 72, 80, 88];

  const proj = makeProject({
    githubStars: 2400,
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: proj,
    allProjects: [proj],
    nowMs: FIXED_NOW,
  });
  const geom = buildVibeVolatilityGeometry(analysis);

  assert.ok(geom.vibeLinePath.startsWith('M'), 'vibeLinePath should start with M');
  assert.ok(geom.volatilityBandPath.startsWith('M'), 'volatilityBandPath should start with M');
  assert.ok(geom.starRateLinePath.startsWith('M'), 'starRateLinePath should start with M');
  assert.ok(!geom.vibeLinePath.includes('NaN'));
  assert.ok(!geom.volatilityBandPath.includes('NaN'));
  assert.ok(!geom.starRateLinePath.includes('NaN'));
  assert.equal(geom.plotPoints.length, 14);
  for (const pt of geom.plotPoints) {
    assert.ok(pt.bandTopY <= pt.vibeY + 1e-6);
    assert.ok(pt.bandBottomY >= pt.vibeY - 1e-6);
  }
});

test('derives realistic daily star growth rate percentages from recorded multi-day snapshots', () => {
  const starDeltas = new Array(14).fill(0);
  const likesSeries = [6, 8, 10, 13, 16, 20, 24, 28, 32, 36, 39, 41, 43, 45];
  const bookmarksSeries = [10, 14, 18, 24, 30, 38, 46, 54, 62, 70, 78, 84, 90, 95];

  const snapshots: Record<string, number> = {
    '2026-11-07': 40000,
    '2026-11-08': 40400, // +1.0%
    '2026-11-09': 41208, // +2.0%
    '2026-11-10': 41620, // +1.0%
    '2026-11-20': 44000,
  };

  const proj = makeProject({
    githubStars: 0,
    lastSyncedAt: '',
    historicalSignals: buildSignals(starDeltas, likesSeries, bookmarksSeries),
  });

  const analysis = computeVibeVolatilityAnalysis({
    project: proj,
    allProjects: [proj],
    recordedSnapshots: snapshots,
    nowMs: FIXED_NOW,
  });

  assert.equal(analysis.starTrackingStatus, 'tracked');
  assert.equal(analysis.totalStars, 44000);
  assert.ok(analysis.starGrowthRatePct14d > 9 && analysis.starGrowthRatePct14d < 11);
  assert.ok(analysis.points[1].starGrowthRatePct > 0.9 && analysis.points[1].starGrowthRatePct < 1.1);
  assert.ok(analysis.points[2].starGrowthRatePct > 1.9 && analysis.points[2].starGrowthRatePct < 2.1);
});
