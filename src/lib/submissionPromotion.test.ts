import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogProject } from '../types/vibeatlas';
import {
  buildProjectShareUrl,
  buildPromotionCopy,
  selectPromotedSubmissions,
} from './submissionPromotion';

function makeProject(overrides: Partial<CatalogProject> = {}): CatalogProject {
  return {
    id: 'p-seed',
    slug: 'seed-proj',
    name: 'Seed Project',
    tagline: 'English seed tagline',
    taglineKo: '한국어 시드 소개',
    description: 'Detailed project description in English.',
    descriptionKo: '한국어 상세 설명입니다.',
    contentType: 'web_app',
    categories: ['Web Tool'],
    techStack: ['React', 'TypeScript', 'Tailwind'],
    developmentPlatform: 'cursor',
    hostingProvider: 'vercel',
    backendTech: 'firebase',
    country: 'KR',
    language: 'bilingual',
    license: 'MIT',
    pricingModel: 'open_source',
    verificationStatus: 'verified',
    provenanceSource: 'github_sync',
    liveDemoUrl: '',
    websiteUrl: 'https://example.com',
    githubRepo: 'org/repo',
    githubUrl: 'https://github.com/org/repo',
    thumbnailUrl: '',
    makerName: 'Atlas Team',
    makerHandle: '@atlas',
    ownerUid: 'curator',
    githubStars: 0,
    githubForks: 0,
    likesCount: 20,
    bookmarksCount: 30,
    lastSyncedAt: '',
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-11-10T00:00:00.000Z',
    isCuratedSeed: true,
    ...overrides,
  };
}

test('selectPromotedSubmissions prioritizes live user-submitted projects before curated seeds', () => {
  const curatedHighEng = makeProject({
    id: 'curated-top',
    slug: 'curated-top',
    name: 'Curated High',
    likesCount: 200,
    bookmarksCount: 300,
    provenanceSource: 'github_sync',
    isCuratedSeed: true,
    createdAtIso: '2026-11-20T00:00:00.000Z',
  });
  const seedMakerSub = makeProject({
    id: 'seed-maker',
    slug: 'seed-maker',
    name: 'Seed Maker Submission',
    provenanceSource: 'maker_submitted',
    isCuratedSeed: true,
    createdAtIso: '2026-11-15T00:00:00.000Z',
  });
  const liveSubmission = makeProject({
    id: 'proj_live_1',
    slug: 'my-live-submission',
    name: 'My Live Submission',
    provenanceSource: 'maker_submitted',
    isCuratedSeed: false,
    likesCount: 0,
    bookmarksCount: 0,
    createdAtIso: '2026-11-22T09:00:00.000Z',
  });

  const summary = selectPromotedSubmissions([curatedHighEng, seedMakerSub, liveSubmission], {
    filter: 'all',
    limit: 3,
  });

  assert.equal(summary.totalLiveSubmissions, 1);
  assert.equal(summary.totalMakerSubmitted, 2);
  assert.deepEqual(
    summary.entries.map((e) => e.project.id),
    ['proj_live_1', 'seed-maker', 'curated-top']
  );
  assert.equal(summary.entries[0].isLiveUserSubmission, true);
});

test('selectPromotedSubmissions filters demo_ready and live_submitted cleanly', () => {
  const noDemo = makeProject({
    id: 'no-demo',
    slug: 'no-demo',
    liveDemoUrl: '',
    provenanceSource: 'github_sync',
    isCuratedSeed: true,
  });
  const withDemo = makeProject({
    id: 'with-demo',
    slug: 'with-demo',
    liveDemoUrl: 'https://demo.example.com',
    provenanceSource: 'maker_submitted',
    isCuratedSeed: false,
  });
  const unsafeDemo = makeProject({
    id: 'unsafe-demo',
    slug: 'unsafe-demo',
    liveDemoUrl: 'javascript:alert(1)',
    isCuratedSeed: true,
  });

  const demoOnly = selectPromotedSubmissions([noDemo, withDemo, unsafeDemo], {
    filter: 'demo_ready',
    limit: 4,
  });
  assert.equal(demoOnly.totalDemoReady, 1);
  assert.deepEqual(
    demoOnly.entries.map((e) => e.project.id),
    ['with-demo']
  );

  const subOnly = selectPromotedSubmissions([noDemo, withDemo], {
    filter: 'live_submitted',
    limit: 4,
  });
  assert.deepEqual(
    subOnly.entries.map((e) => e.project.id),
    ['with-demo']
  );
});

test('buildProjectShareUrl constructs clean canonical project deep links', () => {
  assert.equal(
    buildProjectShareUrl('http://localhost:3000/?tab=submit#draft', 'my-cool-agent'),
    'http://localhost:3000/?project=my-cool-agent'
  );
  assert.equal(
    buildProjectShareUrl('invalid-url', 'demo-slug'),
    'https://vibeatlas.app/?project=demo-slug'
  );
});

test('buildPromotionCopy formats localized promo snippets across ko, en, zh, ja cleanly', () => {
  const project = makeProject({
    name: 'VibeCoder Studio',
    tagline: 'Visual MCP debugger for AI agents',
    taglineKo: 'AI 에이전트를 위한 시각적 MCP 디버거',
    liveDemoUrl: 'https://demo.vibecoder.dev',
    makerName: 'Minsoo',
    makerHandle: '@minsoo',
  });
  const url = 'https://vibeatlas.app/?project=vibecoder-studio';

  const koCommunity = buildPromotionCopy(project, 'ko', url, 'community');
  assert.ok(koCommunity.includes('VibeCoder Studio'));
  assert.ok(koCommunity.includes('AI 에이전트를 위한 시각적 MCP 디버거'));
  assert.ok(koCommunity.includes('https://demo.vibecoder.dev'));
  assert.ok(koCommunity.includes(url));

  const enSocial = buildPromotionCopy(project, 'en', url, 'social');
  assert.ok(enSocial.includes('Visual MCP debugger for AI agents'));
  assert.ok(enSocial.includes('@minsoo'));
  assert.ok(enSocial.includes(url));

  const zhCommunity = buildPromotionCopy(project, 'zh', url, 'community');
  assert.ok(zhCommunity.includes('[项目推介]'));
  const jaCommunity = buildPromotionCopy(project, 'ja', url, 'community');
  assert.ok(jaCommunity.includes('[プロジェクト紹介]'));
});
