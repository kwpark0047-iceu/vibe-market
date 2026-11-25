import type { CatalogProject } from '../types/vibeatlas';

export const MAX_COMPARE_PROJECTS = 3;

export interface ToggleCompareResult {
  nextIds: string[];
  limitReached: boolean;
}

export interface ComparisonLeaders {
  highestStarsId: string | null;
  highestForksId: string | null;
  highestLikesId: string | null;
  highestBookmarksId: string | null;
  mostRecentUpdateId: string | null;
}

/**
 * Toggles a project ID inside a comparison selection list (capped at `max`).
 */
export function toggleCompareProjectId(
  selectedIds: string[],
  projectId: string,
  max: number = MAX_COMPARE_PROJECTS
): ToggleCompareResult {
  if (selectedIds.includes(projectId)) {
    return {
      nextIds: selectedIds.filter((id) => id !== projectId),
      limitReached: false,
    };
  }
  if (selectedIds.length >= max) {
    return {
      nextIds: selectedIds,
      limitReached: true,
    };
  }
  return {
    nextIds: [...selectedIds, projectId],
    limitReached: false,
  };
}

/**
 * Resolves ordered selected IDs against the current project list (and optional fallback lists).
 */
export function resolveComparedProjects(
  selectedIds: string[],
  ...projectLists: CatalogProject[][]
): CatalogProject[] {
  const byId = new Map<string, CatalogProject>();
  for (const list of projectLists) {
    for (const proj of list) {
      if (!byId.has(proj.id)) {
        byId.set(proj.id, proj);
      }
    }
  }
  const resolved: CatalogProject[] = [];
  for (const id of selectedIds) {
    const match = byId.get(id);
    if (match) {
      resolved.push(match);
    }
  }
  return resolved;
}

function findUniqueLeaderId(
  projects: CatalogProject[],
  getValue: (project: CatalogProject) => number
): string | null {
  if (projects.length < 2) return null;
  let bestId: string | null = null;
  let bestVal = 0;
  let tied = false;

  for (const project of projects) {
    const val = getValue(project);
    if (val <= 0) continue;
    if (val > bestVal) {
      bestVal = val;
      bestId = project.id;
      tied = false;
    } else if (val === bestVal) {
      tied = true;
    }
  }

  return tied ? null : bestId;
}

/**
 * Computes which compared project strictly leads on each verifiable metric.
 * Ties or zero-valued metrics return `null` so badges never highlight meaningless zeros.
 */
export function computeComparisonLeaders(projects: CatalogProject[]): ComparisonLeaders {
  const highestStarsId = findUniqueLeaderId(projects, (p) =>
    p.lastSyncedAt ? p.githubStars : 0
  );
  const highestForksId = findUniqueLeaderId(projects, (p) =>
    p.lastSyncedAt ? p.githubForks : 0
  );
  const highestLikesId = findUniqueLeaderId(projects, (p) => p.likesCount);
  const highestBookmarksId = findUniqueLeaderId(projects, (p) => p.bookmarksCount);
  const mostRecentUpdateId = findUniqueLeaderId(projects, (p) => {
    const ms = Date.parse(p.updatedAtIso);
    return Number.isFinite(ms) ? ms : 0;
  });

  return {
    highestStarsId,
    highestForksId,
    highestLikesId,
    highestBookmarksId,
    mostRecentUpdateId,
  };
}
