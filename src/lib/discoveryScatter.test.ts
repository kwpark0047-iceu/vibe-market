import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  CatalogProject,
  GitHubAiTrendingRepo,
  OwnershipClaimRecord,
} from '../types/vibeatlas';
import {
  buildDiscoveryScatterDataset,
  buildDiscoveryScatterLayout,
  classifyScatterQuadrant,
  computeActivityFrequency,
  formatStarTickCompact,
  inferContentTypeFromGitHubRepo,
} from './discoveryScatter';

const NOW_MS = Date.parse('2026-11-24T00:00:00.000Z');

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: overrides.id ?? 'proj-1',
    slug: overrides.slug ?? 'proj-1',
    name: overrides.name ?? 'Project One',
    tagline: overrides.tagline ?? 'Test tagline',
    taglineKo: overrides.taglineKo ?? '테스트 소개',
    description: overrides.description ?? 'Longer description for testing project metadata.',
    descriptionKo: overrides.descriptionKo ?? '테스트 상세 설명',
    contentType: overrides.contentType ?? 'ai_tool',
    categories: overrides.categories ?? ['AI Tools'],
    techStack: overrides.techStack ?? ['TypeScript'],
    developmentPlatform: overrides.developmentPlatform ?? 'custom',
    hostingProvider: overrides.hostingProvider ?? 'vercel',
    backendTech: overrides.backendTech ?? 'nodejs',
    country: overrides.country ?? 'US',
    language: overrides.language ?? 'en',
    license: overrides.license ?? 'MIT',
    pricingModel: overrides.pricingModel ?? 'open_source',
    verificationStatus: overrides.verificationStatus ?? 'verified',
    provenanceSource: overrides.provenanceSource ?? 'github_sync',
    liveDemoUrl: overrides.liveDemoUrl ?? '',
    websiteUrl: overrides.websiteUrl ?? 'https://example.com',
    githubRepo: overrides.githubRepo ?? 'acme/proj-one',
    githubUrl: overrides.githubUrl ?? 'https://github.com/acme/proj-one',
    thumbnailUrl: '',
    makerName: overrides.makerName ?? 'Acme',
    makerHandle: overrides.makerHandle ?? '@acme',
    ownerUid: overrides.ownerUid ?? 'seed-curator',
    githubStars: overrides.githubStars ?? 0,
    githubForks: overrides.githubForks ?? 0,
    likesCount: overrides.likesCount ?? 10,
    bookmarksCount: overrides.bookmarksCount ?? 20,
    lastSyncedAt: overrides.lastSyncedAt ?? '',
    createdAtIso: overrides.createdAtIso ?? '2026-10-01T00:00:00.000Z',
    updatedAtIso: overrides.updatedAtIso ?? '2026-11-22T00:00:00.000Z',
    historicalSignals: overrides.historicalSignals,
    isCuratedSeed: overrides.isCuratedSeed,
  };
}

function makeLiveRepo(overrides: Partial<GitHubAiTrendingRepo> = {}): GitHubAiTrendingRepo {
  return {
    rank: overrides.rank ?? 1,
    id: overrides.id ?? 101,
    fullName: overrides.fullName ?? 'acme/live-agent',
    name: overrides.name ?? 'live-agent',
    ownerLogin: overrides.ownerLogin ?? 'acme',
    ownerAvatarUrl: '',
    description: overrides.description ?? 'Autonomous AI coding agent framework',
    htmlUrl: overrides.htmlUrl ?? 'https://github.com/acme/live-agent',
    homepage: overrides.homepage ?? '',
    stars: overrides.stars ?? 12500,
    forks: overrides.forks ?? 980,
    openIssues: overrides.openIssues ?? 64,
    language: overrides.language ?? 'TypeScript',
    license: overrides.license ?? 'MIT',
    topics: overrides.topics ?? ['ai', 'agent'],
    createdAt: overrides.createdAt ?? '2026-06-01T00:00:00.000Z',
    pushedAt: overrides.pushedAt ?? '2026-11-23T18:00:00.000Z',
    dailyStars: overrides.dailyStars ?? 85,
    dailyRateSource: overrides.dailyRateSource ?? 'daily_velocity_rate',
  };
}

