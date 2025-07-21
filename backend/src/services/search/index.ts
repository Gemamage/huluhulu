import { indexingService, IndexingService } from "./indexing";
import { searchCoreService, SearchCoreService } from "./core";
import {
  searchSuggestionsService,
  SearchSuggestionsService,
} from "./suggestions";
import { searchAnalyticsService, SearchAnalyticsService } from "./analytics";
import { logger } from "../../utils/logger";

// 重新導出介面和類型
export type * from "./indexing";
export type * from "./core";
export type * from "./suggestions";
export type * from "./analytics";

// 重新導出實例和類
export { IndexingService, indexingService } from "./indexing";
export { SearchCoreService, searchCoreService } from "./core";
export { SearchSuggestionsService, searchSuggestionsService } from "./suggestions";
export { SearchAnalyticsService, searchAnalyticsService } from "./analytics";

/**
 * 統一的寵物搜尋服務
 * 整合索引管理、核心搜尋、建議和分析功能
 */
export class PetSearchService {
  private indexing: IndexingService;
  private core: SearchCoreService;
  private suggestions: SearchSuggestionsService;
  private analytics: SearchAnalyticsService;
  private isInitialized: boolean = false;

  constructor() {
    this.indexing = indexingService;
    this.core = searchCoreService;
    this.suggestions = searchSuggestionsService;
    this.analytics = searchAnalyticsService;
  }

  /**
   * 初始化搜尋服務
   */
  public async initialize(): Promise<void> {
    try {
      logger.info("正在初始化寵物搜尋服務...");

      // 初始化索引
      await this.indexing.initializePetIndex();
      await this.indexing.initializeSearchAnalyticsIndex();

      this.isInitialized = true;
      logger.info("寵物搜尋服務初始化完成");
    } catch (error) {
      logger.error("寵物搜尋服務初始化失敗:", error);
      throw error;
    }
  }

  /**
   * 檢查服務是否已初始化
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 獲取索引服務
   */
  public getIndexingService(): IndexingService {
    return this.indexing;
  }

  /**
   * 獲取核心搜尋服務
   */
  public getCoreService(): SearchCoreService {
    return this.core;
  }

  /**
   * 獲取建議服務
   */
  public getSuggestionsService(): SearchSuggestionsService {
    return this.suggestions;
  }

  /**
   * 獲取分析服務
   */
  public getAnalyticsService(): SearchAnalyticsService {
    return this.analytics;
  }

  /**
   * 搜尋寵物（帶分析記錄）
   */
  public async searchPets(
    query: any,
    userId?: string,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    try {
      const startTime = Date.now();

      // 執行搜尋
      const searchResult = await this.core.searchPets(query);

      const searchDuration = Date.now() - startTime;

      // 記錄搜尋分析
      if (query.query || Object.keys(query.filters || {}).length > 0) {
        await this.analytics.recordSearchAnalytics({
          query: query.query || "",
          filters: query.filters || {},
          userId,
          resultCount: searchResult.total,
          timestamp: new Date(),
          sessionId,
          userAgent,
          ipAddress,
          searchDuration,
          location: query.location,
        });
      }

      return searchResult;
    } catch (error) {
      logger.error("搜尋寵物失敗:", error);
      throw error;
    }
  }

  /**
   * 高級搜尋
   */
  public async advancedSearch(query: any, userId?: string) {
    try {
      const startTime = Date.now();

      const searchResult = await this.core.advancedSearch(query);

      const searchDuration = Date.now() - startTime;

      // 記錄搜尋分析
      await this.analytics.recordSearchAnalytics({
        query: query.query || "advanced_search",
        filters: query.filters || {},
        userId,
        resultCount: searchResult.total,
        timestamp: new Date(),
        searchDuration,
      });

      return searchResult;
    } catch (error) {
      logger.error("高級搜尋失敗:", error);
      throw error;
    }
  }

