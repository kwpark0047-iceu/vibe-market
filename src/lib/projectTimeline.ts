import * as d3 from 'd3';
import type {
  AppLanguage,
  CatalogProject,
  GitHubCommitEvent,
  GitHubMilestonesPayload,
  GitHubReleaseEvent,
  ProjectMilestoneRecord,
  TimelineEntry,
  TimelineFilterMode,
  TimelineSortOrder,
} from '../types/vibeatlas';
import type { MakerVerificationInfo } from './makerVerification';
import { sanitizeExternalUrl } from './validation';

export function parseTimelineIsoMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function cleanReleaseSummary(raw: string, maxChars = 260): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`~>-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars - 1).trimEnd()}…`;
}

export function formatTimelineDateShort(iso: string): string {
  const ms = parseTimelineIsoMs(iso);
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(0, 10);
}

export function buildCatalogMilestoneEntries(
  project: Pick<
    CatalogProject,
    | 'id'
    | 'name'
    | 'slug'
    | 'makerName'
    | 'createdAtIso'
    | 'lastSyncedAt'
    | 'githubUrl'
    | 'websiteUrl'
    | 'liveDemoUrl'
    | 'githubStars'
  >,
  makerVerification: Pick<MakerVerificationInfo, 'isClaimedByMaker' | 'matchedClaim'>,
  language: AppLanguage
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const createdMs = parseTimelineIsoMs(project.createdAtIso);
  const projectRefUrl =
    sanitizeExternalUrl(project.githubUrl) ||
    sanitizeExternalUrl(project.websiteUrl) ||
    sanitizeExternalUrl(project.liveDemoUrl) ||
    '';

  if (createdMs > 0) {
    const titleByLang: Record<AppLanguage, string> = {
      ko: 'VibeAtlas 디렉터리 등재',
      en: 'Listed on VibeAtlas Directory',
      zh: '收录至 VibeAtlas 目录',
      ja: 'VibeAtlas ディレクトリに掲載',
    };
    const summaryByLang: Record<AppLanguage, string> = {
      ko: `${project.name}의 초기 메타데이터와 저장소 정보가 디렉터리에 등록되었습니다.`,
      en: `Initial directory profile and stack metadata indexed for ${project.name}.`,
      zh: `已为 ${project.name} 建立初始目录档案与技术栈元数据。`,
      ja: `${project.name} の初期ディレクトリ情報と技術スタックを登録しました。`,
    };
    entries.push({
      id: `cat_launch_${project.id}`,
      source: 'catalog_event',
      kind: 'launch',
      title: titleByLang[language],
      summary: summaryByLang[language],
      versionTag: 'Index',
      actorLabel: project.makerName || 'VibeAtlas',
      externalUrl: projectRefUrl,
      timestampIso: project.createdAtIso,
      timestampMs: createdMs,
    });
  }

  const syncedMs = parseTimelineIsoMs(project.lastSyncedAt);
  if (syncedMs > 0 && Math.abs(syncedMs - createdMs) > 3_600_000) {
    const syncTitleByLang: Record<AppLanguage, string> = {
      ko: 'GitHub 공식 지표 동기화 완료',
      en: 'GitHub Repository Metrics Synced',
      zh: '已完成 GitHub 仓库指标同步',
      ja: 'GitHub 公式メトリクスを同期',
    };
    const syncSummaryByLang: Record<AppLanguage, string> = {
      ko: `공식 REST API 기준 ${project.githubStars.toLocaleString()} Stars 상태를 반영했습니다.`,
      en: `Verified live repository metadata (${project.githubStars.toLocaleString()} stars).`,
      zh: `已同步官方 REST API 仓库数据（${project.githubStars.toLocaleString()} Stars）。`,
      ja: `公式 REST API に基づき最新データ（${project.githubStars.toLocaleString()} Stars）を反映しました。`,
    };
    entries.push({
      id: `cat_sync_${project.id}`,
      source: 'catalog_event',
      kind: 'sync',
      title: syncTitleByLang[language],
      summary: syncSummaryByLang[language],
      versionTag: 'Sync',
      actorLabel: 'GitHub REST API',
      externalUrl: sanitizeExternalUrl(project.githubUrl) || '',
      timestampIso: project.lastSyncedAt,
      timestampMs: syncedMs,
    });
  }

  const claimMs = makerVerification.matchedClaim
    ? parseTimelineIsoMs(makerVerification.matchedClaim.createdAtIso)
    : 0;
  if (makerVerification.isClaimedByMaker && claimMs > 0) {
    const claimTitleByLang: Record<AppLanguage, string> = {
      ko: '메이커 소유권 인증 승인',
      en: 'Maker Ownership Verified',
      zh: '作者所有权认证已通过',
      ja: 'メイカー所有権認証を承認',
    };
    const claimSummaryByLang: Record<AppLanguage, string> = {
      ko: `${project.makerName} 제작자 계정의 공식 소유권 검증이 완료되었습니다.`,
      en: `Official project ownership confirmed for ${project.makerName}.`,
      zh: `已确认 ${project.makerName} 的官方项目所有权。`,
      ja: `${project.makerName} の公式プロジェクト所有権を確認しました。`,
    };
    entries.push({
      id: `cat_verified_${project.id}`,
      source: 'catalog_event',
      kind: 'verified',
      title: claimTitleByLang[language],
      summary: claimSummaryByLang[language],
      versionTag: 'Verified',
      actorLabel: project.makerName || 'Maker',
      externalUrl: '',
      timestampIso: makerVerification.matchedClaim!.createdAtIso,
      timestampMs: claimMs,
    });
  }

  return entries;
}

