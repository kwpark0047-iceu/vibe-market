import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, GitHubAiTrendingRepo } from '../types/vibeatlas';
import {
  computeCatalog24hStarGain,
  computeGrowthPct24h,
  selectTrending24hProjects,
} from './trending24h';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: overrides.id ?? 'proj-1',
    slug: overrides.slug ?? 'proj-1',
    name: overrides.name ?? 'Sample Project',
    tagline: overrides.tagline ?? 'English tagline',
    taglineKo: overrides.taglineKo ?? '한국어 한 줄 소개',
    description: overrides.description ?? 'Long description',
    descriptionKo: overrides.descriptionKo ?? '상세 설명',
    contentType: overrides.contentType ?? 'ai_agent',
    categories: overrides.categories ?? ['AI Agent'],
    techStack: overrides.techStack ?? ['TypeScript'],
    developmentPlatform: overrides.developmentPlatform ?? 'cursor',
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
    githubRepo: overrides.githubRepo ?? 'owner/sample-repo',
    githubUrl: overrides.githubUrl ?? 'https://github.com/owner/sample-repo',
    thumbnailUrl: overrides.thumbnailUrl ?? '',
    makerName: overrides.makerName ?? 'Builder',
    makerHandle: overrides.makerHandle ?? '@builder',
    ownerUid: overrides.ownerUid ?? 'owner-1',
    githubStars: overrides.githubStars ?? 0,
    githubForks: overrides.githubForks ?? 0,
    likesCount: overrides.likesCount ?? 10,
    bookmarksCount: overrides.bookmarksCount ?? 5,
    lastSyncedAt: overrides.lastSyncedAt ?? '',
    createdAtIso: overrides.createdAtIso ?? '2026-11-01T00:00:00.000Z',
    updatedAtIso: overrides.updatedAtIso ?? '2026-11-23T00:00:00.000Z',
    ...overrides,
  };
}

function makeLiveRepo(overrides: Partial<GitHubAiTrendingRepo> = {}): GitHubAiTrendingRepo {
  return {
    rank: overrides.rank ?? 1,
    id: overrides.id ?? 101,
    fullName: overrides.fullName ?? 'acme/fast-agent',
    name: overrides.name ?? 'fast-agent',
    ownerLogin: overrides.ownerLogin ?? 'acme',
    ownerAvatarUrl: overrides.ownerAvatarUrl ?? '',
    description: overrides.description ?? 'Fast autonomous coding agent',
    htmlUrl: overrides.htmlUrl ?? 'https://github.com/acme/fast-agent',
    homepage: overrides.homepage ?? '',
    stars: overrides.stars ?? 4200,
    forks: overrides.forks ?? 300,
    openIssues: overrides.openIssues ?? 12,
    language: overrides.language ?? 'TypeScript',
    license: overrides.license ?? 'MIT',
    topics: overrides.topics ?? ['ai', 'agent'],
    createdAt: overrides.createdAt ?? '2026-11-01T00:00:00.000Z',
    pushedAt: overrides.pushedAt ?? '2026-11-24T00:00:00.000Z',
    dailyStars: overrides.dailyStars ?? 180,
    dailyRateSource: overrides.dailyRateSource ?? 'snapshot_24h',
    ...overrides,
  };
}

test('computeGrowthPct24h calculates realistic percentage surge from prior star baseline', () => {
  assert.equal(computeGrowthPct24h(200, 1200), 20);
  assert.equal(computeGrowthPct24h(25, 1025), 2.5);
  assert.equal(computeGrowthPct24h(0, 500), null);
  assert.equal(computeGrowthPct24h(500, 500), null);
});

test('computeCatalog24hStarGain extracts recent 24h delta from multi-day snapshots or historicalSignals', () => {
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0);
  const project = makeProject({
    githubRepo: 'modelcontextprotocol/servers',
    githubStars: 15420,
    historicalSignals: [
      { date: '2026-11-23', githubStarsDelta: 120, internalLikes: 10, internalBookmarks: 5 },
      { date: '2026-11-24', githubStarsDelta: 340, internalLikes: 12, internalBookmarks: 7 },
    ],
  });

  const fromSignals = computeCatalog24hStarGain(project, {}, nowMs);
  assert.equal(fromSignals.gain24h, 340);
  assert.equal(fromSignals.totalStars, 15420);
  assert.equal(fromSignals.isExact24hSnapshot, true);

  const fromSnaps = computeCatalog24hStarGain(
    makeProject({ githubRepo: 'cline/cline', githubStars: 20500 }),
    { '2026-11-23': 20050, '2026-11-24': 20500 },
    nowMs
  );
  assert.equal(fromSnaps.gain24h, 450);
  assert.equal(fromSnaps.totalStars, 20500);
});

