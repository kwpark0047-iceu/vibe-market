import type { CatalogProject, ContentType, ProjectCategory } from '../types/vibeatlas';

export const CANONICAL_PROJECT_CATEGORIES: ReadonlyArray<ProjectCategory> = [
  'AI Agent',
  'CLI Tool',
  'Framework',
  'MCP Server',
  'Web Tool',
  'AI Skills',
  'Developer Tools',
  'Workflow',
  'Korean Builders',
  'Templates',
  'Backend',
  'SDK',
];

export const CATEGORY_TAG_ALIASES: Record<
  ProjectCategory,
  { tags: ReadonlyArray<string>; types?: ReadonlyArray<ContentType> }
> = {
  'AI Agent': {
    tags: ['ai agent', 'ai agents', 'coding agent', 'agent', 'agents', 'autonomous-agent'],
    types: ['ai_agent'],
  },
  'CLI Tool': {
    tags: ['cli tool', 'cli tools', 'cli', 'cli-tool', 'command-line', 'terminal', 'tui'],
  },
  Framework: {
    tags: [
      'framework',
      'frameworks',
      'web-framework',
      'react-framework',
      'agent-framework',
      'ui-framework',
      'full-stack-framework',
    ],
  },
  'MCP Server': {
    tags: ['mcp server', 'mcp', 'mcp-server', 'protocol'],
    types: ['mcp_server'],
  },
  'Web Tool': {
    tags: [
      'web tool',
      'web tools',
      'web app',
      'web application',
      'ai tools',
      'productivity',
      'browser automation',
      'indie maker',
    ],
    types: ['web_app', 'ai_tool'],
  },
  'AI Skills': {
    tags: ['ai skills', 'ai skill', 'prompts & workflows'],
    types: ['ai_skill'],
  },
  'Developer Tools': {
    tags: ['developer tools', 'developer-tools', 'ide extension', 'design systems', 'sdk'],
  },
  Workflow: {
    tags: ['workflow', 'automation', 'rag', 'prompts & workflows'],
  },
  'Korean Builders': {
    tags: ['korean builders'],
  },
  Templates: {
    tags: ['templates', 'starter kits'],
    types: ['template'],
  },
  Backend: {
    tags: ['backend', 'database', 'postgresql'],
  },
  SDK: {
    tags: ['sdk'],
  },
};

const ALIAS_TO_CANONICAL = new Map<string, ProjectCategory>();
for (const canonical of CANONICAL_PROJECT_CATEGORIES) {
  ALIAS_TO_CANONICAL.set(canonical.toLowerCase(), canonical);
  const spec = CATEGORY_TAG_ALIASES[canonical];
  for (const alias of spec.tags) {
    if (!ALIAS_TO_CANONICAL.has(alias.toLowerCase())) {
      ALIAS_TO_CANONICAL.set(alias.toLowerCase(), canonical);
    }
  }
}

export function resolveCanonicalCategoryTag(raw: string): ProjectCategory | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  return ALIAS_TO_CANONICAL.get(normalized) ?? null;
}

export function matchesSingleCategoryOrTag(project: CatalogProject, target: string): boolean {
  const trimmed = target.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') return true;
  const targetLower = trimmed.toLowerCase();
  const projectCatsLower = project.categories.map((c) => c.trim().toLowerCase()).filter(Boolean);

  if (projectCatsLower.includes(targetLower)) {
    return true;
  }

  const canonical = resolveCanonicalCategoryTag(trimmed);
  if (!canonical) {
    return false;
  }

  if (projectCatsLower.includes(canonical.toLowerCase())) {
    return true;
  }

  const mapping = CATEGORY_TAG_ALIASES[canonical];
  if (mapping.types && mapping.types.includes(project.contentType)) {
    return true;
  }

  return projectCatsLower.some((tag) => mapping.tags.includes(tag));
}

export function matchesProjectTags(
  project: CatalogProject,
  selectedTags: ReadonlyArray<string>
): boolean {
  if (selectedTags.length === 0) return true;
  return selectedTags.every((tag) => matchesSingleCategoryOrTag(project, tag));
}

/**
 * Extracts normalized, deduplicated tags for display on project cards & detail modals.
 * Canonical tags appear cleanly before project-specific custom tags.
 */
