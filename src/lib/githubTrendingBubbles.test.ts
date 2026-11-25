import assert from 'node:assert/strict';
import test from 'node:test';
import type { GitHubAiTrendingRepo } from '../types/vibeatlas';
import {
  buildTrendingBubblePack,
  computeDailyStarMetric,
  extractTrendingLanguages,
  filterAndRankTrendingRepos,
  formatDailyRateCompact,
  getBubbleLabelLayout,
} from './githubTrendingBubbles';

function makeRepo(overrides: Partial<GitHubAiTrendingRepo> = {}): GitHubAiTrendingRepo {
  return {
    rank: 1,
    id: 1,
    fullName: 'acme/ai-agent',
    name: 'ai-agent',
    ownerLogin: 'acme',
    ownerAvatarUrl: '',
    description: 'Autonomous coding agent framework',
    htmlUrl: 'https://github.com/acme/ai-agent',
    homepage: '',
    stars: 30000,
    forks: 2400,
    openIssues: 42,
    language: 'Python',
    license: 'MIT',
    topics: ['ai', 'ai-agents'],
    createdAt: '2026-10-24T00:00:00.000Z',
    pushedAt: '2026-11-23T00:00:00.000Z',
    dailyStars: 1000,
    dailyRateSource: 'daily_velocity_rate',
    ...overrides,
  };
}

test('computeDailyStarMetric prefers multi-day positive snapshot delta over lifetime average', () => {
  const nowMs = Date.parse('2026-11-23T12:00:00.000Z');
  const res = computeDailyStarMetric({
    stars: 12000,
    createdAt: '2025-11-23T00:00:00.000Z',
    snapshots: {
      '2026-11-21': 10200,
      '2026-11-23': 12000,
    },
    nowMs,
  });

  assert.equal(res.dailyRateSource, 'snapshot_24h');
  assert.equal(res.dailyStars, 900);
});

test('computeDailyStarMetric falls back to verifiable daily velocity rate from createdAt', () => {
  const nowMs = Date.parse('2026-11-23T00:00:00.000Z');
  const res = computeDailyStarMetric({
    stars: 30000,
    createdAt: '2026-10-24T00:00:00.000Z',
    snapshots: {
      '2026-11-23': 30000,
    },
    nowMs,
  });

  assert.equal(res.dailyRateSource, 'daily_velocity_rate');
  assert.equal(res.ageDays, 30);
  assert.equal(res.dailyStars, 1000);
});

test('filterAndRankTrendingRepos filters by language, sorts by dailyStars desc, and reassigns rank', () => {
  const items = [
    makeRepo({ id: 1, fullName: 'a/py-low', name: 'py-low', language: 'Python', dailyStars: 200 }),
    makeRepo({ id: 2, fullName: 'b/ts-top', name: 'ts-top', language: 'TypeScript', dailyStars: 2400 }),
    makeRepo({ id: 3, fullName: 'c/py-high', name: 'py-high', language: 'Python', dailyStars: 1600 }),
  ];

  const allRanked = filterAndRankTrendingRepos(items);
  assert.deepEqual(
    allRanked.map((r) => [r.rank, r.fullName]),
    [
      [1, 'b/ts-top'],
      [2, 'c/py-high'],
      [3, 'a/py-low'],
    ]
  );

  const pythonOnly = filterAndRankTrendingRepos(items, { language: 'Python' });
  assert.deepEqual(
    pythonOnly.map((r) => [r.rank, r.fullName]),
    [
      [1, 'c/py-high'],
      [2, 'a/py-low'],
    ]
  );
});

test('extractTrendingLanguages orders languages by frequency', () => {
  const langs = extractTrendingLanguages([
    makeRepo({ id: 1, language: 'Rust' }),
    makeRepo({ id: 2, language: 'Python' }),
    makeRepo({ id: 3, language: 'Python' }),
    makeRepo({ id: 4, language: 'TypeScript' }),
    makeRepo({ id: 5, language: '' }),
  ]);

  assert.deepEqual(langs, ['Python', 'Rust', 'TypeScript']);
});

test('buildTrendingBubblePack produces non-overlapping D3 packed circles inside viewport bounds', () => {
  const repos = [
    makeRepo({ id: 1, fullName: 'org/alpha', name: 'alpha', dailyStars: 2400, language: 'Python' }),
    makeRepo({ id: 2, fullName: 'org/beta', name: 'beta', dailyStars: 1200, language: 'TypeScript' }),
    makeRepo({ id: 3, fullName: 'org/gamma', name: 'gamma', dailyStars: 600, language: 'Rust' }),
    makeRepo({ id: 4, fullName: 'org/delta', name: 'delta', dailyStars: 300, language: 'Go' }),
  ];

  const width = 640;
  const height = 440;
  const nodes = buildTrendingBubblePack(repos, { width, height, padding: 6, isDark: false });

  assert.equal(nodes.length, 4);

  for (const node of nodes) {
    assert.ok(node.r > 0);
    assert.ok(node.x - node.r >= -0.01);
    assert.ok(node.x + node.r <= width + 0.01);
    assert.ok(node.y - node.r >= -0.01);
    assert.ok(node.y + node.r <= height + 0.01);
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      assert.ok(dist >= a.r + b.r - 0.1, `Circles ${a.repo.name} and ${b.repo.name} overlap`);
    }
  }

  assert.ok(nodes[0]!.r > nodes[nodes.length - 1]!.r);
});

test('getBubbleLabelLayout hides overcrowded labels on small circles and formats cleanly', () => {
  const small = getBubbleLabelLayout(18, 'very-long-repository-name');
  assert.equal(small.showName, false);
  assert.equal(small.showMetric, false);

  const medium = getBubbleLabelLayout(28, 'very-long-repository-name');
  assert.equal(medium.showName, true);
  assert.equal(medium.showMetric, false);
  assert.ok(medium.displayName.endsWith('…'));

  const large = getBubbleLabelLayout(56, 'openclaw');
  assert.equal(large.showName, true);
  assert.equal(large.showMetric, true);
  assert.equal(large.displayName, 'openclaw');
  assert.equal(formatDailyRateCompact(1460), '1.5k');
  assert.equal(formatDailyRateCompact(1420), '1.4k');
});
