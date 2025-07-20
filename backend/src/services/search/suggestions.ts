import { elasticsearchService } from "../elasticsearchService";
import { logger } from "../../utils/logger";
import { indexingService } from "./indexing";

// 搜尋建議介面
export interface SearchSuggestion {
  text: string;
  score: number;
  type: "breed" | "location" | "description" | "name";
}

// 熱門搜尋介面
export interface PopularSearch {
  query: string;
  count: number;
  category?: string;
}

/**
 * 搜尋建議服務
 * 負責處理自動完成、搜尋建議和相關推薦功能
 */
export class SearchSuggestionsService {
  /**
   * 獲取搜尋建議
   */
  public async getSearchSuggestions(
    query: string,
    limit: number = 5,
  ): Promise<SearchSuggestion[]> {
    try {
      const response = await elasticsearchService.getClient().search({
        index: indexingService.getPetIndexName(),
        suggest: {
          name_suggest: {
            prefix: query,
            completion: {
              field: "name.suggest",
              size: limit,
            },
          },
          breed_suggest: {
            prefix: query,
            completion: {
              field: "breed.suggest",
              size: limit,
            },
          },
          location_suggest: {
            prefix: query,
            completion: {
              field: "lastSeenLocation.suggest",
              size: limit,
            },
          },
        },
      });

      const suggestions: SearchSuggestion[] = [];
      const suggest = response.suggest;

      // 處理名稱建議
      if (suggest.name_suggest && suggest.name_suggest[0]) {
        suggest.name_suggest[0].options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            score: option._score,
            type: "name",
          });
        });
      }

      // 處理品種建議
      if (suggest.breed_suggest && suggest.breed_suggest[0]) {
        suggest.breed_suggest[0].options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            score: option._score,
            type: "breed",
          });
        });
      }

      // 處理地點建議
      if (suggest.location_suggest && suggest.location_suggest[0]) {
        suggest.location_suggest[0].options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            score: option._score,
            type: "location",
          });
        });
      }

      // 去重並排序
      const uniqueSuggestions = suggestions
        .filter(
          (suggestion, index, self) =>
            index === self.findIndex((s) => s.text === suggestion.text),
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return uniqueSuggestions;
    } catch (error) {
      logger.error("獲取搜尋建議失敗:", error);
      return [];
    }
  }

  /**
   * 獲取分類建議
   */
  public async getCategorySuggestions(
    category: "breed" | "location" | "type",
    query: string,
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    try {
      let field: string;
      switch (category) {
        case "breed":
          field = "breed.suggest";
          break;
        case "location":
          field = "lastSeenLocation.suggest";
          break;
        case "type":
          field = "type";
          break;
        default:
          field = "name.suggest";
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getPetIndexName(),
        suggest: {
          category_suggest: {
            prefix: query,
            completion: {
              field: field,
              size: limit,
            },
          },
        },
      });

      const suggestions: SearchSuggestion[] = [];
      const suggest = response.suggest;

      if (suggest.category_suggest && suggest.category_suggest[0]) {
        suggest.category_suggest[0].options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            score: option._score,
            type: category,
          });
        });
      }

      return suggestions.sort((a, b) => b.score - a.score);
    } catch (error) {
      logger.error(`獲取 ${category} 建議失敗:`, error);
      return [];
    }
  }

  /**
   * 獲取熱門搜尋詞
   */
  public async getPopularSearches(
    limit: number = 10,
    category?: string,
  ): Promise<PopularSearch[]> {
    try {
      const query: any = {
        size: 0,
        aggs: {
          popular_queries: {
            terms: {
              field: "query.keyword",
              size: limit,
              order: { _count: "desc" },
            },
          },
        },
      };

      // 如果指定了分類，添加篩選條件
      if (category) {
        query.query = {
          bool: {
            filter: [{ term: { "filters.type": category } }],
          },
        };
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        ...query,
      });

      const popularSearches: PopularSearch[] = [];
      const aggs = response.aggregations;

      if (aggs && aggs.popular_queries) {
        aggs.popular_queries.buckets.forEach((bucket: any) => {
          popularSearches.push({
            query: bucket.key,
            count: bucket.doc_count,
            category,
          });
        });
      }

      return popularSearches;
    } catch (error) {
      logger.error("獲取熱門搜尋詞失敗:", error);
      return [];
    }
  }

  /**
   * 獲取相關搜尋詞
   */
  public async getRelatedSearches(
    query: string,
    limit: number = 5,
  ): Promise<SearchSuggestion[]> {
    try {
      // 使用 more_like_this 查詢找到相關的搜尋記錄
      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        query: {
          more_like_this: {
            fields: ["query"],
            like: [query],
            min_term_freq: 1,
            max_query_terms: 5,
          },
        },
        aggs: {
          related_queries: {
            terms: {
              field: "query.keyword",
              size: limit,
            },
          },
        },
        size: 0,
      });

      const relatedSearches: SearchSuggestion[] = [];
      const aggs = response.aggregations;

      if (aggs && aggs.related_queries) {
        aggs.related_queries.buckets.forEach((bucket: any) => {
          if (bucket.key !== query) {
            // 排除原始查詢
            relatedSearches.push({
              text: bucket.key,
              score: bucket.doc_count,
              type: "description",
            });
          }
        });
      }

      return relatedSearches.sort((a, b) => b.score - a.score);
    } catch (error) {
      logger.error("獲取相關搜尋詞失敗:", error);
      return [];
    }
  }

  /**
   * 獲取搜尋歷史建議
   */
  public async getUserSearchHistory(
    userId: string,
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    try {
      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        query: {
          term: { userId },
        },
        aggs: {
          user_queries: {
            terms: {
              field: "query.keyword",
              size: limit,
              order: { latest: "desc" },
            },
            aggs: {
              latest: {
                max: {
                  field: "timestamp",
                },
              },
            },
          },
        },
        size: 0,
      });

      const searchHistory: SearchSuggestion[] = [];
      const aggs = response.aggregations;

      if (aggs && aggs.user_queries) {
        aggs.user_queries.buckets.forEach((bucket: any) => {
          searchHistory.push({
            text: bucket.key,
            score: bucket.doc_count,
            type: "description",
          });
        });
      }

      return searchHistory;
    } catch (error) {
      logger.error("獲取用戶搜尋歷史失敗:", error);
      return [];
    }
  }

  /**
   * 獲取智能建議（結合多種建議類型）
   */
  public async getSmartSuggestions(
    query: string,
    userId?: string,
    limit: number = 10,
  ): Promise<{
    autoComplete: SearchSuggestion[];
    popular: PopularSearch[];
    related: SearchSuggestion[];
    history?: SearchSuggestion[];
  }> {
    try {
      const [autoComplete, popular, related, history] = await Promise.all([
        this.getSearchSuggestions(query, Math.ceil(limit / 2)),
        this.getPopularSearches(Math.ceil(limit / 3)),
        this.getRelatedSearches(query, Math.ceil(limit / 3)),
        userId
          ? this.getUserSearchHistory(userId, Math.ceil(limit / 4))
          : Promise.resolve([]),
      ]);

      return {
        autoComplete,
        popular,
        related,
        history: userId ? history : undefined,
      };
    } catch (error) {
      logger.error("獲取智能建議失敗:", error);
      return {
        autoComplete: [],
        popular: [],
        related: [],
      };
    }
  }

  /**
   * 清理過期的搜尋建議緩存
   */
  public async cleanupSuggestionCache(
    daysToKeep: number = 30,
  ): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const response = await elasticsearchService.getClient().deleteByQuery({
        index: indexingService.getSearchAnalyticsIndexName(),
        query: {
          range: {
            timestamp: {
              lt: cutoffDate.toISOString(),
            },
          },
        },
      });

      const deletedCount = response.deleted || 0;
      logger.info(`清理了 ${deletedCount} 條過期搜尋記錄`);

      return { deletedCount };
    } catch (error) {
      logger.error("清理搜尋建議緩存失敗:", error);
      return { deletedCount: 0 };
    }
  }
}

// 導出單例實例
export const searchSuggestionsService = new SearchSuggestionsService();