export function getProjectTags(project: CatalogProject, maxCount: number = 6): string[] {
  const out: string[] = [];
  const seenLower = new Set<string>();

  const pushUnique = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seenLower.has(key)) return;
    seenLower.add(key);
    out.push(trimmed);
  };

  for (const rawCat of project.categories) {
    const canonical = resolveCanonicalCategoryTag(rawCat);
    if (canonical) {
      pushUnique(canonical);
    } else {
      pushUnique(rawCat);
    }
  }

  // Ensure content-type implied canonical tag (e.g. AI Agent, MCP Server) is surfaced if relevant
  for (const canonical of CANONICAL_PROJECT_CATEGORIES) {
    const spec = CATEGORY_TAG_ALIASES[canonical];
    if (spec.types && spec.types.includes(project.contentType)) {
      pushUnique(canonical);
    }
  }

  return out.slice(0, Math.max(1, maxCount));
}

export interface ProjectTagFacet {
  tag: string;
  count: number;
  isCanonical: boolean;
}

/**
 * Computes live project tag counts across the active catalog for DiscoverPage filter options.
 */
export function collectAvailableTagFacets(
  projects: ReadonlyArray<CatalogProject>,
  selectedTags: ReadonlyArray<string> = []
): ProjectTagFacet[] {
  const facets: ProjectTagFacet[] = [];
  const seenLower = new Set<string>();

  for (const canonical of CANONICAL_PROJECT_CATEGORIES) {
    const count = projects.filter((p) => matchesSingleCategoryOrTag(p, canonical)).length;
    facets.push({ tag: canonical, count, isCanonical: true });
    seenLower.add(canonical.toLowerCase());
  }

  const customCounts = new Map<string, { label: string; count: number }>();
  for (const project of projects) {
    for (const rawTag of project.categories) {
      const trimmed = rawTag.trim();
      if (!trimmed) continue;
      if (resolveCanonicalCategoryTag(trimmed)) continue;
      const lower = trimmed.toLowerCase();
      if (seenLower.has(lower)) continue;
      const existing = customCounts.get(lower);
      if (existing) {
        existing.count += 1;
      } else {
        customCounts.set(lower, { label: trimmed, count: 1 });
      }
    }
  }

  // Keep selected custom tags visible even if zero items currently match
  for (const selected of selectedTags) {
    const trimmed = selected.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (seenLower.has(lower) || customCounts.has(lower)) continue;
    if (!resolveCanonicalCategoryTag(trimmed)) {
      customCounts.set(lower, { label: trimmed, count: 0 });
    }
  }

  const sortedCustom = Array.from(customCounts.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 8);

  for (const item of sortedCustom) {
    facets.push({ tag: item.label, count: item.count, isCanonical: false });
  }

  return facets;
}

export function toggleTagSelection(
  currentTags: ReadonlyArray<string>,
  targetTag: string
): string[] {
  const trimmed = targetTag.trim();
  if (!trimmed) return [...currentTags];
  const canonical = resolveCanonicalCategoryTag(trimmed) ?? trimmed;
  const targetLower = canonical.toLowerCase();

  const exists = currentTags.some((t) => t.trim().toLowerCase() === targetLower);
  if (exists) {
    return currentTags.filter((t) => t.trim().toLowerCase() !== targetLower);
  }
  return [...currentTags, canonical];
}

export function parseCommaSeparatedTags(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const piece of raw.split(',')) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function toggleCommaSeparatedTag(
  raw: string,
  targetTag: string,
  maxTags: number = 6
): { nextRaw: string; limitReached: boolean } {
  const canonical = resolveCanonicalCategoryTag(targetTag) ?? targetTag.trim();
  if (!canonical) return { nextRaw: raw, limitReached: false };

  const current = parseCommaSeparatedTags(raw);
  const targetLower = canonical.toLowerCase();

  const exists = current.some((t) => t.toLowerCase() === targetLower);
  if (exists) {
    const remaining = current.filter((t) => t.toLowerCase() !== targetLower);
    return { nextRaw: remaining.join(', '), limitReached: false };
  }

  if (current.length >= maxTags) {
    return { nextRaw: raw, limitReached: true };
  }

  return { nextRaw: [...current, canonical].join(', '), limitReached: false };
}

export function normalizeTopicsToCanonicalTags(topics: ReadonlyArray<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    const trimmed = topic.trim();
    if (!trimmed) continue;
    const canonical = resolveCanonicalCategoryTag(trimmed);
    const label = canonical ?? trimmed;
    const lower = label.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(label);
  }
  return out;
}
