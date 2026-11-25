import type {
  AppLanguage,
  BackendTech,
  ContentType,
  DevelopmentPlatform,
  HostingProvider,
  PricingModel,
  ProjectCategory,
  SortOption,
  VerificationStatus,
} from '../types/vibeatlas';

export const UI_STRINGS: Record<
  AppLanguage,
  {
    nav: {
      home: string;
      discover: string;
      githubStars: string;
      makers: string;
      submit: string;
      primaryCta: string;
    };
    workspace: {
      savedBookmarks: string;
      signInGoogle: string;
      signOut: string;
      makerAccount: string;
      lightMode: string;
      darkMode: string;
      koreanSearchNoteTitle: string;
      koreanSearchNoteBody: string;
    };
    hero: {
      kicker: string;
      headline: string;
      subheadline: string;
      searchPlaceholder: string;
      searchButton: string;
      quickBrowseLabel: string;
    };
    home: {
      trendingTab: string;
      newlyLaunchedTab: string;
      risingOssTab: string;
      viewAllDiscover: string;
      mcpAndSkillsTitle: string;
      mcpAndSkillsSubtitle: string;
      stacksTitle: string;
      stacksSubtitle: string;
      koreanGlobalTitle: string;
      koreanGlobalSubtitle: string;
      featuredMakersTitle: string;
      featuredMakersSubtitle: string;
      submitCtaTitle: string;
      submitCtaBody: string;
      submitCtaButton: string;
      newsletterTitle: string;
      newsletterBody: string;
      newsletterPlaceholder: string;
      newsletterButton: string;
      newsletterSignInNotice: string;
      newsletterSuccess: string;
      promoTitle: string;
      promoSubtitle: string;
      promoTabAll: string;
      promoTabSubmitted: string;
      promoTabDemoReady: string;
      promoCtaSubmit: string;
      promoKitHeading: string;
      promoToneCommunity: string;
      promoToneSocial: string;
      promoCopyLinkButton: string;
      promoCopyPitchButton: string;
      promoCopiedLabel: string;
      promoOpenDetailButton: string;
      promoLiveDemoButton: string;
      promoSubmittedLabel: string;
      promoCuratedLabel: string;
      promoEmptyFilterTitle: string;
      promoEmptyFilterBody: string;
      promoCountLiveSuffix: string;
      trending24hTitle: string;
      trending24hSubtitle: string;
      trending24hAllLanguages: string;
      trending24hRefreshButton: string;
      trending24hViewLeaderboard: string;
      trending24hStarsSuffix: string;
      trending24hSourceSnapshot: string;
      trending24hSourceRate: string;
      trending24hOpenCatalog: string;
      trending24hOpenGithub: string;
      trending24hEmptyTitle: string;
      trending24hEmptyBody: string;
      trending24hResetLanguage: string;
      trending24hErrorTitle: string;
      trending24hRetryButton: string;
      recentActivityTitle: string;
      recentActivitySubtitle: string;
      recentActivityFilterAll: string;
      recentActivityFilterSubmissions: string;
      recentActivityFilterLikes: string;
      recentActivityFilterBookmarks: string;
      recentActivityAutoScrollOn: string;
      recentActivityAutoScrollPaused: string;
      recentActivityActionSubmitted: string;
      recentActivityActionLiked: string;
      recentActivityActionBookmarked: string;
      recentActivityCommunityActor: string;
      recentActivityGuestActor: string;
      recentActivityLiveLabel: string;
      recentActivityDeltaSuffix: string;
      recentActivityOpenProject: string;
      recentActivityEmptyTitle: string;
      recentActivityEmptyBody: string;
      recentActivityLiveCountSuffix: string;
      recentActivityShowAllButton: string;
    };
    discover: {
      title: string;
      subtitle: string;
      filtersHeading: string;
      mobileFiltersButton: string;
      resetFilters: string;
      searchPlaceholder: string;
      sortLabel: string;
      resultsCount: string;
      emptyTitle: string;
      emptyBody: string;
      previousPage: string;
      nextPage: string;
      filterType: string;
      filterCategory: string;
      allCategoriesOption: string;
      filterTags: string;
      clearTags: string;
      activeTagsPrefix: string;
      tagsHint: string;
      filterPlatform: string;
      filterHosting: string;
      filterBackend: string;
      filterCountry: string;
      filterLanguage: string;
      filterLicense: string;
      filterPricing: string;
      filterVerification: string;
      filterMinStars: string;
      filterUpdatedWithin: string;
      allOption: string;
      webAppsTop100Title: string;
      webAppsTop100Subtitle: string;
      webAppsLoading: string;
      webAppsError: string;
      webAppsRetry: string;
    };
    trendingSection: {
      title: string;
      subtitle: string;
      toggleExpand: string;
      toggleCollapse: string;
      tabStar30d: string;
      tabStar7d: string;
      tabSignalVelocity: string;
      chartHeading: string;
      trajectoryHeading: string;
      unitStars: string;
      unitSignals: string;
      perDaySuffix: string;
      periodDeltaLabel: string;
      dailyVelocityLabel: string;
      currentTotalLabel: string;
      inspectButton: string;
      emptyStarTitle: string;
      emptyStarBody: string;
      switchToSignalButton: string;
      emptyFilteredTitle: string;
      emptyFilteredBody: string;
      fallbackNote: string;
    };
    githubTrendingBubble: {
      title: string;
      subtitle: string;
      toggleExpand: string;
      toggleCollapse: string;
      refreshButton: string;
      refreshing: string;
      allLanguages: string;
      perDaySuffix: string;
      dailyStarsLabel: string;
      totalStarsLabel: string;
      forksLabel: string;
      pushedLabel: string;
      topMoversHeading: string;
      openGithubButton: string;
      inspectVibeAtlasButton: string;
      loadingLabel: string;
      emptyTitle: string;
      emptyBody: string;
      resetLanguageButton: string;
      errorTitle: string;
      retryButton: string;
      cachedNotice: string;
      rateModeVelocity: string;
      rateModeSnapshot: string;
      reposCountLabel: string;
      clickHint: string;
    };
    discoveryMap: {
      title: string;
      subtitle: string;
      toggleExpand: string;
      toggleCollapse: string;
      scopeEcosystem: string;
      scopeDirectory: string;
      scopeVerifiedMakers: string;
      allTypes: string;
      xAxisLabel: string;
      yAxisLabel: string;
      quadrantLeaders: string;
      quadrantActiveBuilders: string;
      quadrantEstablished: string;
      quadrantEmerging: string;
      spotlightHeading: string;
      starsMetricLabel: string;
      activityMetricLabel: string;
      dailyVelocityLabel: string;
      recencyLabel: string;
      todayLabel: string;
      daysAgoSuffix: string;
      sourceDirectory: string;
      sourceEnriched: string;
      sourceEcosystem: string;
      inspectButton: string;
      openGithubButton: string;
      emptyTitle: string;
      emptyBody: string;
      resetMapFilter: string;
      resetFiltersButton: string;
      pointsCountLabel: string;
      interactionHint: string;
      medianGuideNote: string;
    };
    card: {
      githubStars: string;
      internalLikes: string;
      internalBookmarks: string;
      notSynced: string;
      staleLabel: string;
      verifiedLabel: string;
      pendingLabel: string;
      unverifiedLabel: string;
      missingLicense: string;
      openDetail: string;
      likeAction: string;
      bookmarkAction: string;
      trendingBadge: string;
      trending7dTooltip: string;
      trendingEngagementTooltip: string;
      compareAdd: string;
      compareSelected: string;
    };
    highlights: {
      containerLabel: string;
      featured: string;
      newArrival: string;
      highActivity: string;
      featuredTooltip: string;
      newArrivalTooltip: string;
      highActivityTooltip: string;
      highActivityStarsTooltip: string;
      highActivitySignalsTooltip: string;
    };
    verification: {
      claimedBadge: string;
      claimedTooltip: string;
      pendingBadge: string;
      pendingTooltip: string;
      unclaimedBadge: string;
      panelTitleClaimed: string;
      panelBodyClaimed: string;
      panelTitlePending: string;
      panelBodyPending: string;
      panelTitleUnclaimed: string;
      panelBodyUnclaimed: string;
      attributionLabel: string;
      methodLabel: string;
      statusLabel: string;
      statusClaimed: string;
      statusPending: string;
      statusUnclaimed: string;
      ownerTag: string;
      methodGithub: string;
      methodDns: string;
      methodDemo: string;
      methodDirect: string;
      claimCta: string;
    };
    compare: {
      trayTitle: string;
      trayHintOneMore: string;
      trayLimitNotice: string;
      emptySlotLabel: string;
      compareNowButton: string;
      clearButton: string;
      removeAction: string;
      modalTitle: string;
      modalSubtitle: string;
      closeButton: string;
      colAttribute: string;
      sectionGithub: string;
      sectionMetadata: string;
      sectionCommunity: string;
      rowGithubStars: string;
      rowGithubForks: string;
      rowLicense: string;
      rowRepository: string;
      rowLastSynced: string;
      rowContentType: string;
      rowCategories: string;
      rowPlatform: string;
      rowHostingBackend: string;
      rowTechStack: string;
      rowPricing: string;
      rowVerification: string;
      rowCountryLang: string;
      rowUpdatedAt: string;
      rowEngagement: string;
      rowLinks: string;
      highestBadge: string;
      latestBadge: string;
      openDetail: string;
      notAvailable: string;
    };
    detail: {
      close: string;
      externalLinksTitle: string;
      internalActionsTitle: string;
      liveDemo: string;
      officialWebsite: string;
      githubRepository: string;
      syncGithubNow: string;
      syncing: string;
      provenanceTitle: string;
      provenanceSourceLabel: string;
      lastSyncedLabel: string;
      missingFieldsLabel: string;
      noneMissing: string;
      techAndPlatformTitle: string;
      platformLabel: string;
      hostingLabel: string;
      backendLabel: string;
      licenseLabel: string;
      pricingLabel: string;
      countryLangLabel: string;
      historyChartTitle: string;
      historyChartSubtitle: string;
      chartTabStars: string;
      chartTabInternal: string;
      chartUnsyncedStarsHint: string;
      chartLiveTotalLabel: string;
      chartDeltaLabel: string;
      chartBaselineNote: string;
      relatedTitle: string;
      reportButton: string;
      claimButton: string;
      reportTitle: string;
      claimTitle: string;
      submitReport: string;
      submitClaim: string;
      actionSubmitted: string;
      signInRequired: string;
      communityActivityTitle: string;
      communityActivitySubtitle: string;
      activityFilterAll: string;
      activityFilterLikes: string;
      activityFilterBookmarks: string;
      activityFilterReports: string;
      activityActionLike: string;
      activityActionBookmark: string;
      activityActionReport: string;
      activityGuestActor: string;
      activityEmptyTitle: string;
      activityEmptySubtitle: string;
      activityLoadingLabel: string;
      activityErrorNotice: string;
      activityReasonBrokenLink: string;
      activityReasonStaleMetadata: string;
      activityReasonMisattribution: string;
      activityReasonSpam: string;
      activityReasonSecurityConcern: string;
      vibeScoreTitle: string;
      vibeScoreSubtitle: string;
      vibeScoreOutOf100: string;
      vibeScoreTierThriving: string;
      vibeScoreTierActive: string;
      vibeScoreTierWarm: string;
      vibeScoreTierQuiet: string;
      vibeScorePillarAffinity: string;
      vibeScorePillarMomentum: string;
      vibeScorePillarTraction: string;
      vibeScorePillarHealth: string;
      vibeScoreUnsyncedNote: string;
      vibeScoreReportsPenalty: string;
      vibeScoreFormulaNote: string;
      sharePromoteTitle: string;
      copyDirectLink: string;
      copyPromoPitch: string;
      copiedFeedback: string;
      timelineTitle: string;
      timelineSubtitle: string;
      timelineFilterAll: string;
      timelineFilterReleases: string;
      timelineFilterCommits: string;
      timelineFilterCreatorLogs: string;
      timelineSortNewest: string;
      timelineSortOldest: string;
      timelineAddButton: string;
      timelineCloseComposer: string;
      timelineCadenceLabel: string;
      timelineSpanDaysSuffix: string;
      timelineGapSuffix: string;
      timelineLoadingLabel: string;
      timelineRepoErrorNotice: string;
      timelineNoRepoNote: string;
      timelineEmptyTitle: string;
      timelineEmptyBody: string;
      timelineEmptyCreatorBody: string;
      timelineAuthNoticeSignedOut: string;
      timelineAuthNoticeNotOwner: string;
      timelineSignInCta: string;
      timelineClaimCta: string;
      timelineKindLabel: string;
      timelineKindRelease: string;
      timelineKindLaunch: string;
      timelineKindFeature: string;
      timelineKindUpdate: string;
      timelineKindFix: string;
      timelineVersionLabel: string;
      timelineDateLabel: string;
      timelineEntryTitleLabel: string;
      timelineSummaryLabel: string;
      timelineUrlLabel: string;
      timelinePublishButton: string;
      timelinePublishingButton: string;
      timelineDeleteButton: string;
      timelineExternalLink: string;
      timelineSourceRelease: string;
      timelineSourceCommit: string;
      timelineSourceCreator: string;
      timelineSourceCatalog: string;
      volatilityTitle: string;
      volatilitySubtitle: string;
      volatilityModePace: string;
      volatilityModeSwing: string;
      volatilityMetricStdDev: string;
      volatilityMetricNetVibe: string;
      volatilityMetricStarRate: string;
      volatilityMetricMaxSwing: string;
      volatilityVerdictLabel: string;
      volatilityVerdictKeepingPace: string;
      volatilityVerdictKeepingPaceDesc: string;
      volatilityVerdictSentimentLeading: string;
      volatilityVerdictSentimentLeadingDesc: string;
      volatilityVerdictAdoptionOutpacing: string;
      volatilityVerdictAdoptionOutpacingDesc: string;
      volatilityVerdictUnsynced: string;
      volatilityVerdictUnsyncedDesc: string;
      volatilityVerdictBaseline: string;
      volatilityVerdictBaselineDesc: string;
      volatilityLegendVibeScore: string;
      volatilityLegendBand: string;
      volatilityLegendStarRate: string;
      volatilityLegendSwing: string;
      volatilityLeftAxisLabel: string;
      volatilityRightAxisLabel: string;
      volatilitySwingAxisLabel: string;
      volatilityScrubHint: string;
      volatilityDateLabel: string;
      volatilityVibeDeltaLabel: string;
      volatilityStarGainLabel: string;
      insightsTitle: string;
      insightsSubtitle: string;
      insightsModeDaily: string;
      insightsModeCumulative: string;
      insightsKpiLikes7d: string;
      insightsKpiBookmarks7d: string;
      insightsKpiBookmarkShare: string;
      insightsKpiPeakDay: string;
      insightsTotalPrefix: string;
      insightsAvgPerDay: string;
      insightsNoPeakDay: string;
      insightsScrubHint: string;
      insightsDateLabel: string;
      insightsCombinedLabel: string;
      insightsMixTitle: string;
      insightsEmptyTitle: string;
      insightsEmptyHint: string;
      insightsAxisCount: string;
    };
    submit: {
      title: string;
      subtitle: string;
      promoPreviewTitle: string;
      promoPreviewSubtitle: string;
      promoPreviewUntitled: string;
      promoPreviewTaglineFallback: string;
      githubImportTitle: string;
      githubImportHint: string;
      githubImportPlaceholder: string;
      githubFetchButton: string;
      fetchingGithub: string;
      nameLabel: string;
      taglineEnLabel: string;
      taglineKoLabel: string;
      descriptionEnLabel: string;
      descriptionKoLabel: string;
      contentTypeLabel: string;
      categoriesLabel: string;
      categoriesQuickTagsHint: string;
      techStackLabel: string;
      platformLabel: string;
      hostingLabel: string;
      backendLabel: string;
      countryLabel: string;
      languageLabel: string;
      licenseLabel: string;
      pricingLabel: string;
      liveDemoLabel: string;
      websiteLabel: string;
      githubUrlLabel: string;
      makerNameLabel: string;
      makerHandleLabel: string;
      submitButton: string;
      submitting: string;
      signInPrompt: string;
      submitSuccess: string;
      draftRestoredNotice: string;
      draftAutosaveHint: string;
      clearDraftButton: string;
      validationSummaryPrefix: string;
    };
    maker: {
      title: string;
      subtitle: string;
      myProjectsTab: string;
      myBookmarksTab: string;
      claimsReportsTab: string;
      signInCtaTitle: string;
      signInCtaBody: string;
      noProjectsYet: string;
      noBookmarksYet: string;
      resyncGithub: string;
      deleteProject: string;
      analyticsTitle: string;
      analyticsSubtitle: string;
      metricOwnedProjects: string;
      metricTotalLikes: string;
      metricTotalBookmarks: string;
      metricTotalEngagement: string;
      metricExternalStarsNote: string;
      analyticsSortEngagement: string;
      analyticsSortLikes: string;
      analyticsSortBookmarks: string;
      analyticsSortRecent: string;
      tableProjectCol: string;
      tableLikesCol: string;
      tableBookmarksCol: string;
      tableTotalCol: string;
      tableSplitCol: string;
      tableGithubCol: string;
      topProjectLabel: string;
      analyticsEmptyHint: string;
      projectListHeading: string;
      likesUnit: string;
      bookmarksUnit: string;
      engagementUnit: string;
    };
    footer: {
      tagline: string;
      transparencyNote: string;
    };
    voiceSearch: {
      startLabel: string;
      stopLabel: string;
      listeningStatus: string;
      stopButton: string;
      unsupportedError: string;
      permissionDeniedError: string;
      noSpeechError: string;
      audioCaptureError: string;
      networkError: string;
      unknownError: string;
      dismissError: string;
    };
    githubStarsPage: {
      title: string;
      subtitle: string;
      refreshButton: string;
      refreshing: string;
      presetAll: string;
      presetWebApps: string;
      presetAiAgents: string;
      presetTypescript: string;
      presetPython: string;
      presetRust: string;
      presetGo: string;
      kpiRankedCount: string;
      kpiTopStars: string;
      kpiMedianStars: string;
      kpiLastUpdated: string;
      cachedFallbackBadge: string;
      searchPlaceholder: string;
      allLanguagesOption: string;
      showingCountLabel: string;
      colRank: string;
      colRepository: string;
      colLanguageLicense: string;
      colForks: string;
      colStars: string;
      colActions: string;
      openInVibeAtlas: string;
      openGithub: string;
      emptyFilteredTitle: string;
      emptyFilteredBody: string;
      resetFilterButton: string;
      errorTitle: string;
      retryButton: string;
      rateLimitResetPrefix: string;
      translatingDescriptions: string;
      translatedBadge: string;
      showOriginal: string;
      showTranslated: string;
      translationErrorNotice: string;
    };
  }