test('computeActivityFrequency rewards recency, daily velocity, and community engagement monotonically within 0..100', () => {
  const highActivity = computeActivityFrequency({
    pushedAt: '2026-11-23T18:00:00.000Z',
    dailyStars: 120,
    openIssues: 80,
    likesCount: 45,
    bookmarksCount: 95,
    recentSignalDelta: 40,
    nowMs: NOW_MS,
  });

  const midIndie = computeActivityFrequency({
    updatedAtIso: '2026-11-20T00:00:00.000Z',
    dailyStars: 0,
    likesCount: 35,
    bookmarksCount: 65,
    nowMs: NOW_MS,
  });

  const staleQuiet = computeActivityFrequency({
    updatedAtIso: '2026-08-01T00:00:00.000Z',
    dailyStars: 0,
    likesCount: 1,
    bookmarksCount: 2,
    nowMs: NOW_MS,
  });

  assert.ok(highActivity.activityFrequency >= 80 && highActivity.activityFrequency <= 100);
  assert.ok(midIndie.activityFrequency > staleQuiet.activityFrequency);
  assert.ok(highActivity.activityFrequency > midIndie.activityFrequency);
  assert.equal(highActivity.recencyDays, 0);
  assert.equal(midIndie.recencyDays, 4);
});

test('inferContentTypeFromGitHubRepo classifies MCP servers, agents, skills, and web apps deterministically', () => {
  assert.equal(
    inferContentTypeFromGitHubRepo(
      makeLiveRepo({ fullName: 'org/postgres-mcp', name: 'postgres-mcp', topics: ['mcp'] })
    ),
    'mcp_server'
  );
  assert.equal(
    inferContentTypeFromGitHubRepo(
      makeLiveRepo({ fullName: 'org/crew', name: 'crew', description: 'Multi-agent orchestrator', topics: ['ai'] })
    ),
    'ai_agent'
  );
  assert.equal(
    inferContentTypeFromGitHubRepo(
      makeLiveRepo({ fullName: 'org/prompts', name: 'agent-skills', description: 'Reusable coding skills', topics: [] })
    ),
    'ai_skill'
  );
  assert.equal(
    inferContentTypeFromGitHubRepo(
      makeLiveRepo({ fullName: 'org/studio', name: 'ai-dashboard', description: 'Interactive web app dashboard', topics: ['webapp'] })
    ),
    'web_app'
  );
});

test('buildDiscoveryScatterDataset enriches catalog entries from live repos without duplicating and respects scopes/filters', () => {
  const catalog = [
    makeProject({
      id: 'c1',
      slug: 'cline-coding-agent',
      name: 'Cline',
      githubRepo: 'cline/cline',
      githubStars: 0,
      contentType: 'ai_agent',
      provenanceSource: 'github_sync',
      verificationStatus: 'verified',
    }),
    makeProject({
      id: 'c2',
      slug: 'seoul-maker-app',
      name: 'Seoul Builder App',
      githubRepo: '',
      githubStars: 0,
      contentType: 'web_app',
      provenanceSource: 'maker_submitted',
      verificationStatus: 'verified',
      developmentPlatform: 'lovable',
    }),
  ];

  const live = [
    makeLiveRepo({
      id: 201,
      fullName: 'cline/cline',
      name: 'cline',
      stars: 42000,
      dailyStars: 110,
    }),
    makeLiveRepo({
      id: 202,
      fullName: 'modelcontextprotocol/servers',
      name: 'servers',
      description: 'Official MCP servers',
      topics: ['mcp'],
      stars: 28000,
      dailyStars: 95,
    }),
  ];

  const eco = buildDiscoveryScatterDataset({
    filteredProjects: catalog,
    liveTrendingRepos: live,
    scope: 'ecosystem',
    nowMs: NOW_MS,
  });

  // cline/cline is enriched rather than duplicated; servers is appended
  assert.equal(eco.length, 3);
  const clinePoint = eco.find((p) => p.slug === 'cline-coding-agent');
  assert.ok(clinePoint);
  assert.equal(clinePoint.githubStars, 42000);
  assert.equal(clinePoint.sourceKind, 'directory_enriched');

  // Claimed makers scope includes maker_submitted verified OR approved OwnershipClaimRecord
  const claims: OwnershipClaimRecord[] = [
    {
      id: 'claim-1',
      projectId: 'c1',
      projectSlug: 'cline-coding-agent',
      claimantUid: 'u1',
      verificationMethod: 'github_repo',
      proofNote: 'Maintainer',
      status: 'approved',
      createdAtIso: '2026-11-23T00:00:00.000Z',
    },
  ];
  const verifiedOnly = buildDiscoveryScatterDataset({
    filteredProjects: catalog,
    liveTrendingRepos: live,
    scope: 'verified_makers',
    claims,
    nowMs: NOW_MS,
  });
  assert.equal(verifiedOnly.length, 2);
  assert.ok(verifiedOnly.every((p) => p.isVerifiedMaker));

  // Directory-specific facet filter (e.g., platform: lovable) omits unrelated live GitHub extras
  const lovableFiltered = buildDiscoveryScatterDataset({
    filteredProjects: [catalog[1]!],
    liveTrendingRepos: live,
    filters: { platform: 'lovable' },
    scope: 'ecosystem',
    nowMs: NOW_MS,
  });
  assert.equal(lovableFiltered.length, 1);
  assert.equal(lovableFiltered[0]!.slug, 'seoul-maker-app');
});

