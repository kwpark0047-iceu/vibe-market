import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  CatalogProject,
  GitHubMilestonesPayload,
  ProjectMilestoneRecord,
} from '../types/vibeatlas';
import {
  buildTimelineEntries,
  cleanReleaseSummary,
  computeGapDaysBetweenEntries,
  computeTimelineCadence,
  filterTimelineEntries,
  summarizeTimelineCounts,
} from './projectTimeline';
import { validateMilestoneLogInput } from './validation';

const SAMPLE_PROJECT: Pick<
  CatalogProject,
  | 'id'
  | 'name'
  | 'slug'
  | 'makerName'
  | 'createdAtIso'
  | 'lastSyncedAt'
  | 'githubUrl'
  | 'websiteUrl'
  | 'liveDemoUrl'
  | 'githubStars'
> = {
  id: 'proj-alpha',
  name: 'Alpha Agent',
  slug: 'alpha-agent',
  makerName: 'Minjun Park',
  createdAtIso: '2026-10-01T08:00:00.000Z',
  lastSyncedAt: '2026-11-18T12:00:00.000Z',
  githubUrl: 'https://github.com/acme/alpha-agent',
  websiteUrl: 'https://alpha.example.com',
  liveDemoUrl: '',
  githubStars: 1240,
};

const SAMPLE_GH_MILESTONES: GitHubMilestonesPayload = {
  repo: 'acme/alpha-agent',
  fetchedAt: '2026-11-20T09:00:00.000Z',
  releases: [
    {
      id: '101',
      tagName: 'v1.2.0',
      name: 'v1.2.0 — Streaming MCP Bridge',
      bodySummary: '## Highlights\nAdded [streaming tools](https://example.com) and <b>faster</b> tool routing.',
      htmlUrl: 'https://github.com/acme/alpha-agent/releases/tag/v1.2.0',
      publishedAtIso: '2026-11-19T15:00:00.000Z',
      prerelease: false,
      authorLogin: 'minjun',
    },
  ],
  commits: [
    {
      sha: 'abcdef1234567890',
      shortSha: 'abcdef1',
      messageHeadline: 'feat: support incremental token counting',
      authorLogin: 'minjun',
      authorName: 'Minjun Park',
      htmlUrl: 'https://github.com/acme/alpha-agent/commit/abcdef1234567890',
      committedAtIso: '2026-11-20T08:00:00.000Z',
    },
    {
      sha: '9999991234567890',
      shortSha: '9999991',
      messageHeadline: 'fix: prevent unsafe redirect',
      authorLogin: '',
      authorName: 'Contributor',
      htmlUrl: 'javascript:alert(1)',
      committedAtIso: '2026-11-05T10:00:00.000Z',
    },
  ],
};

const SAMPLE_CREATOR_LOGS: ProjectMilestoneRecord[] = [
  {
    id: 'ms-1',
    projectId: 'proj-alpha',
    projectSlug: 'alpha-agent',
    authorUid: 'user-1',
    authorName: 'Minjun Park',
    authorHandle: '@minjun',
    kind: 'feature',
    versionTag: 'v1.1.0',
    title: 'Launched Korea-US multi-region worker routing',
    summary: 'Reduced cold-start latency across edge regions.',
    externalUrl: 'https://alpha.example.com/changelog/v1-1',
    occurredAtIso: '2026-10-25T00:00:00.000Z',
    createdAtIso: '2026-10-25T01:00:00.000Z',
    source: 'firestore',
  },
  {
    id: 'ms-other',
    projectId: 'proj-other',
    projectSlug: 'other',
    authorUid: 'user-2',
    authorName: 'Other',
    authorHandle: '',
    kind: 'release',
    versionTag: 'v9.0',
    title: 'Should not appear on proj-alpha',
    summary: '',
    externalUrl: '',
    occurredAtIso: '2026-11-10T00:00:00.000Z',
    createdAtIso: '2026-11-10T00:00:00.000Z',
    source: 'firestore',
  },
];

test('cleanReleaseSummary strips HTML/markdown noise and preserves readable text', () => {
  const cleaned = cleanReleaseSummary(SAMPLE_GH_MILESTONES.releases[0].bodySummary);
  assert.equal(cleaned.includes('<b>'), false);
  assert.match(cleaned, /Highlights/);
  assert.match(cleaned, /streaming tools/);
});