  /**
   * 尋找相似寵物
   */
  public async findSimilarPets(petId: string, userId?: string) {
    try {
      const similarPets = await this.core.findSimilarPets(petId);

      // 記錄搜尋分析
      await this.analytics.recordSearchAnalytics({
        query: `similar_to_${petId}`,
        filters: {},
        userId,
        resultCount: similarPets.length,
        timestamp: new Date(),
      });

      return similarPets;
    } catch (error) {
      logger.error("尋找相似寵物失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取搜尋建議
   */
  public async getSearchSuggestions(query: string, limit?: number) {
    return this.suggestions.getSearchSuggestions(query, limit);
  }

  /**
   * 獲取智能建議
   */
  public async getSmartSuggestions(
    query: string,
    userId?: string,
    limit?: number,
  ) {
    return this.suggestions.getSmartSuggestions(query, userId, limit);
  }

  /**
   * 獲取熱門搜尋
   */
  public async getPopularSearches(limit?: number, category?: string) {
    return this.suggestions.getPopularSearches(limit, category);
  }

  /**
   * 獲取用戶搜尋歷史
   */
  public async getUserSearchHistory(userId: string, limit?: number) {
    return this.suggestions.getUserSearchHistory(userId, limit);
  }

  /**
   * 記錄搜尋點擊
   */
  public async recordSearchClick(
    searchId: string,
    petId: string,
    position: number,
  ) {
    return this.analytics.recordSearchClick(searchId, petId, position);
  }

  /**
   * 索引寵物文檔
   */
  public async indexPet(pet: any) {
    return this.indexing.indexPetDocument(pet);
  }

  /**
   * 批量索引寵物文檔
   */
  public async indexPetsBulk(pets: any[]) {
    return this.indexing.indexPetDocumentsBulk(pets);
  }

  /**
   * 刪除寵物文檔
   */
  public async deletePet(petId: string) {
    return this.indexing.deletePetDocument(petId);
  }

  /**
   * 更新寵物文檔
   */
  public async updatePet(petId: string, updates: any) {
    return this.indexing.updatePetDocument(petId, updates);
  }

  /**
   * 獲取搜尋統計
   */
  public async getSearchStats(startDate?: Date, endDate?: Date) {
    return this.analytics.getSearchStats(startDate, endDate);
  }

  /**
   * 獲取用戶搜尋統計
   */
  public async getUserSearchStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.analytics.getUserSearchStats(userId, startDate, endDate);
  }

  /**
   * 獲取搜尋趨勢
   */
  public async getSearchTrends(
    period: "daily" | "weekly" | "monthly",
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.analytics.getSearchTrends(period, startDate, endDate);
  }

  /**
   * 獲取搜尋效果分析
   */
  public async getSearchEffectiveness() {
    return this.analytics.getSearchEffectiveness();
  }

  /**
   * 獲取索引統計
   */
  public async getIndexStats() {
    return this.indexing.getIndexStats();
  }

  /**
   * 重建寵物索引
   */
  public async rebuildPetIndex() {
    return this.indexing.rebuildPetIndex();
  }

  /**
   * 檢查索引是否存在
   */
  public async checkIndexExists(indexName: string) {
    return this.indexing.checkIndexExists(indexName);
  }

  /**
   * 清理過期數據
   */
  public async cleanupExpiredData(
    analyticsDays: number = 90,
    suggestionDays: number = 30,
  ) {
    try {
      const [analyticsResult, suggestionsResult] = await Promise.all([
        this.analytics.cleanupAnalyticsData(analyticsDays),
        this.suggestions.cleanupSuggestionCache(suggestionDays),
      ]);

      logger.info("清理過期數據完成", {
        deletedAnalytics: analyticsResult.deletedCount,
        deletedSuggestions: suggestionsResult.deletedCount,
      });

      return {
        deletedAnalytics: analyticsResult.deletedCount,
        deletedSuggestions: suggestionsResult.deletedCount,
      };
    } catch (error) {
      logger.error("清理過期數據失敗:", error);
      throw error;
    }
  }

  /**
   * 獲取服務健康狀態
   */
  public async getHealthStatus() {
    try {
      const [petIndexExists, analyticsIndexExists, indexStats] =
        await Promise.all([
          this.indexing.checkIndexExists(this.indexing.getPetIndexName()),
          this.indexing.checkIndexExists(
            this.indexing.getSearchAnalyticsIndexName(),
          ),
          this.indexing.getIndexStats(),
        ]);

      return {
        isInitialized: this.isInitialized,
        petIndexExists,
        analyticsIndexExists,
        indexStats,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("獲取服務健康狀態失敗:", error);
      return {
        isInitialized: this.isInitialized,
        petIndexExists: false,
        analyticsIndexExists: false,
        indexStats: null,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 重啟服務
   */
  public async restart() {
    try {
      logger.info("正在重啟寵物搜尋服務...");
      this.isInitialized = false;
      await this.initialize();
      logger.info("寵物搜尋服務重啟完成");
    } catch (error) {
      logger.error("寵物搜尋服務重啟失敗:", error);
      throw error;
    }
  }
}

// 導出單例實例
export const petSearchService = new PetSearchService();

// 導出子服務實例（向後兼容）
export {
  indexingService,
  searchCoreService,
  searchSuggestionsService,
  searchAnalyticsService,
};

// 默認導出
export default petSearchService;
