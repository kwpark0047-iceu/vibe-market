import type {
  BackendTech,
  CatalogProject,
  DevelopmentPlatform,
  GitHubRankedRepo,
  HostingProvider,
} from '../types/vibeatlas';
import { sanitizeExternalUrl } from './validation';
import { normalizeTopicsToCanonicalTags } from './projectTags';

function inferPlatform(repo: GitHubRankedRepo): DevelopmentPlatform {
  const text = `${repo.fullName} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();
  if (text.includes('next') || text.includes('vercel') || text.includes('v0')) return 'v0';
  if (text.includes('cursor')) return 'cursor';
  if (text.includes('lovable')) return 'lovable';
  if (text.includes('bolt')) return 'bolt';
  return 'custom';
}

function inferHosting(repo: GitHubRankedRepo): HostingProvider {
  const text = `${repo.homepage} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();
  if (text.includes('vercel')) return 'vercel';
  if (text.includes('cloudflare')) return 'cloudflare';
  if (text.includes('netlify')) return 'netlify';
  if (text.includes('self-hosted') || text.includes('docker')) return 'self_hosted';
  return 'unknown';
}

function inferBackend(repo: GitHubRankedRepo): BackendTech {
  const lang = (repo.language || '').toLowerCase();
  const topics = repo.topics.join(' ').toLowerCase();
  if (topics.includes('supabase')) return 'supabase';
  if (topics.includes('firebase')) return 'firebase';
  if (lang === 'python' || topics.includes('fastapi')) return 'python_fastapi';
  if (lang === 'typescript' || lang === 'javascript') return 'nodejs';
  if (topics.includes('postgres') || topics.includes('postgresql')) return 'postgresql';
  if (topics.includes('sqlite')) return 'sqlite';
  return 'unknown';
}

export function mapWebAppReposToCatalogProjects(
  repos: ReadonlyArray<GitHubRankedRepo>,
  fetchedAt: string,
  translatedDescriptions?: Readonly<Record<number, string>>
): CatalogProject[] {
  return repos.map((repo, idx) => {
    const rank = Number.isFinite(repo.rank) && repo.rank > 0 ? repo.rank : idx + 1;
    const safeSlug = `webapp-${rank}-${repo.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;
    const safeHomepage = sanitizeExternalUrl(repo.homepage) ?? '';
    const safeGithubUrl =
      sanitizeExternalUrl(repo.htmlUrl) ?? `https://github.com/${repo.fullName}`;
    const baseDescription =
      (repo.description || '').trim() || `Open-source web application repository (${repo.fullName}).`;
    const translated = translatedDescriptions?.[repo.id]?.trim() || '';
    const normalizedTopics = normalizeTopicsToCanonicalTags(repo.topics);
    const categories = Array.from(
      new Set(['Web Application', 'Web Tool', ...normalizedTopics])
    ).slice(0, 6);
    const techStack = Array.from(
      new Set(
        [repo.language, ...repo.topics.slice(0, 4)]
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    return {
      id: `gh-webapp-${repo.id}`,
      slug: safeSlug,
      name: repo.name || repo.fullName,
      tagline: baseDescription,
      taglineKo: translated,
      description: baseDescription,
      descriptionKo: translated,
      contentType: 'web_app',
      categories,
      techStack: techStack.length > 0 ? techStack : ['Web'],
      developmentPlatform: inferPlatform(repo),
      hostingProvider: inferHosting(repo),
      backendTech: inferBackend(repo),
      country: 'Global',
      language: 'en',
      license: repo.license || 'Unknown',
      pricingModel: 'open_source',
      verificationStatus: 'verified',
      provenanceSource: 'github_sync',
      liveDemoUrl: safeHomepage,
      websiteUrl: safeHomepage,
      githubRepo: repo.fullName,
      githubUrl: safeGithubUrl,
      thumbnailUrl: '',
      makerName: repo.ownerLogin || repo.fullName.split('/')[0] || 'GitHub',
      makerHandle: repo.ownerLogin ? `@${repo.ownerLogin}` : '',
      ownerUid: 'github-top-100',
      githubStars: Math.max(0, repo.stars),
      githubForks: Math.max(0, repo.forks),
      likesCount: 0,
      bookmarksCount: 0,
      lastSyncedAt: fetchedAt || repo.pushedAt || new Date().toISOString(),
      createdAtIso: repo.pushedAt || fetchedAt || new Date().toISOString(),
      updatedAtIso: repo.pushedAt || fetchedAt || new Date().toISOString(),
      isCuratedSeed: true,
      leaderboardRank: rank,
    };
  });
}

export function mergeWebAppTop100WithCatalog(
  baseProjects: ReadonlyArray<CatalogProject>,
  top100WebApps: ReadonlyArray<CatalogProject>
): CatalogProject[] {
  if (top100WebApps.length === 0) {
    return [...baseProjects];
  }

  const byRepo = new Map<string, CatalogProject>();
  for (const proj of baseProjects) {
    const repoKey = proj.githubRepo.trim().toLowerCase();
    if (repoKey) {
      byRepo.set(repoKey, proj);
    }
  }

  const rankedList: CatalogProject[] = top100WebApps.map((topProj) => {
    const repoKey = topProj.githubRepo.trim().toLowerCase();
    const existing = repoKey ? byRepo.get(repoKey) : undefined;
    if (!existing) return topProj;
    return {
      ...existing,
      leaderboardRank: topProj.leaderboardRank,
      githubStars: Math.max(existing.githubStars, topProj.githubStars),
      githubForks: Math.max(existing.githubForks, topProj.githubForks),
      lastSyncedAt: topProj.lastSyncedAt || existing.lastSyncedAt,
    };
  });

  const rankedIds = new Set(rankedList.map((p) => p.id));
  const rankedRepoKeys = new Set(
    rankedList.map((p) => p.githubRepo.trim().toLowerCase()).filter(Boolean)
  );

  const nonRanked = baseProjects.filter((proj) => {
    if (rankedIds.has(proj.id)) return false;
    const repoKey = proj.githubRepo.trim().toLowerCase();
    if (repoKey && rankedRepoKeys.has(repoKey)) return false;
    return true;
  });

  return [...rankedList, ...nonRanked];
}