> = {
  ko: {
    nav: {
      home: '홈',
      discover: '탐색',
      githubStars: 'GitHub 스타',
      makers: '메이커',
      submit: '등록하기',
      primaryCta: '프로젝트 등록',
    },
    workspace: {
      savedBookmarks: '북마크',
      signInGoogle: 'Google 로그인',
      signOut: '로그아웃',
      makerAccount: '메이커 계정',
      lightMode: '라이트 모드',
      darkMode: '다크 모드',
      koreanSearchNoteTitle: '한/영 다국어 검색 안내',
      koreanSearchNoteBody:
        '기본 영문 형태소 토크나이저는 한국어 조사·어미를 분리하지 못하므로, VibeAtlas는 한국어 부분 문자열 매칭과 기술 용어 한·영 동의어 확장(예: 에이전트↔agent, 서버↔server)을 병행합니다.',
    },
    hero: {
      kicker: '검증된 메타데이터 · 투명한 랭킹',
      headline: '바이브코딩 앱, MCP 서버, AI Skills를 한눈에 찾고 검증하세요',
      subheadline:
        'VibeAtlas는 GitHub 스타와 내부 좋아요·북마크를 엄격히 분리하고, 미확인·오래된 데이터를 숨기지 않고 투명하게 표기하는 글로벌 메이커 디스커버리 플랫폼입니다.',
      searchPlaceholder: '예: MCP 서버, Lovable, 한국어 에이전트, Supabase...',
      searchButton: '검색',
      quickBrowseLabel: '빠른 탐색',
    },
    home: {
      trendingTab: '이번 주 트렌딩',
      newlyLaunchedTab: '신규 런칭',
      risingOssTab: '급상승 오픈소스',
      viewAllDiscover: '전체 디렉터리 탐색',
      mcpAndSkillsTitle: '인기 MCP 서버 & AI Skills',
      mcpAndSkillsSubtitle: '에이전트 워크플로우와 도구 프로토콜을 검증된 저장소 기준으로 탐색하세요.',
      stacksTitle: '빌드 스택별 큐레이션',
      stacksSubtitle: 'Lovable · Vercel · Supabase · Cursor 등 실제 운영 스택을 투명하게 공개한 프로젝트',
      koreanGlobalTitle: '한국 및 글로벌 메이커 스포트라이트',
      koreanGlobalSubtitle: '서울에서 샌프란시스코까지, 검증된 1인 개발자 및 AI 네이티브 팀의 프로덕트',
      featuredMakersTitle: '주목할 메이커 & 기여자',
      featuredMakersSubtitle: '메타데이터 출처와 저장소가 확인된 빌더들',
      submitCtaTitle: '만든 AI 툴이나 MCP 서버를 등록하고 바로 홍보하세요',
      submitCtaBody:
        '등록하기로 게시한 프로젝트는 메인 페이지 런칭 쇼케이스에 즉시 노출되며, 공유 링크와 원클릭 홍보 문구 키트를 제공합니다.',
      submitCtaButton: '등록하고 홍보하기',
      newsletterTitle: '주간 VibeAtlas 다이제스트',
      newsletterBody: '매주 검증된 신규 MCP 서버, AI Skills, 한국·글로벌 메이커 출시 소식을 받아보세요.',
      newsletterPlaceholder: '이메일 주소 입력 (Google 로그인 연동)',
      newsletterButton: '구독 신청',
      newsletterSignInNotice: '안전한 구독 저장을 위해 Google 로그인 후 신청해 주세요.',
      newsletterSuccess: '구독이 저장되었습니다.',
      promoTitle: '등록 프로젝트 홍보 쇼케이스',
      promoSubtitle: '등록하기로 게시된 AI 앱과 MCP 서버를 메인 화면에서 소개하고, 공유 링크·홍보 문구 키트로 외부 커뮤니티에 바로 알리세요.',
      promoTabAll: '전체 소개작',
      promoTabSubmitted: '등록 프로젝트 우선',
      promoTabDemoReady: '라이브 데모 체험',
      promoCtaSubmit: '내 프로젝트 등록 · 홍보하기',
      promoKitHeading: '홍보 키트 · 공유용 스니펫',
      promoToneCommunity: '커뮤니티 소개형',
      promoToneSocial: '소셜 요약형',
      promoCopyLinkButton: '홍보 링크 복사',
      promoCopyPitchButton: '홍보 문구 복사',
      promoCopiedLabel: '복사됨',
      promoOpenDetailButton: '상세 보기',
      promoLiveDemoButton: '라이브 데모',
      promoSubmittedLabel: '커뮤니티 등록작',
      promoCuratedLabel: '에디터 큐레이션',
      promoEmptyFilterTitle: '해당 조건의 등록 프로젝트가 아직 없습니다',
      promoEmptyFilterBody: '지금 첫 번째 프로젝트를 등록하고 메인 페이지 홍보 쇼케이스 상단에 노출해 보세요.',
      promoCountLiveSuffix: '건 등록됨',
      trending24hTitle: '최근 24시간 GitHub 스타 급상승',
      trending24hSubtitle: '공식 GitHub API 일일 스타 스냅샷과 24시간 성장 속도를 기준으로 지금 가장 빠르게 주목받는 프로젝트를 실시간 집계합니다.',
      trending24hAllLanguages: '전체 언어',
      trending24hRefreshButton: '새로고침',
      trending24hViewLeaderboard: '전체 스타 랭킹 보기',
      trending24hStarsSuffix: '/ 24h',
      trending24hSourceSnapshot: '24시간 실측 스냅샷',
      trending24hSourceRate: '24시간 스타 증가율',
      trending24hOpenCatalog: '상세 보기',
      trending24hOpenGithub: 'GitHub',
      trending24hEmptyTitle: '선택한 언어의 24시간 급상승 프로젝트가 없습니다',
      trending24hEmptyBody: '전체 언어로 전환하거나 실시간 데이터를 새로고침해 보세요.',
      trending24hResetLanguage: '전체 언어 보기',
      trending24hErrorTitle: '실시간 24시간 GitHub 지표를 불러오지 못했습니다',
      trending24hRetryButton: '다시 시도',
      recentActivityTitle: '실시간 커뮤니티 활동 피드',
      recentActivitySubtitle: '신규 프로젝트 등록, 좋아요, 북마크 등 VibeAtlas 전역의 최근 사용자 참여 흐름',
      recentActivityFilterAll: '전체',
      recentActivityFilterSubmissions: '신규 등록',
      recentActivityFilterLikes: '좋아요',
      recentActivityFilterBookmarks: '북마크',
      recentActivityAutoScrollOn: '자동 스크롤',
      recentActivityAutoScrollPaused: '일시 정지',
      recentActivityActionSubmitted: '새 프로젝트를 등록했습니다',
      recentActivityActionLiked: '좋아요를 눌렀습니다',
      recentActivityActionBookmarked: '북마크에 저장했습니다',
      recentActivityCommunityActor: 'VibeAtlas 커뮤니티',
      recentActivityGuestActor: '게스트 방문자',
      recentActivityLiveLabel: '실시간',
      recentActivityDeltaSuffix: '건 최근 반응',
      recentActivityOpenProject: '상세',
      recentActivityEmptyTitle: '선택한 유형의 최근 활동이 없습니다',
      recentActivityEmptyBody: '프로젝트를 등록하거나 좋아요·북마크를 누르면 실시간 활동이 이곳에 표시됩니다.',
      recentActivityLiveCountSuffix: '건의 활동',
      recentActivityShowAllButton: '전체 활동 보기',
    },
    discover: {
      title: '프로젝트 & 리소스 탐색',
      subtitle: '모든 필터는 URL 쿼리와 동기화되어 링크 공유 및 새로고침 시 그대로 유지됩니다.',
      filtersHeading: '세부 필터',
      mobileFiltersButton: '필터',
      resetFilters: '필터 초기화',
      searchPlaceholder: '키워드, 스택, 메이커, 저장소 검색...',
      sortLabel: '정렬',
      resultsCount: '개 결과',
      emptyTitle: '조건에 일치하는 프로젝트가 없습니다',
      emptyBody: '필터 조건을 완화하거나 검색어를 변경해 보세요.',
      previousPage: '이전',
      nextPage: '다음',
      filterType: '콘텐츠 유형',
      filterCategory: '프로젝트 카테고리',
      allCategoriesOption: '전체 카테고리',
      filterTags: '프로젝트 태그',
      clearTags: '태그 해제',
      activeTagsPrefix: '선택된 태그',
      tagsHint: '여러 태그를 조합해 조건을 좁힐 수 있습니다.',
      filterPlatform: '개발 플랫폼',
      filterHosting: '호스팅',
      filterBackend: '백엔드',
      filterCountry: '국가',
      filterLanguage: '지원 언어',
      filterLicense: '라이선스',
      filterPricing: '가격 모델',
      filterVerification: '검증 상태',
      filterMinStars: '최소 GitHub 스타',
      filterUpdatedWithin: '최근 업데이트',
      allOption: '전체',
      webAppsTop100Title: '웹 애플리케이션 Top #1 ~ #100 전체 보기',
      webAppsTop100Subtitle: 'GitHub 공식 REST API 기준 인기 웹 애플리케이션 #1부터 #100까지 한 번에 모두 렌더링합니다.',
      webAppsLoading: '웹 애플리케이션 #1 ~ #100 데이터를 불러오는 중...',
      webAppsError: '웹 애플리케이션 #1 ~ #100 실시간 목록을 불러오지 못해 로컬 등록 프로젝트만 표시 중입니다.',
      webAppsRetry: '다시 불러오기',
    },
    trendingSection: {
      title: '트렌딩 & 성장 속도',
      subtitle: '최근 30일·7일 GitHub 스타 증가량 및 커뮤니티 성장 속도(D3 시각화)로 급상승 프로젝트를 포착하세요.',
      toggleExpand: '차트 펼치기',
      toggleCollapse: '차트 접기',
      tabStar30d: '30일 스타 성장',
      tabStar7d: '7일 급상승',
      tabSignalVelocity: '커뮤니티 성장 속도',
      chartHeading: '상위 급상승 프로젝트 순위',
      trajectoryHeading: '일별 누적 추이',
      unitStars: '스타',
      unitSignals: '시그널',
      perDaySuffix: '/일',
      periodDeltaLabel: '기간 순증가',
      dailyVelocityLabel: '일평균 속도',
      currentTotalLabel: '현재 누적',
      inspectButton: '상세 보기',
      emptyStarTitle: '다중 일자 GitHub 스타 스냅샷이 아직 부족합니다',
      emptyStarBody: '여러 날짜에 걸쳐 GitHub 동기화가 누적되면 30일·7일 스타 증가 속도가 이 D3 차트에 표시됩니다.',
      switchToSignalButton: '커뮤니티 성장 속도 보기',
      emptyFilteredTitle: '현재 필터에 해당하는 성장 데이터가 없습니다',
      emptyFilteredBody: '필터 조건을 완화하면 급상승 프로젝트의 성장 속도 차트를 확인할 수 있습니다.',
      fallbackNote: '현재 목록에 다중 일자 GitHub 스타 변화량이 없어 실측 VibeAtlas 참여 성장 속도를 기본으로 표시합니다.',
    },
    githubTrendingBubble: {
      title: 'GitHub Trending · AI 생태계',
      subtitle: '최근 활발히 개발 중인 AI 생태계 GitHub 저장소를 일평균 스타 상승량(D3 버블 차트) 크기로 한눈에 비교하세요.',
      toggleExpand: '버블 차트 펼치기',
      toggleCollapse: '버블 차트 접기',
      refreshButton: '새로고침',
      refreshing: '불러오는 중...',
      allLanguages: '전체 언어',
      perDaySuffix: '/일',
      dailyStarsLabel: '일일 스타 속도',
      totalStarsLabel: '총 GitHub 스타',
      forksLabel: '포크',
      pushedLabel: '최근 푸시',
      topMoversHeading: '상위 급상승 저장소',
      openGithubButton: 'GitHub 열기',
      inspectVibeAtlasButton: 'VibeAtlas 상세',
      loadingLabel: 'AI 생태계 GitHub 트렌딩 저장소를 불러오는 중...',
      emptyTitle: '선택한 언어의 트렌딩 저장소가 없습니다',
      emptyBody: '전체 언어 필터로 되돌리면 AI 생태계 전체 버블 차트를 확인할 수 있습니다.',
      resetLanguageButton: '전체 언어 보기',
      errorTitle: 'GitHub 트렌딩 저장소를 불러오지 못했습니다',
      retryButton: '다시 시도',
      cachedNotice: '캐시 스냅샷 표시 중',
      rateModeVelocity: '일일 스타 상승률 기준',
      rateModeSnapshot: '24시간 스냅샷 증감',
      reposCountLabel: '개 활성 저장소',
      clickHint: '버블을 선택해 저장소 상세 정보를 확인하세요',
    },
    discoveryMap: {
      title: '생태계 비주얼 탐색 맵 (Scatter Map)',
      subtitle: 'GitHub 스타 규모(X축·로그)와 최근 업데이트·커뮤니티 활동 빈도(Y축) 기준으로 프로젝트를 탐색하세요.',
      toggleExpand: '탐색 맵 펼치기',
      toggleCollapse: '탐색 맵 접기',
      scopeEcosystem: '전체 생태계',
      scopeDirectory: '디렉터리 필터 결과',
      scopeVerifiedMakers: '메이커 인증만',
      allTypes: '전체 유형',
      xAxisLabel: 'GitHub 스타 (로그 스케일)',
      yAxisLabel: '활동 빈도 지수 (0–100)',
      quadrantLeaders: '생태계 리더',
      quadrantActiveBuilders: '고활동 인디 · 신예',
      quadrantEstablished: '안정 · 성숙기',
      quadrantEmerging: '초기 · 니치',
      spotlightHeading: '선택된 노드 스포트라이트',
      starsMetricLabel: 'GitHub 스타',
      activityMetricLabel: '활동 빈도',
      dailyVelocityLabel: '일일 스타 속도',
      recencyLabel: '최근 활동',
      todayLabel: '오늘',
      daysAgoSuffix: '일 전',
      sourceDirectory: 'VibeAtlas 등록',
      sourceEnriched: '디렉터리 + 실시간 GitHub',
      sourceEcosystem: 'GitHub AI 생태계',
      inspectButton: '상세 보기',
      openGithubButton: 'GitHub 열기',
      emptyTitle: '현재 조건에 맞는 맵 노드가 없습니다',
      emptyBody: '범위나 유형 필터를 전체로 전환하면 생태계 전체 분포를 다시 탐색할 수 있습니다.',
      resetMapFilter: '맵 필터 초기화',
      resetFiltersButton: '디렉터리 필터 초기화',
      pointsCountLabel: '개 프로젝트 매핑됨',
      interactionHint: '점(노드)에 마우스를 올리거나 클릭해 상세 지표를 확인하세요',
      medianGuideNote: '점선: 중앙 기준선',
    },
    card: {
      githubStars: 'GitHub 스타',
      internalLikes: '좋아요',
      internalBookmarks: '북마크',
      notSynced: '미동기화',
      staleLabel: '동기화 오래됨',
      verifiedLabel: '검증됨',
      pendingLabel: '검증 대기',
      unverifiedLabel: '미검증',
      missingLicense: '라이선스 미표기',
      openDetail: '상세 보기',
      likeAction: '좋아요',
      bookmarkAction: '북마크',
      trendingBadge: '트렌딩',
      trending7dTooltip: '최근 7일간 GitHub 스타 +{count} 상승',
      trendingEngagementTooltip: '최근 7일간 좋아요 +{likes} · 북마크 +{bookmarks} (총 +{total} 증가)',
      compareAdd: '비교 담기',
      compareSelected: '비교 선택됨',
    },
    highlights: {
      containerLabel: '프로젝트 주요 배지',
      featured: '주요 추천',
      newArrival: '신규 등록',
      highActivity: '활발한 활동',
      featuredTooltip: '검증된 메타데이터와 커뮤니티 평가를 기준으로 선정된 대표 추천 프로젝트입니다.',
      newArrivalTooltip: '최근 등록된 신규 프로젝트입니다 ({date}).',
      highActivityTooltip: '최근 커밋·커뮤니티 참여 활동이 활발한 프로젝트입니다.',
      highActivityStarsTooltip: '최근 7일간 GitHub 스타 +{count} 상승으로 높은 활동성을 기록했습니다.',
      highActivitySignalsTooltip: '최근 7일간 좋아요·북마크 +{count}건의 활발한 커뮤니티 반응이 모였습니다.',
    },
    verification: {
      claimedBadge: '메이커 인증',
      claimedTooltip: '제작자가 소유권을 직접 인증하고 관리하는 프로젝트입니다.',
      pendingBadge: '소유권 심사 중',
      pendingTooltip: '메이커 소유권 인증 요청이 접수되어 확인 중입니다.',
      unclaimedBadge: '미인증 리스팅',
      panelTitleClaimed: '메이커 소유권 인증 완료',
      panelBodyClaimed:
        '공식 제작자가 VibeAtlas에서 소유권을 직접 인증했습니다. 공식 링크, 라이선스 및 메이커 귀속 정보의 신뢰도가 검증되었습니다.',
      panelTitlePending: '메이커 소유권 인증 심사 중',
      panelBodyPending:
        '소유권 인증 증빙이 접수되어 검토 중입니다. 승인이 완료되면 프로젝트 카드와 상세 화면에 메이커 인증 배지가 표시됩니다.',
      panelTitleUnclaimed: '메이커 소유권 미인증 리스팅',
      panelBodyUnclaimed:
        '공개 저장소 동기화 또는 커뮤니티 큐레이션으로 등록된 항목입니다. 공식 제작자라면 소유권 인증을 제출해 신뢰 배지를 받을 수 있습니다.',
      attributionLabel: '메이커',
      methodLabel: '인증 방식',
      statusLabel: '상태',
      statusClaimed: '소유권 인증됨',
      statusPending: '심사 대기 중',
      statusUnclaimed: '미인증',
      ownerTag: '내 등록',
      methodGithub: 'GitHub 저장소 관리자',
      methodDns: '도메인 DNS TXT',
      methodDemo: '라이브 데모 메타 태그',
      methodDirect: '메이커 직접 등록 · 검증',
      claimCta: '소유권 인증하기',
    },
    compare: {
      trayTitle: '프로젝트 비교함',
      trayHintOneMore: '비교표를 열려면 프로젝트를 1개 이상 더 선택하세요 (최대 3개).',
      trayLimitNotice: '한 번에 최대 3개 프로젝트까지 비교할 수 있습니다. 기존 항목을 제거한 뒤 추가해 주세요.',
      emptySlotLabel: '빈 슬롯',
      compareNowButton: '나란히 비교하기',
      clearButton: '전체 비우기',
      removeAction: '비교에서 제거',
      modalTitle: '프로젝트 나란히 비교',
      modalSubtitle: 'GitHub 스타·포크·라이선스 지표와 기술 스택·메타데이터를 항목별로 비교합니다.',
      closeButton: '닫기',
      colAttribute: '비교 항목',
      sectionGithub: 'GitHub 저장소 지표',
      sectionMetadata: '메타데이터 · 기술 스택',
      sectionCommunity: 'VibeAtlas 내부 활동 · 링크',
      rowGithubStars: 'GitHub 스타',
      rowGithubForks: 'GitHub 포크',
      rowLicense: '라이선스',
      rowRepository: '저장소',
      rowLastSynced: '마지막 동기화',
      rowContentType: '콘텐츠 유형',
      rowCategories: '카테고리',
      rowPlatform: '개발 플랫폼',
      rowHostingBackend: '호스팅 · 백엔드',
      rowTechStack: '기술 스택',
      rowPricing: '가격 모델',
      rowVerification: '검증 · 출처',
      rowCountryLang: '국가 · 언어',
      rowUpdatedAt: '최근 업데이트',
      rowEngagement: '좋아요 · 북마크',
      rowLinks: '외부 · 상세 링크',
      highestBadge: '최고',
      latestBadge: '최신',
      openDetail: '상세 보기',
      notAvailable: '미등록',
    },
    detail: {
      close: '닫기',
      externalLinksTitle: '외부 링크 (외부 사이트로 이동)',
      internalActionsTitle: 'VibeAtlas 내부 액션',
      liveDemo: '라이브 데모',
      officialWebsite: '공식 웹사이트',
      githubRepository: 'GitHub 저장소',
      syncGithubNow: 'GitHub 지금 동기화',
      syncing: '동기화 중...',
      provenanceTitle: '메타데이터 출처 & 신선도',
      provenanceSourceLabel: '출처',
      lastSyncedLabel: '마지막 동기화',
      missingFieldsLabel: '누락 · 미확인 필드',
      noneMissing: '누락된 핵심 필드 없음',
      techAndPlatformTitle: '기술 스택 및 인프라 귀속',
      platformLabel: '개발 플랫폼',
      hostingLabel: '호스팅',
      backendLabel: '백엔드',
      licenseLabel: '라이선스',
      pricingLabel: '가격 정책',
      countryLangLabel: '국가 / 언어',
      historyChartTitle: '최근 14일 성장 추이 (GitHub 스타 · 내부 신호)',
      historyChartSubtitle: 'GitHub 스타 변화량과 VibeAtlas 내부 북마크·좋아요는 별도 축으로 구분됩니다.',
      chartTabStars: 'GitHub 스타',
      chartTabInternal: '내부 좋아요·북마크',
      chartUnsyncedStarsHint: 'GitHub 저장소가 아직 동기화되지 않았습니다. 실시간 스타 수를 반영하려면 동기화하세요.',
      chartLiveTotalLabel: '현재 GitHub 스타',
      chartDeltaLabel: '14일 증가',
      chartBaselineNote: '현재 실시간 기준선 (일별 동기화 누적 시 변화 추이가 표시됩니다)',
      relatedTitle: '유사 프로젝트 및 대안',
      reportButton: '정보 오류/신고',
      claimButton: '소유권 인증 요청',
      reportTitle: '프로젝트 정보 오류 및 문제 신고',
      claimTitle: '메이커 소유권 인증 요청',
      submitReport: '신고 접수',
      submitClaim: '인증 요청 제출',
      actionSubmitted: 'Firestore에 안전하게 기록되었습니다.',
      signInRequired: '이 작업을 저장하려면 Google 로그인이 필요합니다.',
      communityActivityTitle: '커뮤니티 활동',
      communityActivitySubtitle: '이 프로젝트의 최근 좋아요, 북마크, 제보 내역을 최신순으로 표시합니다.',
      activityFilterAll: '전체',
      activityFilterLikes: '좋아요',
      activityFilterBookmarks: '북마크',
      activityFilterReports: '제보',
      activityActionLike: '님이 프로젝트를 좋아합니다',
      activityActionBookmark: '님이 프로젝트를 북마크했습니다',
      activityActionReport: '님이 정보 오류/문제를 제보했습니다',
      activityGuestActor: '방문자',
      activityEmptyTitle: '아직 기록된 최근 활동이 없습니다',
      activityEmptySubtitle: '상단의 좋아요, 북마크 또는 신고 버튼을 누르면 이 타임라인에 실시간으로 기록됩니다.',
      activityLoadingLabel: '활동 내역을 불러오는 중...',
      activityErrorNotice: '실시간 커뮤니티 활동 스트림을 불러오지 못해 로컬 기록만 표시 중입니다.',
      activityReasonBrokenLink: '깨진 링크',
      activityReasonStaleMetadata: '오래된 메타데이터',
      activityReasonMisattribution: '잘못된 스택·제작자 표기',
      activityReasonSpam: '스팸',
      activityReasonSecurityConcern: '보안 우려',
      vibeScoreTitle: '바이브 스코어 · 커뮤니티 건강도',
      vibeScoreSubtitle: 'VibeAtlas 내부 참여도, 최근 활동 모멘텀, 신뢰·신선도 및 동기화된 GitHub 지표를 종합한 D3 게이지입니다.',
      vibeScoreOutOf100: '/ 100',
      vibeScoreTierThriving: '활발 (Thriving)',
      vibeScoreTierActive: '양호 (Active)',
      vibeScoreTierWarm: '보통 (Warm)',
      vibeScoreTierQuiet: '한산 (Quiet)',
      vibeScorePillarAffinity: '커뮤니티 선호도 (좋아요·북마크)',
      vibeScorePillarMomentum: '최근 활동 모멘텀',
      vibeScorePillarTraction: '외부 GitHub 견인력',
      vibeScorePillarHealth: '검증 및 최신성 건강도',
      vibeScoreUnsyncedNote: 'GitHub 저장소 미동기화 상태 (내부 신호만으로 산출됨)',
      vibeScoreReportsPenalty: '신고·오류 제보 감점 반영',
      vibeScoreFormulaNote: '내부 커뮤니티 신호(최대 75점)와 동기화된 외부 GitHub 지표(최대 25점)를 투명하게 분리 계산합니다.',
      sharePromoteTitle: '프로젝트 홍보 · 공유',
      copyDirectLink: '직접 링크 복사',
      copyPromoPitch: '홍보 문구 복사',
      copiedFeedback: '복사 완료',
      timelineTitle: '프로젝트 타임라인 & 마일스톤',
      timelineSubtitle: 'GitHub 공식 릴리스·커밋 활동과 메이커가 직접 기록한 마일스톤을 시간순으로 시각화합니다.',
      timelineFilterAll: '전체',
      timelineFilterReleases: '릴리스',
      timelineFilterCommits: '커밋',
      timelineFilterCreatorLogs: '메이커 로그',
      timelineSortNewest: '최신순',
      timelineSortOldest: '오래된순',
      timelineAddButton: '마일스톤 기록',
      timelineCloseComposer: '입력 닫기',
      timelineCadenceLabel: '활동 주기 분포',
      timelineSpanDaysSuffix: '일 구간',
      timelineGapSuffix: '일 간격',
      timelineLoadingLabel: 'GitHub 저장소 릴리스·커밋 이력을 불러오는 중...',
      timelineRepoErrorNotice: 'GitHub 저장소 마일스톤을 일시적으로 불러오지 못해 디렉터리·메이커 기록만 표시합니다.',
      timelineNoRepoNote: '연결된 GitHub 저장소가 없어 디렉터리 및 메이커 기록을 기준으로 타임라인을 표시합니다.',
      timelineEmptyTitle: '선택한 분류에 해당하는 마일스톤이 없습니다',
      timelineEmptyBody: '전체 탭으로 전환하면 저장소 및 디렉터리 이력을 확인할 수 있습니다.',
      timelineEmptyCreatorBody: '메이커가 아직 별도 업데이트 로그를 등록하지 않았습니다.',
      timelineAuthNoticeSignedOut: '공식 마일스톤 로그를 게시하려면 프로젝트 소유자 계정으로 Google 로그인해야 합니다.',
      timelineAuthNoticeNotOwner: '등록된 프로젝트 소유자 또는 관리자만 공식 타임라인 로그를 추가할 수 있습니다. 제작자라면 상단에서 소유권 인증을 제출하세요.',
      timelineSignInCta: 'Google 로그인',
      timelineClaimCta: '소유권 인증 열기',
      timelineKindLabel: '유형',
      timelineKindRelease: '정식 릴리스',
      timelineKindLaunch: '신규 런칭',
      timelineKindFeature: '기능 추가',
      timelineKindUpdate: '업데이트',
      timelineKindFix: '버그·보안 수정',
      timelineVersionLabel: '버전 태그 (선택)',
      timelineDateLabel: '발생 일자',
      timelineEntryTitleLabel: '마일스톤 제목 *',
      timelineSummaryLabel: '세부 요약 (선택)',
      timelineUrlLabel: '참고 URL / 릴리스 노트 (선택)',
      timelinePublishButton: '타임라인에 게시',
      timelinePublishingButton: '게시 중...',
      timelineDeleteButton: '마일스톤 삭제',
      timelineExternalLink: '원문 보기',
      timelineSourceRelease: 'GitHub 릴리스',
      timelineSourceCommit: '커밋',
      timelineSourceCreator: '메이커 로그',
      timelineSourceCatalog: '디렉터리 이력',
      volatilityTitle: '바이브 스코어 변동성 vs GitHub 스타 성장률',
      volatilitySubtitle: '시간에 따른 커뮤니티 체감 점수 변동폭(±σ 밴드)과 저장소 일일 스타 증가율(D3 이중 추세선)을 비교합니다.',
      volatilityModePace: '이중 추세 비교',
      volatilityModeSwing: '일간 변동폭',
      volatilityMetricStdDev: '점수 변동성 (σ)',
      volatilityMetricNetVibe: '14일 바이브 변화',
      volatilityMetricStarRate: '14일 스타 성장률',
      volatilityMetricMaxSwing: '최대 일간 등락',
      volatilityVerdictLabel: '채택 속도 대비 정서 정렬',
      volatilityVerdictKeepingPace: '기술 채택과 보조 일치',
      volatilityVerdictKeepingPaceDesc: '커뮤니티 바이브 스코어와 GitHub 스타 증가율이 균형 있게 함께 상승하고 있습니다.',
      volatilityVerdictSentimentLeading: '커뮤니티 정서 선행 · 변동 확대',
      volatilityVerdictSentimentLeadingDesc: '내부 바이브 관심도나 변동성이 최근 저장소 스타 성장 속도보다 빠르게 움직이고 있습니다.',
      volatilityVerdictAdoptionOutpacing: '기술 채택이 정서 상회',
      volatilityVerdictAdoptionOutpacingDesc: 'GitHub 스타 채택 속도가 VibeAtlas 내 커뮤니티 모멘텀보다 빠르게 앞서가고 있습니다.',
      volatilityVerdictUnsynced: 'GitHub 미동기화 상태',
      volatilityVerdictUnsyncedDesc: '내부 바이브 변동성은 실시간 추적 중이며, GitHub 동기화 시 스타 성장률 비교선이 활성화됩니다.',
      volatilityVerdictBaseline: '초기 단일 스냅샷 기준선',
      volatilityVerdictBaselineDesc: '현재 시점의 GitHub 스타 기준선이 기록되었습니다. 다중 일자 동기화 누적 시 일일 성장률이 비교됩니다.',
      volatilityLegendVibeScore: '바이브 스코어 (0–100)',
      volatilityLegendBand: '변동성 밴드 (±σ)',
      volatilityLegendStarRate: '일간 스타 성장률 (%)',
      volatilityLegendSwing: '일간 바이브 등락폭 (Δ)',
      volatilityLeftAxisLabel: '바이브 스코어',
      volatilityRightAxisLabel: '스타 성장률 (%)',
      volatilitySwingAxisLabel: '일간 변동 (Δpt)',
      volatilityScrubHint: '각 날짜 노드를 가리키거나 선택해 세부 변동을 확인하세요',
      volatilityDateLabel: '기준일',
      volatilityVibeDeltaLabel: '전일 대비 바이브',
      volatilityStarGainLabel: '일간 스타 증감',
      insightsTitle: '프로젝트 인사이트 · 최근 7일 좋아요 & 북마크',
      insightsSubtitle: '최근 7일간 내부 좋아요(즉각 호응)와 북마크(저장 의도)의 일별 증감 및 누적 추세를 D3로 시각화합니다.',
      insightsModeDaily: '일별 증감',
      insightsModeCumulative: '7일 누적 추이',
      insightsKpiLikes7d: '7일 좋아요 증가',
      insightsKpiBookmarks7d: '7일 북마크 증가',
      insightsKpiBookmarkShare: '북마크 저장 비중',
      insightsKpiPeakDay: '최고 참여일',
      insightsTotalPrefix: '누적',
      insightsAvgPerDay: '일 평균',
      insightsNoPeakDay: '활동 없음',
      insightsScrubHint: '각 날짜 막대나 노드를 가리키거나 선택해 세부 수치를 확인하세요',
      insightsDateLabel: '기준일',
      insightsCombinedLabel: '합계',
      insightsMixTitle: '7일 반응 구성비',
      insightsEmptyTitle: '최근 7일간 기록된 좋아요·북마크 활동이 아직 없습니다.',
      insightsEmptyHint: '좋아요 또는 북마크를 남기면 일별 커뮤니티 참여 추이가 즉시 반영됩니다.',
      insightsAxisCount: '건수',
    },
    submit: {
      title: '새 프로젝트 등록',
      subtitle: '검증 가능한 메타데이터를 입력하면 즉시 디렉터리에 게시되고 Firestore에 저장됩니다.',
      promoPreviewTitle: '메인 페이지 홍보 미리보기',
      promoPreviewSubtitle: '등록 즉시 메인 페이지 홍보 쇼케이스에 노출되며 아래 소개 문구로 외부 공유가 가능합니다.',
      promoPreviewUntitled: '내 AI 프로젝트 (제목 입력 시 반영)',
      promoPreviewTaglineFallback: '한 줄 소개를 입력하면 홍보 스니펫이 실시간 생성됩니다.',
      githubImportTitle: 'GitHub 저장소에서 메타데이터 가져오기',
      githubImportHint: '예: modelcontextprotocol/servers 또는 https://github.com/cline/cline',
      githubImportPlaceholder: 'owner/repo 또는 GitHub URL 입력',
      githubFetchButton: '실시간 가져오기',
      fetchingGithub: '조회 중...',
      nameLabel: '프로젝트 이름 *',
      taglineEnLabel: '영문 한 줄 소개 (5~220자) *',
      taglineKoLabel: '한국어 한 줄 소개',
      descriptionEnLabel: '영문 상세 설명 (최소 20자) *',
      descriptionKoLabel: '한국어 상세 설명',
      contentTypeLabel: '콘텐츠 유형',
      categoriesLabel: '카테고리 · 태그 (쉼표 구분, 최대 6개) *',
      categoriesQuickTagsHint: '빠른 태그 선택 (클릭하여 추가/제거):',
      techStackLabel: '기술 스택 (쉼표 구분, 최대 12개)',
      platformLabel: '개발 플랫폼',
      hostingLabel: '호스팅 제공자',
      backendLabel: '백엔드 기술',
      countryLabel: '국가 코드 (예: KR, US) *',
      languageLabel: '지원 언어',
      licenseLabel: '라이선스 (예: MIT, Apache-2.0) *',
      pricingLabel: '가격 모델',
      liveDemoLabel: '라이브 데모 URL (https://)',
      websiteLabel: '공식 웹사이트 URL (https://)',
      githubUrlLabel: 'GitHub URL (https://)',
      makerNameLabel: '메이커 / 팀 이름 *',
      makerHandleLabel: '메이커 핸들 (예: @handle)',
      submitButton: '디렉터리에 등록',
      submitting: '등록 중...',
      signInPrompt: '프로젝트를 Firestore에 게시하려면 먼저 Google 계정으로 로그인해 주세요.',
      submitSuccess: '프로젝트가 등록되었습니다!',
      draftRestoredNotice: '이전에 작성 중이던 임시 저장 내용을 로컬 스토리지에서 불러왔습니다.',
      draftAutosaveHint: '입력 중인 내용과 설정은 30초마다 브라우저 로컬 스토리지에 자동 저장됩니다.',
      clearDraftButton: '임시 저장 초기화',
      validationSummaryPrefix: '입력 항목을 확인해 주세요',
    },
    maker: {
      title: '메이커 대시보드 & 저장 목록',
      subtitle: '내가 등록한 프로젝트, 북마크한 리소스, 소유권 인증 및 신고 내역을 관리합니다.',
      myProjectsTab: '내 프로젝트',
      myBookmarksTab: '북마크 목록',
      claimsReportsTab: '소유권 인증 · 신고 내역',
      signInCtaTitle: 'Google 계정으로 로그인하여 메이커 대시보드 열기',
      signInCtaBody: '내 프로젝트 관리, 북마크 동기화, GitHub 메타데이터 재동기화를 이용할 수 있습니다.',
      noProjectsYet: '아직 등록한 프로젝트가 없습니다.',
      noBookmarksYet: '북마크한 프로젝트가 없습니다.',
      resyncGithub: 'GitHub 재동기화',
      deleteProject: '삭제',
      analyticsTitle: '프로젝트 참여도 애널리틱스',
      analyticsSubtitle: '내부 좋아요·북마크 합계는 외부 GitHub 스타와 분리 집계됩니다.',
      metricOwnedProjects: '등록 프로젝트',
      metricTotalLikes: '누적 좋아요',
      metricTotalBookmarks: '누적 북마크',
      metricTotalEngagement: '총 내부 참여도',
      metricExternalStarsNote: '외부 GitHub 스타 합계',
      analyticsSortEngagement: '총 참여순',
      analyticsSortLikes: '좋아요순',
      analyticsSortBookmarks: '북마크순',
      analyticsSortRecent: '최신순',
      tableProjectCol: '프로젝트',
      tableLikesCol: '좋아요',
      tableBookmarksCol: '북마크',
      tableTotalCol: '참여 합계',
      tableSplitCol: '참여 비중',
      tableGithubCol: 'GitHub 스타',
      topProjectLabel: '최다 참여 프로젝트',
      analyticsEmptyHint: '프로젝트를 등록하면 각 프로젝트별 좋아요·북마크 추이와 합계가 여기에 표시됩니다.',
      projectListHeading: '보유 프로젝트 목록',
      likesUnit: '좋아요',
      bookmarksUnit: '북마크',
      engagementUnit: '합계',
    },
    footer: {
      tagline: 'VibeAtlas (Working Name) — 검증 가능한 AI 프로덕트 · MCP · AI Skills 디렉터리',
      transparencyNote: '모든 외부 GitHub 지표와 내부 활동 지표는 분리 집계됩니다.',
    },
    voiceSearch: {
      startLabel: '음성으로 검색',
      stopLabel: '음성 입력 중지',
      listeningStatus: '듣고 있습니다... 검색어를 말씀해 주세요',
      stopButton: '중지',
      unsupportedError: '이 브라우저는 음성 검색(Web Speech API)을 지원하지 않습니다. Chrome 또는 Edge에서 이용해 주세요.',
      permissionDeniedError: '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 접근을 허용해 주세요.',
      noSpeechError: '음성이 감지되지 않았습니다. 마이크에 대고 다시 말씀해 주세요.',
      audioCaptureError: '마이크 장치를 찾을 수 없습니다. 오디오 입력 장치를 확인해 주세요.',
      networkError: '음성 인식 서버와 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.',
      unknownError: '음성 인식을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      dismissError: '닫기',
    },
    githubStarsPage: {
      title: 'GitHub 스타 Top 100 랭킹',
      subtitle: 'GitHub 공식 Search REST API 기준 최다 스타 저장소 1위부터 100위까지 실시간 집계입니다 (VibeAtlas 내부 좋아요·북마크와 분리 집계).',
      refreshButton: '실시간 새로고침',
      refreshing: '불러오는 중...',
      presetAll: '전체 Top 100',
      presetWebApps: '웹 애플리케이션',
      presetAiAgents: 'AI · 에이전트 · MCP',
      presetTypescript: 'TypeScript',
      presetPython: 'Python',
      presetRust: 'Rust',
      presetGo: 'Go',
      kpiRankedCount: '집계 순위',
      kpiTopStars: '1위 저장소 스타',
      kpiMedianStars: '중앙값 스타 (50위권)',
      kpiLastUpdated: '마지막 동기화',
      cachedFallbackBadge: '캐시 데이터 표시 중',
      searchPlaceholder: 'Top 100 내 저장소명, 설명, 토픽 검색...',
      allLanguagesOption: '모든 언어',
      showingCountLabel: '개 저장소 표시',
      colRank: '순위',
      colRepository: '저장소',
      colLanguageLicense: '언어 · 라이선스',
      colForks: 'Forks',
      colStars: 'GitHub 스타',
      colActions: '링크',
      openInVibeAtlas: 'VibeAtlas 상세',
      openGithub: 'GitHub',
      emptyFilteredTitle: '필터 조건에 일치하는 저장소가 없습니다',
      emptyFilteredBody: '검색어나 언어 필터를 초기화해 전체 100위 목록을 확인해 보세요.',
      resetFilterButton: '필터 초기화',
      errorTitle: 'GitHub 스타 랭킹을 불러오지 못했습니다',
      retryButton: '다시 시도',
      rateLimitResetPrefix: 'API 할당량 초기화 예정',
      translatingDescriptions: '저장소 설명 한국어 번역 중...',
      translatedBadge: '번역됨',
      showOriginal: '원문 보기',
      showTranslated: '번역 보기',
      translationErrorNotice: '실시간 번역 서비스 연결이 원활하지 않아 GitHub 원문 설명을 표시하고 있습니다.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      discover: 'Discover',
      githubStars: 'GitHub Stars',
      makers: 'Makers',
      submit: 'Submit',
      primaryCta: 'Submit Project',
    },
    workspace: {
      savedBookmarks: 'Bookmarks',
      signInGoogle: 'Google Sign In',
      signOut: 'Sign Out',
      makerAccount: 'Maker Account',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      koreanSearchNoteTitle: 'Multilingual Search Strategy',
      koreanSearchNoteBody:
        'Standard English word stemmers skip Korean agglutinative tokens. VibeAtlas pairs case-insensitive Korean/English substring matching with curated bilingual tech term expansion.',
    },
    hero: {
      kicker: 'Verifiable Metadata · Transparent Rankings',
      headline: 'Discover and evaluate vibe-coded apps, MCP servers, and AI Skills',
      subheadline:
        'VibeAtlas separates GitHub stars from internal likes and bookmarks, surfaces metadata provenance, and transparently marks stale or unverified listings.',
      searchPlaceholder: 'Search MCP servers, Lovable apps, Korean makers, Supabase...',
      searchButton: 'Search',
      quickBrowseLabel: 'Quick Browse',
    },
    home: {
      trendingTab: 'Trending This Week',
      newlyLaunchedTab: 'Newly Launched',
      risingOssTab: 'Rising Open Source',
      viewAllDiscover: 'Browse Full Directory',
      mcpAndSkillsTitle: 'Popular MCP Servers & AI Skills',
      mcpAndSkillsSubtitle: 'Inspect tool protocols, agent skills, and verified repositories.',
      stacksTitle: 'Built with Modern AI Stacks',
      stacksSubtitle: 'Transparent platform attribution across Lovable, Vercel, Supabase, and Cursor.',
      koreanGlobalTitle: 'Korean & Global Maker Spotlight',
      koreanGlobalSubtitle: 'Independent builders and AI-native teams shipping from Seoul and worldwide.',
      featuredMakersTitle: 'Featured Makers',
      featuredMakersSubtitle: 'Builders with verifiable repositories and documented provenance.',
      submitCtaTitle: 'Publish & promote your AI product or MCP server',
      submitCtaBody:
        'Projects published via Submit are featured in the Home Launch Showcase with one-click share links and localized promotional snippets.',
      submitCtaButton: 'Submit & Promote',
      newsletterTitle: 'Weekly VibeAtlas Digest',
      newsletterBody: 'Curated weekly launches across MCP servers, AI Skills, and Korean/global builders.',
      newsletterPlaceholder: 'Your email (requires Google sign-in)',
      newsletterButton: 'Subscribe',
      newsletterSignInNotice: 'Sign in with Google to save your subscription.',
      newsletterSuccess: 'Subscription saved.',
      promoTitle: 'Registered Launch Showcase',
      promoSubtitle: 'Promote projects published via Submit right on the main page with direct deep links and ready-to-share launch snippets.',
      promoTabAll: 'All Featured',
      promoTabSubmitted: 'Maker Submitted',
      promoTabDemoReady: 'Live Demo Ready',
      promoCtaSubmit: 'Submit & Promote Project',
      promoKitHeading: 'Promotion Kit · Shareable Copy',
      promoToneCommunity: 'Community Pitch',
      promoToneSocial: 'Social Post',
      promoCopyLinkButton: 'Copy Share Link',
      promoCopyPitchButton: 'Copy Promo Copy',
      promoCopiedLabel: 'Copied',
      promoOpenDetailButton: 'Open Detail',
      promoLiveDemoButton: 'Live Demo',
      promoSubmittedLabel: 'Maker Submitted',
      promoCuratedLabel: 'Editorial Pick',
      promoEmptyFilterTitle: 'No matching submitted launches yet',
      promoEmptyFilterBody: 'Submit your project now to showcase it at the top of the VibeAtlas main page.',
      promoCountLiveSuffix: 'submitted',
      trending24hTitle: 'Trending · 24h GitHub Star Growth',
      trending24hSubtitle: 'Projects surging fastest in GitHub stars over the last 24 hours from live API snapshots and verified daily star velocity.',
      trending24hAllLanguages: 'All Languages',
      trending24hRefreshButton: 'Refresh',
      trending24hViewLeaderboard: 'View Star Leaderboard',
      trending24hStarsSuffix: '/ 24h',
      trending24hSourceSnapshot: '24h Snapshot Delta',
      trending24hSourceRate: '24h Star Velocity',
      trending24hOpenCatalog: 'Open Detail',
      trending24hOpenGithub: 'GitHub',
      trending24hEmptyTitle: 'No 24h trending projects match this language',
      trending24hEmptyBody: 'Switch back to all languages or refresh live GitHub signals.',
      trending24hResetLanguage: 'Show All Languages',
      trending24hErrorTitle: 'Could not load live 24h GitHub growth signals',
      trending24hRetryButton: 'Retry',
      recentActivityTitle: 'Recent Activity',
      recentActivitySubtitle: 'Live, scrolling feed of new project submissions, recent likes, and bookmarks across VibeAtlas.',
      recentActivityFilterAll: 'All',
      recentActivityFilterSubmissions: 'Submissions',
      recentActivityFilterLikes: 'Likes',
      recentActivityFilterBookmarks: 'Bookmarks',
      recentActivityAutoScrollOn: 'Auto-scroll',
      recentActivityAutoScrollPaused: 'Paused',
      recentActivityActionSubmitted: 'submitted',
      recentActivityActionLiked: 'liked',
      recentActivityActionBookmarked: 'bookmarked',
      recentActivityCommunityActor: 'VibeAtlas Community',
      recentActivityGuestActor: 'Guest Visitor',
      recentActivityLiveLabel: 'Live',
      recentActivityDeltaSuffix: 'recent',
      recentActivityOpenProject: 'Inspect',
      recentActivityEmptyTitle: 'No recent activity in this category',
      recentActivityEmptyBody: 'Submit a project, or click like or bookmark on any listing to see updates stream here.',
      recentActivityLiveCountSuffix: 'events',
      recentActivityShowAllButton: 'Show All Activity',
    },
    discover: {
      title: 'Discover Projects & Resources',
      subtitle: 'All active filters synchronize with the browser URL for sharing and reloads.',
      filtersHeading: 'Filters',
      mobileFiltersButton: 'Filters',
      resetFilters: 'Reset Filters',
      searchPlaceholder: 'Search keywords, stack, makers, repos...',
      sortLabel: 'Sort',
      resultsCount: ' results',
      emptyTitle: 'No matching projects found',
      emptyBody: 'Try broadening your filters or clearing the search query.',
      previousPage: 'Previous',
      nextPage: 'Next',
      filterType: 'Content Type',
      filterCategory: 'Category',
      allCategoriesOption: 'All Categories',
      filterTags: 'Project Tags',
      clearTags: 'Clear tags',
      activeTagsPrefix: 'Active tags',
      tagsHint: 'Select multiple tags to narrow results.',
      filterPlatform: 'Dev Platform',
      filterHosting: 'Hosting',
      filterBackend: 'Backend',
      filterCountry: 'Country',
      filterLanguage: 'Language',
      filterLicense: 'License',
      filterPricing: 'Pricing',
      filterVerification: 'Verification',
      filterMinStars: 'Min GitHub Stars',
      filterUpdatedWithin: 'Last Updated',
      allOption: 'All',
      webAppsTop100Title: 'Web Applications Top #1 – #100 (Full View)',
      webAppsTop100Subtitle: 'Rendering all #1 through #100 open-source web applications directly from the GitHub Search REST API.',
      webAppsLoading: 'Loading Web Applications #1 – #100...',
      webAppsError: 'Unable to fetch live Web Applications #1 – #100; showing local catalog entries.',
      webAppsRetry: 'Retry',
    },
    trendingSection: {
      title: 'Trending & Growth Velocity',
      subtitle: 'D3-powered visualization of rising projects by 30-day star delta and verified daily growth velocity.',
      toggleExpand: 'Expand chart',
      toggleCollapse: 'Collapse chart',
      tabStar30d: '30d Star Growth',
      tabStar7d: '7d Rising',
      tabSignalVelocity: 'Community Velocity',
      chartHeading: 'Fastest Rising Projects',
      trajectoryHeading: 'Daily Cumulative Trajectory',
      unitStars: 'stars',
      unitSignals: 'signals',
      perDaySuffix: '/day',
      periodDeltaLabel: 'Period Growth',
      dailyVelocityLabel: 'Daily Velocity',
      currentTotalLabel: 'Current Total',
      inspectButton: 'Inspect',
      emptyStarTitle: 'Multi-day GitHub star snapshots not yet recorded',
      emptyStarBody: 'Sync repositories across multiple days to plot 30-day and 7-day GitHub star growth velocity here.',
      switchToSignalButton: 'View Community Velocity',
      emptyFilteredTitle: 'No velocity data matches active filters',
      emptyFilteredBody: 'Broaden your filters to inspect growth velocity across rising projects.',
      fallbackNote: 'Showing verified VibeAtlas engagement velocity while multi-day GitHub star snapshots accumulate.',
    },
    githubTrendingBubble: {
      title: 'GitHub Trending',
      subtitle: 'D3 bubble chart sizing the most active AI ecosystem repositories by daily star count.',
      toggleExpand: 'Expand bubble chart',
      toggleCollapse: 'Collapse bubble chart',
      refreshButton: 'Refresh',
      refreshing: 'Refreshing...',
      allLanguages: 'All Languages',
      perDaySuffix: '/day',
      dailyStarsLabel: 'Daily Stars',
      totalStarsLabel: 'Total Stars',
      forksLabel: 'Forks',
      pushedLabel: 'Last Push',
      topMoversHeading: 'Top Daily Movers',
      openGithubButton: 'Open on GitHub',
      inspectVibeAtlasButton: 'Inspect in VibeAtlas',
      loadingLabel: 'Loading active AI ecosystem repositories...',
      emptyTitle: 'No trending repositories match this language',
      emptyBody: 'Reset the language filter to view all active AI ecosystem bubbles.',
      resetLanguageButton: 'Show All Languages',
      errorTitle: 'Unable to load GitHub Trending repositories',
      retryButton: 'Retry',
      cachedNotice: 'Cached snapshot',
      rateModeVelocity: 'Sized by daily star accrual',
      rateModeSnapshot: 'Sized by 24h snapshot delta',
      reposCountLabel: 'active repos',
      clickHint: 'Hover or click any bubble to inspect repository details',
    },
    discoveryMap: {
      title: 'Ecosystem Visual Discovery Map',
      subtitle: 'D3 scatter plot positioning projects by GitHub stars (X-axis, log scale) and activity frequency (Y-axis).',
      toggleExpand: 'Expand discovery map',
      toggleCollapse: 'Collapse discovery map',
      scopeEcosystem: 'Full Ecosystem',
      scopeDirectory: 'Directory Filtered',
      scopeVerifiedMakers: 'Verified Makers',
      allTypes: 'All Types',
      xAxisLabel: 'GitHub Stars (symlog)',
      yAxisLabel: 'Activity Frequency (0–100)',
      quadrantLeaders: 'Ecosystem Leaders',
      quadrantActiveBuilders: 'Active Rising Builders',
      quadrantEstablished: 'Established Steady',
      quadrantEmerging: 'Emerging / Niche',
      spotlightHeading: 'Node Spotlight',
      starsMetricLabel: 'GitHub Stars',
      activityMetricLabel: 'Activity Freq',
      dailyVelocityLabel: 'Daily Velocity',
      recencyLabel: 'Last Active',
      todayLabel: 'Today',
      daysAgoSuffix: 'd ago',
      sourceDirectory: 'VibeAtlas Directory',
      sourceEnriched: 'Directory + Live GitHub',
      sourceEcosystem: 'GitHub AI Ecosystem',
      inspectButton: 'Inspect Detail',
      openGithubButton: 'Open GitHub',
      emptyTitle: 'No projects match this map selection',
      emptyBody: 'Switch back to All Types or reset directory filters to explore the full ecosystem scatter map.',
      resetMapFilter: 'Reset Map Filter',
      resetFiltersButton: 'Reset Directory Filters',
      pointsCountLabel: 'mapped nodes',
      interactionHint: 'Hover or click any node to inspect metrics and quadrant fit',
      medianGuideNote: 'Dashed: median split',
    },
    card: {
      githubStars: 'GitHub Stars',
      internalLikes: 'Likes',
      internalBookmarks: 'Bookmarks',
      notSynced: 'Not synced',
      staleLabel: 'Stale sync',
      verifiedLabel: 'Verified',
      pendingLabel: 'Pending',
      unverifiedLabel: 'Unverified',
      missingLicense: 'License unspecified',
      openDetail: 'Inspect',
      likeAction: 'Like',
      bookmarkAction: 'Bookmark',
      trendingBadge: 'Trending',
      trending7dTooltip: 'Gained +{count} GitHub stars in the last 7 days',
      trendingEngagementTooltip: 'Gained +{likes} likes and +{bookmarks} bookmarks (+{total}) in the last 7 days',
      compareAdd: 'Compare',
      compareSelected: 'In Compare',
    },
    highlights: {
      containerLabel: 'Project highlights',
      featured: 'Featured',
      newArrival: 'New Arrival',
      highActivity: 'High Activity',
      featuredTooltip: 'Editorial spotlight based on verified metadata and top community standing.',
      newArrivalTooltip: 'Recently added to VibeAtlas on {date}.',
      highActivityTooltip: 'Sustained recent engagement and repository update momentum.',
      highActivityStarsTooltip: 'High repository momentum with +{count} GitHub stars in the last 7 days.',
      highActivitySignalsTooltip: 'High community momentum with +{count} likes and bookmarks in the last 7 days.',
    },
    verification: {
      claimedBadge: 'Maker Verified',
      claimedTooltip: 'Maker identity and project ownership are verified on VibeAtlas.',
      pendingBadge: 'Claim Pending',
      pendingTooltip: 'Ownership verification claim submitted and currently under review.',
      unclaimedBadge: 'Unclaimed',
      panelTitleClaimed: 'Verified Maker Ownership',
      panelBodyClaimed:
        'The official maker has claimed and verified this listing on VibeAtlas, confirming authentic links, license attribution, and stewardship.',
      panelTitlePending: 'Maker Claim Under Review',
      panelBodyPending:
        'An ownership verification claim has been submitted and is awaiting review. Once approved, the verified maker seal appears on all cards.',
      panelTitleUnclaimed: 'Unclaimed Directory Listing',
      panelBodyUnclaimed:
        'Indexed from public metadata or community curation. If you built this project, claim ownership to display the verified maker seal.',
      attributionLabel: 'Maker',
      methodLabel: 'Method',
      statusLabel: 'Status',
      statusClaimed: 'Claimed & Verified',
      statusPending: 'Pending Verification',
      statusUnclaimed: 'Not Yet Claimed',
      ownerTag: 'Your Listing',
      methodGithub: 'GitHub Repository',
      methodDns: 'Domain DNS TXT',
      methodDemo: 'Live Demo Meta Tag',
      methodDirect: 'Verified Maker Submission',
      claimCta: 'Claim This Project',
    },
    compare: {
      trayTitle: 'Compare Projects',
      trayHintOneMore: 'Select at least 1 more project to compare side-by-side (up to 3).',
      trayLimitNotice: 'You can compare up to 3 projects at once. Remove one to add another.',
      emptySlotLabel: 'Empty slot',
      compareNowButton: 'Compare Side-by-Side',
      clearButton: 'Clear All',
      removeAction: 'Remove from comparison',
      modalTitle: 'Side-by-Side Project Comparison',
      modalSubtitle: 'Compare verifiable GitHub metrics (stars, forks, license) alongside build stack and metadata.',
      closeButton: 'Close',
      colAttribute: 'Attribute',
      sectionGithub: 'GitHub Metrics',
      sectionMetadata: 'Stack & Metadata',
      sectionCommunity: 'Community Signals & Links',
      rowGithubStars: 'GitHub Stars',
      rowGithubForks: 'GitHub Forks',
      rowLicense: 'License',
      rowRepository: 'Repository',
      rowLastSynced: 'Last Synced',
      rowContentType: 'Content Type',
      rowCategories: 'Categories',
      rowPlatform: 'Dev Platform',
      rowHostingBackend: 'Hosting & Backend',
      rowTechStack: 'Tech Stack',
      rowPricing: 'Pricing Model',
      rowVerification: 'Verification & Source',
      rowCountryLang: 'Country & Language',
      rowUpdatedAt: 'Last Updated',
      rowEngagement: 'Likes & Bookmarks',
      rowLinks: 'Links',
      highestBadge: 'Highest',
      latestBadge: 'Latest',
      openDetail: 'Inspect',
      notAvailable: 'N/A',
    },
    detail: {
      close: 'Close',
      externalLinksTitle: 'External Links (Leaves VibeAtlas)',
      internalActionsTitle: 'VibeAtlas Actions',
      liveDemo: 'Live Demo',
      officialWebsite: 'Official Website',
      githubRepository: 'GitHub Repo',
      syncGithubNow: 'Sync GitHub Now',
      syncing: 'Syncing...',
      provenanceTitle: 'Metadata Provenance & Freshness',
      provenanceSourceLabel: 'Source',
      lastSyncedLabel: 'Last Synced',
      missingFieldsLabel: 'Missing / Unverified Fields',
      noneMissing: 'All core metadata fields present',
      techAndPlatformTitle: 'Stack & Platform Attribution',
      platformLabel: 'Platform',
      hostingLabel: 'Hosting',
      backendLabel: 'Backend',
      licenseLabel: 'License',
      pricingLabel: 'Pricing',
      countryLangLabel: 'Country / Language',
      historyChartTitle: '14-Day Growth History (GitHub Stars & Internal Signals)',
      historyChartSubtitle: 'External GitHub stars and internal VibeAtlas engagement are plotted on separate charts.',
      chartTabStars: 'GitHub Stars',
      chartTabInternal: 'Internal Signals',
      chartUnsyncedStarsHint: 'GitHub repository has not been synced yet. Sync now to plot live star totals.',
      chartLiveTotalLabel: 'Current GitHub Stars',
      chartDeltaLabel: '14d Gain',
      chartBaselineNote: 'Live baseline snapshot (daily deltas build over multiple sync days)',
      relatedTitle: 'Related Projects & Alternatives',
      reportButton: 'Report Issue',
      claimButton: 'Claim Ownership',
      reportTitle: 'Report Inaccurate or Broken Listing',
      claimTitle: 'Request Maker Ownership Verification',
      submitReport: 'Submit Report',
      submitClaim: 'Submit Claim',
      actionSubmitted: 'Saved securely to Firestore.',
      signInRequired: 'Please sign in with Google to save this action.',
      communityActivityTitle: 'Community Activity',
      communityActivitySubtitle: 'Chronological feed of recent likes, bookmarks, and reports for this project.',
      activityFilterAll: 'All',
      activityFilterLikes: 'Likes',
      activityFilterBookmarks: 'Bookmarks',
      activityFilterReports: 'Reports',
      activityActionLike: 'liked this project',
      activityActionBookmark: 'bookmarked this project',
      activityActionReport: 'submitted a report',
      activityGuestActor: 'Community visitor',
      activityEmptyTitle: 'No recent interactions recorded yet',
      activityEmptySubtitle: 'Like, bookmark, or report this project above to see real-time chronological activity here.',
      activityLoadingLabel: 'Loading recent activity...',
      activityErrorNotice: 'Unable to sync live Firestore activity; showing local interactions.',
      activityReasonBrokenLink: 'Broken link',
      activityReasonStaleMetadata: 'Stale metadata',
      activityReasonMisattribution: 'Wrong attribution',
      activityReasonSpam: 'Spam',
      activityReasonSecurityConcern: 'Security concern',
      vibeScoreTitle: 'Vibe Score · Activity Health',
      vibeScoreSubtitle: 'Transparent D3 health gauge derived from internal VibeAtlas engagement, momentum, verification freshness, and synced GitHub traction.',
      vibeScoreOutOf100: '/ 100',
      vibeScoreTierThriving: 'Thriving',
      vibeScoreTierActive: 'Active',
      vibeScoreTierWarm: 'Warm',
      vibeScoreTierQuiet: 'Quiet',
      vibeScorePillarAffinity: 'Community Affinity (Likes · Bookmarks)',
      vibeScorePillarMomentum: 'Recent Activity Momentum',
      vibeScorePillarTraction: 'Synced GitHub Traction',
      vibeScorePillarHealth: 'Verification & Freshness',
      vibeScoreUnsyncedNote: 'GitHub not synced yet (external traction is 0 until synced)',
      vibeScoreReportsPenalty: 'Sentiment deduction from open reports',
      vibeScoreFormulaNote: 'Combines up to 75 internal VibeAtlas health points with up to 25 synced GitHub traction points.',
      sharePromoteTitle: 'Promote & Share',
      copyDirectLink: 'Copy Share Link',
      copyPromoPitch: 'Copy Promo Copy',
      copiedFeedback: 'Copied',
      timelineTitle: 'Project Timeline & Milestones',
      timelineSubtitle: 'Chronological vertical timeline combining GitHub releases, recent repository commits, and creator-published logs.',
      timelineFilterAll: 'All',
      timelineFilterReleases: 'Releases',
      timelineFilterCommits: 'Commits',
      timelineFilterCreatorLogs: 'Creator Logs',
      timelineSortNewest: 'Newest first',
      timelineSortOldest: 'Oldest first',
      timelineAddButton: 'Log Milestone',
      timelineCloseComposer: 'Close Form',
      timelineCadenceLabel: 'Activity Cadence',
      timelineSpanDaysSuffix: 'd span',
      timelineGapSuffix: 'd interval',
      timelineLoadingLabel: 'Fetching repository releases and commits from GitHub...',
      timelineRepoErrorNotice: 'GitHub repository activity could not be loaded right now; showing catalog and creator entries.',
      timelineNoRepoNote: 'No linked GitHub repository — showing directory provenance and creator logs.',
      timelineEmptyTitle: 'No milestones match this filter',
      timelineEmptyBody: 'Switch back to All to inspect repository and directory milestones.',
      timelineEmptyCreatorBody: 'No creator-added milestone logs have been published for this listing yet.',
      timelineAuthNoticeSignedOut: 'Sign in with Google as the project owner to publish official milestone logs.',
      timelineAuthNoticeNotOwner: 'Only the registered project owner or an administrator can publish creator logs. Submit an ownership claim above if you built this project.',
      timelineSignInCta: 'Sign in with Google',
      timelineClaimCta: 'Open Ownership Claim',
      timelineKindLabel: 'Milestone Type',
      timelineKindRelease: 'Release',
      timelineKindLaunch: 'Launch',
      timelineKindFeature: 'Feature',
      timelineKindUpdate: 'Update',
      timelineKindFix: 'Fix',
      timelineVersionLabel: 'Version Tag (optional)',
      timelineDateLabel: 'Date',
      timelineEntryTitleLabel: 'Milestone Title *',
      timelineSummaryLabel: 'Summary (optional)',
      timelineUrlLabel: 'Reference URL (optional)',
      timelinePublishButton: 'Publish Milestone',
      timelinePublishingButton: 'Publishing...',
      timelineDeleteButton: 'Delete milestone',
      timelineExternalLink: 'View Source',
      timelineSourceRelease: 'GitHub Release',
      timelineSourceCommit: 'Commit',
      timelineSourceCreator: 'Creator Log',
      timelineSourceCatalog: 'Catalog Event',
      volatilityTitle: 'Vibe Score Volatility vs. GitHub Star Growth Rate',
      volatilitySubtitle: 'D3 dual-trend analysis pairing Vibe Score dispersion (±σ band) against daily repository star growth rate.',
      volatilityModePace: 'Dual Trend',
      volatilityModeSwing: 'Daily Swing',
      volatilityMetricStdDev: 'Volatility (σ)',
      volatilityMetricNetVibe: '14d Vibe Shift',
      volatilityMetricStarRate: '14d Star Growth',
      volatilityMetricMaxSwing: 'Peak Daily Swing',
      volatilityVerdictLabel: 'Sentiment vs. Adoption Pace',
      volatilityVerdictKeepingPace: 'Keeping Pace with Adoption',
      volatilityVerdictKeepingPaceDesc: 'Community Vibe Score is climbing proportionally alongside external GitHub star growth.',
      volatilityVerdictSentimentLeading: 'Sentiment Leading Adoption',
      volatilityVerdictSentimentLeadingDesc: 'VibeAtlas community sentiment and swing intensity are moving faster than current star growth.',
      volatilityVerdictAdoptionOutpacing: 'Adoption Outpacing Sentiment',
      volatilityVerdictAdoptionOutpacingDesc: 'Repository star adoption is accelerating faster than internal VibeAtlas sentiment momentum.',
      volatilityVerdictUnsynced: 'GitHub Unsynced',
      volatilityVerdictUnsyncedDesc: 'Internal Vibe Score volatility is tracked live; sync GitHub to overlay real star growth rates.',
      volatilityVerdictBaseline: 'Single Snapshot Baseline',
      volatilityVerdictBaselineDesc: 'Baseline star count captured today. Daily star growth rates will plot across multi-day syncs.',
      volatilityLegendVibeScore: 'Vibe Score (0–100)',
      volatilityLegendBand: 'Volatility Band (±σ)',
      volatilityLegendStarRate: 'Star Growth Rate (%)',
      volatilityLegendSwing: 'Daily Vibe Delta (Δ)',
      volatilityLeftAxisLabel: 'Vibe Score',
      volatilityRightAxisLabel: 'Star Rate (%)',
      volatilitySwingAxisLabel: 'Daily Vibe Δ',
      volatilityScrubHint: 'Hover or select any date marker to inspect daily readings',
      volatilityDateLabel: 'Date',
      volatilityVibeDeltaLabel: 'Daily Vibe Δ',
      volatilityStarGainLabel: 'Daily Star Gain',
      insightsTitle: 'Project Insights · 7-Day Likes & Bookmarks',
      insightsSubtitle: 'D3 visualization comparing daily community likes and high-intent bookmarks across the 7-day window.',
      insightsModeDaily: 'Daily Gains',
      insightsModeCumulative: '7d Cumulative',
      insightsKpiLikes7d: '7d Likes Gained',
      insightsKpiBookmarks7d: '7d Bookmarks Gained',
      insightsKpiBookmarkShare: 'Bookmark Share',
      insightsKpiPeakDay: 'Peak Activity Day',
      insightsTotalPrefix: 'Total',
      insightsAvgPerDay: 'avg/day',
      insightsNoPeakDay: 'No activity',
      insightsScrubHint: 'Hover or select a day bar to inspect exact daily metrics',
      insightsDateLabel: 'Date',
      insightsCombinedLabel: 'Combined',
      insightsMixTitle: '7-Day Engagement Mix',
      insightsEmptyTitle: 'No likes or bookmarks recorded in this 7-day window yet.',
      insightsEmptyHint: 'Add a Like or Bookmark below to start tracking daily community velocity.',
      insightsAxisCount: 'Count',
    },
    submit: {
      title: 'Submit a Project',
      subtitle: 'Publish verifiable metadata to the VibeAtlas directory backed by Firestore.',
      promoPreviewTitle: 'Main Page Promotion Preview',
      promoPreviewSubtitle: 'Once published, your project appears in the Home Launch Showcase with this shareable snippet.',
      promoPreviewUntitled: 'Your AI Project (live preview)',
      promoPreviewTaglineFallback: 'Enter a concise tagline to generate your shareable launch pitch.',
      githubImportTitle: 'Import Metadata from GitHub',
      githubImportHint: 'e.g. modelcontextprotocol/servers or https://github.com/cline/cline',
      githubImportPlaceholder: 'Enter owner/repo or GitHub URL',
      githubFetchButton: 'Fetch Live Metadata',
      fetchingGithub: 'Fetching...',
      nameLabel: 'Project Name *',
      taglineEnLabel: 'English Tagline (5-220 chars) *',
      taglineKoLabel: 'Korean Tagline',
      descriptionEnLabel: 'English Description (min 20 chars) *',
      descriptionKoLabel: 'Korean Description',
      contentTypeLabel: 'Content Type',
      categoriesLabel: 'Categories / Tags (comma-separated, max 6) *',
      categoriesQuickTagsHint: 'Quick tag presets (click to toggle):',
      techStackLabel: 'Tech Stack (comma-separated, max 12)',
      platformLabel: 'Development Platform',
      hostingLabel: 'Hosting Provider',
      backendLabel: 'Backend Tech',
      countryLabel: 'Country Code (e.g. KR, US) *',
      languageLabel: 'Language',
      licenseLabel: 'License (e.g. MIT, Apache-2.0) *',
      pricingLabel: 'Pricing Model',
      liveDemoLabel: 'Live Demo URL (https://)',
      websiteLabel: 'Official Website URL (https://)',
      githubUrlLabel: 'GitHub URL (https://)',
      makerNameLabel: 'Maker / Team Name *',
      makerHandleLabel: 'Maker Handle (e.g. @handle)',
      submitButton: 'Publish Listing',
      submitting: 'Publishing...',
      signInPrompt: 'Sign in with Google to publish a verified listing to Firestore.',
      submitSuccess: 'Project published to the directory!',
      draftRestoredNotice: 'Restored your previous in-progress draft from local storage.',
      draftAutosaveHint: 'Your notes and settings are automatically saved to local storage every 30 seconds.',
      clearDraftButton: 'Discard Draft',
      validationSummaryPrefix: 'Please fix the highlighted fields',
    },
    maker: {
      title: 'Maker Dashboard & Saved Library',
      subtitle: 'Manage your submitted projects, saved bookmarks, ownership claims, and reports.',
      myProjectsTab: 'My Projects',
      myBookmarksTab: 'Bookmarks',
      claimsReportsTab: 'Claims & Reports',
      signInCtaTitle: 'Sign in with Google to access Maker Dashboard',
      signInCtaBody: 'Manage listings, sync live GitHub metrics, and keep bookmarks across devices.',
      noProjectsYet: 'You have not published any projects yet.',
      noBookmarksYet: 'No bookmarked projects yet.',
      resyncGithub: 'Re-sync GitHub',
      deleteProject: 'Delete',
      analyticsTitle: 'Project Engagement Analytics',
      analyticsSubtitle: 'Internal likes and bookmarks are tallied separately from external GitHub stars.',
      metricOwnedProjects: 'Owned Projects',
      metricTotalLikes: 'Total Likes',
      metricTotalBookmarks: 'Total Bookmarks',
      metricTotalEngagement: 'Total Engagement',
      metricExternalStarsNote: 'Combined external GitHub stars',
      analyticsSortEngagement: 'Engagement',
      analyticsSortLikes: 'Most Liked',
      analyticsSortBookmarks: 'Most Bookmarked',
      analyticsSortRecent: 'Newest',
      tableProjectCol: 'Project',
      tableLikesCol: 'Likes',
      tableBookmarksCol: 'Bookmarks',
      tableTotalCol: 'Total',
      tableSplitCol: 'Engagement Share',
      tableGithubCol: 'GitHub Stars',
      topProjectLabel: 'Top engaging project',
      analyticsEmptyHint: 'Publish a project to inspect likes, bookmarks, and engagement breakdown per listing.',
      projectListHeading: 'Your Listed Projects',
      likesUnit: 'likes',
      bookmarksUnit: 'bookmarks',
      engagementUnit: 'total',
    },
    footer: {
      tagline: 'VibeAtlas (Working Name) — Verifiable Discovery for AI Products, MCP & Skills',
      transparencyNote: 'External GitHub stars and internal engagement are always counted separately.',
    },
    voiceSearch: {
      startLabel: 'Search by voice',
      stopLabel: 'Stop voice input',
      listeningStatus: 'Listening... Speak your search query',
      stopButton: 'Stop',
      unsupportedError: 'Voice search (Web Speech API) is not supported in this browser. Please try Chrome or Edge.',
      permissionDeniedError: 'Microphone access was denied. Please allow microphone permission in your browser settings.',
      noSpeechError: 'No speech was detected. Please speak clearly and try again.',
      audioCaptureError: 'No microphone was detected. Check your audio input device.',
      networkError: 'Voice recognition network error. Check your connection and try again.',
      unknownError: 'Could not complete voice recognition. Please try again.',
      dismissError: 'Dismiss',
    },
    githubStarsPage: {
      title: 'GitHub Stars Top 100 Leaderboard',
      subtitle: 'Live top 100 most-starred repositories ranked directly via the GitHub Search REST API, kept separate from internal VibeAtlas signals.',
      refreshButton: 'Refresh Live',
      refreshing: 'Loading...',
      presetAll: 'Global Top 100',
      presetWebApps: 'Web Apps',
      presetAiAgents: 'AI, Agents & MCP',
      presetTypescript: 'TypeScript',
      presetPython: 'Python',
      presetRust: 'Rust',
      presetGo: 'Go',
      kpiRankedCount: 'Ranked Repositories',
      kpiTopStars: '#1 Repository Stars',
      kpiMedianStars: 'Median Stars',
      kpiLastUpdated: 'Last Synced',
      cachedFallbackBadge: 'Cached snapshot',
      searchPlaceholder: 'Filter Top 100 by repo, description, or topic...',
      allLanguagesOption: 'All Languages',
      showingCountLabel: 'repositories shown',
      colRank: 'Rank',
      colRepository: 'Repository',
      colLanguageLicense: 'Language & License',
      colForks: 'Forks',
      colStars: 'GitHub Stars',
      colActions: 'Links',
      openInVibeAtlas: 'VibeAtlas Detail',
      openGithub: 'GitHub',
      emptyFilteredTitle: 'No repositories match your filter',
      emptyFilteredBody: 'Clear your search query or language filter to inspect the full Top 100 ranking.',
      resetFilterButton: 'Reset Filters',
      errorTitle: 'Unable to load GitHub Top 100 leaderboard',
      retryButton: 'Retry',
      rateLimitResetPrefix: 'Rate limit resets around',
      translatingDescriptions: 'Translating repository descriptions...',
      translatedBadge: 'Translated',
      showOriginal: 'Original',
      showTranslated: 'Translated',
      translationErrorNotice: 'Showing original GitHub descriptions because live translation is currently unavailable.',
    },
  },
  zh: {
    nav: {
      home: '首页',
      discover: '探索',
      githubStars: 'GitHub 星标',
      makers: '创作者',
      submit: '提交项目',
      primaryCta: '提交项目',
    },
    workspace: {
      savedBookmarks: '收藏夹',
      signInGoogle: 'Google 登录',
      signOut: '退出登录',
      makerAccount: '创作者账号',
      lightMode: '浅色模式',
      darkMode: '深色模式',
      koreanSearchNoteTitle: '多语言检索说明',
      koreanSearchNoteBody:
        '常规英文分词器难以切分韩语和东亚粘着语词尾。VibeAtlas 结合不区分大小写的多语言子串匹配与技术术语同义词扩展来提升检索准确度。',
    },
    hero: {
      kicker: '可验证元数据 · 透明榜单',
      headline: '一站式发现与评估 Vibe-Coding 应用、MCP 服务器与 AI Skills',
      subheadline:
        'VibeAtlas 严格区分外部 GitHub 星标与站内点赞收藏，清晰展示元数据来源并透明标注待验证或过期条目。',
      searchPlaceholder: '搜索 MCP 服务器、Lovable、AI Agent、Supabase...',
      searchButton: '搜索',
      quickBrowseLabel: '快速浏览',
    },
    home: {
      trendingTab: '本周热门',
      newlyLaunchedTab: '最新上线',
      risingOssTab: '飙升开源项目',
      viewAllDiscover: '浏览完整目录',
      mcpAndSkillsTitle: '热门 MCP 服务器与 AI Skills',
      mcpAndSkillsSubtitle: '基于已验证仓库探索工具协议、智能体技能与实战项目。',
      stacksTitle: '现代 AI 技术栈精选',
      stacksSubtitle: '透明标注 Lovable、Vercel、Supabase 与 Cursor 等真实构建技术栈。',
      koreanGlobalTitle: '韩国与全球创作者聚焦',
      koreanGlobalSubtitle: '来自首尔与世界各地的独立开发者及 AI 原生团队作品。',
      featuredMakersTitle: '推荐创作者',
      featuredMakersSubtitle: '拥有可验证代码仓库与完整来源记录的建设者。',
      submitCtaTitle: '发布您的 AI 产品或 MCP 服务器并立即推广',
      submitCtaBody:
        '通过“提交项目”发布的作品将自动登上首页推广展示区，并生成直达详情链接与一键推广文案。',
      submitCtaButton: '提交并推广项目',
      newsletterTitle: 'VibeAtlas 每周精选',
      newsletterBody: '每周接收已验证的新增 MCP 服务器、AI Skills 与全球创作者新品动态。',
      newsletterPlaceholder: '输入邮箱地址（需 Google 登录）',
      newsletterButton: '订阅',
      newsletterSignInNotice: '请先使用 Google 登录以保存订阅设置。',
      newsletterSuccess: '订阅已保存。',
      promoTitle: '已提交项目推广展示区',
      promoSubtitle: '在首页展示通过“提交项目”发布的 AI 应用与 MCP 工具，并提供直达链接与一键社交推广文案。',
      promoTabAll: '全部展示',
      promoTabSubmitted: '社区投稿优先',
      promoTabDemoReady: '可在线体验',
      promoCtaSubmit: '提交并推广项目',
      promoKitHeading: '推广工具包 · 分享文案',
      promoToneCommunity: '社区详细介绍',
      promoToneSocial: '社交精简动态',
      promoCopyLinkButton: '复制推广链接',
      promoCopyPitchButton: '复制推广文案',
      promoCopiedLabel: '已复制',
      promoOpenDetailButton: '查看详情',
      promoLiveDemoButton: '在线演示',
      promoSubmittedLabel: '社区提交',
      promoCuratedLabel: '编辑精选',
      promoEmptyFilterTitle: '暂无符合该条件的提交项目',
      promoEmptyFilterBody: '立即提交您的第一个项目，即可自动展示在首页推广展示区。',
      promoCountLiveSuffix: '个已提交',
      trending24hTitle: '热门趋势 · 24 小时 GitHub 星标飙升',
      trending24hSubtitle: '基于 GitHub 官方接口快照与每日星标增长速率，实时追踪过去 24 小时星标增长最快的项目。',
      trending24hAllLanguages: '全部语言',
      trending24hRefreshButton: '刷新',
      trending24hViewLeaderboard: '查看完整星标榜',
      trending24hStarsSuffix: '/ 24h',
      trending24hSourceSnapshot: '24h 快照增量',
      trending24hSourceRate: '24h 增长速率',
      trending24hOpenCatalog: '查看详情',
      trending24hOpenGithub: 'GitHub',
      trending24hEmptyTitle: '该语言下暂无 24 小时热门项目',
      trending24hEmptyBody: '请切换至全部语言或刷新实时数据。',
      trending24hResetLanguage: '查看全部语言',
      trending24hErrorTitle: '暂时无法加载 24 小时 GitHub 增长数据',
      trending24hRetryButton: '重试',
      recentActivityTitle: '最近动态 · 实时社区信息流',
      recentActivitySubtitle: '实时滚动展示 VibeAtlas 平台的新项目提交、最近点赞与收藏互动。',
      recentActivityFilterAll: '全部',
      recentActivityFilterSubmissions: '新提交',
      recentActivityFilterLikes: '点赞',
      recentActivityFilterBookmarks: '收藏',
      recentActivityAutoScrollOn: '自动滚动',
      recentActivityAutoScrollPaused: '已暂停',
      recentActivityActionSubmitted: '提交了新项目',
      recentActivityActionLiked: '点赞了',
      recentActivityActionBookmarked: '收藏了',
      recentActivityCommunityActor: 'VibeAtlas 社区',
      recentActivityGuestActor: '访客用户',
      recentActivityLiveLabel: '实时',
      recentActivityDeltaSuffix: '次近期互动',
      recentActivityOpenProject: '详情',
      recentActivityEmptyTitle: '该分类下暂无最近动态',
      recentActivityEmptyBody: '提交新项目或为项目点赞、收藏后，动态将实时显示在这里。',
      recentActivityLiveCountSuffix: '条动态',
      recentActivityShowAllButton: '查看全部动态',
    },
    discover: {
      title: '探索项目与资源',
      subtitle: '所有筛选条件均与浏览器 URL 实时同步，支持直接分享与刷新保留。',
      filtersHeading: '筛选条件',
      mobileFiltersButton: '筛选',
      resetFilters: '重置筛选',
      searchPlaceholder: '搜索关键词、技术栈、创作者、仓库...',
      sortLabel: '排序',
      resultsCount: ' 条结果',
      emptyTitle: '未找到匹配的项目',
      emptyBody: '请尝试放宽筛选条件或更换搜索关键词。',
      previousPage: '上一页',
      nextPage: '下一页',
      filterType: '内容类型',
      filterCategory: '项目分类',
      allCategoriesOption: '全部分类',
      filterTags: '项目标签',
      clearTags: '清除标签',
      activeTagsPrefix: '已选标签',
      tagsHint: '可组合多个标签以缩小筛选范围。',
      filterPlatform: '开发平台',
      filterHosting: '托管服务',
      filterBackend: '后端技术',
      filterCountry: '国家/地区',
      filterLanguage: '支持语言',
      filterLicense: '开源协议',
      filterPricing: '定价模式',
      filterVerification: '验证状态',
      filterMinStars: '最低 GitHub 星标',
      filterUpdatedWithin: '最近更新',
      allOption: '全部',
      webAppsTop100Title: 'Web 应用 Top #1 – #100 全量视图',
      webAppsTop100Subtitle: '直接基于 GitHub Search REST API 完整渲染第 #1 至第 #100 名开源 Web 应用。',
      webAppsLoading: '正在加载 Web 应用 #1 – #100...',
      webAppsError: '暂时无法获取实时 Web 应用 Top 100 榜单，仅展示本地目录项目。',
      webAppsRetry: '重新加载',
    },
    trendingSection: {
      title: '趋势与增长速度',
      subtitle: '使用 D3 可视化近 30 天 / 7 天 GitHub 星标增量及日均增长速率，快速发现飙升项目。',
      toggleExpand: '展开图表',
      toggleCollapse: '收起图表',
      tabStar30d: '30 天星标增长',
      tabStar7d: '7 天飙升',
      tabSignalVelocity: '社区互动增速',
      chartHeading: '增长最快项目排行',
      trajectoryHeading: '每日累计增长轨迹',
      unitStars: '星标',
      unitSignals: '互动',
      perDaySuffix: '/天',
      periodDeltaLabel: '周期净增长',
      dailyVelocityLabel: '日均速率',
      currentTotalLabel: '当前总计',
      inspectButton: '查看详情',
      emptyStarTitle: '尚无跨日 GitHub 星标快照记录',
      emptyStarBody: '在不同日期同步仓库后，此处将通过 D3 绘制 30 天与 7 天真实星标增速。',
      switchToSignalButton: '查看社区互动增速',
      emptyFilteredTitle: '当前筛选条件下暂无增长数据',
      emptyFilteredBody: '放宽筛选条件即可查看上升期项目的增长速度可视化。',
      fallbackNote: '正在等待跨日 GitHub 星标快照累积，当前默认展示已验证的站内互动增速。',
    },
    githubTrendingBubble: {
      title: 'GitHub Trending · AI 生态',
      subtitle: '使用 D3 气泡图按每日新增星标数可视化当前最活跃的 AI 生态 GitHub 仓库。',
      toggleExpand: '展开气泡图',
      toggleCollapse: '收起气泡图',
      refreshButton: '刷新',
      refreshing: '加载中...',
      allLanguages: '全部语言',
      perDaySuffix: '/天',
      dailyStarsLabel: '每日星标',
      totalStarsLabel: '累计星标',
      forksLabel: 'Forks',
      pushedLabel: '最近推送',
      topMoversHeading: '每日增速榜首',
      openGithubButton: '在 GitHub 打开',
      inspectVibeAtlasButton: '在 VibeAtlas 查看',
      loadingLabel: '正在加载活跃 AI 生态仓库...',
      emptyTitle: '当前语言暂无匹配的趋势仓库',
      emptyBody: '重置语言筛选以查看全部 AI 生态活跃仓库气泡图。',
      resetLanguageButton: '显示全部语言',
      errorTitle: '无法加载 GitHub Trending 仓库',
      retryButton: '重试',
      cachedNotice: '缓存快照',
      rateModeVelocity: '按日均星标增速绘制',
      rateModeSnapshot: '按 24 小时快照增量绘制',
      reposCountLabel: '个活跃仓库',
      clickHint: '悬停或点击任意气泡以查看仓库详情',
    },
    discoveryMap: {
      title: '生态可视化探索散点图',
      subtitle: '通过 D3 散点图按 GitHub 星标规模（X 轴对数）与近期活跃频率（Y 轴）直观探索项目分布。',
      toggleExpand: '展开探索地图',
      toggleCollapse: '收起探索地图',
      scopeEcosystem: '全部生态',
      scopeDirectory: '当前目录筛选',
      scopeVerifiedMakers: '仅作者认证',
      allTypes: '全部类型',
      xAxisLabel: 'GitHub 星标（对数刻度）',
      yAxisLabel: '活跃频率指数 (0–100)',
      quadrantLeaders: '生态领先者',
      quadrantActiveBuilders: '高活跃新锐',
      quadrantEstablished: '成熟稳健型',
      quadrantEmerging: '早期 · 细分',
      spotlightHeading: '节点详情聚焦',
      starsMetricLabel: 'GitHub 星标',
      activityMetricLabel: '活跃频率',
      dailyVelocityLabel: '日均星标速率',
      recencyLabel: '最近活跃',
      todayLabel: '今天',
      daysAgoSuffix: '天前',
      sourceDirectory: 'VibeAtlas 收录',
      sourceEnriched: '目录 + 实时 GitHub',
      sourceEcosystem: 'GitHub AI 生态',
      inspectButton: '查看详情',
      openGithubButton: '打开 GitHub',
      emptyTitle: '当前筛选条件下暂无散点数据',
      emptyBody: '切换回全部类型或重置目录筛选即可继续探索生态分布图。',
      resetMapFilter: '重置图内筛选',
      resetFiltersButton: '重置目录筛选',
      pointsCountLabel: '个已映射节点',
      interactionHint: '悬停或点击任意散点以查看详细指标与象限位置',
      medianGuideNote: '虚线：中位数基准线',
    },
    card: {
      githubStars: 'GitHub 星标',
      internalLikes: '点赞',
      internalBookmarks: '收藏',
      notSynced: '未同步',
      staleLabel: '同步较旧',
      verifiedLabel: '已验证',
      pendingLabel: '待验证',
      unverifiedLabel: '未验证',
      missingLicense: '协议未注明',
      openDetail: '查看详情',
      likeAction: '点赞',
      bookmarkAction: '收藏',
      trendingBadge: '热门趋势',
      trending7dTooltip: '近 7 天 GitHub 星标新增 +{count}',
      trendingEngagementTooltip: '近 7 天点赞 +{likes}、收藏 +{bookmarks}（共 +{total}）',
      compareAdd: '加入对比',
      compareSelected: '已选对比',
    },
    highlights: {
      containerLabel: '项目亮点徽章',
      featured: '精选推荐',
      newArrival: '最新上架',
      highActivity: '高活跃度',
      featuredTooltip: '基于已验证元数据与社区高评价入选的重点推荐项目。',
      newArrivalTooltip: '近期新收录项目（{date}）。',
      highActivityTooltip: '近期仓库更新与社区互动保持高活跃状态。',
      highActivityStarsTooltip: '近 7 天 GitHub 星标新增 +{count}，热度持续走高。',
      highActivitySignalsTooltip: '近 7 天站内点赞与收藏新增 +{count}，社区互动活跃。',
    },
    verification: {
      claimedBadge: '作者已认证',
      claimedTooltip: '该条目已由创作者本人认领并验证所有权。',
      pendingBadge: '认领审核中',
      pendingTooltip: '作者所有权认领申请已提交，正在审核确认。',
      unclaimedBadge: '未认领',
      panelTitleClaimed: '作者所有权已认证',
      panelBodyClaimed:
        '官方创作者已在 VibeAtlas 完成所有权认领与核验，确保外部链接、开源协议与作者归属信息的真实可靠。',
      panelTitlePending: '作者所有权认领审核中',
      panelBodyPending:
        '所有权验证凭证已提交审核。审核通过后，该项目卡片与详情弹窗将展示作者认证徽章。',
      panelTitleUnclaimed: '未认领目录条目',
      panelBodyUnclaimed:
        '该条目来自公开仓库同步或社区收录。如果您是该项目作者，可申请认领所有权以获得可信认证徽章。',
      attributionLabel: '创作者',
      methodLabel: '验证方式',
      statusLabel: '状态',
      statusClaimed: '已认领并核验',
      statusPending: '等待验证审核',
      statusUnclaimed: '尚未认领',
      ownerTag: '我提交的',
      methodGithub: 'GitHub 仓库维护者',
      methodDns: '域名 DNS TXT',
      methodDemo: '在线演示 Meta 标签',
      methodDirect: '作者直投 · 已核验',
      claimCta: '认领此项目',
    },
    compare: {
      trayTitle: '项目对比栏',
      trayHintOneMore: '请至少再选择 1 个项目即可横向对比（最多 3 个）。',
      trayLimitNotice: '最多可同时对比 3 个项目，请先移除一个项目后再添加。',
      emptySlotLabel: '空位',
      compareNowButton: '横向对比',
      clearButton: '清空',
      removeAction: '从对比中移除',
      modalTitle: '项目横向对比',
      modalSubtitle: '并排对比 GitHub 统计指标（星标、Fork、协议）及技术栈与元数据。',
      closeButton: '关闭',
      colAttribute: '对比维度',
      sectionGithub: 'GitHub 仓库指标',
      sectionMetadata: '元数据与技术栈',
      sectionCommunity: '站内互动与链接',
      rowGithubStars: 'GitHub 星标',
      rowGithubForks: 'GitHub Forks',
      rowLicense: '开源协议',
      rowRepository: '代码仓库',
      rowLastSynced: '最后同步',
      rowContentType: '内容类型',
      rowCategories: '分类标签',
      rowPlatform: '开发平台',
      rowHostingBackend: '托管与后端',
      rowTechStack: '技术栈',
      rowPricing: '定价模式',
      rowVerification: '验证状态与来源',
      rowCountryLang: '国家与语言',
      rowUpdatedAt: '最近更新',
      rowEngagement: '点赞与收藏',
      rowLinks: '相关链接',
      highestBadge: '最高',
      latestBadge: '最新',
      openDetail: '查看详情',
      notAvailable: '暂无',
    },
    detail: {
      close: '关闭',
      externalLinksTitle: '外部链接（离开 VibeAtlas）',
      internalActionsTitle: 'VibeAtlas 站内操作',
      liveDemo: '在线演示',
      officialWebsite: '官方网站',
      githubRepository: 'GitHub 仓库',
      syncGithubNow: '立即同步 GitHub',
      syncing: '同步中...',
      provenanceTitle: '元数据来源与时效性',
      provenanceSourceLabel: '来源',
      lastSyncedLabel: '最后同步',
      missingFieldsLabel: '缺失/未验证字段',
      noneMissing: '核心元数据字段完整',
      techAndPlatformTitle: '技术栈与平台归属',
      platformLabel: '开发平台',
      hostingLabel: '托管服务',
      backendLabel: '后端技术',
      licenseLabel: '开源协议',
      pricingLabel: '定价模式',
      countryLangLabel: '国家 / 语言',
      historyChartTitle: '近 14 天增长趋势（GitHub 星标 · 站内信号）',
      historyChartSubtitle: '外部 GitHub 星标增量与 VibeAtlas 站内点赞收藏分开统计绘制。',
      chartTabStars: 'GitHub 星标',
      chartTabInternal: '站内点赞 · 收藏',
      chartUnsyncedStarsHint: '该 GitHub 仓库尚未同步，立即同步即可查看实时星标数。',
      chartLiveTotalLabel: '当前 GitHub 星标',
      chartDeltaLabel: '14 天增量',
      chartBaselineNote: '当前实时基准线（随着每日同步累积将展示历史变化曲线）',
      relatedTitle: '相似项目与替代方案',
      reportButton: '反馈错误',
      claimButton: '认领所有权',
      reportTitle: '提交条目错误或失效链接报告',
      claimTitle: '申请创作者所有权验证',
      submitReport: '提交报告',
      submitClaim: '提交认领申请',
      actionSubmitted: '已安全保存至 Firestore。',
      signInRequired: '请先使用 Google 登录以保存此操作。',
      communityActivityTitle: '社区动态',
      communityActivitySubtitle: '按时间顺序列出该项目的近期点赞、收藏与报告记录。',
      activityFilterAll: '全部',
      activityFilterLikes: '点赞',
      activityFilterBookmarks: '收藏',
      activityFilterReports: '报告',
      activityActionLike: '赞了该项目',
      activityActionBookmark: '收藏了该项目',
      activityActionReport: '提交了问题报告',
      activityGuestActor: '社区访客',
      activityEmptyTitle: '暂无近期互动记录',
      activityEmptySubtitle: '点击上方的点赞、收藏或反馈按钮后，这里将实时按时间顺序展示记录。',
      activityLoadingLabel: '正在加载动态...',
      activityErrorNotice: '暂无法同步实时 Firestore 动态，仅显示本地记录。',
      activityReasonBrokenLink: '链接失效',
      activityReasonStaleMetadata: '元数据过时',
      activityReasonMisattribution: '归属信息有误',
      activityReasonSpam: '垃圾内容',
      activityReasonSecurityConcern: '安全隐患',
      vibeScoreTitle: 'Vibe 指数 · 社区健康度',
      vibeScoreSubtitle: '基于 VibeAtlas 站内互动、近期活跃动量、验证新鲜度及已同步 GitHub 牵引力的透明 D3 仪表盘。',
      vibeScoreOutOf100: '/ 100',
      vibeScoreTierThriving: '活跃旺盛',
      vibeScoreTierActive: '持续活跃',
      vibeScoreTierWarm: '温和成长',
      vibeScoreTierQuiet: '起步关注',
      vibeScorePillarAffinity: '社区偏好（点赞 · 收藏）',
      vibeScorePillarMomentum: '近期活跃动量',
      vibeScorePillarTraction: '已同步 GitHub 牵引力',
      vibeScorePillarHealth: '验证与更新健康度',
      vibeScoreUnsyncedNote: 'GitHub 尚未同步（同步前外部牵引力计 0 分）',
      vibeScoreReportsPenalty: '来自问题反馈的情绪扣分',
      vibeScoreFormulaNote: '由最高 75 分的站内健康指标与最高 25 分的已同步外部 GitHub 指标透明计算。',
      sharePromoteTitle: '推广与分享',
      copyDirectLink: '复制直达链接',
      copyPromoPitch: '复制推广文案',
      copiedFeedback: '已复制',
      timelineTitle: '项目时间线与里程碑',
      timelineSubtitle: '按时间顺序呈现 GitHub 版本发布、近期仓库提交及作者手动发布的里程碑日志。',
      timelineFilterAll: '全部',
      timelineFilterReleases: '版本发布',
      timelineFilterCommits: '代码提交',
      timelineFilterCreatorLogs: '作者日志',
      timelineSortNewest: '最新优先',
      timelineSortOldest: '最早优先',
      timelineAddButton: '记录里程碑',
      timelineCloseComposer: '收起表单',
      timelineCadenceLabel: '活跃周期分布',
      timelineSpanDaysSuffix: '天跨度',
      timelineGapSuffix: '天间隔',
      timelineLoadingLabel: '正在从 GitHub 拉取发布记录与最近提交...',
      timelineRepoErrorNotice: '暂时无法加载 GitHub 仓库动态，当前仅显示目录及作者日志记录。',
      timelineNoRepoNote: '未绑定 GitHub 仓库 — 当前展示目录索引记录与作者里程碑。',
      timelineEmptyTitle: '当前筛选下暂无里程碑记录',
      timelineEmptyBody: '切回“全部”即可查看仓库发布、代码提交与目录动态。',
      timelineEmptyCreatorBody: '该项目暂未发布作者手工里程碑日志。',
      timelineAuthNoticeSignedOut: '请使用项目创建者账号通过 Google 登录后发布官方里程碑日志。',
      timelineAuthNoticeNotOwner: '仅项目注册所有者或管理员可发布作者里程碑。如您为项目原作者，请先在上方提交所有权认证。',
      timelineSignInCta: 'Google 登录',
      timelineClaimCta: '前往所有权认证',
      timelineKindLabel: '里程碑类型',
      timelineKindRelease: '版本发布',
      timelineKindLaunch: '正式上线',
      timelineKindFeature: '新功能',
      timelineKindUpdate: '迭代更新',
      timelineKindFix: '问题修复',
      timelineVersionLabel: '版本标签（选填）',
      timelineDateLabel: '日期',
      timelineEntryTitleLabel: '里程碑标题 *',
      timelineSummaryLabel: '摘要说明（选填）',
      timelineUrlLabel: '参考链接（选填）',
      timelinePublishButton: '发布里程碑',
      timelinePublishingButton: '发布中...',
      timelineDeleteButton: '删除里程碑',
      timelineExternalLink: '查看详情',
      timelineSourceRelease: 'GitHub 发布',
      timelineSourceCommit: '提交记录',
      timelineSourceCreator: '作者日志',
      timelineSourceCatalog: '目录事件',
      volatilityTitle: 'Vibe 指数波动率 vs. GitHub 星标增速',
      volatilitySubtitle: '通过 D3 双趋势线对比社区 Vibe 指数波动区间（±σ 包络带）与仓库每日星标增长率。',
      volatilityModePace: '双趋势对比',
      volatilityModeSwing: '单日波幅',
      volatilityMetricStdDev: '波动率 (σ)',
      volatilityMetricNetVibe: '14天 Vibe 变化',
      volatilityMetricStarRate: '14天星标增速',
      volatilityMetricMaxSwing: '最大单日波幅',
      volatilityVerdictLabel: '社区情绪与技术采用节奏对比',
      volatilityVerdictKeepingPace: '情绪与采用保持同步',
      volatilityVerdictKeepingPaceDesc: '社区 Vibe 指数与外部 GitHub 星标增长速率同步稳健提升。',
      volatilityVerdictSentimentLeading: '社区情绪领先 · 波动增强',
      volatilityVerdictSentimentLeadingDesc: '站内 Vibe 关注度与短期波动幅度高于当前仓库星标的实际增长速度。',
      volatilityVerdictAdoptionOutpacing: '技术采用快于社区情绪',
      volatilityVerdictAdoptionOutpacingDesc: 'GitHub 星标增长速率显著快于当前站内社区互动与口碑反馈动量。',
      volatilityVerdictUnsynced: 'GitHub 尚未同步',
      volatilityVerdictUnsyncedDesc: '站内 Vibe 波动曲线已实时绘制，同步 GitHub 后可叠加真实星标增速对比。',
      volatilityVerdictBaseline: '单日基准快照',
      volatilityVerdictBaselineDesc: '已记录当前基准星标数。跨日同步累积后将绘制每日星标增长率曲线。',
      volatilityLegendVibeScore: 'Vibe 指数 (0–100)',
      volatilityLegendBand: '波动区间 (±σ)',
      volatilityLegendStarRate: '日星标增速 (%)',
      volatilityLegendSwing: '单日 Vibe 涨跌 (Δ)',
      volatilityLeftAxisLabel: 'Vibe 指数',
      volatilityRightAxisLabel: '星标增速 (%)',
      volatilitySwingAxisLabel: '单日波幅 (Δ)',
      volatilityScrubHint: '悬停或点击日期节点以查看当日详细数值',
      volatilityDateLabel: '日期',
      volatilityVibeDeltaLabel: '单日 Vibe 变化',
      volatilityStarGainLabel: '单日新增星标',
      insightsTitle: '项目洞察 · 近 7 天点赞与收藏趋势',
      insightsSubtitle: '通过 D3 可视化近 7 天社区点赞（即时认同）与收藏（留存意向）的每日增量及累计走势。',
      insightsModeDaily: '每日增量',
      insightsModeCumulative: '7天累计走势',
      insightsKpiLikes7d: '7天新增点赞',
      insightsKpiBookmarks7d: '7天新增收藏',
      insightsKpiBookmarkShare: '收藏意向占比',
      insightsKpiPeakDay: '最高互动日',
      insightsTotalPrefix: '累计',
      insightsAvgPerDay: '日均',
      insightsNoPeakDay: '暂无互动',
      insightsScrubHint: '悬停或选择任意日期柱条可查看当日详细数据',
      insightsDateLabel: '日期',
      insightsCombinedLabel: '合计',
      insightsMixTitle: '7天互动构成比',
      insightsEmptyTitle: '该 7 天窗口内暂未记录到点赞或收藏互动。',
      insightsEmptyHint: '点击下方点赞或收藏按钮即可实时记录每日社区互动变化。',
      insightsAxisCount: '次数',
    },
    submit: {
      title: '提交新项目',
      subtitle: '填写可验证的项目元数据，立即发布至目录并保存至 Firestore。',
      promoPreviewTitle: '首页推广效果实时预览',
      promoPreviewSubtitle: '发布后项目将登上首页推广展示区，并支持使用下方文案一键向外分享。',
      promoPreviewUntitled: '您的 AI 项目（输入标题后实时预览）',
      promoPreviewTaglineFallback: '填写一句话简介即可生成可分享的发布推介文案。',
      githubImportTitle: '从 GitHub 仓库导入元数据',
      githubImportHint: '例如：modelcontextprotocol/servers 或 https://github.com/cline/cline',
      githubImportPlaceholder: '输入 owner/repo 或 GitHub 链接',
      githubFetchButton: '实时获取',
      fetchingGithub: '获取中...',
      nameLabel: '项目名称 *',
      taglineEnLabel: '英文一句话简介（5-220 字符）*',
      taglineKoLabel: '韩文一句话简介',
      descriptionEnLabel: '英文详细说明（至少 20 字符）*',
      descriptionKoLabel: '韩文详细说明',
      contentTypeLabel: '内容类型',
      categoriesLabel: '分类标签（逗号分隔，最多 6 个）*',
      categoriesQuickTagsHint: '常用标签快选（点击切换）：',
      techStackLabel: '技术栈（逗号分隔，最多 12 项）',
      platformLabel: '开发平台',
      hostingLabel: '托管服务商',
      backendLabel: '后端技术',
      countryLabel: '国家/地区代码（如 KR、US）*',
      languageLabel: '支持语言',
      licenseLabel: '开源协议（如 MIT、Apache-2.0）*',
      pricingLabel: '定价模式',
      liveDemoLabel: '在线演示 URL (https://)',
      websiteLabel: '官方网站 URL (https://)',
      githubUrlLabel: 'GitHub URL (https://)',
      makerNameLabel: '创作者 / 团队名称 *',
      makerHandleLabel: '创作者账号（如 @handle）',
      submitButton: '发布到目录',
      submitting: '发布中...',
      signInPrompt: '请先使用 Google 登录，以发布经验证的项目至 Firestore。',
      submitSuccess: '项目已成功发布！',
      draftRestoredNotice: '已从本地存储恢复您上次未提交的草稿。',
      draftAutosaveHint: '您的输入内容每 30 秒自动保存至浏览器本地存储。',
      clearDraftButton: '清除草稿',
      validationSummaryPrefix: '请修正高亮的输入字段',
    },
    maker: {
      title: '创作者控制台与收藏库',
      subtitle: '管理您发布的项目、收藏列表、所有权认领与反馈记录。',
      myProjectsTab: '我的项目',
      myBookmarksTab: '收藏列表',
      claimsReportsTab: '认领与反馈记录',
      signInCtaTitle: '使用 Google 登录开启创作者控制台',
      signInCtaBody: '管理您的项目、同步 GitHub 数据并在多设备间同步收藏夹。',
      noProjectsYet: '您尚未发布任何项目。',
      noBookmarksYet: '暂无收藏的项目。',
      resyncGithub: '重新同步 GitHub',
      deleteProject: '删除',
      analyticsTitle: '项目互动数据分析',
      analyticsSubtitle: '站内点赞与收藏统计严格独立于外部 GitHub 星标。',
      metricOwnedProjects: '已发布项目',
      metricTotalLikes: '累计点赞',
      metricTotalBookmarks: '累计收藏',
      metricTotalEngagement: '站内总互动',
      metricExternalStarsNote: '外部 GitHub 星标总计',
      analyticsSortEngagement: '总互动量',
      analyticsSortLikes: '最多点赞',
      analyticsSortBookmarks: '最多收藏',
      analyticsSortRecent: '最新发布',
      tableProjectCol: '项目',
      tableLikesCol: '点赞',
      tableBookmarksCol: '收藏',
      tableTotalCol: '互动合计',
      tableSplitCol: '互动占比',
      tableGithubCol: 'GitHub 星标',
      topProjectLabel: '互动最高项目',
      analyticsEmptyHint: '发布项目后，可在此查看每个项目的点赞、收藏与互动明细。',
      projectListHeading: '我的项目列表',
      likesUnit: '点赞',
      bookmarksUnit: '收藏',
      engagementUnit: '总互动',
    },
    footer: {
      tagline: 'VibeAtlas (Working Name) — 可验证的 AI 产品 · MCP · AI Skills 发现平台',
      transparencyNote: '外部 GitHub 指标与站内互动指标始终严格分离统计。',
    },
    voiceSearch: {
      startLabel: '语音搜索',
      stopLabel: '停止语音输入',
      listeningStatus: '正在聆听... 请说出搜索关键词',
      stopButton: '停止',
      unsupportedError: '当前浏览器不支持语音搜索（Web Speech API），请尝试使用 Chrome 或 Edge。',
      permissionDeniedError: '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风。',
      noSpeechError: '未检测到语音，请对着麦克风重试。',
      audioCaptureError: '未检测到麦克风设备，请检查音频输入设备。',
      networkError: '语音识别网络连接失败，请检查网络后重试。',
      unknownError: '无法完成语音识别，请稍后再试。',
      dismissError: '关闭',
    },
    githubStarsPage: {
      title: 'GitHub 星标 Top 100 排行榜',
      subtitle: '基于 GitHub 官方 Search REST API 实时统计星标数前 100 名仓库（与 VibeAtlas 站内点赞收藏严格分离）。',
      refreshButton: '实时刷新',
      refreshing: '加载中...',
      presetAll: '全球 Top 100',
      presetWebApps: 'Web 应用',
      presetAiAgents: 'AI · 智能体 · MCP',
      presetTypescript: 'TypeScript',
      presetPython: 'Python',
      presetRust: 'Rust',
      presetGo: 'Go',
      kpiRankedCount: '上榜仓库数',
      kpiTopStars: '第 1 名星标数',
      kpiMedianStars: '星标中位数',
      kpiLastUpdated: '最后同步时间',
      cachedFallbackBadge: '缓存快照',
      searchPlaceholder: '在 Top 100 内搜索仓库名、描述或标签...',
      allLanguagesOption: '全部语言',
      showingCountLabel: '个仓库显示中',
      colRank: '排名',
      colRepository: '仓库',
      colLanguageLicense: '语言 · 协议',
      colForks: 'Forks',
      colStars: 'GitHub 星标',
      colActions: '链接',
      openInVibeAtlas: 'VibeAtlas 详情',
      openGithub: 'GitHub',
      emptyFilteredTitle: '没有符合筛选条件的仓库',
      emptyFilteredBody: '请清空搜索关键词或语言筛选以查看完整的 Top 100 榜单。',
      resetFilterButton: '重置筛选',
      errorTitle: '无法加载 GitHub Top 100 排行榜',
      retryButton: '重试',
      rateLimitResetPrefix: 'API 配额预计重置时间',
      translatingDescriptions: '正在将仓库简介翻译为中文...',
      translatedBadge: '已翻译',
      showOriginal: '查看原文',
      showTranslated: '查看译文',
      translationErrorNotice: '实时翻译服务暂不可用，当前显示 GitHub 原始简介。',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      discover: '探索',
      githubStars: 'GitHub スター',
      makers: 'メイカー',
      submit: '登録',
      primaryCta: 'プロジェクト登録',
    },
    workspace: {
      savedBookmarks: 'ブックマーク',
      signInGoogle: 'Google ログイン',
      signOut: 'ログアウト',
      makerAccount: 'メイカーアカウント',
      lightMode: 'ライトモード',
      darkMode: 'ダークモード',
      koreanSearchNoteTitle: '多言語検索について',
      koreanSearchNoteBody:
        '一般的な英語ステマーは韓国語や日本語・中国語の部分語を適切に分割できません。VibeAtlas は大文字小文字を区別しない多言語部分一致と技術用語の同義語拡張を組み合わせています。',
    },
    hero: {
      kicker: '検証済みメタデータ · 透明なランキング',
      headline: 'バイブコーディングアプリ・MCPサーバー・AI Skills を一目で発見して検証',
      subheadline:
        'VibeAtlas は外部 GitHub スターと内部のいいね・ブックマークを厳密に分離し、メタデータの出典や未検証・古い情報を透明に表示します。',
      searchPlaceholder: '例: MCP サーバー、Lovable、AI エージェント、Supabase...',
      searchButton: '検索',
      quickBrowseLabel: 'クイック探索',
    },
    home: {
      trendingTab: '今週のトレンド',
      newlyLaunchedTab: '新着リリース',
      risingOssTab: '急上昇 OSS',
      viewAllDiscover: 'ディレクトリ全体を見る',
      mcpAndSkillsTitle: '人気の MCP サーバー & AI Skills',
      mcpAndSkillsSubtitle: '検証済みリポジトリ基準でツールプロトコルとエージェントスキルを探索。',
      stacksTitle: 'モダン AI スタック別コレクション',
      stacksSubtitle: 'Lovable・Vercel・Supabase・Cursor など実際の運用スタックを公開。',
      koreanGlobalTitle: '韓国・グローバルメイカー特集',
      koreanGlobalSubtitle: 'ソウルから世界まで、検証済み個人開発者や AI ネイティブチームのプロダクト。',
      featuredMakersTitle: '注目のメイカー',
      featuredMakersSubtitle: 'リポジトリとメタデータ出典が確認されたビルダー。',
      submitCtaTitle: 'AI プロダクトや MCP サーバーを登録して発信しよう',
      submitCtaBody:
        '「登録する」で公開したプロジェクトはトップページのローンチショーケースに掲載され、共有リンクとプロモーション文面キットを利用できます。',
      submitCtaButton: '登録してプロモーション',
      newsletterTitle: 'VibeAtlas 週刊ダイジェスト',
      newsletterBody: '毎週検証済みの新着 MCP サーバーや AI Skills、国内外メイカーの公開情報をお届け。',
      newsletterPlaceholder: 'メールアドレス（Google ログイン連携）',
      newsletterButton: '購読する',
      newsletterSignInNotice: '購読設定を保存するには Google でログインしてください。',
      newsletterSuccess: '購読設定を保存しました。',
      promoTitle: '登録プロジェクト プロモーションショーケース',
      promoSubtitle: '「登録する」で公開された AI アプリや MCP サーバーをトップで紹介し、共有リンク・紹介文キットで外部コミュニティへすぐ発信できます。',
      promoTabAll: 'すべて',
      promoTabSubmitted: '投稿プロジェクト優先',
      promoTabDemoReady: 'ライブデモあり',
      promoCtaSubmit: '登録して発信する',
      promoKitHeading: 'プロモーションキット · 共有スニペット',
      promoToneCommunity: 'コミュニティ紹介向け',
      promoToneSocial: 'SNS 投稿向け',
      promoCopyLinkButton: '共有リンクをコピー',
      promoCopyPitchButton: '紹介文をコピー',
      promoCopiedLabel: 'コピー済み',
      promoOpenDetailButton: '詳細を見る',
      promoLiveDemoButton: 'ライブデモ',
      promoSubmittedLabel: 'コミュニティ登録',
      promoCuratedLabel: '編集部ピックアップ',
      promoEmptyFilterTitle: '該当条件の登録プロジェクトがまだありません',
      promoEmptyFilterBody: '最初のプロジェクトを登録して、トップページのショーケースに掲載しましょう。',
      promoCountLiveSuffix: '件登録済み',
      trending24hTitle: 'トレンド · 24時間 GitHub スター急上昇',
      trending24hSubtitle: 'GitHub 公式 API の日次スナップショットと 24 時間スター増加速度をもとに、直近 24 時間で最も注目されているリポジトリをリアルタイム表示します。',
      trending24hAllLanguages: 'すべての言語',
      trending24hRefreshButton: '更新',
      trending24hViewLeaderboard: 'スターランキングを見る',
      trending24hStarsSuffix: '/ 24h',
      trending24hSourceSnapshot: '24h 実測差分',
      trending24hSourceRate: '24h 増加速度',
      trending24hOpenCatalog: '詳細を見る',
      trending24hOpenGithub: 'GitHub',
      trending24hEmptyTitle: '選択した言語の 24 時間急上昇リポジトリはありません',
      trending24hEmptyBody: 'すべての言語に戻すか、最新データを再取得してください。',
      trending24hResetLanguage: 'すべての言語を表示',
      trending24hErrorTitle: '24時間の GitHub 成長データを取得できませんでした',
      trending24hRetryButton: '再試行',
      recentActivityTitle: '最近のアクティビティ',
      recentActivitySubtitle: 'VibeAtlas 全体での新規プロジェクト投稿・いいね・ブックマークをリアルタイムでスクロール表示します。',
      recentActivityFilterAll: 'すべて',
      recentActivityFilterSubmissions: '新規投稿',
      recentActivityFilterLikes: 'いいね',
      recentActivityFilterBookmarks: 'ブックマーク',
      recentActivityAutoScrollOn: '自動スクロール',
      recentActivityAutoScrollPaused: '一時停止',
      recentActivityActionSubmitted: 'が新規投稿しました',
      recentActivityActionLiked: 'にいいねしました',
      recentActivityActionBookmarked: 'をブックマークしました',
      recentActivityCommunityActor: 'VibeAtlas コミュニティ',
      recentActivityGuestActor: 'ゲスト',
      recentActivityLiveLabel: 'ライブ',
      recentActivityDeltaSuffix: '件の反応',
      recentActivityOpenProject: '詳細',
      recentActivityEmptyTitle: 'この種別のアクティビティはまだありません',
      recentActivityEmptyBody: 'プロジェクトを投稿したり、いいね・ブックマークを行うとここに即時反映されます。',
      recentActivityLiveCountSuffix: '件',
      recentActivityShowAllButton: 'すべて表示',
    },
    discover: {
      title: 'プロジェクト・リソース探索',
      subtitle: 'すべてのフィルターは URL クエリと同期され、共有やリロード時も状態が保持されます。',
      filtersHeading: '詳細フィルター',
      mobileFiltersButton: 'フィルター',
      resetFilters: 'フィルターをリセット',
      searchPlaceholder: 'キーワード、スタック、メイカー、リポジトリを検索...',
      sortLabel: '並び替え',
      resultsCount: '件の結果',
      emptyTitle: '一致するプロジェクトが見つかりません',
      emptyBody: 'フィルター条件を緩めるか、検索キーワードを変更してください。',
      previousPage: '前へ',
      nextPage: '次へ',
      filterType: 'コンテンツ種別',
      filterCategory: 'プロジェクトカテゴリ',
      allCategoriesOption: 'すべてのカテゴリ',
      filterTags: 'プロジェクトタグ',
      clearTags: 'タグ解除',
      activeTagsPrefix: '選択中のタグ',
      tagsHint: '複数タグの組み合わせで絞り込めます。',
      filterPlatform: '開発プラットフォーム',
      filterHosting: 'ホスティング',
      filterBackend: 'バックエンド',
      filterCountry: '国・地域',
      filterLanguage: '対応言語',
      filterLicense: 'ライセンス',
      filterPricing: '料金モデル',
      filterVerification: '検証ステータス',
      filterMinStars: '最小 GitHub スター',
      filterUpdatedWithin: '最終更新',
      allOption: 'すべて',
      webAppsTop100Title: 'Web アプリ Top #1 – #100 全件表示',
      webAppsTop100Subtitle: 'GitHub 公式 Search REST API に基づき、上位 #1 から #100 のオープンソース Web アプリを一括レンダリングします。',
      webAppsLoading: 'Web アプリ #1 – #100 を読み込み中...',
      webAppsError: 'ライブ Web アプリ Top 100 を取得できないため、ローカル登録項目のみ表示しています。',
      webAppsRetry: '再試行',
    },
    trendingSection: {
      title: 'トレンド & 成長速度',
      subtitle: '過去30日間・7日間のスター増加数と成長速度を D3 で可視化し、急上昇プロジェクトを見つけます。',
      toggleExpand: 'グラフを展開',
      toggleCollapse: 'グラフを折りたたむ',
      tabStar30d: '30日間スター増加',
      tabStar7d: '7日間急上昇',
      tabSignalVelocity: 'コミュニティ成長速度',
      chartHeading: '急上昇プロジェクト順位',
      trajectoryHeading: '日別累積推移',
      unitStars: 'スター',
      unitSignals: 'シグナル',
      perDaySuffix: '/日',
      periodDeltaLabel: '期間純増',
      dailyVelocityLabel: '日次速度',
      currentTotalLabel: '現在合計',
      inspectButton: '詳細を見る',
      emptyStarTitle: '複数日の GitHub スター履歴がまだ記録されていません',
      emptyStarBody: '複数の日付でリポジトリを同期すると、ここに30日・7日のスター成長速度が D3 グラフで表示されます。',
      switchToSignalButton: 'コミュニティ成長速度を表示',
      emptyFilteredTitle: '現在のフィルターに一致する成長データがありません',
      emptyFilteredBody: 'フィルター条件を緩めると、急上昇プロジェクトの成長速度グラフが表示されます。',
      fallbackNote: '複数日の GitHub スター履歴が蓄積されるまで、検証済み VibeAtlas 内部成長速度を表示しています。',
    },
    githubTrendingBubble: {
      title: 'GitHub Trending · AI エコシステム',
      subtitle: 'D3 バブルチャートで AI エコシステムの最注目 GitHub リポジトリを日別スター数サイズで可視化します。',
      toggleExpand: 'バブルチャートを展開',
      toggleCollapse: 'バブルチャートを折りたたむ',
      refreshButton: '更新',
      refreshing: '読み込み中...',
      allLanguages: 'すべての言語',
      perDaySuffix: '/日',
      dailyStarsLabel: '日別スター',
      totalStarsLabel: '累計スター',
      forksLabel: 'Forks',
      pushedLabel: '最終プッシュ',
      topMoversHeading: '日別上位リポジトリ',
      openGithubButton: 'GitHub で開く',
      inspectVibeAtlasButton: 'VibeAtlas で詳細を見る',
      loadingLabel: 'アクティブな AI エコシステムリポジトリを読み込み中...',
      emptyTitle: '該当言語のトレンドリポジトリはありません',
      emptyBody: '言語フィルターをリセットすると AI エコシステム全体のバブルが表示されます。',
      resetLanguageButton: 'すべて表示',
      errorTitle: 'GitHub Trending リポジトリを取得できませんでした',
      retryButton: '再試行',
      cachedNotice: 'キャッシュ表示中',
      rateModeVelocity: '日次スター増加ペース基準',
      rateModeSnapshot: '24時間スナップショット差分',
      reposCountLabel: '件の活発なリポジトリ',
      clickHint: 'バブルをクリックまたはホバーして詳細を確認',
    },
    discoveryMap: {
      title: 'エコシステム・ビジュアル探索マップ',
      subtitle: 'GitHub スター数（X軸・対数）と更新・コミュニティ活動頻度（Y軸）に基づく D3 散布図で直感的に探索します。',
      toggleExpand: 'マップを展開',
      toggleCollapse: 'マップを折りたたむ',
      scopeEcosystem: 'エコシステム全体',
      scopeDirectory: 'ディレクトリ絞り込み結果',
      scopeVerifiedMakers: '認証メイカーのみ',
      allTypes: 'すべて',
      xAxisLabel: 'GitHub スター（対数スケール）',
      yAxisLabel: '活動頻度スコア (0–100)',
      quadrantLeaders: 'エコシステム上位',
      quadrantActiveBuilders: '高活性・注目ビルド',
      quadrantEstablished: '安定・成熟',
      quadrantEmerging: '初期・ニッチ',
      spotlightHeading: 'ノード詳細スポットライト',
      starsMetricLabel: 'GitHub スター',
      activityMetricLabel: '活動頻度',
      dailyVelocityLabel: '日次スター速度',
      recencyLabel: '最終活動',
      todayLabel: '今日',
      daysAgoSuffix: '日前',
      sourceDirectory: 'VibeAtlas 登録',
      sourceEnriched: 'ディレクトリ + リアルタイム GitHub',
      sourceEcosystem: 'GitHub AI エコシステム',
      inspectButton: '詳細を見る',
      openGithubButton: 'GitHub で開く',
      emptyTitle: '条件に一致するノードがありません',
      emptyBody: 'すべてのタイプに戻すかディレクトリ条件をリセットして全体マップを表示してください。',
      resetMapFilter: 'マップ絞り込み解除',
      resetFiltersButton: 'ディレクトリ条件をリセット',
      pointsCountLabel: '件のノードを表示中',
      interactionHint: '各ドットにホバーまたはクリックして詳細指標を確認',
      medianGuideNote: '破線：中央値ライン',
    },
    card: {
      githubStars: 'GitHub スター',
      internalLikes: 'いいね',
      internalBookmarks: 'ブックマーク',
      notSynced: '未同期',
      staleLabel: '同期が古い',
      verifiedLabel: '検証済み',
      pendingLabel: '検証待ち',
      unverifiedLabel: '未検証',
      missingLicense: 'ライセンス未記載',
      openDetail: '詳細を見る',
      likeAction: 'いいね',
      bookmarkAction: 'ブックマーク',
      trendingBadge: 'トレンド',
      trending7dTooltip: '過去 7 日間で GitHub スター +{count} 増加',
      trendingEngagementTooltip: '過去 7 日間でいいね +{likes}・ブックマーク +{bookmarks}（計 +{total} 増加）',
      compareAdd: '比較に追加',
      compareSelected: '比較対象',
    },
    highlights: {
      containerLabel: 'プロジェクト注目バッジ',
      featured: '注目ピック',
      newArrival: '新着',
      highActivity: '高アクティビティ',
      featuredTooltip: '検証済みメタデータと高いコミュニティ評価に基づく注目プロジェクトです。',
      newArrivalTooltip: '最近カタログに追加された新着プロジェクトです（{date}）。',
      highActivityTooltip: '直近の更新頻度やコミュニティ反応が特に活発なプロジェクトです。',
      highActivityStarsTooltip: '過去 7 日間で GitHub スター +{count} 増加の高成長プロジェクトです。',
      highActivitySignalsTooltip: '過去 7 日間でいいね・ブックマーク +{count} 件の活発な反応があります。',
    },
    verification: {
      claimedBadge: 'メイカー認証',
      claimedTooltip: '制作者本人によって所有権が認証・管理されているプロジェクトです。',
      pendingBadge: '認証審査中',
      pendingTooltip: 'メイカー所有権の認証リクエストを受領し確認中です。',
      unclaimedBadge: '未認証',
      panelTitleClaimed: 'メイカー所有権 認証済み',
      panelBodyClaimed:
        '公式メイカーが VibeAtlas 上で所有権を認証済みです。外部リンクやライセンス表記、制作者情報の信頼性が確認されています。',
      panelTitlePending: 'メイカー所有権 認証審査中',
      panelBodyPending:
        '所有権の認証申請が提出され確認中です。承認されるとカードおよび詳細モーダルにメイカー認証バッジが表示されます。',
      panelTitleUnclaimed: 'メイカー未認証リスティング',
      panelBodyUnclaimed:
        '公開リポジトリまたはコミュニティ登録によるエントリです。制作者ご本人の場合は所有権を申請して信頼バッジを取得できます。',
      attributionLabel: 'メイカー',
      methodLabel: '認証方法',
      statusLabel: 'ステータス',
      statusClaimed: '所有権認証済み',
      statusPending: '審査中',
      statusUnclaimed: '未認証',
      ownerTag: 'あなたの登録',
      methodGithub: 'GitHub リポジトリ権限',
      methodDns: 'ドメイン DNS TXT',
      methodDemo: 'ライブデモ Meta タグ',
      methodDirect: 'メイカー直接投稿・検証済み',
      claimCta: '所有権を認証する',
    },
    compare: {
      trayTitle: 'プロジェクト比較',
      trayHintOneMore: '並べて比較するにはもう 1 件選択してください（最大 3 件）。',
      trayLimitNotice: '同時に比較できるのは最大 3 件までです。いずれかを外してから追加してください。',
      emptySlotLabel: '空きスロット',
      compareNowButton: '並べて比較する',
      clearButton: 'すべて解除',
      removeAction: '比較から外す',
      modalTitle: 'プロジェクト比較テーブル',
      modalSubtitle: 'GitHub 指標（スター・フォーク・ライセンス）と技術スタック・メタデータを並べて比較します。',
      closeButton: '閉じる',
      colAttribute: '比較項目',
      sectionGithub: 'GitHub 統計',
      sectionMetadata: 'メタデータ・技術スタック',
      sectionCommunity: 'コミュニティ指標・リンク',
      rowGithubStars: 'GitHub スター',
      rowGithubForks: 'GitHub フォーク',
      rowLicense: 'ライセンス',
      rowRepository: 'リポジトリ',
      rowLastSynced: '最終同期',
      rowContentType: 'コンテンツ種別',
      rowCategories: 'カテゴリ',
      rowPlatform: '開発プラットフォーム',
      rowHostingBackend: 'ホスティング・バックエンド',
      rowTechStack: '技術スタック',
      rowPricing: '料金モデル',
      rowVerification: '検証状態・出典',
      rowCountryLang: '国・言語',
      rowUpdatedAt: '最終更新',
      rowEngagement: 'いいね・ブックマーク',
      rowLinks: 'リンク',
      highestBadge: '最多',
      latestBadge: '最新',
      openDetail: '詳細を見る',
      notAvailable: '未設定',
    },
    detail: {
      close: '閉じる',
      externalLinksTitle: '外部リンク（外部サイトへ移動）',
      internalActionsTitle: 'VibeAtlas 内部アクション',
      liveDemo: 'ライブデモ',
      officialWebsite: '公式サイト',
      githubRepository: 'GitHub リポジトリ',
      syncGithubNow: '今すぐ GitHub 同期',
      syncing: '同期中...',
      provenanceTitle: 'メタデータ出典 & 鮮度',
      provenanceSourceLabel: '出典',
      lastSyncedLabel: '最終同期',
      missingFieldsLabel: '未入力・未検証項目',
      noneMissing: '主要メタデータはすべて揃っています',
      techAndPlatformTitle: 'スタック & プラットフォーム帰属',
      platformLabel: '開発プラットフォーム',
      hostingLabel: 'ホスティング',
      backendLabel: 'バックエンド',
      licenseLabel: 'ライセンス',
      pricingLabel: '料金プラン',
      countryLangLabel: '国 / 言語',
      historyChartTitle: '過去 14 日間の成長推移（GitHub スター・内部指標）',
      historyChartSubtitle: '外部 GitHub スターと VibeAtlas 内部のいいね・ブックマークは別軸で表示されます。',
      chartTabStars: 'GitHub スター',
      chartTabInternal: '内部いいね・ブックマーク',
      chartUnsyncedStarsHint: 'GitHub リポジトリが未同期です。同期するとリアルタイムスター数が表示されます。',
      chartLiveTotalLabel: '現在の GitHub スター',
      chartDeltaLabel: '14日間増加',
      chartBaselineNote: 'リアルタイム基準値（日次同期が蓄積されると推移が表示されます）',
      relatedTitle: '関連プロジェクト & 代替ツール',
      reportButton: '誤情報を報告',
      claimButton: '所有権を申請',
      reportTitle: '情報誤り・リンク切れの報告',
      claimTitle: 'メイカー所有権認証を申請',
      submitReport: '報告を送信',
      submitClaim: '認証申請を送信',
      actionSubmitted: 'Firestore に安全に保存されました。',
      signInRequired: 'この操作を保存するには Google ログインが必要です。',
      communityActivityTitle: 'コミュニティアクティビティ',
      communityActivitySubtitle: 'このプロジェクトへの最近のいいね・ブックマーク・報告を時系列で表示します。',
      activityFilterAll: 'すべて',
      activityFilterLikes: 'いいね',
      activityFilterBookmarks: 'ブックマーク',
      activityFilterReports: '報告',
      activityActionLike: 'がプロジェクトにいいねしました',
      activityActionBookmark: 'がプロジェクトをブックマークしました',
      activityActionReport: 'が問題を報告しました',
      activityGuestActor: 'ゲストメンバー',
      activityEmptyTitle: 'まだ最近のアクティビティはありません',
      activityEmptySubtitle: '上のいいね・ブックマーク・報告ボタンを使うと、ここに時系列でリアルタイム表示されます。',
      activityLoadingLabel: 'アクティビティを読み込み中...',
      activityErrorNotice: 'Firestore のリアルタイム同期を取得できないため、ローカル履歴のみ表示しています。',
      activityReasonBrokenLink: 'リンク切れ',
      activityReasonStaleMetadata: '古いメタデータ',
      activityReasonMisattribution: '帰属情報の誤り',
      activityReasonSpam: 'スパム',
      activityReasonSecurityConcern: 'セキュリティ上の懸念',
      vibeScoreTitle: 'Vibe スコア · コミュニティ健全度',
      vibeScoreSubtitle: 'VibeAtlas 内部エンゲージメント・直近モメンタム・検証鮮度・同期済み GitHub 指標に基づく D3 ゲージです。',
      vibeScoreOutOf100: '/ 100',
      vibeScoreTierThriving: '高活性 (Thriving)',
      vibeScoreTierActive: '活発 (Active)',
      vibeScoreTierWarm: '安定 (Warm)',
      vibeScoreTierQuiet: '静穏 (Quiet)',
      vibeScorePillarAffinity: 'コミュニティ好感度 (いいね・保存)',
      vibeScorePillarMomentum: '直近アクティビティ勢い',
      vibeScorePillarTraction: '同期済み GitHub 牽引力',
      vibeScorePillarHealth: '検証・更新フレッシュネス',
      vibeScoreUnsyncedNote: 'GitHub 未同期のため外部牽引力スコアは 0 点です',
      vibeScoreReportsPenalty: '問題報告による減点反映',
      vibeScoreFormulaNote: '内部エンゲージメント・健全度（最大75点）と同期済み外部 GitHub 指標（最大25点）を分離して合算しています。',
      sharePromoteTitle: 'プロモーション · 共有',
      copyDirectLink: 'リンクをコピー',
      copyPromoPitch: '紹介文をコピー',
      copiedFeedback: 'コピーしました',
      timelineTitle: 'プロジェクトタイムライン & マイルストーン',
      timelineSubtitle: 'GitHub リリース・直近コミット履歴と作成者が記録したマイルストーンログを時系列で可視化します。',
      timelineFilterAll: 'すべて',
      timelineFilterReleases: 'リリース',
      timelineFilterCommits: 'コミット',
      timelineFilterCreatorLogs: '作成者ログ',
      timelineSortNewest: '新しい順',
      timelineSortOldest: '古い順',
      timelineAddButton: 'マイルストーンを追加',
      timelineCloseComposer: 'フォームを閉じる',
      timelineCadenceLabel: '活動タイムスパン',
      timelineSpanDaysSuffix: '日間',
      timelineGapSuffix: '日の間隔',
      timelineLoadingLabel: 'GitHub リポジトリのリリースとコミットを取得中...',
      timelineRepoErrorNotice: 'GitHub のアクティビティを一時的に取得できないため、ディレクトリおよび作成者ログのみ表示しています。',
      timelineNoRepoNote: 'GitHub リポジトリ未連携のため、ディレクトリ履歴と作成者ログを表示しています。',
      timelineEmptyTitle: '該当するマイルストーンがありません',
      timelineEmptyBody: '「すべて」に切り替えると、リポジトリやディレクトリの履歴を確認できます。',
      timelineEmptyCreatorBody: '作成者によるカスタム更新ログはまだ登録されていません。',
      timelineAuthNoticeSignedOut: '公式マイルストーンログを公開するには、プロジェクト所有者の Google アカウントでログインしてください。',
      timelineAuthNoticeNotOwner: '登録済みのプロジェクト所有者または管理者のみ作成者ログを追加できます。制作者の場合は上から所有権認証を申請してください。',
      timelineSignInCta: 'Google でログイン',
      timelineClaimCta: '所有権認証を開く',
      timelineKindLabel: '種別',
      timelineKindRelease: 'リリース',
      timelineKindLaunch: 'ローンチ',
      timelineKindFeature: '新機能',
      timelineKindUpdate: 'アップデート',
      timelineKindFix: '修正',
      timelineVersionLabel: 'バージョンタグ（任意）',
      timelineDateLabel: '日付',
      timelineEntryTitleLabel: 'タイトル *',
      timelineSummaryLabel: '概要（任意）',
      timelineUrlLabel: '参考 URL（任意）',
      timelinePublishButton: 'タイムラインに公開',
      timelinePublishingButton: '公開中...',
      timelineDeleteButton: 'マイルストーンを削除',
      timelineExternalLink: 'ソースを開く',
      timelineSourceRelease: 'GitHub リリース',
      timelineSourceCommit: 'コミット',
      timelineSourceCreator: '作成者ログ',
      timelineSourceCatalog: 'ディレクトリ履歴',
      volatilityTitle: 'Vibe スコア変動率 vs. GitHub スター成長率',
      volatilitySubtitle: 'D3 デュアルトレンド線で Vibe スコアの揺らぎ幅（±σ バンド）と日次スター増加率を比較します。',
      volatilityModePace: '複合トレンド',
      volatilityModeSwing: '日次変動幅',
      volatilityMetricStdDev: '変動率 (σ)',
      volatilityMetricNetVibe: '14日間 Vibe 変化',
      volatilityMetricStarRate: '14日間スター成長率',
      volatilityMetricMaxSwing: '最大日次振れ幅',
      volatilityVerdictLabel: '技術採用ペースとコミュニティ感情の整合性',
      volatilityVerdictKeepingPace: '技術採用と歩調が一致',
      volatilityVerdictKeepingPaceDesc: 'コミュニティの Vibe スコアと GitHub スター増加率がバランスよく連動しています。',
      volatilityVerdictSentimentLeading: 'コミュニティ期待が先行',
      volatilityVerdictSentimentLeadingDesc: '内部の注目度やスコア変動が現在のリポジトリスター成長速度を上回っています。',
      volatilityVerdictAdoptionOutpacing: '技術採用がコミュニティを上回る',
      volatilityVerdictAdoptionOutpacingDesc: 'GitHub スターの伸びが VibeAtlas 内部のコミュニティ勢いよりも速く進んでいます。',
      volatilityVerdictUnsynced: 'GitHub 未同期',
      volatilityVerdictUnsyncedDesc: '内部 Vibe 変動のみ追跡中です。GitHub を同期すると実測スター成長率を重ねて比較できます。',
      volatilityVerdictBaseline: '初回スナップショット基準',
      volatilityVerdictBaselineDesc: '本日のスター数が記録されました。複数日の同期データが蓄積すると日次成長率が描画されます。',
      volatilityLegendVibeScore: 'Vibe スコア (0–100)',
      volatilityLegendBand: '変動バンド (±σ)',
      volatilityLegendStarRate: '日次スター成長率 (%)',
      volatilityLegendSwing: '日次 Vibe 増減 (Δ)',
      volatilityLeftAxisLabel: 'Vibe スコア',
      volatilityRightAxisLabel: 'スター成長率 (%)',
      volatilitySwingAxisLabel: '日次変動 (Δpt)',
      volatilityScrubHint: '日付ポイントにホバーまたは選択すると詳細数値を表示します',
      volatilityDateLabel: '日付',
      volatilityVibeDeltaLabel: '前日比 Vibe',
      volatilityStarGainLabel: '日次スター増減',
      insightsTitle: 'プロジェクトインサイト · 直近 7 日間のいいね & ブックマーク',
      insightsSubtitle: '直近 7 日間のいいね（即時反応）とブックマーク（保存意図）の日次増減および累計推移を D3 で可視化します。',
      insightsModeDaily: '日次増減',
      insightsModeCumulative: '7日間累計推移',
      insightsKpiLikes7d: '7日間のいいね増',
      insightsKpiBookmarks7d: '7日間の保存増',
      insightsKpiBookmarkShare: 'ブックマーク比率',
      insightsKpiPeakDay: '最大アクティブ日',
      insightsTotalPrefix: '累計',
      insightsAvgPerDay: '日平均',
      insightsNoPeakDay: '記録なし',
      insightsScrubHint: '日付ごとのバーやノードを選択して詳細数値を確認できます',
      insightsDateLabel: '日付',
      insightsCombinedLabel: '合計',
      insightsMixTitle: '7日間の反応内訳',
      insightsEmptyTitle: '直近 7 日間に記録されたいいね・ブックマークはまだありません。',
      insightsEmptyHint: '下のいいねまたはブックマークを押すと、日次のコミュニティ推移が即座に反映されます。',
      insightsAxisCount: '件数',
    },
    submit: {
      title: '新しいプロジェクトを登録',
      subtitle: '検証可能なメタデータを入力するとディレクトリに即時公開され、Firestore に保存されます。',
      promoPreviewTitle: 'トップページ紹介プレビュー',
      promoPreviewSubtitle: '公開するとトップページのショーケースに掲載され、下記の紹介文でそのまま発信できます。',
      promoPreviewUntitled: 'あなたの AI プロジェクト（入力プレビュー）',
      promoPreviewTaglineFallback: 'タグラインを入力すると共有用の紹介文が生成されます。',
      githubImportTitle: 'GitHub リポジトリからメタデータを取得',
      githubImportHint: '例: modelcontextprotocol/servers または https://github.com/cline/cline',
      githubImportPlaceholder: 'owner/repo または GitHub URL を入力',
      githubFetchButton: 'リアルタイム取得',
      fetchingGithub: '取得中...',
      nameLabel: 'プロジェクト名 *',
      taglineEnLabel: '英語タグライン（5〜220文字）*',
      taglineKoLabel: '韓国語タグライン',
      descriptionEnLabel: '英語の詳細説明（20文字以上）*',
      descriptionKoLabel: '韓国語の詳細説明',
      contentTypeLabel: 'コンテンツ種別',
      categoriesLabel: 'カテゴリ・タグ（カンマ区切り・最大6つ）*',
      categoriesQuickTagsHint: 'クイックタグ選択（クリックで切替）：',
      techStackLabel: '技術スタック（カンマ区切り・最大12件）',
      platformLabel: '開発プラットフォーム',
      hostingLabel: 'ホスティング',
      backendLabel: 'バックエンド技術',
      countryLabel: '国コード（例: KR, JP, US）*',
      languageLabel: '対応言語',
      licenseLabel: 'ライセンス（例: MIT, Apache-2.0）*',
      pricingLabel: '料金モデル',
      liveDemoLabel: 'ライブデモ URL (https://)',
      websiteLabel: '公式サイト URL (https://)',
      githubUrlLabel: 'GitHub URL (https://)',
      makerNameLabel: 'メイカー / チーム名 *',
      makerHandleLabel: 'メイカーハンドル（例: @handle）',
      submitButton: 'ディレクトリに公開',
      submitting: '公開中...',
      signInPrompt: 'プロジェクトを Firestore に公開するには Google でログインしてください。',
      submitSuccess: 'プロジェクトを公開しました！',
      draftRestoredNotice: '前回の入力途中の下書きをローカルストレージから復元しました。',
      draftAutosaveHint: '入力内容は 30 秒ごとにブラウザのローカルストレージへ自動保存されます。',
      clearDraftButton: '下書きを削除',
      validationSummaryPrefix: '入力内容を確認してください',
    },
    maker: {
      title: 'メイカーダッシュボード & 保存一覧',
      subtitle: '公開したプロジェクト、ブックマーク、所有権申請、報告履歴を管理します。',
      myProjectsTab: '公開プロジェクト',
      myBookmarksTab: 'ブックマーク',
      claimsReportsTab: '所有権申請・報告履歴',
      signInCtaTitle: 'Google ログインでメイカーダッシュボードを開く',
      signInCtaBody: 'プロジェクト管理、GitHub 再同期、端末間ブックマーク同期を利用できます。',
      noProjectsYet: 'まだ公開したプロジェクトはありません。',
      noBookmarksYet: 'ブックマークしたプロジェクトはありません。',
      resyncGithub: 'GitHub 再同期',
      deleteProject: '削除',
      analyticsTitle: 'エンゲージメント分析',
      analyticsSubtitle: '内部のいいね・ブックマーク合計は外部 GitHub スターと分離して集計されます。',
      metricOwnedProjects: '公開プロジェクト',
      metricTotalLikes: '累計いいね',
      metricTotalBookmarks: '累計ブックマーク',
      metricTotalEngagement: '内部エンゲージメント計',
      metricExternalStarsNote: '外部 GitHub スター合計',
      analyticsSortEngagement: '総エンゲージメント順',
      analyticsSortLikes: 'いいね順',
      analyticsSortBookmarks: 'ブックマーク順',
      analyticsSortRecent: '新着順',
      tableProjectCol: 'プロジェクト',
      tableLikesCol: 'いいね',
      tableBookmarksCol: 'ブックマーク',
      tableTotalCol: '合計',
      tableSplitCol: 'エンゲージメント比率',
      tableGithubCol: 'GitHub スター',
      topProjectLabel: '最多エンゲージメント',
      analyticsEmptyHint: 'プロジェクトを公開すると、作品ごとのいいね・ブックマーク内訳が表示されます。',
      projectListHeading: '公開プロジェクト一覧',
      likesUnit: 'いいね',
      bookmarksUnit: 'ブックマーク',
      engagementUnit: '合計',
    },
    footer: {
      tagline: 'VibeAtlas (Working Name) — 検証可能な AI プロダクト・MCP・AI Skills ディレクトリ',
      transparencyNote: '外部 GitHub 指標と内部アクティビティ指標は常に分離集計されます。',
    },
    voiceSearch: {
      startLabel: '音声で検索',
      stopLabel: '音声入力を停止',
      listeningStatus: '聞き取り中... 検索キーワードをお話しください',
      stopButton: '停止',
      unsupportedError: 'お使いのブラウザは音声検索（Web Speech API）に対応していません。Chrome または Edge をお試しください。',
      permissionDeniedError: 'マイクへのアクセスが拒否されました。ブラウザ設定からマイク権限を許可してください。',
      noSpeechError: '音声が検出されませんでした。マイクに向かって再度お話しください。',
      audioCaptureError: 'マイクデバイスが見つかりません。オーディオ入力設定をご確認ください。',
      networkError: '音声認識サービスへの接続に失敗しました。通信環境をご確認ください。',
      unknownError: '音声認識を完了できませんでした。しばらくしてから再試行してください。',
      dismissError: '閉じる',
    },
    githubStarsPage: {
      title: 'GitHub スター Top 100 ランキング',
      subtitle: 'GitHub 公式 Search REST API に基づくスター数上位 100 リポジトリのリアルタイム集計（VibeAtlas 内部評価とは別集計）。',
      refreshButton: '最新に更新',
      refreshing: '読み込み中...',
      presetAll: '世界 Top 100',
      presetWebApps: 'Web アプリ',
      presetAiAgents: 'AI・エージェント・MCP',
      presetTypescript: 'TypeScript',
      presetPython: 'Python',
      presetRust: 'Rust',
      presetGo: 'Go',
      kpiRankedCount: '集計リポジトリ',
      kpiTopStars: '1位スター数',
      kpiMedianStars: '中央値スター',
      kpiLastUpdated: '最終同期',
      cachedFallbackBadge: 'キャッシュ表示中',
      searchPlaceholder: 'Top 100 内でリポジトリ名・説明・トピックを検索...',
      allLanguagesOption: 'すべての言語',
      showingCountLabel: '件のリポジトリを表示',
      colRank: '順位',
      colRepository: 'リポジトリ',
      colLanguageLicense: '言語 · ライセンス',
      colForks: 'Forks',
      colStars: 'GitHub スター',
      colActions: 'リンク',
      openInVibeAtlas: 'VibeAtlas 詳細',
      openGithub: 'GitHub',
      emptyFilteredTitle: '条件に一致するリポジトリがありません',
      emptyFilteredBody: '検索キーワードや言語フィルターをリセットして Top 100 全体を確認してください。',
      resetFilterButton: 'フィルターをリセット',
      errorTitle: 'GitHub Top 100 ランキングを読み込めませんでした',
      retryButton: '再試行',
      rateLimitResetPrefix: 'API 制限リセット予定',
      translatingDescriptions: 'リポジトリの説明を日本語に翻訳中...',
      translatedBadge: '翻訳済み',
      showOriginal: '原文を表示',
      showTranslated: '翻訳を表示',
      translationErrorNotice: 'リアルタイム翻訳を利用できないため、GitHub の原文説明を表示しています。',
    },
  },
};

