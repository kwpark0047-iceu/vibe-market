import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  GitCompareArrows,
  Info,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  AppLanguage,
  BackendTech,
  CatalogProject,
  ContentType,
  DevelopmentPlatform,
  HostingProvider,
  OwnershipClaimRecord,
  PricingModel,
  ProjectActivityRecord,
  ProjectCategory,
  SearchFilters,
  SortOption,
  VerificationStatus,
} from '../types/vibeatlas';
import {
  BACKEND_LABELS,
  CONTENT_TYPE_LABELS,
  HOSTING_LABELS,
  PLATFORM_LABELS,
  PRICING_LABELS,
  PROJECT_CATEGORY_LABELS,
  SORT_LABELS,
  UI_STRINGS,
  VERIFICATION_LABELS,
} from '../data/i18n';
import { VALID_PROJECT_CATEGORIES } from '../lib/urlSync';
import {
  detectMissingFields,
  filterProjects,
  formatCompactCount,
  paginateProjects,
  sortProjects,
} from '../lib/catalogEngine';
import {
  MAX_COMPARE_PROJECTS,
  resolveComparedProjects,
  toggleCompareProjectId,
} from '../lib/projectComparison';
import {
  collectAvailableTagFacets,
  resolveCanonicalCategoryTag,
  toggleTagSelection,
} from '../lib/projectTags';
import { computeCatalogHighlightContext } from '../lib/projectHighlightBadges';
import {
  computeEngagementTrendingScoresMap,
  selectTrendingByEngagement7d,
} from '../lib/trendingEngagement';
import { computeStarGainsMap, selectTrendingProjects7d } from '../lib/trendingStars';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { DiscoveryScatterMap } from './DiscoveryScatterMap';
import { GitHubTrendingBubbleChart } from './GitHubTrendingBubbleChart';
import { ProjectCard } from './ProjectCard';
import { ProjectComparisonModal } from './ProjectComparisonModal';
import { TrendingVelocityChart } from './TrendingVelocityChart';
import { VoiceSearchButton, VoiceSearchFeedback } from './VoiceSearchButton';

