import { z } from 'zod';
import type { AppLanguage } from '../types/vibeatlas';

export function parseGitHubRepoSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const directMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
  if (directMatch) {
    return `${directMatch[1]}/${directMatch[2]}`;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') {
      return null;
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, '');
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
      return null;
    }
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

function hasValidWebHostname(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname === 'localhost') return true;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  const parts = hostname.split('.');
  return (
    parts.length >= 2 &&
    parts.every((part) => part.length > 0) &&
    /[A-Za-z0-9-]{2,}$/.test(parts[parts.length - 1]!)
  );
}

export function isSafeHttpUrl(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    const isHttp = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    return isHttp && hasValidWebHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function sanitizeExternalUrl(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      hasValidWebHostname(parsed.hostname)
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (ascii.length >= 2) {
    return ascii.slice(0, 80);
  }
  return `project-${Date.now().toString(36)}`;
}

export const projectSubmissionSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(5).max(220),
  taglineKo: z.string().trim().max(220).default(''),
  description: z.string().trim().min(20).max(4000),
  descriptionKo: z.string().trim().max(4000).default(''),
  contentType: z.enum([
    'web_app',
    'ai_tool',
    'mcp_server',
    'ai_skill',
    'ai_agent',
    'template',
    'open_source',
  ]),
  categories: z.array(z.string().trim().min(1).max(40)).min(1).max(6),
  techStack: z.array(z.string().trim().min(1).max(40)).max(12),
  developmentPlatform: z.enum([
    'lovable',
    'cursor',
    'windsurf',
    'bolt',
    'v0',
    'claude_code',
    'replit',
    'custom',
  ]),
  hostingProvider: z.enum([
    'vercel',
    'cloudflare',
    'aws',
    'fly_io',
    'gcp',
    'netlify',
    'self_hosted',
    'unknown',
  ]),
  backendTech: z.enum([
    'supabase',
    'firebase',
    'postgresql',
    'nodejs',
    'python_fastapi',
    'sqlite',
    'serverless',
    'none',
    'unknown',
  ]),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,12}$/),
  language: z.enum(['ko', 'en', 'bilingual', 'other']),
  license: z.string().trim().min(1).max(64),
  pricingModel: z.enum(['free', 'open_source', 'freemium', 'paid', 'enterprise']),
  liveDemoUrl: z.string().trim().max(500).refine(isSafeHttpUrl, 'Invalid HTTP/HTTPS URL'),
  websiteUrl: z.string().trim().max(500).refine(isSafeHttpUrl, 'Invalid HTTP/HTTPS URL'),
  githubUrl: z.string().trim().max(500).refine(isSafeHttpUrl, 'Invalid HTTP/HTTPS URL'),
  makerName: z.string().trim().min(1).max(100),
  makerHandle: z.string().trim().max(80).default(''),
});

export const reportSubmissionSchema = z.object({
  reason: z.enum([
    'broken_link',
    'stale_metadata',
    'spam',
    'misattribution',
    'security_concern',
  ]),
  details: z.string().trim().min(5).max(1000),
});

export const ownershipClaimSchema = z.object({
  verificationMethod: z.enum(['github_repo', 'domain_dns', 'demo_meta']),
  proofNote: z.string().trim().min(5).max(1000),
});

export type ProjectSubmissionInput = z.input<typeof projectSubmissionSchema>;
export type ProjectSubmissionValidated = z.output<typeof projectSubmissionSchema>;

export type SubmitValidationField =
  | 'name'
  | 'tagline'
  | 'taglineKo'
  | 'description'
  | 'descriptionKo'
  | 'categories'
  | 'techStack'
  | 'country'
  | 'license'
  | 'liveDemoUrl'
  | 'websiteUrl'
  | 'githubUrl'
  | 'makerName'
  | 'makerHandle';