export const CONTENT_TYPE_LABELS: Record<AppLanguage, Record<ContentType, string>> = {
  ko: {
    web_app: '웹 애플리케이션',
    ai_tool: 'AI 툴',
    mcp_server: 'MCP 서버',
    ai_skill: 'AI Skills',
    ai_agent: 'AI 에이전트',
    template: '템플릿',
    open_source: '오픈소스',
  },
  en: {
    web_app: 'Web Apps',
    ai_tool: 'AI Tools',
    mcp_server: 'MCP Servers',
    ai_skill: 'AI Skills',
    ai_agent: 'AI Agents',
    template: 'Templates',
    open_source: 'Open Source',
  },
  zh: {
    web_app: 'Web 应用',
    ai_tool: 'AI 工具',
    mcp_server: 'MCP 服务器',
    ai_skill: 'AI Skills',
    ai_agent: 'AI 智能体',
    template: '项目模板',
    open_source: '开源项目',
  },
  ja: {
    web_app: 'Web アプリ',
    ai_tool: 'AI ツール',
    mcp_server: 'MCP サーバー',
    ai_skill: 'AI Skills',
    ai_agent: 'AI エージェント',
    template: 'テンプレート',
    open_source: 'オープンソース',
  },
};

export const PROJECT_CATEGORY_LABELS: Record<AppLanguage, Record<ProjectCategory, string>> = {
  ko: {
    'AI Agent': 'AI 에이전트',
    'CLI Tool': 'CLI 도구',
    Framework: '프레임워크',
    'MCP Server': 'MCP 서버',
    'Web Tool': '웹 툴',
    'AI Skills': 'AI Skills',
    'Developer Tools': '개발자 도구',
    Workflow: '워크플로우',
    'Korean Builders': '한국 메이커',
    Templates: '템플릿',
    Backend: '백엔드',
    SDK: 'SDK',
  },
  en: {
    'AI Agent': 'AI Agent',
    'CLI Tool': 'CLI Tool',
    Framework: 'Framework',
    'MCP Server': 'MCP Server',
    'Web Tool': 'Web Tool',
    'AI Skills': 'AI Skills',
    'Developer Tools': 'Developer Tools',
    Workflow: 'Workflow',
    'Korean Builders': 'Korean Builders',
    Templates: 'Templates',
    Backend: 'Backend',
    SDK: 'SDK',
  },
  zh: {
    'AI Agent': 'AI 智能体',
    'CLI Tool': 'CLI 工具',
    Framework: '开发框架',
    'MCP Server': 'MCP 服务器',
    'Web Tool': 'Web 工具',
    'AI Skills': 'AI Skills',
    'Developer Tools': '开发工具',
    Workflow: '工作流',
    'Korean Builders': '韩国创作者',
    Templates: '模板',
    Backend: '后端',
    SDK: 'SDK',
  },
  ja: {
    'AI Agent': 'AI エージェント',
    'CLI Tool': 'CLI ツール',
    Framework: 'フレームワーク',
    'MCP Server': 'MCP サーバー',
    'Web Tool': 'Web ツール',
    'AI Skills': 'AI Skills',
    'Developer Tools': '開発ツール',
    Workflow: 'ワークフロー',
    'Korean Builders': '韓国メイカー',
    Templates: 'テンプレート',
    Backend: 'バックエンド',
    SDK: 'SDK',
  },
};

