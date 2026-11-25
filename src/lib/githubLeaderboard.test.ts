import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, GitHubRankedRepo } from '../types/vibeatlas.ts';
import {
  computeLeaderboardSummary,
  extractLeaderboardLanguages,
  filterGitHubRankedRepos,
  findCatalogProjectByRepo,
} from './githubLeaderboard.ts';

function makeRankedRepo(overrides: Partial<GitHubRankedRepo> = {}): GitHubRankedRepo {
  return {
    rank: 1,
    id: 1,
    fullName: 'example/repo-one',
    name: 'repo-one',
    ownerLogin: 'example',
    ownerAvatarUrl: '',
    description: 'Open source developer toolkit',
    htmlUrl: 'https://github.com/example/repo-one',
    homepage: '',
    stars: 100000,
    forks: 12000,
    openIssues: 120,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['typescript', 'ai'],
    pushedAt: '2026-11-20T00:00:00Z',
    ...overrides,
  };
}

test('computeLeaderboardSummary computes top, median, and combined stars accurately', () => {
  assert.deepEqual(computeLeaderboardSummary([]), {
    totalRepos: 0,
    topStars: 0,
    topRepoName: '',
    medianStars: 0,
    totalCombinedStars: 0,
  });

  const sample = [
    makeRankedRepo({ rank: 1, fullName: 'a/top', stars: 500000 }),
    makeRankedRepo({ rank: 2, fullName: 'b/mid1', stars: 200000 }),
    makeRankedRepo({ rank: 3, fullName: 'c/mid2', stars: 100000 }),
    makeRankedRepo({ rank: 4, fullName: 'd/low', stars: 60000 }),
  ];

  const summary = computeLeaderboardSummary(sample);
  assert.equal(summary.totalRepos, 4);
  assert.equal(summary.topStars, 500000);
  assert.equal(summary.topRepoName, 'a/top');
  assert.equal(summary.medianStars, 150000);
  assert.equal(summary.totalCombinedStars, 860000);
});

test('filterGitHubRankedRepos preserves true rank and filters by language and query', () => {
  const sample = [
    makeRankedRepo({ id: 1, rank: 1, fullName: 'freeCodeCamp/freeCodeCamp', language: 'TypeScript', topics: ['education'] }),
    makeRankedRepo({ id: 2, rank: 2, fullName: 'public-apis/public-apis', language: 'Python', topics: ['api'] }),
    makeRankedRepo({ id: 3, rank: 3, fullName: 'modelcontextprotocol/servers', language: 'TypeScript', topics: ['mcp'] }),
  ];

  const tsOnly = filterGitHubRankedRepos(sample, '', 'TypeScript');
  assert.deepEqual(tsOnly.map((r) => r.rank), [1, 3]);

  const mcpSearch = filterGitHubRankedRepos(sample, 'mcp', 'all');
  assert.deepEqual(mcpSearch.map((r) => r.fullName), ['modelcontextprotocol/servers']);

  const translatedSearch = filterGitHubRankedRepos(sample, 'ツールキット', 'all', {
    1: 'オープンソース開発者ツールキット',
  });
  assert.deepEqual(translatedSearch.map((r) => r.fullName), ['freeCodeCamp/freeCodeCamp']);
});

test('extractLeaderboardLanguages sorts distinct languages by frequency', () => {
  const sample = [
    makeRankedRepo({ language: 'Python' }),
    makeRankedRepo({ language: 'TypeScript' }),
    makeRankedRepo({ language: 'Python' }),
    makeRankedRepo({ language: 'Go' }),
    makeRankedRepo({ language: '' }),
  ];
  assert.deepEqual(extractLeaderboardLanguages(sample), ['Python', 'Go', 'TypeScript']);
});

test('findCatalogProjectByRepo matches VibeAtlas listings case-insensitively', () => {
  const projects = [
    { id: '1', slug: 'mcp', githubRepo: 'modelcontextprotocol/servers' } as CatalogProject,
  ];
  assert.equal(findCatalogProjectByRepo(projects, 'ModelContextProtocol/Servers')?.slug, 'mcp');
  assert.equal(findCatalogProjectByRepo(projects, 'other/repo'), null);
});