const FIELD_ERROR_COPY: Record<AppLanguage, Record<SubmitValidationField, string>> = {
  ko: {
    name: '프로젝트 이름은 2자 이상 120자 이하로 입력하세요.',
    tagline: '영문 한 줄 소개는 5자 이상 220자 이하로 입력하세요.',
    taglineKo: '한국어 한 줄 소개는 220자 이하로 입력하세요.',
    description: '영문 상세 설명은 최소 20자 이상(최대 4,000자) 입력하세요.',
    descriptionKo: '한국어 상세 설명은 4,000자 이하로 입력하세요.',
    categories: '카테고리를 최소 1개 이상(최대 6개, 쉼표 구분) 입력하세요.',
    techStack: '기술 스택은 최대 12개까지 입력할 수 있습니다.',
    country: '국가 코드는 2~12자의 영문 대문자로 입력하세요 (예: KR, US).',
    license: '라이선스를 입력하세요 (예: MIT, Apache-2.0, Unknown).',
    liveDemoUrl: '올바른 http:// 또는 https:// 라이브 데모 URL 형식을 입력하세요.',
    websiteUrl: '올바른 http:// 또는 https:// 공식 웹사이트 URL 형식을 입력하세요.',
    githubUrl: '올바른 http:// 또는 https:// GitHub URL 형식을 입력하세요.',
    makerName: '메이커 또는 팀 이름을 입력하세요.',
    makerHandle: '메이커 핸들은 80자 이하로 입력하세요.',
  },
  en: {
    name: 'Project name must be between 2 and 120 characters.',
    tagline: 'English tagline must be between 5 and 220 characters.',
    taglineKo: 'Korean tagline must be 220 characters or fewer.',
    description: 'English description must be at least 20 characters (max 4,000).',
    descriptionKo: 'Korean description must be 4,000 characters or fewer.',
    categories: 'Enter at least 1 category (comma-separated, max 6).',
    techStack: 'Tech stack can contain at most 12 entries.',
    country: 'Country code must be 2–12 uppercase letters (e.g. KR, US).',
    license: 'License is required (e.g. MIT, Apache-2.0, Unknown).',
    liveDemoUrl: 'Enter a valid http:// or https:// Live Demo URL.',
    websiteUrl: 'Enter a valid http:// or https:// Website URL.',
    githubUrl: 'Enter a valid http:// or https:// GitHub URL.',
    makerName: 'Maker or team name is required.',
    makerHandle: 'Maker handle must be 80 characters or fewer.',
  },
  zh: {
    name: '项目名称需为 2 至 120 个字符。',
    tagline: '英文一句话简介需为 5 至 220 个字符。',
    taglineKo: '韩文简介不能超过 220 个字符。',
    description: '英文详细说明至少需 20 个字符（最多 4,000 个字符）。',
    descriptionKo: '韩文详细说明不能超过 4,000 个字符。',
    categories: '请至少输入 1 个分类（以逗号分隔，最多 6 个）。',
    techStack: '技术栈最多填写 12 项。',
    country: '国家/地区代码需为 2 至 12 位大写字母（例如 KR、US）。',
    license: '请填写开源许可证（例如 MIT、Apache-2.0、Unknown）。',
    liveDemoUrl: '请输入有效的 http:// 或 https:// 在线演示 URL。',
    websiteUrl: '请输入有效的 http:// 或 https:// 官网 URL。',
    githubUrl: '请输入有效的 http:// 或 https:// GitHub URL。',
    makerName: '请填写作者或团队名称。',
    makerHandle: '作者账号标识不能超过 80 个字符。',
  },
  ja: {
    name: 'プロジェクト名は2文字以上120文字以内で入力してください。',
    tagline: '英語のタグラインは5文字以上220文字以内で入力してください。',
    taglineKo: '韓国語タグラインは220文字以内で入力してください。',
    description: '英語の詳細説明は20文字以上（最大4,000文字）で入力してください。',
    descriptionKo: '韓国語の詳細説明は4,000文字以内で入力してください。',
    categories: 'カテゴリを1つ以上（カンマ区切り・最大6つ）入力してください。',
    techStack: '技術スタックは最大12件まで入力できます。',
    country: '国コードは2〜12文字の英大文字で入力してください（例: KR、JP、US）。',
    license: 'ライセンスを入力してください（例: MIT、Apache-2.0、Unknown）。',
    liveDemoUrl: '有効な http:// または https:// ライブデモURLを入力してください。',
    websiteUrl: '有効な http:// または https:// 公式サイトURLを入力してください。',
    githubUrl: '有効な http:// または https:// GitHub URLを入力してください。',
    makerName: 'メイカーまたはチーム名を入力してください。',
    makerHandle: 'メイカーハンドルは80文字以内で入力してください。',
  },
};

export type ProjectSubmissionValidationResult =
  | { success: true; data: ProjectSubmissionValidated }
  | {
      success: false;
      fieldErrors: Partial<Record<SubmitValidationField, string>>;
      summaryMessage: string;
    };

