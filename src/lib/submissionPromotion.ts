import type { AppLanguage, CatalogProject } from '../types/vibeatlas';
import { sanitizeExternalUrl } from './validation';

export type PromoShowcaseFilter = 'all' | 'live_submitted' | 'demo_ready';
export type PromoCopyTone = 'community' | 'social';

export interface PromotedSubmissionEntry {
  project: CatalogProject;
  isLiveUserSubmission: boolean;
  isMakerSubmitted: boolean;
  hasLiveDemo: boolean;
  hasWebsite: boolean;
  hasGithubRepo: boolean;
  hasBilingualCopy: boolean;
  launchDateShort: string;
  engagementTotal: number;
}

export interface PromotedSubmissionsSummary {
  entries: PromotedSubmissionEntry[];
  totalLiveSubmissions: number;
  totalMakerSubmitted: number;
  totalDemoReady: number;
}

function parseIsoMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function formatDateShort(iso: string): string {
  const ms = parseIsoMs(iso);
  if (!ms) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

export function buildPromotedSubmissionEntry(project: CatalogProject): PromotedSubmissionEntry {
  const isLiveUserSubmission = project.isCuratedSeed === false;
  const isMakerSubmitted =
    isLiveUserSubmission || project.provenanceSource === 'maker_submitted';
  const hasLiveDemo = Boolean(sanitizeExternalUrl(project.liveDemoUrl));
  const hasWebsite = Boolean(sanitizeExternalUrl(project.websiteUrl));
  const hasGithubRepo = Boolean(project.githubRepo.trim() || sanitizeExternalUrl(project.githubUrl));
  const hasBilingualCopy = Boolean(project.tagline.trim() && project.taglineKo.trim());

  return {
    project,
    isLiveUserSubmission,
    isMakerSubmitted,
    hasLiveDemo,
    hasWebsite,
    hasGithubRepo,
    hasBilingualCopy,
    launchDateShort: formatDateShort(project.createdAtIso),
    engagementTotal: Math.max(0, project.likesCount) + Math.max(0, project.bookmarksCount),
  };
}

export function selectPromotedSubmissions(
  projects: ReadonlyArray<CatalogProject>,
  options: {
    filter?: PromoShowcaseFilter;
    limit?: number;
  } = {}
): PromotedSubmissionsSummary {
  const filter = options.filter ?? 'all';
  const limit = Math.max(1, options.limit ?? 4);

  const allEntries = projects.map(buildPromotedSubmissionEntry);
  const totalLiveSubmissions = allEntries.filter((e) => e.isLiveUserSubmission).length;
  const totalMakerSubmitted = allEntries.filter((e) => e.isMakerSubmitted).length;
  const totalDemoReady = allEntries.filter((e) => e.hasLiveDemo).length;

  let filtered = allEntries;
  if (filter === 'live_submitted') {
    filtered = allEntries.filter((e) => e.isMakerSubmitted);
  } else if (filter === 'demo_ready') {
    filtered = allEntries.filter((e) => e.hasLiveDemo);
  }

  const ranked = [...filtered].sort((a, b) => {
    if (a.isLiveUserSubmission !== b.isLiveUserSubmission) {
      return a.isLiveUserSubmission ? -1 : 1;
    }
    if (a.isMakerSubmitted !== b.isMakerSubmitted) {
      return a.isMakerSubmitted ? -1 : 1;
    }
    const createdDiff =
      parseIsoMs(b.project.createdAtIso) - parseIsoMs(a.project.createdAtIso);
    if (createdDiff !== 0) return createdDiff;
    if (b.engagementTotal !== a.engagementTotal) {
      return b.engagementTotal - a.engagementTotal;
    }
    return a.project.name.localeCompare(b.project.name);
  });

  return {
    entries: ranked.slice(0, limit),
    totalLiveSubmissions,
    totalMakerSubmitted,
    totalDemoReady,
  };
}

export function buildProjectShareUrl(baseUrl: string, slug: string): string {
  const cleanSlug = slug.trim();
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    parsed = new URL('https://vibeatlas.app');
  }
  parsed.search = '';
  parsed.hash = '';
  if (cleanSlug) {
    parsed.searchParams.set('project', cleanSlug);
  }
  return parsed.toString();
}

export function buildPromotionCopy(
  project: CatalogProject,
  language: AppLanguage,
  shareUrl: string,
  tone: PromoCopyTone = 'community'
): string {
  const tagline =
    language === 'ko' && project.taglineKo.trim()
      ? project.taglineKo.trim()
      : project.tagline.trim();
  const stackLine = project.techStack.slice(0, 4).join(' · ');
  const makerLabel = project.makerHandle.trim()
    ? `${project.makerName} (${project.makerHandle.trim()})`
    : project.makerName;
  const safeDemo = sanitizeExternalUrl(project.liveDemoUrl);

  if (language === 'ko') {
    if (tone === 'social') {
      const stackPart = stackLine ? `\n스택: ${stackLine}` : '';
      return `${project.name} — ${tagline}${stackPart}\n만든이: ${makerLabel}\n지금 VibeAtlas에서 확인하기: ${shareUrl}`;
    }
    const lines = [
      `[프로젝트 소개] ${project.name}`,
      tagline,
      stackLine ? `• 주요 스택: ${stackLine}` : '',
      `• 메이커: ${makerLabel}`,
      safeDemo ? `• 라이브 데모: ${safeDemo}` : '',
      `• 상세 정보 & 피드백: ${shareUrl}`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  if (language === 'zh') {
    if (tone === 'social') {
      const stackPart = stackLine ? `\n技术栈：${stackLine}` : '';
      return `${project.name} — ${tagline}${stackPart}\n创作者：${makerLabel}\n在 VibeAtlas 查看详情：${shareUrl}`;
    }
    const lines = [
      `[项目推介] ${project.name}`,
      tagline,
      stackLine ? `• 核心技术栈：${stackLine}` : '',
      `• 创作者：${makerLabel}`,
      safeDemo ? `• 在线演示：${safeDemo}` : '',
      `• 详情与社区评价：${shareUrl}`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  if (language === 'ja') {
    if (tone === 'social') {
      const stackPart = stackLine ? `\nスタック: ${stackLine}` : '';
      return `${project.name} — ${tagline}${stackPart}\nメイカー: ${makerLabel}\nVibeAtlas で詳細を見る: ${shareUrl}`;
    }
    const lines = [
      `[プロジェクト紹介] ${project.name}`,
      tagline,
      stackLine ? `• 主な技術スタック: ${stackLine}` : '',
      `• メイカー: ${makerLabel}`,
      safeDemo ? `• ライブデモ: ${safeDemo}` : '',
      `• 詳細とフィードバック: ${shareUrl}`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  // English default
  if (tone === 'social') {
    const stackPart = stackLine ? `\nStack: ${stackLine}` : '';
    return `${project.name} — ${tagline}${stackPart}\nBy ${makerLabel}\nExplore on VibeAtlas: ${shareUrl}`;
  }
  const lines = [
    `[Launch Showcase] ${project.name}`,
    tagline,
    stackLine ? `• Stack: ${stackLine}` : '',
    `• Maker: ${makerLabel}`,
    safeDemo ? `• Live Demo: ${safeDemo}` : '',
    `• Full Profile & Health Score: ${shareUrl}`,
  ].filter(Boolean);
  return lines.join('\n');
}