test('selectTrending24hProjects merges catalog 24h snapshots and live trending repos ranked by 24h growth', () => {
  const nowMs = Date.UTC(2026, 10, 24, 10, 0, 0);
  const catalog = [
    makeProject({
      id: 'cline',
      slug: 'cline-coding-agent',
      name: 'Cline Autonomous Coding Agent',
      githubRepo: 'cline/cline',
      githubStars: 24000,
    }),
    makeProject({
      id: 'mcp',
      slug: 'mcp-reference-servers',
      name: 'Model Context Protocol Servers',
      githubRepo: 'modelcontextprotocol/servers',
      githubStars: 18000,
    }),
  ];

  const liveRepos = [
    makeLiveRepo({
      id: 1,
      fullName: 'cline/cline',
      name: 'cline',
      stars: 24000,
      dailyStars: 220,
      language: 'TypeScript',
      dailyRateSource: 'daily_velocity_rate',
    }),
    makeLiveRepo({
      id: 2,
      fullName: 'browser-use/browser-use',
      name: 'browser-use',
      stars: 31200,
      dailyStars: 640,
      language: 'Python',
      dailyRateSource: 'snapshot_24h',
    }),
    makeLiveRepo({
      id: 3,
      fullName: 'astral-sh/uv',
      name: 'uv',
      stars: 45000,
      dailyStars: 310,
      language: 'Rust',
      dailyRateSource: 'github_daily_velocity' as never,
    }),
  ];

  const summary = selectTrending24hProjects({
    catalogProjects: catalog,
    liveTrendingRepos: liveRepos,
    snapshotsByRepo: {
      'cline/cline': { '2026-11-23': 23500, '2026-11-24': 24000 }, // +500 exact 24h snapshot
    },
    nowMs,
    limit: 6,
  });

  // Deduplication: cline/cline appears once with catalog 24h snapshot +500
  assert.equal(summary.totalCandidates, 3);
  assert.equal(summary.entries[0]!.fullName, 'browser-use/browser-use');
  assert.equal(summary.entries[0]!.starsGained24h, 640);
  assert.equal(summary.entries[0]!.rank, 1);

  assert.equal(summary.entries[1]!.fullName, 'cline/cline');
  assert.equal(summary.entries[1]!.starsGained24h, 500);
  assert.equal(summary.entries[1]!.matchedCatalogProject?.slug, 'cline-coding-agent');
  assert.equal(summary.entries[1]!.language, 'TypeScript');

  assert.equal(summary.entries[2]!.fullName, 'astral-sh/uv');
  assert.equal(summary.maxGain24h, 640);
  assert.equal(summary.hasExact24hSnapshots, true);
  assert.deepEqual(summary.availableLanguages, ['Python', 'Rust', 'TypeScript']);
});

test('selectTrending24hProjects filters by language and handles empty inputs cleanly', () => {
  const liveRepos = [
    makeLiveRepo({ id: 1, fullName: 'a/py-one', language: 'Python', dailyStars: 300 }),
    makeLiveRepo({ id: 2, fullName: 'b/ts-one', language: 'TypeScript', dailyStars: 500 }),
  ];

  const pyOnly = selectTrending24hProjects({
    catalogProjects: [],
    liveTrendingRepos: liveRepos,
    languageFilter: 'Python',
    snapshotsByRepo: {},
  });

  assert.equal(pyOnly.entries.length, 1);
  assert.equal(pyOnly.entries[0]!.fullName, 'a/py-one');
  assert.equal(pyOnly.entries[0]!.rank, 1);
  assert.deepEqual(pyOnly.availableLanguages, ['Python', 'TypeScript']);

  const empty = selectTrending24hProjects({
    catalogProjects: [],
    liveTrendingRepos: [],
    snapshotsByRepo: {},
  });
  assert.equal(empty.entries.length, 0);
  assert.equal(empty.maxGain24h, 0);
});
