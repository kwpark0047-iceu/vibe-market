export type AppLanguage = 'ko' | 'en' | 'zh' | 'ja';

export type ContentType =
  | 'web_app'
  | 'ai_tool'
  | 'mcp_server'
  | 'ai_skill'
  | 'ai_agent'
  | 'template'
  | 'open_source';

export type ProjectCategory =
  | 'AI Agent'
  | 'MCP Server'
  | 'Web Tool'
  | 'CLI Tool'
  | 'Framework'
  | 'AI Skills'
  | 'Developer Tools'
  | 'Workflow'
  | 'Korean Builders'
  | 'Templates'
  | 'Backend'
  | 'SDK';

export type DevelopmentPlatform =
  | 'lovable'
  | 'cursor'
  | 'windsurf'
  | 'bolt'
  | 'v0'
  | 'claude_code'
  | 'replit'
  | 'custom';

export type HostingProvider =
  | 'vercel'
  | 'cloudflare'
  | 'aws'
  | 'fly_io'
  | 'gcp'
  | 'netlify'
  | 'self_hosted'
  | 'unknown';

export type BackendTech =
  | 'supabase'
  | 'firebase'
  | 'postgresql'
  | 'nodejs'
  | 'python_fastapi'
  | 'sqlite'
  | 'serverless'
  | 'none'
  | 'unknown';

export type PricingModel = 'free' | 'open_source' | 'freemium' | 'paid' | 'enterprise';

export type VerificationStatus = 'verified' | 'pending' | 'unverified';

export type ProvenanceSource = 'github_sync' | 'maker_submitted' | 'editorial_curated';

export type FreshnessState = 'fresh' | 'stale' | 'unknown';

export type SortOption =
  | 'relevance'
  | 'trending_24h'
  | 'trending_7d'
  | 'trending_30d'
  | 'most_starred'
  | 'most_liked'
  | 'most_bookmarked'
  | 'recently_added'
  | 'recently_updated';

export type ViewMode = 'grid' | 'list';

export type ActivePage = 'home' | 'discover' | 'stars' | 'maker' | 'submit';

export interface DailySignalPoint {
  date: string;
  githubStarsDelta: number;
  internalLikes: number;
  internalBookmarks: number;
}

export interface CatalogProject {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  taglineKo: string;
  description: string;
  descriptionKo: string;
  contentType: ContentType;
  categories: string[];
  techStack: string[];
  developmentPlatform: DevelopmentPlatform;
  hostingProvider: HostingProvider;
  backendTech: BackendTech;
  country: string;
  language: 'ko' | 'en' | 'bilingual' | 'other';
  license: string;
  pricingModel: PricingModel;
  verificationStatus: VerificationStatus;
  provenanceSource: ProvenanceSource;
  liveDemoUrl: string;
  websiteUrl: string;
  githubRepo: string;
  githubUrl: string;
  thumbnailUrl: string;
  makerName: string;
  makerHandle: string;
  ownerUid: string;
  githubStars: number;
  githubForks: number;
  likesCount: number;
  bookmarksCount: number;
  lastSyncedAt: string;
  createdAtIso: string;
  updatedAtIso: string;
  isCuratedSeed?: boolean;
  isFeatured?: boolean;
  leaderboardRank?: number;
  historicalSignals?: DailySignalPoint[];
}

export interface SearchFilters {
  q: string;
  type: ContentType | 'all';
  category: ProjectCategory | 'all';
  tags: string[];
  platform: DevelopmentPlatform | 'all';
  hosting: HostingProvider | 'all';
  backend: BackendTech | 'all';
  country: string;
  lang: 'all' | 'ko' | 'en' | 'bilingual' | 'other';
  license: string;
  pricing: PricingModel | 'all';
  verified: VerificationStatus | 'all';
  minStars: number;
  updatedWithinDays: number;
  sort: SortOption;
  view: ViewMode;
  page: number;
}

export interface SearchSuggestion {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  contentType: ContentType;
}

export interface ProjectReportRecord {
  id: string;
  projectId: string;
  projectSlug: string;
  reporterUid: string;
  reason: 'broken_link' | 'stale_metadata' | 'spam' | 'misattribution' | 'security_concern';
  details: string;
  status: 'open' | 'reviewed' | 'resolved';
  createdAtIso: string;
}

export interface OwnershipClaimRecord {
  id: string;
  projectId: string;
  projectSlug: string;
  claimantUid: string;
  verificationMethod: 'github_repo' | 'domain_dns' | 'demo_meta';
  proofNote: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAtIso: string;
}

export type CommunityActivityType = 'like' | 'bookmark' | 'report';

export interface ProjectActivityRecord {
  id: string;
  projectId: string;
  projectSlug: string;
  actorUid: string;
  actorName: string;
  actorHandle: string;
  type: CommunityActivityType;
  reportReason: '' | ProjectReportRecord['reason'];
  createdAtIso: string;
  source: 'firestore' | 'local';
}

export interface GitHubRepoMetadata {
  fullName: string;
  name: string;
  description: string;
  homepage: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  license: string;
  language: string;
  topics: string[];
  ownerLogin: string;
  pushedAt: string;
  fetchedAt: string;
}

export type GitHubTopRepoPreset =
  | 'all'
  | 'web_apps'
  | 'ai_agents'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go';

export interface GitHubRankedRepo {
  rank: number;
  id: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  license: string;
  topics: string[];
  pushedAt: string;
}

export type DailyStarRateSource = 'snapshot_24h' | 'daily_velocity_rate';

export interface GitHubAiTrendingRepo {
  rank: number;
  id: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  license: string;
  topics: string[];
  createdAt: string;
  pushedAt: string;
  dailyStars: number;
  dailyRateSource: DailyStarRateSource;
}

export type MilestoneSource =
  | 'github_release'
  | 'github_commit'
  | 'creator_log'
  | 'catalog_event';

export type CreatorMilestoneKind = 'release' | 'launch' | 'feature' | 'update' | 'fix';

export interface GitHubReleaseEvent {
  id: string;
  tagName: string;
  name: string;
  bodySummary: string;
  htmlUrl: string;
  publishedAtIso: string;
  prerelease: boolean;
  authorLogin: string;
}

export interface GitHubCommitEvent {
  sha: string;
  shortSha: string;
  messageHeadline: string;
  authorLogin: string;
  authorName: string;
  htmlUrl: string;
  committedAtIso: string;
}

export interface GitHubMilestonesPayload {
  repo: string;
  fetchedAt: string;
  releases: GitHubReleaseEvent[];
  commits: GitHubCommitEvent[];
  staleCache?: boolean;
}

export interface ProjectMilestoneRecord {
  id: string;
  projectId: string;
  projectSlug: string;
  authorUid: string;
  authorName: string;
  authorHandle: string;
  kind: CreatorMilestoneKind;
  versionTag: string;
  title: string;
  summary: string;
  externalUrl: string;
  occurredAtIso: string;
  createdAtIso: string;
  source: 'firestore' | 'local';
}

export type TimelineFilterMode = 'all' | 'releases' | 'commits' | 'creator_logs';
export type TimelineSortOrder = 'newest' | 'oldest';

export interface TimelineEntry {
  id: string;
  source: MilestoneSource;
  kind: CreatorMilestoneKind | 'commit' | 'launch' | 'sync' | 'verified';
  title: string;
  summary: string;
  versionTag: string;
  actorLabel: string;
  externalUrl: string;
  timestampIso: string;
  timestampMs: number;
  prerelease?: boolean;
  shortSha?: string;
  creatorRecord?: ProjectMilestoneRecord;
}

