import type { CatalogProject, OwnershipClaimRecord } from '../types/vibeatlas';

export type MakerClaimStatus = 'claimed_verified' | 'claim_pending' | 'unclaimed';

export type MakerVerificationMethod =
  | OwnershipClaimRecord['verificationMethod']
  | 'direct_submission';

export interface MakerVerificationInfo {
  status: MakerClaimStatus;
  isClaimedByMaker: boolean;
  method: MakerVerificationMethod | null;
  matchedClaim: OwnershipClaimRecord | null;
  lastRejectedClaim: OwnershipClaimRecord | null;
  isCurrentUserOwner: boolean;
  makerDisplayName: string;
  makerHandle: string;
}

function compareCreatedDesc(a: OwnershipClaimRecord, b: OwnershipClaimRecord): number {
  const ta = Date.parse(a.createdAtIso || '') || 0;
  const tb = Date.parse(b.createdAtIso || '') || 0;
  return tb - ta;
}

function findMatchingClaims(
  project: Pick<CatalogProject, 'id' | 'slug'>,
  claims: ReadonlyArray<OwnershipClaimRecord>
): OwnershipClaimRecord[] {
  if (!claims || claims.length === 0) return [];
  return claims
    .filter(
      (c) =>
        c.projectId === project.id ||
        (Boolean(project.slug) && Boolean(c.projectSlug) && c.projectSlug === project.slug)
    )
    .slice()
    .sort(compareCreatedDesc);
}

/**
 * Resolves whether a catalog project has been claimed and verified by its maker.
 *
 * Distinction from metadata verification:
 * - Directory-indexed GitHub repositories (`provenanceSource === 'github_sync'`) may have
 *   `verificationStatus === 'verified'` for link/license accuracy without being claimed by their
 *   original makers.
 * - A project receives `'claimed_verified'` only when an approved `OwnershipClaimRecord` exists
 *   OR when the listing is `'maker_submitted'` and has `verificationStatus === 'verified'`.
 */
export function resolveMakerVerification(
  project: Pick<
    CatalogProject,
    | 'id'
    | 'slug'
    | 'provenanceSource'
    | 'verificationStatus'
    | 'ownerUid'
    | 'makerName'
    | 'makerHandle'
  >,
  claims: ReadonlyArray<OwnershipClaimRecord> = [],
  currentUserUid: string | null = null
): MakerVerificationInfo {
  const matching = findMatchingClaims(project, claims);
  const approvedClaim = matching.find((c) => c.status === 'approved') ?? null;
  const pendingClaim = matching.find((c) => c.status === 'pending') ?? null;
  const rejectedClaim = matching.find((c) => c.status === 'rejected') ?? null;

  const isCurrentUserOwner = Boolean(
    currentUserUid && project.ownerUid && project.ownerUid === currentUserUid
  );
  const makerDisplayName = project.makerName.trim();
  const makerHandle = project.makerHandle.trim();

  if (approvedClaim) {
    return {
      status: 'claimed_verified',
      isClaimedByMaker: true,
      method: approvedClaim.verificationMethod,
      matchedClaim: approvedClaim,
      lastRejectedClaim: rejectedClaim,
      isCurrentUserOwner,
      makerDisplayName,
      makerHandle,
    };
  }

  if (project.provenanceSource === 'maker_submitted' && project.verificationStatus === 'verified') {
    return {
      status: 'claimed_verified',
      isClaimedByMaker: true,
      method: 'direct_submission',
      matchedClaim: null,
      lastRejectedClaim: rejectedClaim,
      isCurrentUserOwner,
      makerDisplayName,
      makerHandle,
    };
  }

  if (pendingClaim) {
    return {
      status: 'claim_pending',
      isClaimedByMaker: false,
      method: pendingClaim.verificationMethod,
      matchedClaim: pendingClaim,
      lastRejectedClaim: rejectedClaim,
      isCurrentUserOwner,
      makerDisplayName,
      makerHandle,
    };
  }

  if (project.provenanceSource === 'maker_submitted' && project.verificationStatus === 'pending') {
    return {
      status: 'claim_pending',
      isClaimedByMaker: false,
      method: 'direct_submission',
      matchedClaim: null,
      lastRejectedClaim: rejectedClaim,
      isCurrentUserOwner,
      makerDisplayName,
      makerHandle,
    };
  }

  return {
    status: 'unclaimed',
    isClaimedByMaker: false,
    method: null,
    matchedClaim: null,
    lastRejectedClaim: rejectedClaim,
    isCurrentUserOwner,
    makerDisplayName,
    makerHandle,
  };
}

export function countMakerVerifiedProjects(
  projects: ReadonlyArray<
    Pick<
      CatalogProject,
      | 'id'
      | 'slug'
      | 'provenanceSource'
      | 'verificationStatus'
      | 'ownerUid'
      | 'makerName'
      | 'makerHandle'
    >
  >,
  claims: ReadonlyArray<OwnershipClaimRecord> = []
): number {
  return projects.filter((p) => resolveMakerVerification(p, claims).isClaimedByMaker).length;
}