interface DiscoverPageProps {
  language: AppLanguage;
  projects: CatalogProject[];
  filters: SearchFilters;
  isLoading: boolean;
  isLoadingWebApps?: boolean;
  webAppsError?: string | null;
  onRetryWebApps?: () => void;
  likedIds: Set<string>;
  bookmarkedIds: Set<string>;
  userClaims?: ReadonlyArray<OwnershipClaimRecord>;
  recentActivities?: ReadonlyArray<ProjectActivityRecord>;
  snapshotRevision?: number;
  onUpdateFilters: (patch: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDetail: (project: CatalogProject) => void;
  onToggleLike: (project: CatalogProject) => void;
  onToggleBookmark: (project: CatalogProject) => void;
}

export function DiscoverPage({
  language,
  projects,
  filters,
  isLoading,
  isLoadingWebApps = false,
  webAppsError = null,
  onRetryWebApps,
  likedIds,
  bookmarkedIds,
  userClaims = [],
  recentActivities = [],
  snapshotRevision = 0,
  onUpdateFilters,
  onResetFilters,
  onOpenDetail,
  onToggleLike,
  onToggleBookmark,
}: DiscoverPageProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSearchNote, setShowSearchNote] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLimitNotice, setCompareLimitNotice] = useState(false);
  const copy = UI_STRINGS[language].discover;
  const compareCopy = UI_STRINGS[language].compare;
  const wsCopy = UI_STRINGS[language].workspace;

  const voiceSearch = useVoiceSearch({
    language,
    onInterimTranscript: (transcript) => {
      onUpdateFilters({ q: transcript, page: 1 });
    },
    onFinalTranscript: (transcript) => {
      onUpdateFilters({ q: transcript, page: 1 });
    },
  });

  const availableCountries = useMemo(
    () => Array.from(new Set(projects.map((p) => p.country))).sort(),
    [projects]
  );

  const availableLicenses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.license))).sort(),
    [projects]
  );

  const starGains7dMap = useMemo(
    () => computeStarGainsMap(projects),
    [projects, snapshotRevision]
  );

  const trendingMap = useMemo(
    () => selectTrendingProjects7d(projects, { maxBadges: 3 }),
    [projects, snapshotRevision]
  );

  const engagementTrendingScores = useMemo(
    () => computeEngagementTrendingScoresMap(projects, { activities: recentActivities }),
    [projects, recentActivities]
  );

  const engagementTrendingMap = useMemo(
    () =>
      selectTrendingByEngagement7d(projects, {
        activities: recentActivities,
        maxBadges: 3,
      }),
    [projects, recentActivities]
  );

  const highlightContext = useMemo(
    () => computeCatalogHighlightContext(projects),
    [projects, snapshotRevision]
  );

  const isFullWebAppView = filters.type === 'web_app';
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const sorted = useMemo(
    () =>
      sortProjects(
        filtered,
        filters.sort,
        filters.q,
        starGains7dMap,
        engagementTrendingScores
      ),
    [filtered, filters.sort, filters.q, starGains7dMap, engagementTrendingScores]
  );
  const pageSize = isFullWebAppView ? Math.max(100, sorted.length) : 9;
  const paginated = useMemo(
    () => paginateProjects(sorted, filters.page, pageSize),
    [sorted, filters.page, pageSize]
  );

  const comparedProjects = useMemo(
    () => resolveComparedProjects(compareIds, projects),
    [compareIds, projects]
  );

  const compareIdSet = useMemo(() => new Set(compareIds), [compareIds]);

  useEffect(() => {
    if (!compareLimitNotice) return;
    const timer = window.setTimeout(() => setCompareLimitNotice(false), 4000);
    return () => window.clearTimeout(timer);
  }, [compareLimitNotice]);

  useEffect(() => {
    if (compareModalOpen && comparedProjects.length === 0) {
      setCompareModalOpen(false);
    }
  }, [compareModalOpen, comparedProjects.length]);

  const handleToggleCompare = useCallback((project: CatalogProject) => {
    setCompareIds((prev) => {
      const result = toggleCompareProjectId(prev, project.id, MAX_COMPARE_PROJECTS);
      setCompareLimitNotice(result.limitReached);
      return result.nextIds;
    });
  }, []);

  const handleRemoveCompare = useCallback((projectId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== projectId));
    setCompareLimitNotice(false);
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareLimitNotice(false);
    setCompareModalOpen(false);
  }, []);

  const tagFacets = useMemo(
    () => collectAvailableTagFacets(projects, filters.tags),
    [projects, filters.tags]
  );

  const selectedTagSet = useMemo(
    () => new Set(filters.tags.map((t) => t.trim().toLowerCase())),
    [filters.tags]
  );

  const formatTagLabel = useCallback(
    (tag: string) => {
      const canonical = resolveCanonicalCategoryTag(tag);
      return canonical ? PROJECT_CATEGORY_LABELS[language][canonical] : tag;
    },
    [language]
  );

  const handleToggleTag = useCallback(
    (tag: string) => {
      onUpdateFilters({
        tags: toggleTagSelection(filters.tags, tag),
        page: 1,
      });
    },
    [filters.tags, onUpdateFilters]
  );

  const renderFilterForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {copy.filtersHeading}
        </h2>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          <RotateCcw className="h-3 w-3" />
          <span>{copy.resetFilters}</span>
        </button>
      </div>

      {/* Content Type */}
      <div>
        <label htmlFor="filter-type" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterType}
        </label>
        <select
          id="filter-type"
          value={filters.type}
          onChange={(e) => onUpdateFilters({ type: e.target.value as ContentType | 'all', page: 1 })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(CONTENT_TYPE_LABELS[language]) as ContentType[]).map((key) => (
            <option key={key} value={key}>
              {CONTENT_TYPE_LABELS[language][key]}
            </option>
          ))}
        </select>
      </div>

      {/* Project Category */}
      <div>
        <label htmlFor="filter-category" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterCategory}
        </label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(e) =>
            onUpdateFilters({ category: e.target.value as ProjectCategory | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allCategoriesOption}</option>
          {VALID_PROJECT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {PROJECT_CATEGORY_LABELS[language][category]}
            </option>
          ))}
        </select>
      </div>

      {/* Project Tags Multi-Filter */}
      <div data-testid="discover-tags-filter" className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {copy.filterTags}
          </span>
          {filters.tags.length > 0 && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ tags: [], page: 1 })}
              className="text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              {copy.clearTags}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{copy.tagsHint}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tagFacets.map((facet) => {
            const isSelected = selectedTagSet.has(facet.tag.toLowerCase());
            return (
              <button
                key={facet.tag}
                type="button"
                data-testid={`filter-tag-${facet.tag}`}
                aria-pressed={isSelected}
                onClick={() => handleToggleTag(facet.tag)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <span>{formatTagLabel(facet.tag)}</span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {facet.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dev Platform */}
      <div>
        <label htmlFor="filter-platform" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterPlatform}
        </label>
        <select
          id="filter-platform"
          value={filters.platform}
          onChange={(e) =>
            onUpdateFilters({ platform: e.target.value as DevelopmentPlatform | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(PLATFORM_LABELS) as DevelopmentPlatform[]).map((key) => (
            <option key={key} value={key}>
              {PLATFORM_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Hosting Provider */}
      <div>
        <label htmlFor="filter-hosting" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterHosting}
        </label>
        <select
          id="filter-hosting"
          value={filters.hosting}
          onChange={(e) =>
            onUpdateFilters({ hosting: e.target.value as HostingProvider | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(HOSTING_LABELS) as HostingProvider[]).map((key) => (
            <option key={key} value={key}>
              {HOSTING_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Backend Tech */}
      <div>
        <label htmlFor="filter-backend" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterBackend}
        </label>
        <select
          id="filter-backend"
          value={filters.backend}
          onChange={(e) =>
            onUpdateFilters({ backend: e.target.value as BackendTech | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(BACKEND_LABELS) as BackendTech[]).map((key) => (
            <option key={key} value={key}>
              {BACKEND_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Country */}
      <div>
        <label htmlFor="filter-country" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterCountry}
        </label>
        <select
          id="filter-country"
          value={filters.country}
          onChange={(e) => onUpdateFilters({ country: e.target.value, page: 1 })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {availableCountries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label htmlFor="filter-language" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterLanguage}
        </label>
        <select
          id="filter-language"
          value={filters.lang}
          onChange={(e) =>
            onUpdateFilters({
              lang: e.target.value as SearchFilters['lang'],
              page: 1,
            })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          <option value="ko">한국어 (ko)</option>
          <option value="en">English (en)</option>
          <option value="bilingual">한/영 (bilingual)</option>
        </select>
      </div>

      {/* License */}
      <div>
        <label htmlFor="filter-license" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterLicense}
        </label>
        <select
          id="filter-license"
          value={filters.license}
          onChange={(e) => onUpdateFilters({ license: e.target.value, page: 1 })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {availableLicenses.map((lic) => (
            <option key={lic} value={lic}>
              {lic}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing */}
      <div>
        <label htmlFor="filter-pricing" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterPricing}
        </label>
        <select
          id="filter-pricing"
          value={filters.pricing}
          onChange={(e) =>
            onUpdateFilters({ pricing: e.target.value as PricingModel | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(PRICING_LABELS[language]) as PricingModel[]).map((key) => (
            <option key={key} value={key}>
              {PRICING_LABELS[language][key]}
            </option>
          ))}
        </select>
      </div>

      {/* Verification Status */}
      <div>
        <label htmlFor="filter-verification" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterVerification}
        </label>
        <select
          id="filter-verification"
          value={filters.verified}
          onChange={(e) =>
            onUpdateFilters({ verified: e.target.value as VerificationStatus | 'all', page: 1 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">{copy.allOption}</option>
          {(Object.keys(VERIFICATION_LABELS[language]) as VerificationStatus[]).map((key) => (
            <option key={key} value={key}>
              {VERIFICATION_LABELS[language][key]}
            </option>
          ))}
        </select>
      </div>

      {/* Min Stars */}
      <div>
        <label htmlFor="filter-min-stars" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterMinStars}
        </label>
        <select
          id="filter-min-stars"
          value={filters.minStars}
          onChange={(e) => onUpdateFilters({ minStars: Number(e.target.value), page: 1 })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value={0}>{copy.allOption}</option>
          <option value={100}>100+</option>
          <option value={1000}>1,000+</option>
          <option value={10000}>10,000+</option>
        </select>
      </div>

      {/* Updated Within */}
      <div>
        <label htmlFor="filter-updated" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {copy.filterUpdatedWithin}
        </label>
        <select
          id="filter-updated"
          value={filters.updatedWithinDays}
          onChange={(e) => onUpdateFilters({ updatedWithinDays: Number(e.target.value), page: 1 })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value={0}>{copy.allOption}</option>
          <option value={7}>7d</option>
          <option value={30}>30d</option>
          <option value={90}>90d</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowSearchNote((prev) => !prev)}
          aria-expanded={showSearchNote}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <Info className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
          <span>{wsCopy.koreanSearchNoteTitle}</span>
        </button>
      </div>

      {showSearchNote && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs leading-relaxed text-slate-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-slate-200">
          {wsCopy.koreanSearchNoteBody}
        </div>
      )}

      {/* Search Bar & Toolbar */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white py-1 pl-3 pr-1.5 dark:border-slate-700 dark:bg-slate-950">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => onUpdateFilters({ q: e.target.value, page: 1 })}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              className="w-full bg-transparent py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />
            {filters.q && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => onUpdateFilters({ q: '', page: 1 })}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <VoiceSearchButton
              language={language}
              isListening={voiceSearch.isListening}
              onClick={voiceSearch.toggle}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{copy.mobileFiltersButton}</span>
            </button>

            <label htmlFor="sort-select" className="sr-only">
              {copy.sortLabel}
            </label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => onUpdateFilters({ sort: e.target.value as SortOption, page: 1 })}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {(Object.keys(SORT_LABELS[language]) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[language][key]}
                </option>
              ))}
            </select>

            <div
              role="group"
              aria-label="View mode"
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
            >
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => onUpdateFilters({ view: 'grid' })}
                className={`rounded-md p-1.5 ${
                  filters.view === 'grid'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => onUpdateFilters({ view: 'list' })}
                className={`rounded-md p-1.5 ${
                  filters.view === 'list'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <VoiceSearchFeedback
          language={language}
          status={voiceSearch.status}
          errorCode={voiceSearch.errorCode}
          interimTranscript={voiceSearch.interimTranscript}
          onStop={voiceSearch.stop}
          onDismissError={voiceSearch.clearError}
        />
      </div>

      {/* Quick Category Filter Bar */}
      <div
        role="group"
        aria-label={copy.filterCategory}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          aria-pressed={filters.category === 'all'}
          onClick={() => onUpdateFilters({ category: 'all', page: 1 })}
          className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filters.category === 'all'
              ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {copy.allCategoriesOption}
        </button>
        {VALID_PROJECT_CATEGORIES.map((category) => {
          const isActive = filters.category === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                onUpdateFilters({ category: isActive ? 'all' : category, page: 1 })
              }
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {PROJECT_CATEGORY_LABELS[language][category]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Desktop Faceted Filter Sidebar */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            {renderFilterForm()}
          </div>
        </aside>

        {/* Results Panel */}
        <div className="lg:col-span-9">
          {isFullWebAppView && (
            <div
              data-testid="webapps-top100-banner"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  {copy.webAppsTop100Title}
                </p>
                <p className="mt-0.5 text-xs text-blue-800/90 dark:text-blue-300/90">
                  {isLoadingWebApps ? copy.webAppsLoading : copy.webAppsTop100Subtitle}
                </p>
              </div>
              {onRetryWebApps && (
                <button
                  type="button"
                  disabled={isLoadingWebApps}
                  onClick={onRetryWebApps}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 disabled:opacity-60 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingWebApps ? 'animate-spin' : ''}`} />
                  <span>{copy.webAppsRetry}</span>
                </button>
              )}
            </div>
          )}

          {isFullWebAppView && webAppsError && !isLoadingWebApps && (
            <div
              role="status"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>{copy.webAppsError}</span>
              </span>
              {onRetryWebApps && (
                <button
                  type="button"
                  onClick={onRetryWebApps}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{copy.webAppsRetry}</span>
                </button>
              )}
            </div>
          )}

          {!isLoading && (
            <DiscoveryScatterMap
              language={language}
              filteredProjects={filtered}
              filters={filters}
              userClaims={userClaims}
              snapshotRevision={snapshotRevision}
              onOpenDetail={onOpenDetail}
              onResetFilters={onResetFilters}
            />
          )}

          {!isLoading && (
            <TrendingVelocityChart
              language={language}
              projects={filtered}
              snapshotRevision={snapshotRevision}
              onOpenDetail={onOpenDetail}
            />
          )}

          <GitHubTrendingBubbleChart
            language={language}
            catalogProjects={projects}
            onOpenDetail={onOpenDetail}
          />

          {filters.tags.length > 0 && (
            <div
              data-testid="active-tag-filters"
              className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {copy.activeTagsPrefix}:
              </span>
              {filters.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200 dark:hover:bg-blue-900/60"
                >
                  <span>#{formatTagLabel(tag)}</span>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => onUpdateFilters({ tags: [], page: 1 })}
                className="ml-auto text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                {copy.clearTags}
              </button>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span data-testid="discover-results-count" className="tabular-nums font-medium">
              {paginated.totalCount}
              {copy.resultsCount}
            </span>
            <span className="tabular-nums font-mono">
              {paginated.currentPage} / {paginated.totalPages}
            </span>
          </div>

          {isLoading || (isFullWebAppView && isLoadingWebApps && sorted.length <= 1) ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : paginated.items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {copy.emptyTitle}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {copy.emptyBody}
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{copy.resetFilters}</span>
              </button>
            </div>
          ) : (
            <div
              className={
                filters.view === 'list'
                  ? 'flex flex-col gap-4'
                  : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
              }
            >
              {paginated.items.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  language={language}
                  viewMode={filters.view}
                  isLiked={likedIds.has(proj.id)}
                  isBookmarked={bookmarkedIds.has(proj.id)}
                  isCompared={compareIdSet.has(proj.id)}
                  compareDisabled={
                    compareIds.length >= MAX_COMPARE_PROJECTS && !compareIdSet.has(proj.id)
                  }
                  trendingInfo={trendingMap.get(proj.id)}
                  engagementTrending={engagementTrendingMap.get(proj.id)}
                  highlightContext={highlightContext}
                  makerClaims={userClaims}
                  selectedTags={filters.tags}
                  onSelectTag={handleToggleTag}
                  onOpenDetail={onOpenDetail}
                  onToggleLike={onToggleLike}
                  onToggleBookmark={onToggleBookmark}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {paginated.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                disabled={paginated.currentPage <= 1}
                onClick={() => onUpdateFilters({ page: paginated.currentPage - 1 })}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {copy.previousPage}
              </button>
              <span className="tabular-nums font-mono text-xs text-slate-600 dark:text-slate-400">
                {paginated.currentPage} / {paginated.totalPages}
              </span>
              <button
                type="button"
                disabled={paginated.currentPage >= paginated.totalPages}
                onClick={() => onUpdateFilters({ page: paginated.currentPage + 1 })}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {copy.nextPage}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Compare Projects Tray */}
      {comparedProjects.length > 0 && (
        <aside
          aria-label={compareCopy.trayTitle}
          data-testid="compare-tray"
          className="sticky bottom-4 z-30 mt-8 rounded-xl border border-slate-300 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                <GitCompareArrows className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                <span>{compareCopy.trayTitle}</span>
              </span>
              <span
                data-testid="compare-tray-count"
                className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {comparedProjects.length} / {MAX_COMPARE_PROJECTS}
              </span>
              {comparedProjects.length === 1 && (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {compareCopy.trayHintOneMore}
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleClearCompare}
                className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {compareCopy.clearButton}
              </button>
              <button
                type="button"
                data-testid="open-compare-modal-btn"
                disabled={comparedProjects.length < 2}
                onClick={() => setCompareModalOpen(true)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                <span>
                  {compareCopy.compareNowButton} ({comparedProjects.length})
                </span>
              </button>
            </div>
          </div>

          {compareLimitNotice && (
            <p
              role="status"
              data-testid="compare-limit-notice"
              className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
              <span>{compareCopy.trayLimitNotice}</span>
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 sm:mt-3 sm:grid sm:grid-cols-3 sm:gap-2.5 sm:overflow-visible sm:pb-0">
            {Array.from({ length: MAX_COMPARE_PROJECTS }).map((_, slotIdx) => {
              const proj = comparedProjects[slotIdx];
              if (!proj) {
                return (
                  <div
                    key={`empty-slot-${slotIdx}`}
                    className="hidden items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-400 sm:flex dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-500"
                  >
                    {compareCopy.emptySlotLabel} {slotIdx + 1}
                  </div>
                );
              }
              const licenseMissing = detectMissingFields(proj).includes('license');
              const licenseLabel = licenseMissing
                ? UI_STRINGS[language].card.missingLicense
                : proj.license;
              return (
                <div
                  key={proj.id}
                  data-testid={`compare-slot-${proj.slug}`}
                  className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:min-w-0 sm:shrink sm:px-3 sm:py-2 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="max-w-[140px] min-w-0 sm:max-w-none">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {proj.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      {proj.lastSyncedAt
                        ? `★ ${formatCompactCount(proj.githubStars)}`
                        : UI_STRINGS[language].card.notSynced}{' '}
                      · {licenseLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCompare(proj.id)}
                    aria-label={`${compareCopy.removeAction}: ${proj.name}`}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Side-by-Side Comparison Modal */}
      <ProjectComparisonModal
        isOpen={compareModalOpen}
        projects={comparedProjects}
        language={language}
        onClose={() => setCompareModalOpen(false)}
        onRemoveProject={handleRemoveCompare}
        onClearAll={handleClearCompare}
        onOpenDetail={onOpenDetail}
      />

      {/* Mobile Filter Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {copy.filtersHeading}
              </span>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFilterForm()}
          </div>
        </div>
      )}
    </div>
  );
}
