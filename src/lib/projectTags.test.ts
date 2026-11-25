import assert from 'node:assert/strict';
import test from 'node:test';
import { CURATED_SEED_PROJECTS } from '../data/seedCatalog';
import type { CatalogProject } from '../types/vibeatlas';
import {
  collectAvailableTagFacets,
  getProjectTags,
  matchesProjectTags,
  matchesSingleCategoryOrTag,
  normalizeTopicsToCanonicalTags,
  resolveCanonicalCategoryTag,
  toggleCommaSeparatedTag,
  toggleTagSelection,
} from './projectTags';

function makeStubProject(id: string, overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    ...CURATED_SEED_PROJECTS[0],
    id,
    slug: id,
    name: `Project ${id}`,
    categories: [],
    ...overrides,
  };
}

test('resolveCanonicalCategoryTag maps aliases for AI Agent, CLI Tool, and Framework accurately', () => {
  assert.equal(resolveCanonicalCategoryTag('ai agent'), 'AI Agent');
  assert.equal(resolveCanonicalCategoryTag('Coding Agent'), 'AI Agent');
  assert.equal(resolveCanonicalCategoryTag('cli'), 'CLI Tool');
  assert.equal(resolveCanonicalCategoryTag('cli-tool'), 'CLI Tool');
  assert.equal(resolveCanonicalCategoryTag('terminal'), 'CLI Tool');
  assert.equal(resolveCanonicalCategoryTag('framework'), 'Framework');
  assert.equal(resolveCanonicalCategoryTag('web-framework'), 'Framework');
  assert.equal(resolveCanonicalCategoryTag('unknown-custom-tag'), null);
});

test('matchesProjectTags applies AND semantics across selected canonical and custom tags', () => {
  const cliAgent = makeStubProject('cli-agent', {
    contentType: 'ai_agent',
    categories: ['Coding Agent', 'CLI Tool', 'TypeScript'],
  });
  const frameworkOnly = makeStubProject('fw-only', {
    contentType: 'open_source',
    categories: ['Framework', 'SDK'],
  });

  assert.equal(matchesProjectTags(cliAgent, []), true);
  assert.equal(matchesProjectTags(cliAgent, ['AI Agent']), true);
  assert.equal(matchesProjectTags(cliAgent, ['CLI Tool']), true);
  assert.equal(matchesProjectTags(cliAgent, ['AI Agent', 'CLI Tool']), true);
  assert.equal(matchesProjectTags(cliAgent, ['AI Agent', 'Framework']), false);
  assert.equal(matchesSingleCategoryOrTag(frameworkOnly, 'Framework'), true);
  assert.equal(matchesSingleCategoryOrTag(frameworkOnly, 'CLI Tool'), false);
});

test('getProjectTags deduplicates aliases and surfaces implied canonical tags', () => {
  const proj = makeStubProject('mcp-cli', {
    contentType: 'mcp_server',
    categories: ['MCP', 'cli-tool', 'Protocol', 'GraphQL'],
  });

  const tags = getProjectTags(proj);
  assert.ok(tags.includes('MCP Server'));
  assert.ok(tags.includes('CLI Tool'));
  assert.ok(tags.includes('GraphQL'));
  // Ensure 'MCP', 'Protocol', and contentType 'mcp_server' did not duplicate
  assert.equal(tags.filter((t) => t === 'MCP Server').length, 1);
});

test('collectAvailableTagFacets returns accurate live counts across curated seed catalog', () => {
  const facets = collectAvailableTagFacets(CURATED_SEED_PROJECTS);
  const aiAgentFacet = facets.find((f) => f.tag === 'AI Agent');
  const cliToolFacet = facets.find((f) => f.tag === 'CLI Tool');
  const frameworkFacet = facets.find((f) => f.tag === 'Framework');

  assert.ok(aiAgentFacet && aiAgentFacet.count >= 3);
  assert.ok(cliToolFacet && cliToolFacet.count >= 2);
  assert.ok(frameworkFacet && frameworkFacet.count >= 3);
});

test('toggleTagSelection and toggleCommaSeparatedTag enforce canonical casing and max tag limit', () => {
  let selected = toggleTagSelection([], 'cli tool');
  assert.deepEqual(selected, ['CLI Tool']);
  selected = toggleTagSelection(selected, 'Framework');
  assert.deepEqual(selected, ['CLI Tool', 'Framework']);
  selected = toggleTagSelection(selected, 'CLI Tool');
  assert.deepEqual(selected, ['Framework']);

  const added = toggleCommaSeparatedTag('AI Agent, SDK', 'cli', 6);
  assert.equal(added.limitReached, false);
  assert.equal(added.nextRaw, 'AI Agent, SDK, CLI Tool');

  const capped = toggleCommaSeparatedTag('A, B, C, D, E, F', 'Framework', 6);
  assert.equal(capped.limitReached, true);
  assert.equal(capped.nextRaw, 'A, B, C, D, E, F');
});

test('normalizeTopicsToCanonicalTags converts GitHub repo topics cleanly', () => {
  const normalized = normalizeTopicsToCanonicalTags(['react', 'web-framework', 'cli-tool', 'mcp']);
  assert.deepEqual(normalized, ['react', 'Framework', 'CLI Tool', 'MCP Server']);
});
