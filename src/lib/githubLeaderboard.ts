import type { CatalogProject, GitHubRankedRepo } from '../types/vibeatlas';

export interface LeaderboardSummary {
  totalRepos: number;
  topStars: number;
  topRepoName: string;
  medianStars: number;
  totalCombinedStars: number;
}

export function filterGitHubRankedRepos(
  items: ReadonlyArray<GitHubRankedRepo>,
  query: string,
  languageFilter: string,
  translatedDescriptions?: Readonly<Record<number, string>>
): GitHubRankedRepo[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedLang = languageFilter.trim().toLowerCase();

  return items.filter((repo) => {
    if (normalizedLang && normalizedLang !== 'all') {
      if ((repo.language || '').toLowerCase() !== normalizedLang) {
        return false;
      }
    }
    if (!normalizedQuery) return true;
    const translatedDesc = translatedDescriptions?.[repo.id] ?? '';
    const haystack = [
      repo.fullName,
      repo.description,
      translatedDesc,
      repo.language,
      repo.license,
      repo.ownerLogin,
      ...repo.topics,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function extractLeaderboardLanguages(items: ReadonlyArray<GitHubRankedRepo>): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const lang = (item.language || '').trim();
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([lang]) => lang);
}

export function computeLeaderboardSummary(items: ReadonlyArray<GitHubRankedRepo>): LeaderboardSummary {
  if (items.length === 0) {
    return {
      totalRepos: 0,
      topStars: 0,
      topRepoName: '',
      medianStars: 0,
      totalCombinedStars: 0,
    };
  }

  const sortedStars = items.map((r) => Math.max(0, r.stars)).sort((a, b) => b - a);
  const mid = Math.floor(sortedStars.length / 2);
  const medianStars =
    sortedStars.length % 2 === 1
      ? sortedStars[mid]!
      : Math.round((sortedStars[mid - 1]! + sortedStars[mid]!) / 2);

  let totalCombinedStars = 0;
  for (const s of sortedStars) totalCombinedStars += s;

  const topRepo = items.reduce((best, cur) => (cur.stars > best.stars ? cur : best), items[0]!);

  return {
    totalRepos: items.length,
    topStars: topRepo.stars,
    topRepoName: topRepo.fullName,
    medianStars,
    totalCombinedStars,
  };
}

export function findCatalogProjectByRepo(
  projects: ReadonlyArray<CatalogProject>,
  fullName: string
): CatalogProject | null {
  const target = fullName.trim().toLowerCase();
  if (!target) return null;
  return (
    projects.find((p) => (p.githubRepo || '').trim().toLowerCase() === target) ?? null
  );
}
