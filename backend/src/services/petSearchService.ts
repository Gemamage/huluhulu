// 重構後的寵物搜尋服務
// 導出模組化的搜尋服務和相關介面

// 導出類和實例
export {
  PetSearchService,
  IndexingService,
  SearchCoreService,
  SearchSuggestionsService,
  SearchAnalyticsService,
  petSearchService,
  indexingService,
  searchCoreService,
  searchSuggestionsService,
  searchAnalyticsService,
} from "./search";

// 導出類型
export type {
  PetSearchQuery,
  SearchSuggestion,
  PopularSearch,
  SearchAnalytics,
  SearchStats,
  SearchTrend,
} from "./search";

// 默認導出主服務實例（向後兼容）
export { default } from "./search";
