import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { computeDailyStarMetric } from './src/lib/githubTrendingBubbles.ts';
import {
  chunkTranslationItems,
  executeTranslationWithFallback,
  extractTranslationErrorDetails,
  isRetryableTranslationError,
  parseTranslationBatchResponse,
} from './src/lib/repoDescriptionTranslator.ts';
import { parseGitHubRepoSlug } from './src/lib/validation.ts';
import type {
  AppLanguage,
  GitHubAiTrendingRepo,
  GitHubCommitEvent,
  GitHubMilestonesPayload,
  GitHubRankedRepo,
  GitHubReleaseEvent,
  GitHubRepoMetadata,
  GitHubTopRepoPreset,
} from './src/types/vibeatlas.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  data: GitHubRepoMetadata;
}

interface TopStarredCacheEntry {
  expiresAt: number;
  fetchedAt: string;
  items: GitHubRankedRepo[];
}

interface MilestonesCacheEntry {
  expiresAt: number;
  data: GitHubMilestonesPayload;
}

const githubCache = new Map<string, CacheEntry>();
const githubMilestonesCache = new Map<string, MilestonesCacheEntry>();
const topStarredCache = new Map<GitHubTopRepoPreset, TopStarredCacheEntry>();
const TOP_STARRED_CACHE_DIR = path.resolve(__dirname, '.cache');

const TOP_STARRED_PRESET_QUERIES: Record<GitHubTopRepoPreset, string> = {
  all: 'stars:>50000',
  web_apps: 'topic:webapp stars:>500',
  ai_agents: 'topic:ai stars:>3000',
  typescript: 'language:TypeScript stars:>10000',
  python: 'language:Python stars:>15000',
  rust: 'language:Rust stars:>5000',
  go: 'language:Go stars:>10000',
};

function isValidTopRepoPreset(val: string): val is GitHubTopRepoPreset {
  return Object.prototype.hasOwnProperty.call(TOP_STARRED_PRESET_QUERIES, val);
}

function getDiskCachePath(preset: GitHubTopRepoPreset): string {
  return path.join(TOP_STARRED_CACHE_DIR, `top-starred-${preset}.json`);
}

function readTopStarredCache(preset: GitHubTopRepoPreset): TopStarredCacheEntry | undefined {
  const mem = topStarredCache.get(preset);
  if (mem && mem.items.length > 0) return mem;
  try {
    const filePath = getDiskCachePath(preset);
    if (!fs.existsSync(filePath)) return undefined;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<TopStarredCacheEntry>;
    if (
      typeof parsed.expiresAt === 'number' &&
      typeof parsed.fetchedAt === 'string' &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      const entry: TopStarredCacheEntry = {
        expiresAt: parsed.expiresAt,
        fetchedAt: parsed.fetchedAt,
        items: parsed.items as GitHubRankedRepo[],
      };
      topStarredCache.set(preset, entry);
      return entry;
    }
  } catch {
    // Ignore corrupt cache files and re-fetch live
  }
  return undefined;
}

function writeTopStarredCache(preset: GitHubTopRepoPreset, entry: TopStarredCacheEntry): void {
  topStarredCache.set(preset, entry);
  try {
    fs.mkdirSync(TOP_STARRED_CACHE_DIR, { recursive: true });
    fs.writeFileSync(getDiskCachePath(preset), JSON.stringify(entry), 'utf8');
  } catch {
    // Non-fatal if filesystem cache write fails
  }
}

interface AiTrendingCacheEntry {
  expiresAt: number;
  fetchedAt: string;
  items: GitHubAiTrendingRepo[];
}

const AI_TRENDING_CACHE_PATH = path.join(TOP_STARRED_CACHE_DIR, 'ai-trending.json');
const AI_TRENDING_HISTORY_PATH = path.join(TOP_STARRED_CACHE_DIR, 'ai-trending-history.json');
let aiTrendingMemCache: AiTrendingCacheEntry | undefined;

function readAiTrendingCache(): AiTrendingCacheEntry | undefined {
  if (aiTrendingMemCache && aiTrendingMemCache.items.length > 0) return aiTrendingMemCache;
  try {
    if (!fs.existsSync(AI_TRENDING_CACHE_PATH)) return undefined;
    const parsed = JSON.parse(fs.readFileSync(AI_TRENDING_CACHE_PATH, 'utf8')) as Partial<AiTrendingCacheEntry>;
    if (
      typeof parsed.expiresAt === 'number' &&
      typeof parsed.fetchedAt === 'string' &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      aiTrendingMemCache = {
        expiresAt: parsed.expiresAt,
        fetchedAt: parsed.fetchedAt,
        items: parsed.items as GitHubAiTrendingRepo[],
      };
      return aiTrendingMemCache;
    }
  } catch {
    // Ignore corrupt cache file
  }
  return undefined;
}