export function buildTimelineEntries(params: {
  project: Pick<
    CatalogProject,
    | 'id'
    | 'name'
    | 'slug'
    | 'makerName'
    | 'createdAtIso'
    | 'lastSyncedAt'
    | 'githubUrl'
    | 'websiteUrl'
    | 'liveDemoUrl'
    | 'githubStars'
  >;
  makerVerification: Pick<MakerVerificationInfo, 'isClaimedByMaker' | 'matchedClaim'>;
  language: AppLanguage;
  githubMilestones?: GitHubMilestonesPayload | null;
  creatorMilestones?: ReadonlyArray<ProjectMilestoneRecord>;
  sortOrder?: TimelineSortOrder;
}): TimelineEntry[] {
  const {
    project,
    makerVerification,
    language,
    githubMilestones = null,
    creatorMilestones = [],
    sortOrder = 'newest',
  } = params;

  const byId = new Map<string, TimelineEntry>();

  if (githubMilestones) {
    for (const rel of githubMilestones.releases as GitHubReleaseEvent[]) {
      const tsMs = parseTimelineIsoMs(rel.publishedAtIso);
      if (!tsMs) continue;
      const safeUrl = sanitizeExternalUrl(rel.htmlUrl) || '';
      const entryId = `gh_rel_${rel.id}`;
      byId.set(entryId, {
        id: entryId,
        source: 'github_release',
        kind: 'release',
        title: rel.name || rel.tagName,
        summary: cleanReleaseSummary(rel.bodySummary),
        versionTag: rel.tagName,
        actorLabel: rel.authorLogin ? `@${rel.authorLogin}` : 'GitHub Release',
        externalUrl: safeUrl,
        timestampIso: rel.publishedAtIso,
        timestampMs: tsMs,
        prerelease: rel.prerelease,
      });
    }

    for (const commit of githubMilestones.commits as GitHubCommitEvent[]) {
      const tsMs = parseTimelineIsoMs(commit.committedAtIso);
      if (!tsMs) continue;
      const safeUrl = sanitizeExternalUrl(commit.htmlUrl) || '';
      const entryId = `gh_cmt_${commit.sha}`;
      const actor =
        commit.authorLogin
          ? `@${commit.authorLogin}`
          : commit.authorName || 'Contributor';
      byId.set(entryId, {
        id: entryId,
        source: 'github_commit',
        kind: 'commit',
        title: commit.messageHeadline,
        summary: '',
        versionTag: commit.shortSha,
        actorLabel: actor,
        externalUrl: safeUrl,
        timestampIso: commit.committedAtIso,
        timestampMs: tsMs,
        shortSha: commit.shortSha,
      });
    }
  }

  for (const log of creatorMilestones) {
    if (log.projectId !== project.id && log.projectSlug !== project.slug) continue;
    const tsMs = parseTimelineIsoMs(log.occurredAtIso) || parseTimelineIsoMs(log.createdAtIso);
    if (!tsMs) continue;
    const safeUrl = sanitizeExternalUrl(log.externalUrl) || '';
    const entryId = `cr_${log.id}`;
    byId.set(entryId, {
      id: entryId,
      source: 'creator_log',
      kind: log.kind,
      title: log.title,
      summary: log.summary,
      versionTag: log.versionTag,
      actorLabel: log.authorHandle ? `${log.authorName} (${log.authorHandle})` : log.authorName,
      externalUrl: safeUrl,
      timestampIso: log.occurredAtIso || log.createdAtIso,
      timestampMs: tsMs,
      creatorRecord: log,
    });
  }

  for (const catEntry of buildCatalogMilestoneEntries(project, makerVerification, language)) {
    byId.set(catEntry.id, catEntry);
  }

  const entries = Array.from(byId.values());
  entries.sort((a, b) =>
    sortOrder === 'oldest'
      ? a.timestampMs - b.timestampMs || a.id.localeCompare(b.id)
      : b.timestampMs - a.timestampMs || a.id.localeCompare(b.id)
  );
  return entries;
}

