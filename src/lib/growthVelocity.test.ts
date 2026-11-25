import assert from 'node:assert/strict';
import test from 'node:test';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject } from '../types/vibeatlas';
import { computeProjectGrowthVelocities } from './growthVelocity';

function makeStubProject(
  id: string,
  overrides: Partial<CatalogProject> = {}
): CatalogProject {
  return {
    ...CURATED_SEED_PROJECTS[0],
    id,
    slug: id,
    name: `Repo ${id}`,
    githubRepo: `org/${id}`,
    historicalSignals: undefined,
    ...overrides,
  };
}

test('computeProjectGrowthVelocities ranks 30d GitHub star growth velocity accurately from historicalSignals and snapshots', () => {
  const nowMs = Date.parse('2026-11-23T12:00:00.000Z');
  const p1 = makeStubProject('fast-star', {
    githubStars: 5000,
    historicalSignals: [
      { date: '2026-10-28', githubStarsDelta: 120, internalLikes: 10, internalBookmarks: 20 },
      { date: '2026-11-10', githubStarsDelta: 180, internalLikes: 12, internalBookmarks: 25 },
      { date: '2026-11-22', githubStarsDelta: 300, internalLikes: 15, internalBookmarks: 30 },
    ],
  });
  const p2 = makeStubProject('snapshot-star', {
    githubStars: 2400,
  });
  const p3 = makeStubProject('flat-star', {
    githubStars: 9000,
  });

  const snapshotsByRepo: Record<string, Record<string, number>> = {
    'org/snapshot-star': {
      '2026-11-01': 1950,
      '2026-11-12': 2100,
      '2026-11-22': 2400, // +450 stars over 30d window
    },
  };

  const summary = computeProjectGrowthVelocities([p3, p2, p1], {
    metric: 'star_growth_30d',
    nowMs,
    snapshotsByRepo,
  });

  assert.equal(summary.hasStarGrowth30d, true);
  assert.equal(summary.recommendedMetric, 'star_growth_30d');
  assert.equal(summary.entries.length, 2);
  assert.equal(summary.entries[0].project.id, 'fast-star');
  assert.equal(summary.entries[0].rank, 1);
  assert.equal(summary.entries[0].totalDelta, 600);
  assert.equal(summary.entries[0].dailyVelocity, 20);
  assert.equal(summary.entries[1].project.id, 'snapshot-star');
  assert.equal(summary.entries[1].totalDelta, 450);
  assert.equal(summary.entries[1].dailyVelocity, 15);
  assert.equal(summary.entries[1].series.length, 3);
  assert.equal(summary.entries[1].series[2].cumulativeValue, 450);
});

test('computeProjectGrowthVelocities recommends signal_velocity when no multi-day star deltas exist yet', () => {
  const nowMs = Date.parse('2026-11-23T12:00:00.000Z');
  const summary = computeProjectGrowthVelocities(CURATED_SEED_PROJECTS, {
    nowMs,
    snapshotsByRepo: {},
    storage: null,
  });

  assert.equal(summary.hasStarGrowth30d, false);
  assert.equal(summary.hasStarGrowth7d, false);
  assert.equal(summary.recommendedMetric, 'signal_velocity');
  assert.equal(summary.metric, 'signal_velocity');
  assert.equal(summary.entries.length, 6);
  // Seed catalog's top bookmark+like item is anthropic-agent-skills (54 + 129 = 183 total)
  assert.equal(summary.entries[0].project.id, 'anthropic-agent-skills');
  assert.ok(summary.entries[0].totalDelta > 0);
  assert.ok(summary.entries[0].dailyVelocity > 0);
  assert.equal(summary.entries[0].series.length, 14);
});

test('computeProjectGrowthVelocities filters strictly by 7-day window in star_growth_7d mode', () => {
  const nowMs = Date.parse('2026-11-23T12:00:00.000Z');
  const pOldOnly = makeStubProject('old-spike', {
    historicalSignals: [
      { date: '2026-11-01', githubStarsDelta: 500, internalLikes: 5, internalBookmarks: 5 },
    ],
  });
  const pRecent = makeStubProject('recent-spike', {
    historicalSignals: [
      { date: '2026-11-20', githubStarsDelta: 140, internalLikes: 8, internalBookmarks: 12 },
    ],
  });

  const summary = computeProjectGrowthVelocities([pOldOnly, pRecent], {
    metric: 'star_growth_7d',
    nowMs,
    snapshotsByRepo: {},
  });

  assert.equal(summary.hasStarGrowth7d, true);
  assert.equal(summary.entries.length, 1);
  assert.equal(summary.entries[0].project.id, 'recent-spike');
  assert.equal(summary.entries[0].totalDelta, 140);
  assert.equal(summary.entries[0].dailyVelocity, 20);
});