test('buildTimelineEntries merges sources, sanitizes unsafe URLs, and excludes foreign projects', () => {
  const entries = buildTimelineEntries({
    project: SAMPLE_PROJECT,
    makerVerification: {
      isClaimedByMaker: true,
      matchedClaim: {
        id: 'clm-1',
        projectId: 'proj-alpha',
        projectSlug: 'alpha-agent',
        claimantUid: 'user-1',
        verificationMethod: 'github_repo',
        proofNote: 'Verified owner',
        status: 'approved',
        createdAtIso: '2026-10-12T09:00:00.000Z',
      },
    },
    language: 'en',
    githubMilestones: SAMPLE_GH_MILESTONES,
    creatorMilestones: SAMPLE_CREATOR_LOGS,
    sortOrder: 'newest',
  });

  // Should contain 1 release + 2 commits + 1 matching creator log + 3 catalog events = 7
  assert.equal(entries.length, 7);
  assert.equal(entries[0].id, 'gh_cmt_abcdef1234567890');
  assert.equal(entries[entries.length - 1].id, 'cat_launch_proj-alpha');

  const unsafeCommit = entries.find((e) => e.id === 'gh_cmt_9999991234567890');
  assert.equal(unsafeCommit?.externalUrl, '');
  assert.equal(entries.some((e) => e.id === 'cr_ms-other'), false);
});

test('buildTimelineEntries supports oldest-first chronological ordering', () => {
  const entries = buildTimelineEntries({
    project: SAMPLE_PROJECT,
    makerVerification: { isClaimedByMaker: false, matchedClaim: null },
    language: 'ko',
    githubMilestones: SAMPLE_GH_MILESTONES,
    creatorMilestones: SAMPLE_CREATOR_LOGS,
    sortOrder: 'oldest',
  });

  assert.equal(entries[0].id, 'cat_launch_proj-alpha');
  assert.equal(entries[entries.length - 1].id, 'gh_cmt_abcdef1234567890');
});

test('filterTimelineEntries and summarizeTimelineCounts categorize milestones accurately', () => {
  const entries = buildTimelineEntries({
    project: SAMPLE_PROJECT,
    makerVerification: { isClaimedByMaker: false, matchedClaim: null },
    language: 'en',
    githubMilestones: SAMPLE_GH_MILESTONES,
    creatorMilestones: SAMPLE_CREATOR_LOGS,
  });

  const counts = summarizeTimelineCounts(entries);
  assert.deepEqual(counts, {
    all: 6,
    releases: 1,
    commits: 2,
    creatorLogs: 1,
  });

  assert.equal(filterTimelineEntries(entries, 'releases').length, 1);
  assert.equal(filterTimelineEntries(entries, 'commits').length, 2);
  assert.equal(filterTimelineEntries(entries, 'creator_logs').length, 1);
});

test('computeGapDaysBetweenEntries surfaces week+ intervals and hides minor daily steps', () => {
  const entries = buildTimelineEntries({
    project: SAMPLE_PROJECT,
    makerVerification: { isClaimedByMaker: false, matchedClaim: null },
    language: 'en',
    githubMilestones: SAMPLE_GH_MILESTONES,
    creatorMilestones: SAMPLE_CREATOR_LOGS,
    sortOrder: 'newest',
  });

  // Entry 0 (Nov 20 commit) vs Entry 1 (Nov 19 release) -> 1 day -> returns 0
  assert.equal(computeGapDaysBetweenEntries(entries[0], entries[1]), 0);
  // Entry 3 (Nov 05 commit) vs Entry 4 (Oct 25 creator log) -> 11 days -> returns 11
  assert.equal(computeGapDaysBetweenEntries(entries[3], entries[4]), 11);
});

test('computeTimelineCadence produces valid D3 time-scale coordinates within [4, 96]', () => {
  const entries = buildTimelineEntries({
    project: SAMPLE_PROJECT,
    makerVerification: { isClaimedByMaker: false, matchedClaim: null },
    language: 'en',
    githubMilestones: SAMPLE_GH_MILESTONES,
    creatorMilestones: SAMPLE_CREATOR_LOGS,
  });

  const cadence = computeTimelineCadence(entries);
  assert.ok(cadence);
  assert.equal(cadence.startDate, '2026-10-01');
  assert.equal(cadence.endDate, '2026-11-20');
  assert.equal(cadence.spanDays, 50);
  for (const m of cadence.markers) {
    assert.ok(m.xPercent >= 4 && m.xPercent <= 96);
  }
});

test('validateMilestoneLogInput enforces bounds and blocks javascript: URLs', () => {
  const badUrl = validateMilestoneLogInput(
    {
      kind: 'release',
      versionTag: 'v1.0.0',
      title: 'Initial release',
      summary: 'Shipped MVP',
      externalUrl: 'javascript:alert(1)',
      occurredDate: '2026-11-20',
    },
    'en'
  );
  assert.equal(badUrl.success, false);

  const ok = validateMilestoneLogInput(
    {
      kind: 'release',
      versionTag: 'v1.0.0',
      title: 'Initial release',
      summary: 'Shipped MVP',
      externalUrl: 'https://github.com/acme/alpha-agent/releases/tag/v1.0.0',
      occurredDate: '2026-11-20',
    },
    'en'
  );
  assert.equal(ok.success, true);
});
