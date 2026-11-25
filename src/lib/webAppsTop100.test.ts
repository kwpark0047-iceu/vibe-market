import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, GitHubRankedRepo } from '../types/vibeatlas';
import {
  mapWebAppReposToCatalogProjects,
  mergeWebAppTop100WithCatalog,
} from './webAppsTop100';
import { sortProjects } from './catalogEngine';

function makeRankedRepo(rank: number, overrides: Partial<GitHubRankedRepo> = {}): GitHubRankedRepo {
  return {
    rank,
    id: 1000 + rank,
    fullName: `org/webapp-${rank}`,
    name: `webapp-${rank}`,
    ownerLogin: `org${rank}`,
    ownerAvatarUrl: '',
    description: `Web application #${rank} built for production teams.`,
    htmlUrl: `https://github.com/org/webapp-${rank}`,
    homepage: `https://webapp-${rank}.example.com`,
    stars: 100000 - rank * 500,
    forks: 5000 - rank * 20,
    openIssues: 12,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['webapp', 'nextjs'],
    pushedAt: '2026-11-20T00:00:00.000Z',
    ...overrides,
  };
}

function makeCuratedProject(id: string, overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id,
    slug: id,
    name: `Curated ${id}`,
    tagline: 'Curated web app',
    taglineKo: '큐레이션 웹 앱',
    description: 'Curated description for testing',
    descriptionKo: '테스트용 큐레이션 설명',
    contentType: 'web_app',
    categories: ['Web Tool'],
    techStack: ['React'],
    developmentPlatform: 'lovable',
    hostingProvider: 'vercel',
    backendTech: 'supabase',
    country: 'KR',
    language: 'ko',
    license: 'MIT',
    pricingModel: 'freemium',
    verificationStatus: 'verified',
    provenanceSource: 'maker_submitted',
    liveDemoUrl: 'https://curated.example.com',
    websiteUrl: 'https://curated.example.com',
    githubRepo: '',
    githubUrl: '',
    thumbnailUrl: '',
    makerName: 'Maker',
    makerHandle: '@maker',
    ownerUid: 'seed-kr-1',
    githubStars: 0,
    githubForks: 0,
    likesCount: 41,
    bookmarksCount: 68,
    lastSyncedAt: '2026-11-18T00:00:00.000Z',
    createdAtIso: '2026-11-14T00:00:00.000Z',
    updatedAtIso: '2026-11-18T00:00:00.000Z',
    ...overrides,
  };
}

test('mapWebAppReposToCatalogProjects maps all 100 repos preserving #1 through #100 ranks', () => {
  const repos = Array.from({ length: 100 }, (_, i) => makeRankedRepo(i + 1));
  const mapped = mapWebAppReposToCatalogProjects(repos, '2026-11-22T10:00:00.000Z', {
    1001: '프로덕션 팀을 위한 1위 웹 애플리케이션',
  });

  assert.equal(mapped.length, 100);
  assert.equal(mapped[0]?.leaderboardRank, 1);
  assert.equal(mapped[0]?.contentType, 'web_app');
  assert.equal(mapped[0]?.taglineKo, '프로덕션 팀을 위한 1위 웹 애플리케이션');
  assert.equal(mapped[99]?.leaderboardRank, 100);
  assert.equal(mapped[99]?.githubStars, 50000);
});

test('mergeWebAppTop100WithCatalog deduplicates matching githubRepo and keeps curated non-ranked items', () => {
  const repos = [makeRankedRepo(1), makeRankedRepo(2)];
  const top100 = mapWebAppReposToCatalogProjects(repos, '2026-11-22T10:00:00.000Z');
  const curatedLocal = makeCuratedProject('local-kr-1');
  const curatedOverlap = makeCuratedProject('overlap-1', {
    githubRepo: 'org/webapp-2',
    likesCount: 25,
    bookmarksCount: 60,
  });

  const merged = mergeWebAppTop100WithCatalog([curatedLocal, curatedOverlap], top100);
  assert.equal(merged.length, 3);
  assert.equal(merged[0]?.leaderboardRank, 1);
  assert.equal(merged[1]?.leaderboardRank, 2);
  assert.equal(merged[1]?.id, 'overlap-1');
  assert.equal(merged[2]?.id, 'local-kr-1');
  assert.equal(merged[2]?.leaderboardRank, undefined);
});

test('sortProjects preserves #1 to #100 rank order under default relevance sort without query', () => {
  const repos = Array.from({ length: 100 }, (_, i) => makeRankedRepo(i + 1));
  const top100 = mapWebAppReposToCatalogProjects(repos, '2026-11-22T10:00:00.000Z');
  const curated = makeCuratedProject('local-kr-1', { bookmarksCount: 999, likesCount: 999 });

  const sorted = sortProjects([curated, ...top100.slice().reverse()], 'relevance', '');
  assert.equal(sorted[0]?.leaderboardRank, 1);
  assert.equal(sorted[99]?.leaderboardRank, 100);
  assert.equal(sorted[100]?.id, 'local-kr-1');
});
