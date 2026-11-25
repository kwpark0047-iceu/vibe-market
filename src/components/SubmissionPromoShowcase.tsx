import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Heart,
  Link2,
  Megaphone,
} from 'lucide-react';
import type {
  ActivePage,
  AppLanguage,
  CatalogProject,
  OwnershipClaimRecord,
} from '../types/vibeatlas';
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, UI_STRINGS } from '../data/i18n';
import { resolveMakerVerification } from '../lib/makerVerification';
import {
  buildProjectShareUrl,
  buildPromotionCopy,
  selectPromotedSubmissions,
  type PromoCopyTone,
  type PromoShowcaseFilter,
} from '../lib/submissionPromotion';
import { sanitizeExternalUrl } from '../lib/validation';
import { MakerVerificationBadge } from './MakerVerificationBadge';

interface SubmissionPromoShowcaseProps {
  language: AppLanguage;
  projects: CatalogProject[];
  likedIds: Set<string>;
  userClaims?: ReadonlyArray<OwnershipClaimRecord>;
  onOpenDetail: (project: CatalogProject) => void;
  onToggleLike: (project: CatalogProject) => void;
  onNavigate: (page: ActivePage) => void;
}

async function copyTextSafely(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function SubmissionPromoShowcase({
  language,
  projects,
  likedIds,
  userClaims = [],
  onOpenDetail,
  onToggleLike,
  onNavigate,
}: SubmissionPromoShowcaseProps) {
  const homeCopy = UI_STRINGS[language].home;
  const typeLabels = CONTENT_TYPE_LABELS[language];

  const [filter, setFilter] = useState<PromoShowcaseFilter>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [tone, setTone] = useState<PromoCopyTone>('community');
  const [copiedState, setCopiedState] = useState<'none' | 'link' | 'pitch'>('none');

  const summary = useMemo(
    () => selectPromotedSubmissions(projects, { filter, limit: 4 }),
    [projects, filter]
  );

  const activeEntry = useMemo(() => {
    if (summary.entries.length === 0) return null;
    if (selectedSlug) {
      const match = summary.entries.find((e) => e.project.slug === selectedSlug);
      if (match) return match;
    }
    return summary.entries[0];
  }, [summary.entries, selectedSlug]);

  useEffect(() => {
    if (copiedState === 'none') return;
    const timer = window.setTimeout(() => setCopiedState('none'), 2200);
    return () => window.clearTimeout(timer);
  }, [copiedState]);

  const baseOrigin =
    typeof window !== 'undefined' ? window.location.href : 'https://vibeatlas.app';
  const activeShareUrl = activeEntry
    ? buildProjectShareUrl(baseOrigin, activeEntry.project.slug)
    : '';
  const activePromoPitch = activeEntry
    ? buildPromotionCopy(activeEntry.project, language, activeShareUrl, tone)
    : '';
  const activeSafeDemo = activeEntry
    ? sanitizeExternalUrl(activeEntry.project.liveDemoUrl)
    : '';

  const filterTabs: Array<{ id: PromoShowcaseFilter; label: string }> = [
    { id: 'all', label: homeCopy.promoTabAll },
    { id: 'live_submitted', label: homeCopy.promoTabSubmitted },
    { id: 'demo_ready', label: homeCopy.promoTabDemoReady },
  ];

  return (
    <section
      aria-labelledby="home-promo-showcase-heading"
      data-testid="home-promo-showcase"
      className="mx-auto max-w-7xl px-4 sm:px-6"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Megaphone
                className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
                aria-hidden="true"
              />
              <h2
                id="home-promo-showcase-heading"
                className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white"
              >
                {homeCopy.promoTitle}
              </h2>
              <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                · {summary.totalMakerSubmitted} {homeCopy.promoCountLiveSuffix}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
              {homeCopy.promoSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              role="tablist"
              aria-label={homeCopy.promoTitle}
              className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
            >
              {filterTabs.map((tab) => {
                const selected = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={`promo-filter-${tab.id}`}
                    onClick={() => setFilter(tab.id)}
                    className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('submit')}
              data-testid="promo-cta-submit"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
            >
              <span>{homeCopy.promoCtaSubmit}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Main Showcase Content */}
        {summary.entries.length === 0 ? (
          <div className="mt-5 border-t border-slate-200 pt-8 pb-4 text-center dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {homeCopy.promoEmptyFilterTitle}
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
              {homeCopy.promoEmptyFilterBody}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <span>{homeCopy.promoCtaSubmit}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 lg:grid-cols-12 dark:border-slate-800">
            {/* Left: Clickable Launch Showcase List */}
            <div className="divide-y divide-slate-100 lg:col-span-7 dark:divide-slate-800">
              {summary.entries.map((entry) => {
                const { project } = entry;
                const isActive = activeEntry?.project.id === project.id;
                const isLiked = likedIds.has(project.id);
                const tagline =
                  language === 'ko' && project.taglineKo ? project.taglineKo : project.tagline;
                const safeDemo = sanitizeExternalUrl(project.liveDemoUrl);
                const makerVerification = resolveMakerVerification(project, userClaims);

                return (
                  <div
                    key={project.id}
                    data-testid={`promo-entry-${project.slug}`}
                    className={`rounded-lg p-3.5 transition-colors first:pt-3.5 ${
                      isActive
                        ? 'bg-blue-50/75 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-950/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(project.slug)}
                        aria-pressed={isActive}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            {entry.isMakerSubmitted
                              ? homeCopy.promoSubmittedLabel
                              : homeCopy.promoCuratedLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{typeLabels[project.contentType]}</span>
                          <span aria-hidden="true">·</span>
                          <span>{PLATFORM_LABELS[project.developmentPlatform]}</span>
                          {entry.launchDateShort && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {entry.launchDateShort}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {tagline}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            {project.makerName}
                            {project.makerHandle ? ` (${project.makerHandle})` : ''}
                            {project.techStack.length > 0
                              ? ` · ${project.techStack.slice(0, 3).join(' · ')}`
                              : ''}
                          </span>
                          <MakerVerificationBadge
                            verification={makerVerification}
                            language={language}
                            variant="inline"
                          />
                        </div>
                      </button>

                      {/* Row Actions */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleLike(project)}
                          aria-label={`${UI_STRINGS[language].card.likeAction} ${project.name}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-mono text-xs tabular-nums transition-colors ${
                            isLiked
                              ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{project.likesCount}</span>
                        </button>

                        {safeDemo && (
                          <a
                            href={safeDemo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <span>{homeCopy.promoLiveDemoButton}</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenDetail(project)}
                          className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          {homeCopy.promoOpenDetailButton}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: 1-Click Promotion Toolkit */}
            {activeEntry && (
              <div
                data-testid="promo-kit-panel"
                className="flex flex-col border-t border-slate-200 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {homeCopy.promoKitHeading}
                  </h3>
                  <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => setTone('community')}
                      data-testid="promo-tone-community"
                      className={`whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        tone === 'community'
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {homeCopy.promoToneCommunity}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTone('social')}
                      data-testid="promo-tone-social"
                      className={`whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        tone === 'social'
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {homeCopy.promoToneSocial}
                    </button>
                  </div>
                </div>

                {/* Selected Launch Context */}
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-blue-200/70 bg-blue-50/60 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-950/25">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {activeEntry.project.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {activeEntry.project.makerName}
                      {activeEntry.project.makerHandle
                        ? ` (${activeEntry.project.makerHandle})`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(activeEntry.project)}
                    className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {homeCopy.promoOpenDetailButton} →
                  </button>
                </div>

                {/* Direct Share URL */}
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    readOnly
                    aria-label={homeCopy.promoCopyLinkButton}
                    value={activeShareUrl}
                    data-testid="promo-share-url-input"
                    className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-slate-700 focus:outline-none dark:text-slate-300"
                  />
                </div>

                {/* Auto-Generated Promotion Pitch */}
                <textarea
                  readOnly
                  rows={7}
                  aria-label={homeCopy.promoKitHeading}
                  value={activePromoPitch}
                  data-testid="promo-pitch-textarea"
                  className="mt-3 min-h-[172px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />

                {/* Copy & Action Controls */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="promo-copy-pitch-btn"
                    onClick={async () => {
                      await copyTextSafely(activePromoPitch);
                      setCopiedState('pitch');
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {copiedState === 'pitch' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {copiedState === 'pitch'
                        ? homeCopy.promoCopiedLabel
                        : homeCopy.promoCopyPitchButton}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="promo-copy-link-btn"
                    onClick={async () => {
                      await copyTextSafely(activeShareUrl);
                      setCopiedState('link');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {copiedState === 'link' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {copiedState === 'link'
                        ? homeCopy.promoCopiedLabel
                        : homeCopy.promoCopyLinkButton}
                    </span>
                  </button>

                  {activeSafeDemo && (
                    <a
                      href={activeSafeDemo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span>{homeCopy.promoLiveDemoButton}</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