export function validateProjectSubmissionInput(
  input: ProjectSubmissionInput,
  language: AppLanguage
): ProjectSubmissionValidationResult {
  const parsed = projectSubmissionSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const messages = FIELD_ERROR_COPY[language] ?? FIELD_ERROR_COPY.en;
  const fieldErrors: Partial<Record<SubmitValidationField, string>> = {};

  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && key in messages) {
      const typedKey = key as SubmitValidationField;
      if (!fieldErrors[typedKey]) {
        fieldErrors[typedKey] = messages[typedKey];
      }
    }
  }

  const orderedErrors = Object.values(fieldErrors);
  const summaryMessage =
    orderedErrors.length > 0
      ? orderedErrors[0]!
      : `${parsed.error.issues[0]?.path.join('.') || 'form'}: ${parsed.error.issues[0]?.message || 'Validation failed'}`;

  return {
    success: false,
    fieldErrors,
    summaryMessage,
  };
}

export const milestoneLogSchema = z.object({
  kind: z.enum(['release', 'launch', 'feature', 'update', 'fix']),
  versionTag: z.string().trim().max(40).default(''),
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().max(800).default(''),
  externalUrl: z
    .string()
    .trim()
    .max(500)
    .refine(isSafeHttpUrl, 'Invalid HTTP/HTTPS URL')
    .default(''),
  occurredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MilestoneLogInput = z.input<typeof milestoneLogSchema>;
export type MilestoneLogValidated = z.output<typeof milestoneLogSchema>;
export type MilestoneLogField = 'versionTag' | 'title' | 'summary' | 'externalUrl' | 'occurredDate';

const MILESTONE_FIELD_ERROR_COPY: Record<AppLanguage, Record<MilestoneLogField, string>> = {
  ko: {
    versionTag: '버전 태그는 40자 이하로 입력하세요 (예: v1.4.0).',
    title: '마일스톤 제목은 3자 이상 140자 이하로 입력하세요.',
    summary: '요약 내용은 800자 이하로 입력하세요.',
    externalUrl: '올바른 http:// 또는 https:// 링크 형식을 입력하세요.',
    occurredDate: '날짜는 YYYY-MM-DD 형식으로 선택하세요.',
  },
  en: {
    versionTag: 'Version tag must be 40 characters or fewer (e.g. v1.4.0).',
    title: 'Milestone title must be between 3 and 140 characters.',
    summary: 'Summary must be 800 characters or fewer.',
    externalUrl: 'Enter a valid http:// or https:// reference URL.',
    occurredDate: 'Select a valid YYYY-MM-DD date.',
  },
  zh: {
    versionTag: '版本标签不能超过 40 个字符（例如 v1.4.0）。',
    title: '里程碑标题需为 3 至 140 个字符。',
    summary: '摘要说明不能超过 800 个字符。',
    externalUrl: '请输入有效的 http:// 或 https:// 链接。',
    occurredDate: '请选择有效的 YYYY-MM-DD 日期。',
  },
  ja: {
    versionTag: 'バージョンタグは40文字以内で入力してください（例: v1.4.0）。',
    title: 'マイルストーンタイトルは3文字以上140文字以内で入力してください。',
    summary: '概要は800文字以内で入力してください。',
    externalUrl: '有効な http:// または https:// URLを入力してください。',
    occurredDate: '有効な YYYY-MM-DD 形式の日付を選択してください。',
  },
};

export type MilestoneLogValidationResult =
  | { success: true; data: MilestoneLogValidated }
  | {
      success: false;
      fieldErrors: Partial<Record<MilestoneLogField, string>>;
      summaryMessage: string;
    };

export function validateMilestoneLogInput(
  input: MilestoneLogInput,
  language: AppLanguage
): MilestoneLogValidationResult {
  const parsed = milestoneLogSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const messages = MILESTONE_FIELD_ERROR_COPY[language] ?? MILESTONE_FIELD_ERROR_COPY.en;
  const fieldErrors: Partial<Record<MilestoneLogField, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && key in messages) {
      const typedKey = key as MilestoneLogField;
      if (!fieldErrors[typedKey]) {
        fieldErrors[typedKey] = messages[typedKey];
      }
    }
  }
  const ordered = Object.values(fieldErrors);
  return {
    success: false,
    fieldErrors,
    summaryMessage:
      ordered[0] ||
      `${parsed.error.issues[0]?.path.join('.') || 'milestone'}: ${parsed.error.issues[0]?.message || 'Validation failed'}`,
  };
}