function writeAiTrendingCache(entry: AiTrendingCacheEntry): void {
  aiTrendingMemCache = entry;
  try {
    fs.mkdirSync(TOP_STARRED_CACHE_DIR, { recursive: true });
    fs.writeFileSync(AI_TRENDING_CACHE_PATH, JSON.stringify(entry), 'utf8');
  } catch {
    // Non-fatal if cache write fails
  }
}

function readAiTrendingHistory(): Record<string, Record<string, number>> {
  try {
    if (!fs.existsSync(AI_TRENDING_HISTORY_PATH)) return {};
    const parsed = JSON.parse(fs.readFileSync(AI_TRENDING_HISTORY_PATH, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, Record<string, number>>;
    }
  } catch {
    // Ignore corrupt history file
  }
  return {};
}

function writeAiTrendingHistory(history: Record<string, Record<string, number>>): void {
  try {
    fs.mkdirSync(TOP_STARRED_CACHE_DIR, { recursive: true });
    fs.writeFileSync(AI_TRENDING_HISTORY_PATH, JSON.stringify(history), 'utf8');
  } catch {
    // Non-fatal if write fails
  }
}

function deriveFallbackAiTrendingFromTopStarred(): AiTrendingCacheEntry | undefined {
  const aiCache = readTopStarredCache('ai_agents');
  if (!aiCache || aiCache.items.length === 0) return undefined;
  const history = readAiTrendingHistory();
  const nowMs = Date.now();
  const cutoffMs = nowMs - 30 * 86_400_000;

  const activeItems = aiCache.items
    .filter((repo) => {
      if (!repo.pushedAt) return true;
      const pushedMs = Date.parse(repo.pushedAt);
      return Number.isNaN(pushedMs) || pushedMs >= cutoffMs;
    })
    .slice(0, 40)
    .map((repo) => {
      const snapMap = history[repo.fullName.toLowerCase()];
      const metric = computeDailyStarMetric({
        stars: repo.stars,
        snapshots: snapMap,
        nowMs,
      });
      return {
        ...repo,
        createdAt: '',
        dailyStars: metric.dailyStars,
        dailyRateSource: metric.dailyRateSource,
      } satisfies GitHubAiTrendingRepo;
    })
    .sort((a, b) => b.dailyStars - a.dailyStars || b.stars - a.stars)
    .map((repo, idx) => ({ ...repo, rank: idx + 1 }));

  if (activeItems.length === 0) return undefined;
  return {
    expiresAt: aiCache.expiresAt,
    fetchedAt: aiCache.fetchedAt,
    items: activeItems,
  };
}

const VALID_APP_LANGUAGES: ReadonlySet<AppLanguage> = new Set(['ko', 'en', 'zh', 'ja']);
const TARGET_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  ko: 'Korean (한국어)',
  en: 'English',
  zh: 'Simplified Chinese (简体中文)',
  ja: 'Japanese (日本語)',
};
const TRANSLATION_DISK_CACHE_PATH = path.join(TOP_STARRED_CACHE_DIR, 'github-desc-translations.json');
const MAX_TRANSLATION_CACHE_ENTRIES = 5000;
const TRANSLATION_MODEL_PRIORITY = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
const TRANSLATION_MODEL_COOLDOWN_MS = 60_000;
const TRANSLATION_ATTEMPT_TIMEOUT_MS = 18_000;
let translationDiskLoaded = false;
const translationCache = new Map<string, string>();
const modelCooldownUntil = new Map<string, number>();
let geminiClient: GoogleGenAI | null = null;

function getPrioritizedTranslationModels(): string[] {
  const now = Date.now();
  const healthy: string[] = [];
  const cooledDown: string[] = [];
  for (const model of TRANSLATION_MODEL_PRIORITY) {
    const until = modelCooldownUntil.get(model) ?? 0;
    if (until > now) {
      cooledDown.push(model);
    } else {
      healthy.push(model);
    }
  }
  return [...healthy, ...cooledDown];
}