test('buildDiscoveryScatterLayout computes separated symlog X positions, bounded Y positions, and quadrant counts', () => {
  const candidates = buildDiscoveryScatterDataset({
    filteredProjects: [
      makeProject({ id: 'p0', name: 'Indie 0', githubRepo: '', githubStars: 0, likesCount: 40, bookmarksCount: 80, updatedAtIso: '2026-11-23T00:00:00.000Z' }),
      makeProject({ id: 'p0b', name: 'Indie 0 Twin', githubRepo: '', githubStars: 0, likesCount: 40, bookmarksCount: 80, updatedAtIso: '2026-11-23T00:00:00.000Z' }),
      makeProject({ id: 'p1', name: 'Mid 2k', githubStars: 2000, likesCount: 5, bookmarksCount: 5, updatedAtIso: '2026-09-01T00:00:00.000Z' }),
      makeProject({ id: 'p2', name: 'Leader 80k', githubStars: 80000, githubForks: 4000, updatedAtIso: '2026-11-23T12:00:00.000Z' }),
    ],
    liveTrendingRepos: [
      makeLiveRepo({ id: 99, fullName: 'hot/repo', name: 'hot-repo', stars: 80000, dailyStars: 220 }),
    ],
    scope: 'ecosystem',
    nowMs: NOW_MS,
  });

  const layout = buildDiscoveryScatterLayout(candidates, { width: 640, height: 380 });
  assert.equal(layout.points.length, candidates.length);
  assert.ok(layout.xTicks.length >= 3);
  assert.equal(layout.yTicks.length, 5);

  const p0 = layout.points.find((p) => p.id === 'dir-p0')!;
  const p0b = layout.points.find((p) => p.id === 'dir-p0b')!;
  const hot = layout.points.find((p) => p.id === 'gh-99')!;

  // Twin indie points at exact same (0, Y) are nudged slightly apart so both are clickable
  assert.ok(Math.hypot(p0.x - p0b.x, p0.y - p0b.y) >= 4);
  assert.ok(hot.x > p0.x);
  assert.equal(hot.quadrant, 'ecosystem_leaders');

  // Ticks formatted compactly
  assert.equal(formatStarTickCompact(0), '0');
  assert.equal(formatStarTickCompact(1000), '1k');
  assert.equal(formatStarTickCompact(50000), '50k');

  assert.equal(classifyScatterQuadrant(15000, 75, 1000, 50), 'ecosystem_leaders');
  assert.equal(classifyScatterQuadrant(120, 75, 1000, 50), 'active_builders');
  assert.equal(classifyScatterQuadrant(15000, 20, 1000, 50), 'established_steady');
  assert.equal(classifyScatterQuadrant(120, 20, 1000, 50), 'emerging_niche');
});