export function isReleaseMilestoneEntry(entry: TimelineEntry): boolean {
  return (
    entry.source === 'github_release' ||
    (entry.source === 'creator_log' && (entry.kind === 'release' || entry.kind === 'launch'))
  );
}

export function filterTimelineEntries(
  entries: ReadonlyArray<TimelineEntry>,
  filterMode: TimelineFilterMode
): TimelineEntry[] {
  if (filterMode === 'all') return [...entries];
  if (filterMode === 'releases') {
    return entries.filter(isReleaseMilestoneEntry);
  }
  if (filterMode === 'commits') {
    return entries.filter((item) => item.source === 'github_commit');
  }
  return entries.filter((item) => item.source === 'creator_log');
}

export function summarizeTimelineCounts(entries: ReadonlyArray<TimelineEntry>): {
  all: number;
  releases: number;
  commits: number;
  creatorLogs: number;
} {
  let releases = 0;
  let commits = 0;
  let creatorLogs = 0;

  for (const entry of entries) {
    if (isReleaseMilestoneEntry(entry)) releases += 1;
    if (entry.source === 'github_commit') commits += 1;
    if (entry.source === 'creator_log') creatorLogs += 1;
  }

  return {
    all: entries.length,
    releases,
    commits,
    creatorLogs,
  };
}

export function computeGapDaysBetweenEntries(
  previousEntry: TimelineEntry | undefined,
  currentEntry: TimelineEntry
): number {
  if (!previousEntry) return 0;
  const diffMs = Math.abs(previousEntry.timestampMs - currentEntry.timestampMs);
  const diffDays = Math.floor(diffMs / 86_400_000);
  return diffDays >= 7 ? diffDays : 0;
}

export interface TimelineCadenceMarker {
  id: string;
  source: TimelineEntry['source'];
  xPercent: number;
  dateLabel: string;
  title: string;
}

export interface TimelineCadenceSummary {
  startDate: string;
  endDate: string;
  spanDays: number;
  markers: TimelineCadenceMarker[];
}

export function computeTimelineCadence(
  entries: ReadonlyArray<TimelineEntry>
): TimelineCadenceSummary | null {
  const valid = entries.filter((item) => item.timestampMs > 0);
  if (valid.length === 0) return null;

  const minMs = d3.min(valid, (d) => d.timestampMs) ?? valid[0].timestampMs;
  const maxMs = d3.max(valid, (d) => d.timestampMs) ?? valid[0].timestampMs;
  const spanDays = Math.max(1, Math.round((maxMs - minMs) / 86_400_000));

  const domainStart = minMs === maxMs ? minMs - 86_400_000 : minMs;
  const domainEnd = minMs === maxMs ? maxMs + 86_400_000 : maxMs;
  const scale = d3
    .scaleTime()
    .domain([new Date(domainStart), new Date(domainEnd)])
    .range([4, 96]);

  const markers: TimelineCadenceMarker[] = valid.map((item) => ({
    id: item.id,
    source: item.source,
    xPercent: Number(scale(new Date(item.timestampMs)).toFixed(2)),
    dateLabel: formatTimelineDateShort(item.timestampIso),
    title: item.versionTag ? `${item.versionTag} · ${item.title}` : item.title,
  }));

  return {
    startDate: new Date(minMs).toISOString().slice(0, 10),
    endDate: new Date(maxMs).toISOString().slice(0, 10),
    spanDays,
    markers,
  };
}
