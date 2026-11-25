import assert from 'node:assert/strict';
import test from 'node:test';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject } from '../types/vibeatlas';
import {
  buildActivityHeatmapMatrix,
  formatCompactHour,
  formatUtcHourWindow,
  toMondayFirstDayIndex,
} from './activityHeatmap';

function makeStubProject(
  id: string,
  name: string,
  createdAtIso: string,
  updatedAtIso: string
): CatalogProject {
  return {
    ...CURATED_SEED_PROJECTS[0],
    id,
    slug: id,
    name,
    createdAtIso,
    updatedAtIso,
  };
}

test('toMondayFirstDayIndex converts Sunday=0..Saturday=6 into Monday=0..Sunday=6', () => {
  assert.equal(toMondayFirstDayIndex(1), 0); // Monday
  assert.equal(toMondayFirstDayIndex(2), 1); // Tuesday
  assert.equal(toMondayFirstDayIndex(6), 5); // Saturday
  assert.equal(toMondayFirstDayIndex(0), 6); // Sunday
});

test('buildActivityHeatmapMatrix returns empty 7x24 matrix for empty input', () => {
  const matrix = buildActivityHeatmapMatrix([], 'submissions');
  assert.equal(matrix.cells.length, 168);
  assert.equal(matrix.totalProjectsAnalyzed, 0);
  assert.equal(matrix.totalEvents, 0);
  assert.equal(matrix.maxCount, 0);
  assert.equal(matrix.activeCellsCount, 0);
  assert.equal(matrix.peakSlot, null);
  assert.equal(matrix.busiestDayIndex, null);
});

test('buildActivityHeatmapMatrix buckets submissions vs updates accurately and ignores invalid timestamps', () => {
  // 2026-11-16 is a Monday (UTC), 2026-11-18 is a Wednesday (UTC), 2026-11-22 is a Sunday (UTC)
  const projects: CatalogProject[] = [
    makeStubProject('p1', 'Alpha', '2026-11-16T09:15:00.000Z', '2026-11-18T14:20:00.000Z'),
    makeStubProject('p2', 'Beta', '2026-11-16T09:45:00.000Z', '2026-11-18T14:55:00.000Z'),
    makeStubProject('p3', 'Gamma', '2026-11-22T23:10:00.000Z', '2026-11-19T02:05:00.000Z'),
    makeStubProject('p4', 'Invalid', 'not-a-date', ''),
  ];

  const submissions = buildActivityHeatmapMatrix(projects, 'submissions');
  assert.equal(submissions.totalProjectsAnalyzed, 4);
  assert.equal(submissions.totalEvents, 3);
  assert.equal(submissions.maxCount, 2);
  assert.equal(submissions.activeCellsCount, 2);
  assert.deepEqual(submissions.peakSlot, { dayIndex: 0, hour: 9, count: 2 });
  assert.equal(submissions.busiestDayIndex, 0);
  assert.deepEqual(submissions.cells[0 * 24 + 9].projectNames, ['Alpha', 'Beta']);
  assert.equal(submissions.cells[6 * 24 + 23].count, 1);

  const updates = buildActivityHeatmapMatrix(projects, 'updates');
  assert.equal(updates.totalEvents, 3);
  assert.equal(updates.maxCount, 2);
  assert.deepEqual(updates.peakSlot, { dayIndex: 2, hour: 14, count: 2 }); // Wed 14:00 UTC
  assert.equal(updates.busiestDayIndex, 2);
});

test('hour formatting helpers pad single digits consistently', () => {
  assert.equal(formatCompactHour(0), '00:00');
  assert.equal(formatCompactHour(9), '09:00');
  assert.equal(formatUtcHourWindow(3), '03:00–03:59 UTC');
  assert.equal(formatUtcHourWindow(21), '21:00–21:59 UTC');
});