function isValidAppLanguage(val: unknown): val is AppLanguage {
  return typeof val === 'string' && VALID_APP_LANGUAGES.has(val as AppLanguage);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

function buildTranslationCacheKey(targetLanguage: AppLanguage, sourceText: string): string {
  const digest = createHash('sha256').update(sourceText.trim()).digest('hex').slice(0, 16);
  return `${targetLanguage}:${digest}`;
}

function loadTranslationDiskCacheOnce(): void {
  if (translationDiskLoaded) return;
  translationDiskLoaded = true;
  try {
    if (!fs.existsSync(TRANSLATION_DISK_CACHE_PATH)) return;
    const raw = JSON.parse(fs.readFileSync(TRANSLATION_DISK_CACHE_PATH, 'utf8')) as Record<string, unknown>;
    if (raw && typeof raw === 'object') {
      for (const [key, val] of Object.entries(raw)) {
        if (typeof val === 'string' && val.trim()) {
          translationCache.set(key, val);
        }
      }
    }
  } catch {
    // Ignore corrupt disk translation cache
  }
}

function persistTranslationDiskCache(): void {
  try {
    fs.mkdirSync(TOP_STARRED_CACHE_DIR, { recursive: true });
    const entries = Array.from(translationCache.entries());
    const trimmed =
      entries.length > MAX_TRANSLATION_CACHE_ENTRIES
        ? entries.slice(entries.length - MAX_TRANSLATION_CACHE_ENTRIES)
        : entries;
    fs.writeFileSync(TRANSLATION_DISK_CACHE_PATH, JSON.stringify(Object.fromEntries(trimmed)), 'utf8');
  } catch {
    // Non-fatal if cache write fails
  }
}

async function fetchGitHubRepoFromApi(slug: string): Promise<{
  ok: true;
  data: GitHubRepoMetadata;
} | {
  ok: false;
  status: number;
  error: string;
}> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) {
    return { ok: false, status: 400, error: 'Invalid GitHub repository format (expected owner/repo).' };
  }

  const cached = githubCache.get(slug.toLowerCase());
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, data: cached.data };
  }

  const [owner, repo] = slug.split('/');
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'VibeAtlas-Directory-Sync',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const ghToken = process.env.GITHUB_TOKEN?.trim();
  if (ghToken) {
    headers.Authorization = `Bearer ${ghToken}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(endpoint, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (resp.status === 404) {
      return { ok: false, status: 404, error: `GitHub repository "${slug}" was not found.` };
    }
    if (resp.status === 403 || resp.status === 429) {
      return {
        ok: false,
        status: 429,
        error: 'GitHub API rate limit reached. Try again later or configure GITHUB_TOKEN on the server.',
      };
    }
    if (!resp.ok) {
      return { ok: false, status: resp.status, error: `GitHub API returned status ${resp.status}.` };
    }

    const raw = (await resp.json()) as Record<string, unknown>;
    const licenseObj = raw.license as Record<string, unknown> | null | undefined;
    const ownerObj = raw.owner as Record<string, unknown> | null | undefined;

    const metadata: GitHubRepoMetadata = {
      fullName: String(raw.full_name || slug),
      name: String(raw.name || repo),
      description: String(raw.description || ''),
      homepage: typeof raw.homepage === 'string' ? raw.homepage : '',
      htmlUrl: String(raw.html_url || `https://github.com/${slug}`),
      stars: Number(raw.stargazers_count || 0),
      forks: Number(raw.forks_count || 0),
      license:
        licenseObj && typeof licenseObj.spdx_id === 'string' && licenseObj.spdx_id !== 'NOASSERTION'
          ? licenseObj.spdx_id
          : 'Unknown',
      language: typeof raw.language === 'string' ? raw.language : '',
      topics: Array.isArray(raw.topics) ? raw.topics.slice(0, 8).map(String) : [],
      ownerLogin: ownerObj && typeof ownerObj.login === 'string' ? ownerObj.login : owner,
      pushedAt: typeof raw.pushed_at === 'string' ? raw.pushed_at : new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };

    githubCache.set(slug.toLowerCase(), {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: metadata,
    });

    return { ok: true, data: metadata };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Failed to reach GitHub API.',
    };
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      app: 'VibeAtlas',
      hasGithubToken: Boolean(process.env.GITHUB_TOKEN?.trim()),
    });
  });

  app.get('/api/github/repo', async (req: Request, res: Response) => {
    const rawRepo = typeof req.query.repo === 'string' ? req.query.repo : '';
    const slug = parseGitHubRepoSlug(rawRepo);
    if (!slug) {
      res.status(400).json({ error: 'Provide a valid GitHub repository (owner/repo or https://github.com/owner/repo).' });
      return;
    }

    const result = await fetchGitHubRepoFromApi(slug);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ repo: result.data });
  });

  app.get('/api/github/milestones', async (req: Request, res: Response) => {
    const rawRepo = typeof req.query.repo === 'string' ? req.query.repo : '';
    const slug = parseGitHubRepoSlug(rawRepo);
    if (!slug) {
      res.status(400).json({
        error: 'Provide a valid GitHub repository (owner/repo or https://github.com/owner/repo).',
      });
      return;
    }

    const forceRefresh = req.query.refresh === '1';
    const cacheKey = slug.toLowerCase();
    const cached = githubMilestonesCache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      res.json(cached.data);
      return;
    }

    const [owner, repo] = slug.split('/');
    const releasesEndpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=8`;
    const commitsEndpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VibeAtlas-Directory-Sync',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const ghToken = process.env.GITHUB_TOKEN?.trim();
    if (ghToken) {
      headers.Authorization = `Bearer ${ghToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    try {
      const [releasesResp, commitsResp] = await Promise.all([
        fetch(releasesEndpoint, { headers, signal: controller.signal }),
        fetch(commitsEndpoint, { headers, signal: controller.signal }),
      ]);
      clearTimeout(timeout);

      const rateLimited =
        releasesResp.status === 403 ||
        releasesResp.status === 429 ||
        commitsResp.status === 403 ||
        commitsResp.status === 429;

      if (rateLimited) {
        if (cached) {
          res.json({ ...cached.data, staleCache: true });
          return;
        }
        res.status(429).json({
          error:
            'GitHub API rate limit reached while fetching repository milestones. Try again shortly.',
        });
        return;
      }

      if (commitsResp.status === 404 && releasesResp.status === 404) {
        res.status(404).json({ error: `GitHub repository "${slug}" was not found.` });
        return;
      }

      let releases: GitHubReleaseEvent[] = [];
      if (releasesResp.ok) {
        const rawReleases = (await releasesResp.json()) as unknown[];
        if (Array.isArray(rawReleases)) {
          releases = rawReleases
            .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
            .filter((item) => !item.draft)
            .slice(0, 8)
            .map((item) => {
              const authorObj = item.author as Record<string, unknown> | null | undefined;
              const tagName = String(item.tag_name || '').slice(0, 48);
              const name = String(item.name || tagName || 'Release').slice(0, 140);
              const rawBody = typeof item.body === 'string' ? item.body : '';
              return {
                id: String(item.id || tagName || name),
                tagName,
                name,
                bodySummary: rawBody.slice(0, 600),
                htmlUrl:
                  typeof item.html_url === 'string'
                    ? item.html_url
                    : `https://github.com/${slug}/releases`,
                publishedAtIso:
                  typeof item.published_at === 'string' && item.published_at
                    ? item.published_at
                    : typeof item.created_at === 'string'
                      ? item.created_at
                      : '',
                prerelease: Boolean(item.prerelease),
                authorLogin:
                  authorObj && typeof authorObj.login === 'string' ? authorObj.login : '',
              };
            })
            .filter((rel) => Boolean(rel.publishedAtIso));
        }
      }

      let commits: GitHubCommitEvent[] = [];
      if (commitsResp.ok) {
        const rawCommits = (await commitsResp.json()) as unknown[];
        if (Array.isArray(rawCommits)) {
          commits = rawCommits
            .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
            .slice(0, 10)
            .map((item) => {
              const sha = String(item.sha || '');
              const commitObj = item.commit as Record<string, unknown> | null | undefined;
              const commitAuthorObj = commitObj?.author as Record<string, unknown> | null | undefined;
              const ghAuthorObj = item.author as Record<string, unknown> | null | undefined;
              const rawMessage =
                commitObj && typeof commitObj.message === 'string' ? commitObj.message : '';
              const firstLine = rawMessage.split('\n')[0]?.trim() || 'Repository commit';
              const dateIso =
                commitAuthorObj && typeof commitAuthorObj.date === 'string'
                  ? commitAuthorObj.date
                  : '';
              const authorName =
                commitAuthorObj && typeof commitAuthorObj.name === 'string'
                  ? commitAuthorObj.name
                  : 'Contributor';
              return {
                sha,
                shortSha: sha.slice(0, 7),
                messageHeadline: firstLine.slice(0, 160),
                authorLogin:
                  ghAuthorObj && typeof ghAuthorObj.login === 'string' ? ghAuthorObj.login : '',
                authorName: authorName.slice(0, 80),
                htmlUrl:
                  typeof item.html_url === 'string'
                    ? item.html_url
                    : `https://github.com/${slug}/commit/${sha}`,
                committedAtIso: dateIso,
              };
            })
            .filter((c) => Boolean(c.sha && c.committedAtIso));
        }
      }

      const payload: GitHubMilestonesPayload = {
        repo: slug,
        fetchedAt: new Date().toISOString(),
        releases,
        commits,
        staleCache: false,
      };

      githubMilestonesCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        data: payload,
      });

      res.json(payload);
    } catch (err) {
      clearTimeout(timeout);
      if (cached) {
        res.json({ ...cached.data, staleCache: true });
        return;
      }
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to fetch GitHub repository activity.',
      });
    }
  });

  app.post('/api/github/sync-batch', async (req: Request, res: Response) => {
    const rawRepos: unknown[] = Array.isArray(req.body?.repos) ? (req.body.repos as unknown[]) : [];
    const slugs: string[] = rawRepos
      .slice(0, 12)
      .map((item: unknown) => (typeof item === 'string' ? parseGitHubRepoSlug(item) : null))
      .filter((item): item is string => Boolean(item));

    if (slugs.length === 0) {
      res.status(400).json({ error: 'Provide at least one valid owner/repo slug.' });
      return;
    }

    const results: Record<string, GitHubRepoMetadata> = {};
    const errors: Record<string, string> = {};

    await Promise.all(
      slugs.map(async (slug: string) => {
        const result = await fetchGitHubRepoFromApi(slug);
        if (result.ok) {
          results[slug] = result.data;
        } else {
          errors[slug] = result.error;
        }
      })
    );

    res.json({ results, errors });
  });

  app.get('/api/github/top-starred', async (req: Request, res: Response) => {
    const rawPreset = typeof req.query.preset === 'string' ? req.query.preset.trim() : 'all';
    const preset: GitHubTopRepoPreset = isValidTopRepoPreset(rawPreset) ? rawPreset : 'all';
    const forceRefresh = req.query.refresh === '1';

    const cached = readTopStarredCache(preset);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      res.json({
        preset,
        fetchedAt: cached.fetchedAt,
        staleCache: false,
        items: cached.items,
      });
      return;
    }

    const query = TOP_STARRED_PRESET_QUERIES[preset];
    const endpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=1`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VibeAtlas-Directory-Sync',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const ghToken = process.env.GITHUB_TOKEN?.trim();
    if (ghToken) {
      headers.Authorization = `Bearer ${ghToken}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(endpoint, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (resp.status === 403 || resp.status === 429) {
        if (cached && cached.items.length > 0) {
          res.json({
            preset,
            fetchedAt: cached.fetchedAt,
            staleCache: true,
            items: cached.items,
          });
          return;
        }
        const resetHeader = resp.headers.get('x-ratelimit-reset');
        const resetEpoch = resetHeader ? Number(resetHeader) : NaN;
        const resetAtIso =
          Number.isFinite(resetEpoch) && resetEpoch > 0
            ? new Date(resetEpoch * 1000).toISOString()
            : null;
        res.status(429).json({
          error:
            'GitHub Search API rate limit reached. Try again shortly or configure GITHUB_TOKEN on the server.',
          resetAtIso,
        });
        return;
      }

      if (!resp.ok) {
        if (cached && cached.items.length > 0) {
          res.json({
            preset,
            fetchedAt: cached.fetchedAt,
            staleCache: true,
            items: cached.items,
          });
          return;
        }
        res.status(resp.status).json({
          error: `GitHub Search API returned status ${resp.status}.`,
        });
        return;
      }

      const raw = (await resp.json()) as { items?: unknown[] };
      const rawItems = Array.isArray(raw.items) ? raw.items : [];
      const items: GitHubRankedRepo[] = rawItems.slice(0, 100).map((entry, idx) => {
        const repo = entry as Record<string, unknown>;
        const ownerObj = repo.owner as Record<string, unknown> | null | undefined;
        const licenseObj = repo.license as Record<string, unknown> | null | undefined;
        const fullName = String(repo.full_name || '');
        return {
          rank: idx + 1,
          id: Number(repo.id || idx + 1),
          fullName,
          name: String(repo.name || fullName),
          ownerLogin:
            ownerObj && typeof ownerObj.login === 'string'
              ? ownerObj.login
              : fullName.split('/')[0] || '',
          ownerAvatarUrl:
            ownerObj && typeof ownerObj.avatar_url === 'string' ? ownerObj.avatar_url : '',
          description: typeof repo.description === 'string' ? repo.description : '',
          htmlUrl:
            typeof repo.html_url === 'string'
              ? repo.html_url
              : `https://github.com/${fullName}`,
          homepage: typeof repo.homepage === 'string' ? repo.homepage : '',
          stars: Number(repo.stargazers_count || 0),
          forks: Number(repo.forks_count || 0),
          openIssues: Number(repo.open_issues_count || 0),
          language: typeof repo.language === 'string' ? repo.language : '',
          license:
            licenseObj && typeof licenseObj.spdx_id === 'string' && licenseObj.spdx_id !== 'NOASSERTION'
              ? licenseObj.spdx_id
              : 'Unknown',
          topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 6).map(String) : [],
          pushedAt: typeof repo.pushed_at === 'string' ? repo.pushed_at : '',
        };
      });

      const fetchedAt = new Date().toISOString();
      writeTopStarredCache(preset, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        fetchedAt,
        items,
      });

      res.json({
        preset,
        fetchedAt,
        staleCache: false,
        items,
      });
    } catch (err) {
      if (cached && cached.items.length > 0) {
        res.json({
          preset,
          fetchedAt: cached.fetchedAt,
          staleCache: true,
          items: cached.items,
        });
        return;
      }
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to reach GitHub Search API.',
      });
    }
  });

  app.get('/api/github/ai-trending', async (req: Request, res: Response) => {
    const forceRefresh = req.query.refresh === '1';
    const cached = readAiTrendingCache();

    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      res.json({
        fetchedAt: cached.fetchedAt,
        staleCache: false,
        items: cached.items,
      });
      return;
    }

    const sinceDate = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
    const risingSinceDate = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
    const activeQuery = `topic:ai pushed:>=${sinceDate} stars:>500`;
    const risingQuery = `topic:ai created:>=${risingSinceDate} stars:>250`;
    const activeEndpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(activeQuery)}&sort=stars&order=desc&per_page=60&page=1`;
    const risingEndpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(risingQuery)}&sort=stars&order=desc&per_page=30&page=1`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VibeAtlas-Directory-Sync',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const ghToken = process.env.GITHUB_TOKEN?.trim();
    if (ghToken) {
      headers.Authorization = `Bearer ${ghToken}`;
    }

    const serveFallback = (status: number, errorMessage: string, resetAtIso: string | null = null) => {
      if (cached && cached.items.length > 0) {
        res.json({
          fetchedAt: cached.fetchedAt,
          staleCache: true,
          items: cached.items,
        });
        return;
      }
      const derived = deriveFallbackAiTrendingFromTopStarred();
      if (derived) {
        res.json({
          fetchedAt: derived.fetchedAt,
          staleCache: true,
          items: derived.items,
        });
        return;
      }
      res.status(status).json({ error: errorMessage, resetAtIso });
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const [activeResp, risingResp] = await Promise.all([
        fetch(activeEndpoint, { headers, signal: controller.signal }),
        fetch(risingEndpoint, { headers, signal: controller.signal }).catch(() => null),
      ]);
      clearTimeout(timeout);

      if (activeResp.status === 403 || activeResp.status === 429) {
        const resetHeader = activeResp.headers.get('x-ratelimit-reset');
        const resetEpoch = resetHeader ? Number(resetHeader) : NaN;
        const resetAtIso =
          Number.isFinite(resetEpoch) && resetEpoch > 0
            ? new Date(resetEpoch * 1000).toISOString()
            : null;
        serveFallback(
          429,
          'GitHub Search API rate limit reached. Try again shortly or configure GITHUB_TOKEN on the server.',
          resetAtIso
        );
        return;
      }

      if (!activeResp.ok) {
        serveFallback(activeResp.status, `GitHub Search API returned status ${activeResp.status}.`);
        return;
      }

      const activeRaw = (await activeResp.json()) as { items?: unknown[] };
      const activeItems = Array.isArray(activeRaw.items) ? activeRaw.items : [];
      let risingItems: unknown[] = [];
      if (risingResp && risingResp.ok) {
        const risingRaw = (await risingResp.json()) as { items?: unknown[] };
        if (Array.isArray(risingRaw.items)) {
          risingItems = risingRaw.items;
        }
      }

      const dedupedRaw: unknown[] = [];
      const seenRepoKeys = new Set<string>();
      for (const entry of [...risingItems, ...activeItems]) {
        if (!entry || typeof entry !== 'object') continue;
        const rec = entry as Record<string, unknown>;
        const fullName = String(rec.full_name || '').toLowerCase();
        if (!fullName || seenRepoKeys.has(fullName)) continue;
        seenRepoKeys.add(fullName);
        dedupedRaw.push(entry);
      }

      const history = readAiTrendingHistory();
      const todayUtc = new Date().toISOString().slice(0, 10);
      const nowMs = Date.now();

      const items: GitHubAiTrendingRepo[] = dedupedRaw
        .slice(0, 75)
        .map((entry, idx) => {
          const repo = entry as Record<string, unknown>;
          const ownerObj = repo.owner as Record<string, unknown> | null | undefined;
          const licenseObj = repo.license as Record<string, unknown> | null | undefined;
          const fullName = String(repo.full_name || '');
          const stars = Number(repo.stargazers_count || 0);
          const createdAt = typeof repo.created_at === 'string' ? repo.created_at : '';
          const pushedAt = typeof repo.pushed_at === 'string' ? repo.pushed_at : '';

          const historyKey = fullName.toLowerCase();
          if (historyKey && stars > 0) {
            if (!history[historyKey]) history[historyKey] = {};
            history[historyKey]![todayUtc] = stars;
          }

          const metric = computeDailyStarMetric({
            stars,
            createdAt,
            pushedAt,
            snapshots: history[historyKey],
            nowMs,
          });

          return {
            rank: idx + 1,
            id: Number(repo.id || idx + 1),
            fullName,
            name: String(repo.name || fullName),
            ownerLogin:
              ownerObj && typeof ownerObj.login === 'string'
                ? ownerObj.login
                : fullName.split('/')[0] || '',
            ownerAvatarUrl:
              ownerObj && typeof ownerObj.avatar_url === 'string' ? ownerObj.avatar_url : '',
            description: typeof repo.description === 'string' ? repo.description : '',
            htmlUrl:
              typeof repo.html_url === 'string'
                ? repo.html_url
                : `https://github.com/${fullName}`,
            homepage: typeof repo.homepage === 'string' ? repo.homepage : '',
            stars,
            forks: Number(repo.forks_count || 0),
            openIssues: Number(repo.open_issues_count || 0),
            language: typeof repo.language === 'string' ? repo.language : '',
            license:
              licenseObj && typeof licenseObj.spdx_id === 'string' && licenseObj.spdx_id !== 'NOASSERTION'
                ? licenseObj.spdx_id
                : 'Unknown',
            topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 6).map(String) : [],
            createdAt,
            pushedAt,
            dailyStars: metric.dailyStars,
            dailyRateSource: metric.dailyRateSource,
          } satisfies GitHubAiTrendingRepo;
        })
        .filter((item) => Boolean(item.fullName))
        .sort((a, b) => b.dailyStars - a.dailyStars || b.stars - a.stars)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

      if (items.length === 0) {
        serveFallback(502, 'GitHub Search API returned no active AI repositories.');
        return;
      }

      writeAiTrendingHistory(history);
      const fetchedAt = new Date().toISOString();
      writeAiTrendingCache({
        expiresAt: Date.now() + CACHE_TTL_MS,
        fetchedAt,
        items,
      });

      res.json({
        fetchedAt,
        staleCache: false,
        items,
      });
    } catch (err) {
      serveFallback(502, err instanceof Error ? err.message : 'Failed to reach GitHub Search API.');
    }
  });

  app.post('/api/github/translate-descriptions', async (req: Request, res: Response) => {
    const targetLanguage = req.body?.targetLanguage;
    if (!isValidAppLanguage(targetLanguage)) {
      res.status(400).json({ error: 'Invalid targetLanguage. Expected ko, en, zh, or ja.' });
      return;
    }

    const rawItems: unknown[] = Array.isArray(req.body?.items) ? (req.body.items as unknown[]) : [];
    const normalizedItems: { id: string; text: string; cacheKey: string }[] = [];
    for (const entry of rawItems.slice(0, 100)) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const idRaw = rec.id;
      const textRaw = typeof rec.text === 'string' ? rec.text.trim().slice(0, 500) : '';
      if ((typeof idRaw === 'number' || typeof idRaw === 'string') && textRaw) {
        normalizedItems.push({
          id: String(idRaw),
          text: textRaw,
          cacheKey: buildTranslationCacheKey(targetLanguage, textRaw),
        });
      }
    }

    if (normalizedItems.length === 0) {
      res.json({ translations: {}, cachedCount: 0, translatedCount: 0 });
      return;
    }

    loadTranslationDiskCacheOnce();
    const translations: Record<string, string> = {};
    const uncached: { id: string; text: string; cacheKey: string }[] = [];
    let cachedCount = 0;

    for (const item of normalizedItems) {
      const hit = translationCache.get(item.cacheKey);
      if (hit) {
        translations[item.id] = hit;
        cachedCount += 1;
      } else {
        uncached.push(item);
      }
    }

    if (uncached.length === 0) {
      res.json({ translations, cachedCount, translatedCount: 0 });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Translation service API key is not configured on the server (Settings > Secrets).',
        errorCode: 'MISSING_API_KEY',
        translations,
        cachedCount,
        translatedCount: 0,
      });
      return;
    }

    const chunks = chunkTranslationItems(uncached, 15);
    let translatedCount = 0;
    let lastModelUsed = '';
    let firstFailure: { status: number; message: string } | null = null;
    const targetName = TARGET_LANGUAGE_NAMES[targetLanguage];

    const translateChunk = async (chunk: typeof uncached) => {
      const promptPayload = chunk.map((item) => ({ id: item.id, text: item.text }));
      const models = getPrioritizedTranslationModels();

      const { value: parsedRows, modelUsed } = await executeTranslationWithFallback({
        models,
        maxRetriesPerModel: 1,
        baseDelayMs: 350,
        runAttempt: async (model) => {
          const timeoutController = new AbortController();
          const timer = setTimeout(() => timeoutController.abort(), TRANSLATION_ATTEMPT_TIMEOUT_MS);
          try {
            const response = await ai.models.generateContent({
              model,
              contents:
                `Translate each GitHub repository description into natural, concise ${targetName}. ` +
                `Preserve technical terms, project names, frameworks, and acronyms accurately.\n\n` +
                JSON.stringify(promptPayload),
              config: {
                abortSignal: timeoutController.signal,
                systemInstruction:
                  'You translate GitHub repository descriptions cleanly into the requested target language while keeping technical terms accurate. Output only structured JSON matching the schema.',
                thinkingConfig: {
                  thinkingLevel:
                    model === 'gemini-4-hydrogen' ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL,
                },
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      translatedText: { type: Type.STRING },
                    },
                    required: ['id', 'translatedText'],
                  },
                },
              },
            });

            const rows = parseTranslationBatchResponse(response.text);
            if (rows.length === 0 && promptPayload.length > 0) {
              throw new Error('Model returned empty structured translation payload.');
            }
            modelCooldownUntil.delete(model);
            return rows;
          } catch (attemptErr) {
            if (isRetryableTranslationError(attemptErr)) {
              modelCooldownUntil.set(model, Date.now() + TRANSLATION_MODEL_COOLDOWN_MS);
            }
            throw attemptErr;
          } finally {
            clearTimeout(timer);
          }
        },
      });

      lastModelUsed = modelUsed;
      const itemById = new Map(chunk.map((c) => [c.id, c]));
      for (const row of parsedRows) {
        const sourceItem = itemById.get(row.id);
        if (sourceItem && row.translatedText) {
          translations[row.id] = row.translatedText;
          translationCache.set(sourceItem.cacheKey, row.translatedText);
          translatedCount += 1;
        }
      }
    };

    try {
      // Process up to 2 chunks concurrently for faster real-time response without spiking RPM
      for (let i = 0; i < chunks.length; i += 2) {
        const pair = chunks.slice(i, i + 2);
        const settled = await Promise.allSettled(pair.map((chunk) => translateChunk(chunk)));
        for (const outcome of settled) {
          if (outcome.status === 'rejected' && !firstFailure) {
            firstFailure = extractTranslationErrorDetails(outcome.reason);
          }
        }
        // Stop early on non-retryable credential/key errors
        if (firstFailure && (firstFailure.status === 400 || firstFailure.status === 401 || firstFailure.status === 403)) {
          break;
        }
      }

      if (translatedCount > 0) {
        persistTranslationDiskCache();
      }

      if (firstFailure && translatedCount === 0) {
        res.status(firstFailure.status).json({
          error: firstFailure.message,
          translations,
          cachedCount,
          translatedCount,
        });
        return;
      }

      res.json({
        translations,
        cachedCount,
        translatedCount,
        modelUsed: lastModelUsed || undefined,
        partialError: firstFailure ? firstFailure.message : undefined,
      });
    } catch (err) {
      if (translatedCount > 0) {
        persistTranslationDiskCache();
      }
      const { status, message } = extractTranslationErrorDetails(err);
      res.status(status).json({
        error: message,
        translations,
        cachedCount,
        translatedCount,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VibeAtlas listening on http://localhost:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start VibeAtlas server:', err);
  process.exit(1);
});