export const PLATFORM_LABELS: Record<DevelopmentPlatform, string> = {
  lovable: 'Lovable',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  bolt: 'Bolt.new',
  v0: 'v0 by Vercel',
  claude_code: 'Claude Code',
  replit: 'Replit',
  custom: 'Custom IDE',
};

export const HOSTING_LABELS: Record<HostingProvider, string> = {
  vercel: 'Vercel',
  cloudflare: 'Cloudflare',
  aws: 'AWS',
  fly_io: 'Fly.io',
  gcp: 'Google Cloud',
  netlify: 'Netlify',
  self_hosted: 'Self-Hosted',
  unknown: 'Unspecified',
};

export const BACKEND_LABELS: Record<BackendTech, string> = {
  supabase: 'Supabase',
  firebase: 'Firebase',
  postgresql: 'PostgreSQL',
  nodejs: 'Node.js / Express',
  python_fastapi: 'Python / FastAPI',
  sqlite: 'SQLite',
  serverless: 'Serverless',
  none: 'Client-Only',
  unknown: 'Unspecified',
};

export const PRICING_LABELS: Record<AppLanguage, Record<PricingModel, string>> = {
  ko: {
    free: '무료',
    open_source: '오픈소스',
    freemium: '부분 유료',
    paid: '유료',
    enterprise: '엔터프라이즈',
  },
  en: {
    free: 'Free',
    open_source: 'Open Source',
    freemium: 'Freemium',
    paid: 'Paid',
    enterprise: 'Enterprise',
  },
  zh: {
    free: '免费',
    open_source: '开源',
    freemium: '免费增值',
    paid: '付费',
    enterprise: '企业版',
  },
  ja: {
    free: '無料',
    open_source: 'オープンソース',
    freemium: 'フリーミアム',
    paid: '有料',
    enterprise: 'エンタープライズ',
  },
};

