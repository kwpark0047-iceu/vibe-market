import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject, OwnershipClaimRecord } from '../types/vibeatlas';
import { countMakerVerifiedProjects, resolveMakerVerification } from './makerVerification';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'proj-1',
    slug: 'sample-project',
    name: 'Sample Project',
    tagline: 'Sample project tagline',
    taglineKo: '샘플 프로젝트',
    description: 'Detailed sample project description.',
    descriptionKo: '샘플 프로젝트 상세 설명입니다.',
    contentType: 'web_app',
    categories: ['AI Tools'],
    techStack: ['React', 'TypeScript'],
    developmentPlatform: 'cursor',
    hostingProvider: 'vercel',
    backendTech: 'supabase',
    country: 'KR',
    language: 'ko',
    license: 'MIT',
    pricingModel: 'free',
    verificationStatus: 'verified',
    provenanceSource: 'github_sync',
    liveDemoUrl: '',
    websiteUrl: '',
    githubRepo: 'owner/sample',
    githubUrl: 'https://github.com/owner/sample',
    thumbnailUrl: '',
    makerName: 'Sample Maker',
    makerHandle: '@sample',
    ownerUid: 'seed-curator',
    githubStars: 120,
    githubForks: 15,
    likesCount: 10,
    bookmarksCount: 20,
    lastSyncedAt: '2026-11-20T00:00:00.000Z',
    createdAtIso: '2026-11-01T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
    isCuratedSeed: true,
    ...overrides,
  };
}

function makeClaim(overrides: Partial<OwnershipClaimRecord> = {}): OwnershipClaimRecord {
  return {
    id: 'claim-1',
    projectId: 'proj-1',
    projectSlug: 'sample-project',
    claimantUid: 'user-123',
    verificationMethod: 'github_repo',
    proofNote: 'Maintainer on GitHub @sample',
    status: 'pending',
    createdAtIso: '2026-11-21T10:00:00.000Z',
    ...overrides,
  };
}

test('github_sync verified repo without an approved claim resolves as unclaimed', () => {
  const proj = makeProject({
    provenanceSource: 'github_sync',
    verificationStatus: 'verified',
  });
  const res = resolveMakerVerification(proj);
  assert.equal(res.status, 'unclaimed');
  assert.equal(res.isClaimedByMaker, false);
  assert.equal(res.method, null);
});

test('maker_submitted verified listing resolves as claimed_verified with direct_submission method', () => {
  const proj = makeProject({
    id: 'seoul-vibe-ops-lovable',
    slug: 'seoul-vibe-ops-lovable',
    provenanceSource: 'maker_submitted',
    verificationStatus: 'verified',
    ownerUid: 'seed-kr-1',
    makerName: 'Jisoo Han',
    makerHandle: '@jisoohan_kr',
  });
  const res = resolveMakerVerification(proj, [], 'seed-kr-1');
  assert.equal(res.status, 'claimed_verified');
  assert.equal(res.isClaimedByMaker, true);
  assert.equal(res.method, 'direct_submission');
  assert.equal(res.isCurrentUserOwner, true);
  assert.equal(res.makerDisplayName, 'Jisoo Han');
  assert.equal(res.makerHandle, '@jisoohan_kr');
});

test('approved claim upgrades a github_sync listing to claimed_verified using claim method', () => {
  const proj = makeProject({
    id: 'vercel-ai-sdk',
    slug: 'vercel-ai-sdk',
    provenanceSource: 'github_sync',
    verificationStatus: 'verified',
  });
  const claim = makeClaim({
    projectId: 'other-id',
    projectSlug: 'vercel-ai-sdk',
    verificationMethod: 'domain_dns',
    status: 'approved',
  });
  const res = resolveMakerVerification(proj, [claim]);
  assert.equal(res.status, 'claimed_verified');
  assert.equal(res.isClaimedByMaker, true);
  assert.equal(res.method, 'domain_dns');
  assert.equal(res.matchedClaim?.id, 'claim-1');
});

test('pending user claim transitions project to claim_pending', () => {
  const proj = makeProject({
    id: 'cline-coding-agent',
    slug: 'cline-coding-agent',
    provenanceSource: 'github_sync',
    verificationStatus: 'verified',
  });
  const claim = makeClaim({
    projectId: 'cline-coding-agent',
    projectSlug: 'cline-coding-agent',
    verificationMethod: 'demo_meta',
    status: 'pending',
  });
  const res = resolveMakerVerification(proj, [claim]);
  assert.equal(res.status, 'claim_pending');
  assert.equal(res.isClaimedByMaker, false);
  assert.equal(res.method, 'demo_meta');
  assert.equal(res.matchedClaim?.id, 'claim-1');
});

test('maker_submitted pending listing resolves to claim_pending even without separate claim doc', () => {
  const proj = makeProject({
    id: 'seoul-mcp-receipt-scanner',
    slug: 'seoul-mcp-receipt-scanner',
    provenanceSource: 'maker_submitted',
    verificationStatus: 'pending',
  });
  const res = resolveMakerVerification(proj);
  assert.equal(res.status, 'claim_pending');
  assert.equal(res.isClaimedByMaker, false);
  assert.equal(res.method, 'direct_submission');
});

test('approved claim takes precedence over older pending or rejected claims', () => {
  const proj = makeProject();
  const rejected = makeClaim({
    id: 'c-rej',
    status: 'rejected',
    createdAtIso: '2026-11-18T00:00:00.000Z',
  });
  const pending = makeClaim({
    id: 'c-pend',
    status: 'pending',
    createdAtIso: '2026-11-19T00:00:00.000Z',
  });
  const approved = makeClaim({
    id: 'c-app',
    status: 'approved',
    verificationMethod: 'domain_dns',
    createdAtIso: '2026-11-20T00:00:00.000Z',
  });
  const res = resolveMakerVerification(proj, [rejected, pending, approved]);
  assert.equal(res.status, 'claimed_verified');
  assert.equal(res.matchedClaim?.id, 'c-app');
  assert.equal(res.method, 'domain_dns');
  assert.equal(res.lastRejectedClaim?.id, 'c-rej');
});

test('rejected claim alone keeps project unclaimed and exposes lastRejectedClaim', () => {
  const proj = makeProject({
    provenanceSource: 'maker_submitted',
    verificationStatus: 'unverified',
  });
  const rejected = makeClaim({
    id: 'c-rej',
    status: 'rejected',
  });
  const res = resolveMakerVerification(proj, [rejected]);
  assert.equal(res.status, 'unclaimed');
  assert.equal(res.isClaimedByMaker, false);
  assert.equal(res.lastRejectedClaim?.id, 'c-rej');
});

test('countMakerVerifiedProjects counts only maker-claimed verified projects', () => {
  const projects = [
    makeProject({ id: 'p1', slug: 'p1', provenanceSource: 'github_sync', verificationStatus: 'verified' }),
    makeProject({ id: 'p2', slug: 'p2', provenanceSource: 'maker_submitted', verificationStatus: 'verified' }),
    makeProject({ id: 'p3', slug: 'p3', provenanceSource: 'maker_submitted', verificationStatus: 'pending' }),
    makeProject({ id: 'p4', slug: 'p4', provenanceSource: 'github_sync', verificationStatus: 'verified' }),
  ];
  const claims = [makeClaim({ projectId: 'p4', projectSlug: 'p4', status: 'approved' })];
  assert.equal(countMakerVerifiedProjects(projects, claims), 2);
});
