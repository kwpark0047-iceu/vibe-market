import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import type {
  ActivePage,
  AppLanguage,
  CatalogProject,
  GitHubAiTrendingRepo,
} from '../types/vibeatlas';
import { UI_STRINGS } from '../data/i18n';
import { formatCompactCount } from '../lib/catalogEngine';
import {
  chunkTranslationItems,
  needsDescriptionTranslation,
} from '../lib/repoDescriptionTranslator';
import { selectTrending24hProjects } from '../lib/trending24h';
import { sanitizeExternalUrl } from '../lib/validation';

interface HomeTrending24hSectionProps {
  language: AppLanguage;
  catalogProjects: CatalogProject[];
  snapshotRevision?: number;
  onOpenDetail: (project: CatalogProject) => void;
  onNavigate: (page: ActivePage) => void;
}

interface AiTrendingApiResponse {
  fetchedAt?: string;
  staleCache?: boolean;
  items?: GitHubAiTrendingRepo[];
  error?: string;
}

export function HomeTrending24hSection({
  language,
  catalogProjects,
  snapshotRevision = 0,
  onOpenDetail,
  onNavigate,
}: HomeTrending24hSectionProps) {
  const homeCopy = UI_STRINGS[language].home;

  const [liveRepos, setLiveRepos] = useState<GitHubAiTrendingRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [translationsByLang, setTranslationsByLang] = useState<
    Partial<Record<AppLanguage, Record<number, string>>>
  >({});

  const loadLiveTrending = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = forceRefresh
        ? '/api/github/ai-trending?refresh=1'
        : '/api/github/ai-trending';
      const resp = await fetch(url);
      const data = (await resp.json()) as AiTrendingApiResponse;
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      setLiveRepos(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : homeCopy.trending24hErrorTitle);
    } finally {
      setIsLoading(false);
    }
  }, [homeCopy.trending24hErrorTitle]);

  useEffect(() => {
    void loadLiveTrending(false);
  }, [loadLiveTrending]);

  const summary = useMemo(
    () =>
      selectTrending24hProjects({
        catalogProjects,
        liveTrendingRepos: liveRepos,
        languageFilter: selectedLanguage,
        limit: 6,
      }),
    [catalogProjects, liveRepos, selectedLanguage, snapshotRevision]
  );

  // Non-blocking background translation of GitHub repo descriptions for ko / zh / ja
  useEffect(() => {
    if (language === 'en' || liveRepos.length === 0) return;
    const existing = translationsByLang[language] ?? {};
    const pending = liveRepos
      .slice(0, 18)
      .filter(
        (repo) =>
          repo.description &&
          needsDescriptionTranslation(repo.description, language) &&
          !existing[repo.id]
      )
      .map((repo) => ({ id: repo.id, text: repo.description }));
    if (pending.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      const batches = chunkTranslationItems(pending, 12);
      for (const batch of batches) {
        if (cancelled) break;
        try {
          const resp = await fetch('/api/github/translate-descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetLanguage: language, items: batch }),
            signal: controller.signal,
          });
          if (!resp.ok) break;
          const data = (await resp.json()) as { translations?: Record<string, string> };
          if (!cancelled && data.translations) {
            const updates: Array<[number, string]> = [];
            for (const [k, v] of Object.entries(data.translations)) {
              const idNum = Number(k);
              if (Number.isFinite(idNum) && typeof v === 'string' && v.trim()) {
                updates.push([idNum, v.trim()]);
              }
            }
            if (updates.length > 0) {
              setTranslationsByLang((prev) => {
                const nextMap = { ...(prev[language] ?? {}) };
                for (const [idNum, txt] of updates) nextMap[idNum] = txt;
                return { ...prev, [language]: nextMap };
              });
            }
          }
        } catch {
          // Fallback gracefully to original description
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [language, liveRepos, translationsByLang]);

  const activeLangMap = language === 'en' ? undefined : translationsByLang[language];

  return (
    <section
      aria-labelledby="home-trending-24h-heading"
      data-testid="home-trending-24h"
      className="mx-auto max-w-7xl px-4 sm:px-6"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <TrendingUp
                className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <h2
                id="home-trending-24h-heading"
                className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white"
              >
                {homeCopy.trending24hTitle}
              </h2>
              {summary.entries.length > 0 && (
                <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  · Top {summary.entries.length}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
              {homeCopy.trending24hSubtitle}
            </p>
          </div>

          <div className="flex min-w-0 w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
            {summary.availableLanguages.length > 0 && (
              <div
                role="tablist"
                aria-label={homeCopy.trending24hTitle}
                className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedLanguage === 'all'}
                  data-testid="trending24h-lang-all"
                  onClick={() => setSelectedLanguage('all')}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    selectedLanguage === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {homeCopy.trending24hAllLanguages}
                </button>
                {summary.availableLanguages.map((lang) => {
                  const active = selectedLanguage.toLowerCase() === lang.toLowerCase();
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-testid={`trending24h-lang-${lang.toLowerCase()}`}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => void loadLiveTrending(true)}
              disabled={isLoading}
              data-testid="trending24h-refresh-btn"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{homeCopy.trending24hRefreshButton}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('stars')}
              data-testid="trending24h-leaderboard-btn"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              <span>{homeCopy.trending24hViewLeaderboard}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading && summary.entries.length === 0 ? (
          <div
            data-testid="trending24h-loading"
            className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 md:grid-cols-2 lg:grid-cols-3 dark:border-slate-800"
          >
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <div
                key={slot}
                className="h-40 animate-pulse rounded-lg bg-slate-100 p-4 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : error && summary.entries.length === 0 ? (
          <div
            data-testid="trending24h-error"
            className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 pb-2 dark:border-slate-800"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {homeCopy.trending24hErrorTitle}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadLiveTrending(true)}
              className="shrink-0 whitespace-nowrap rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {homeCopy.trending24hRetryButton}
            </button>
          </div>
        ) : summary.entries.length === 0 ? (
          <div
            data-testid="trending24h-empty"
            className="mt-5 border-t border-slate-200 pt-8 pb-4 text-center dark:border-slate-800"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {homeCopy.trending24hEmptyTitle}
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
              {homeCopy.trending24hEmptyBody}
            </p>
            {selectedLanguage !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedLanguage('all')}
                className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                {homeCopy.trending24hResetLanguage}
              </button>
            )}
          </div>
        ) : (
          <div
            data-testid="trending24h-grid"
            className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 md:grid-cols-2 lg:grid-cols-3 dark:border-slate-800"
          >
            {summary.entries.map((entry) => {
              const safeUrl = sanitizeExternalUrl(entry.htmlUrl);
              const numericRepoId = entry.id.startsWith('gh-')
                ? Number(entry.id.slice(3))
                : NaN;
              const translatedDesc =
                Number.isFinite(numericRepoId) && activeLangMap?.[numericRepoId]
                  ? activeLangMap[numericRepoId]
                  : '';
              const displayDesc =
                entry.matchedCatalogProject && language === 'ko' && entry.matchedCatalogProject.taglineKo
                  ? entry.matchedCatalogProject.taglineKo
                  : translatedDesc || entry.description;
              const barPct =
                summary.maxGain24h > 0
                  ? Math.max(8, Math.round((entry.starsGained24h / summary.maxGain24h) * 100))
                  : 0;
              const sourceLabel =
                entry.sourceKind === 'catalog_snapshot_24h' ||
                entry.sourceKind === 'github_snapshot_24h'
                  ? homeCopy.trending24hSourceSnapshot
                  : homeCopy.trending24hSourceRate;

              return (
                <article
                  key={entry.id}
                  data-testid={`trending24h-item-${entry.rank}`}
                  className="flex flex-col justify-between rounded-lg bg-slate-50/85 p-4 transition-colors hover:bg-slate-100/90 dark:bg-slate-950/70 dark:hover:bg-slate-950"
                >
                  <div>
                    {/* Zero-Pill Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-bold text-slate-900 tabular-nums dark:text-white">
                        #{entry.rank}
                      </span>
                      {entry.language && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{entry.language}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-mono">{entry.fullName}</span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-1.5 truncate text-base font-bold text-slate-900 dark:text-white">
                      {entry.matchedCatalogProject ? (
                        <button
                          type="button"
                          onClick={() => onOpenDetail(entry.matchedCatalogProject!)}
                          className="max-w-full truncate text-left hover:text-blue-700 hover:underline dark:hover:text-blue-400"
                        >
                          {entry.name}
                        </button>
                      ) : safeUrl ? (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-full truncate hover:text-blue-700 hover:underline dark:hover:text-blue-400"
                        >
                          {entry.name}
                        </a>
                      ) : (
                        entry.name
                      )}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 line-clamp-2 min-h-[2.35rem] text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {displayDesc || entry.fullName}
                    </p>
                  </div>

                  {/* 24h Growth Bar & Actions */}
                  <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-slate-800">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          data-testid={`trending24h-gain-${entry.rank}`}
                          className="font-mono text-base font-bold text-emerald-700 tabular-nums dark:text-emerald-400"
                        >
                          +{formatCompactCount(entry.starsGained24h)}
                        </span>
                        <span className="font-mono text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
                          {homeCopy.trending24hStarsSuffix}
                        </span>
                        {entry.growthPct24h !== null && entry.growthPct24h > 0 && (
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                            (+{entry.growthPct24h}%)
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                        <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                        <span>{formatCompactCount(entry.totalStars)}</span>
                      </span>
                    </div>

                    {/* Relative 24h Momentum Bar */}
                    <div
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300 dark:bg-emerald-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {sourceLabel}
                      </span>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {entry.matchedCatalogProject && (
                          <button
                            type="button"
                            onClick={() => onOpenDetail(entry.matchedCatalogProject!)}
                            className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            {homeCopy.trending24hOpenCatalog}
                          </button>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <span>{homeCopy.trending24hOpenGithub}</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