export const SORT_LABELS: Record<AppLanguage, Record<SortOption, string>> = {
  ko: {
    relevance: '관련도순',
    trending_24h: '트렌딩 24시간',
    trending_7d: '트렌딩 7일',
    trending_30d: '트렌딩 30일',
    most_starred: 'GitHub 스타순',
    most_liked: 'VibeAtlas 좋아요순',
    most_bookmarked: 'VibeAtlas 북마크순',
    recently_added: '최신 등록순',
    recently_updated: '최근 업데이트순',
  },
  en: {
    relevance: 'Relevance',
    trending_24h: 'Trending 24h',
    trending_7d: 'Trending 7d',
    trending_30d: 'Trending 30d',
    most_starred: 'Most Starred (GitHub)',
    most_liked: 'Most Liked (VibeAtlas)',
    most_bookmarked: 'Most Bookmarked',
    recently_added: 'Recently Added',
    recently_updated: 'Recently Updated',
  },
  zh: {
    relevance: '相关性',
    trending_24h: '24 小时趋势',
    trending_7d: '7 天趋势',
    trending_30d: '30 天趋势',
    most_starred: 'GitHub 星标最多',
    most_liked: 'VibeAtlas 点赞最多',
    most_bookmarked: '收藏最多',
    recently_added: '最新收录',
    recently_updated: '最近更新',
  },
  ja: {
    relevance: '関連度順',
    trending_24h: 'トレンド 24時間',
    trending_7d: 'トレンド 7日間',
    trending_30d: 'トレンド 30日間',
    most_starred: 'GitHub スター順',
    most_liked: 'VibeAtlas いいね順',
    most_bookmarked: 'ブックマーク順',
    recently_added: '新着順',
    recently_updated: '更新日順',
  },
};

export const VERIFICATION_LABELS: Record<AppLanguage, Record<VerificationStatus, string>> = {
  ko: {
    verified: '검증됨',
    pending: '검증 대기',
    unverified: '미검증',
  },
  en: {
    verified: 'Verified',
    pending: 'Pending',
    unverified: 'Unverified',
  },
  zh: {
    verified: '已验证',
    pending: '待验证',
    unverified: '未验证',
  },
  ja: {
    verified: '検証済み',
    pending: '検証待ち',
    unverified: '未検証',
  },
};
