import { elasticsearchService } from '../elasticsearchService';
import { logger } from '../../utils/logger';
import { indexingService } from './indexing';

// 搜尋分析介面
export interface SearchAnalytics {
  query: string;
  filters: any;
  userId?: string;
  resultCount: number;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  clickedResults?: string[];
  searchDuration?: number;
  location?: {
    lat: number;
    lon: number;
  };
}

// 搜尋統計介面
export interface SearchStats {
  totalSearches: number;
  uniqueUsers: number;
  averageResultCount: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularTypes: Array<{ type: string; count: number }>;
  popularLocations: Array<{ location: string; count: number }>;
  popularBreeds: Array<{ breed: string; count: number }>;
  searchTrends: Array<{ date: string; count: number }>;
  averageSearchDuration?: number;
  clickThroughRate?: number;
}

// 搜尋趨勢介面
export interface SearchTrend {
  date: string;
  count: number;
  uniqueUsers: number;
  averageResults: number;
  topQueries: string[];
}

/**
 * 搜尋分析服務
 * 負責處理搜尋統計、分析和報告功能
 */
export class SearchAnalyticsService {
  /**
   * 記錄搜尋分析數據
   */
  public async recordSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
    try {
      await elasticsearchService.getClient().index({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: {
          ...analytics,
          timestamp: analytics.timestamp || new Date()
        }
      });

      logger.debug('搜尋分析數據已記錄', { query: analytics.query, userId: analytics.userId });
    } catch (error) {
      logger.error('記錄搜尋分析數據失敗:', error);
    }
  }

  /**
   * 批量記錄搜尋分析數據
   */
  public async recordBulkSearchAnalytics(analyticsArray: SearchAnalytics[]): Promise<void> {
    try {
      const body = analyticsArray.flatMap(analytics => [
        { index: { _index: indexingService.getSearchAnalyticsIndexName() } },
        {
          ...analytics,
          timestamp: analytics.timestamp || new Date()
        }
      ]);

      await elasticsearchService.getClient().bulk({ body });
      logger.debug(`批量記錄了 ${analyticsArray.length} 條搜尋分析數據`);
    } catch (error) {
      logger.error('批量記錄搜尋分析數據失敗:', error);
    }
  }

  /**
   * 獲取搜尋統計數據
   */
  public async getSearchStats(startDate?: Date, endDate?: Date): Promise<SearchStats> {
    try {
      const query: any = {
        size: 0,
        aggs: {
          total_searches: {
            value_count: {
              field: 'query.keyword'
            }
          },
          unique_users: {
            cardinality: {
              field: 'userId'
            }
          },
          average_result_count: {
            avg: {
              field: 'resultCount'
            }
          },
          popular_queries: {
            terms: {
              field: 'query.keyword',
              size: 10
            }
          },
          popular_types: {
            terms: {
              field: 'filters.type',
              size: 10
            }
          },
          popular_locations: {
            terms: {
              field: 'filters.location.keyword',
              size: 10
            }
          },
          popular_breeds: {
            terms: {
              field: 'filters.breed.keyword',
              size: 10
            }
          },
          search_trends: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'day',
              format: 'yyyy-MM-dd'
            }
          }
        }
      };

      // 添加日期範圍篩選
      if (startDate || endDate) {
        const dateRange: any = {};
        if (startDate) dateRange.gte = startDate.toISOString();
        if (endDate) dateRange.lte = endDate.toISOString();

        query.query = {
          range: {
            timestamp: dateRange
          }
        };
      }

      // 添加搜尋持續時間和點擊率統計
      if (this.supportsAdvancedMetrics()) {
        query.aggs.average_search_duration = {
          avg: {
            field: 'searchDuration'
          }
        };
        query.aggs.click_through_rate = {
          bucket_script: {
            buckets_path: {
              clicks: 'total_clicks',
              searches: 'total_searches'
            },
            script: 'params.clicks / params.searches'
          }
        };
        query.aggs.total_clicks = {
          sum: {
            script: {
              source: "doc['clickedResults'].size()"
            }
          }
        };
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: query
      });

      const aggs = response.body.aggregations;

      return {
        totalSearches: aggs.total_searches.value || 0,
        uniqueUsers: aggs.unique_users.value || 0,
        averageResultCount: Math.round(aggs.average_result_count.value || 0),
        popularQueries: aggs.popular_queries.buckets.map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count
        })),
        popularTypes: aggs.popular_types.buckets.map((bucket: any) => ({
          type: bucket.key,
          count: bucket.doc_count
        })),
        popularLocations: aggs.popular_locations.buckets.map((bucket: any) => ({
          location: bucket.key,
          count: bucket.doc_count
        })),
        popularBreeds: aggs.popular_breeds.buckets.map((bucket: any) => ({
          breed: bucket.key,
          count: bucket.doc_count
        })),
        searchTrends: aggs.search_trends.buckets.map((bucket: any) => ({
          date: bucket.key_as_string,
          count: bucket.doc_count
        })),
        averageSearchDuration: aggs.average_search_duration?.value,
        clickThroughRate: aggs.click_through_rate?.value
      };
    } catch (error) {
      logger.error('獲取搜尋統計數據失敗:', error);
      return {
        totalSearches: 0,
        uniqueUsers: 0,
        averageResultCount: 0,
        popularQueries: [],
        popularTypes: [],
        popularLocations: [],
        popularBreeds: [],
        searchTrends: []
      };
    }
  }

  /**
   * 獲取用戶搜尋統計
   */
  public async getUserSearchStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResultCount: number;
    topQueries: Array<{ query: string; count: number }>;
    searchHistory: Array<{ query: string; timestamp: Date; resultCount: number }>;
  }> {
    try {
      const query: any = {
        query: {
          bool: {
            must: [
              { term: { userId } }
            ]
          }
        },
        size: 100,
        sort: [{ timestamp: { order: 'desc' } }],
        aggs: {
          total_searches: {
            value_count: {
              field: 'query.keyword'
            }
          },
          unique_queries: {
            cardinality: {
              field: 'query.keyword'
            }
          },
          average_result_count: {
            avg: {
              field: 'resultCount'
            }
          },
          top_queries: {
            terms: {
              field: 'query.keyword',
              size: 10
            }
          }
        }
      };

      // 添加日期範圍篩選
      if (startDate || endDate) {
        const dateRange: any = {};
        if (startDate) dateRange.gte = startDate.toISOString();
        if (endDate) dateRange.lte = endDate.toISOString();

        query.query.bool.must.push({
          range: {
            timestamp: dateRange
          }
        });
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: query
      });

      const aggs = response.body.aggregations;
      const hits = response.body.hits.hits;

      return {
        totalSearches: aggs.total_searches.value || 0,
        uniqueQueries: aggs.unique_queries.value || 0,
        averageResultCount: Math.round(aggs.average_result_count.value || 0),
        topQueries: aggs.top_queries.buckets.map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count
        })),
        searchHistory: hits.map((hit: any) => ({
          query: hit._source.query,
          timestamp: new Date(hit._source.timestamp),
          resultCount: hit._source.resultCount
        }))
      };
    } catch (error) {
      logger.error('獲取用戶搜尋統計失敗:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResultCount: 0,
        topQueries: [],
        searchHistory: []
      };
    }
  }

  /**
   * 獲取搜尋趨勢數據
   */
  public async getSearchTrends(period: 'daily' | 'weekly' | 'monthly', startDate?: Date, endDate?: Date): Promise<SearchTrend[]> {
    try {
      let interval: string;
      switch (period) {
        case 'daily':
          interval = 'day';
          break;
        case 'weekly':
          interval = 'week';
          break;
        case 'monthly':
          interval = 'month';
          break;
        default:
          interval = 'day';
      }

      const query: any = {
        size: 0,
        aggs: {
          trends: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: interval,
              format: 'yyyy-MM-dd'
            },
            aggs: {
              unique_users: {
                cardinality: {
                  field: 'userId'
                }
              },
              average_results: {
                avg: {
                  field: 'resultCount'
                }
              },
              top_queries: {
                terms: {
                  field: 'query.keyword',
                  size: 5
                }
              }
            }
          }
        }
      };

      // 添加日期範圍篩選
      if (startDate || endDate) {
        const dateRange: any = {};
        if (startDate) dateRange.gte = startDate.toISOString();
        if (endDate) dateRange.lte = endDate.toISOString();

        query.query = {
          range: {
            timestamp: dateRange
          }
        };
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: query
      });

      const trends: SearchTrend[] = [];
      const aggs = response.body.aggregations;

      if (aggs && aggs.trends) {
        aggs.trends.buckets.forEach((bucket: any) => {
          trends.push({
            date: bucket.key_as_string,
            count: bucket.doc_count,
            uniqueUsers: bucket.unique_users.value,
            averageResults: Math.round(bucket.average_results.value || 0),
            topQueries: bucket.top_queries.buckets.map((q: any) => q.key)
          });
        });
      }

      return trends;
    } catch (error) {
      logger.error('獲取搜尋趨勢數據失敗:', error);
      return [];
    }
  }

  /**
   * 記錄搜尋結果點擊
   */
  public async recordSearchClick(searchId: string, petId: string, position: number): Promise<void> {
    try {
      await elasticsearchService.getClient().update({
        index: indexingService.getSearchAnalyticsIndexName(),
        id: searchId,
        body: {
          script: {
            source: `
              if (ctx._source.clickedResults == null) {
                ctx._source.clickedResults = [];
              }
              ctx._source.clickedResults.add(params.click);
            `,
            params: {
              click: {
                petId,
                position,
                timestamp: new Date().toISOString()
              }
            }
          }
        }
      });

      logger.debug('搜尋點擊已記錄', { searchId, petId, position });
    } catch (error) {
      logger.error('記錄搜尋點擊失敗:', error);
    }
  }

  /**
   * 獲取搜尋效果分析
   */
  public async getSearchEffectiveness(): Promise<{
    clickThroughRate: number;
    averageClickPosition: number;
    zeroResultQueries: Array<{ query: string; count: number }>;
    highPerformingQueries: Array<{ query: string; ctr: number; avgPosition: number }>;
  }> {
    try {
      const response = await elasticsearchService.getClient().search({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: {
          size: 0,
          aggs: {
            total_searches: {
              value_count: {
                field: 'query.keyword'
              }
            },
            searches_with_clicks: {
              filter: {
                exists: {
                  field: 'clickedResults'
                }
              }
            },
            zero_result_queries: {
              filter: {
                term: {
                  resultCount: 0
                }
              },
              aggs: {
                queries: {
                  terms: {
                    field: 'query.keyword',
                    size: 10
                  }
                }
              }
            },
            query_performance: {
              terms: {
                field: 'query.keyword',
                size: 100
              },
              aggs: {
                total_searches: {
                  value_count: {
                    field: 'query.keyword'
                  }
                },
                searches_with_clicks: {
                  filter: {
                    exists: {
                      field: 'clickedResults'
                    }
                  }
                },
                average_click_position: {
                  avg: {
                    script: {
                      source: `
                        if (doc['clickedResults'].size() > 0) {
                          return doc['clickedResults'][0].position;
                        }
                        return null;
                      `
                    }
                  }
                }
              }
            }
          }
        }
      });

      const aggs = response.body.aggregations;
      const totalSearches = aggs.total_searches.value;
      const searchesWithClicks = aggs.searches_with_clicks.doc_count;
      const clickThroughRate = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;

      // 計算平均點擊位置
      let totalClickPositions = 0;
      let totalClicks = 0;
      aggs.query_performance.buckets.forEach((bucket: any) => {
        if (bucket.average_click_position.value) {
          totalClickPositions += bucket.average_click_position.value * bucket.searches_with_clicks.doc_count;
          totalClicks += bucket.searches_with_clicks.doc_count;
        }
      });
      const averageClickPosition = totalClicks > 0 ? totalClickPositions / totalClicks : 0;

      // 零結果查詢
      const zeroResultQueries = aggs.zero_result_queries.queries.buckets.map((bucket: any) => ({
        query: bucket.key,
        count: bucket.doc_count
      }));

      // 高效查詢
      const highPerformingQueries = aggs.query_performance.buckets
        .map((bucket: any) => {
          const ctr = bucket.total_searches.value > 0 ? 
            (bucket.searches_with_clicks.doc_count / bucket.total_searches.value) * 100 : 0;
          return {
            query: bucket.key,
            ctr,
            avgPosition: bucket.average_click_position.value || 0
          };
        })
        .filter((item: any) => item.ctr > 10) // 點擊率大於10%
        .sort((a: any, b: any) => b.ctr - a.ctr)
        .slice(0, 10);

      return {
        clickThroughRate,
        averageClickPosition,
        zeroResultQueries,
        highPerformingQueries
      };
    } catch (error) {
      logger.error('獲取搜尋效果分析失敗:', error);
      return {
        clickThroughRate: 0,
        averageClickPosition: 0,
        zeroResultQueries: [],
        highPerformingQueries: []
      };
    }
  }

  /**
   * 清理過期的分析數據
   */
  public async cleanupAnalyticsData(daysToKeep: number = 90): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const response = await elasticsearchService.getClient().deleteByQuery({
        index: indexingService.getSearchAnalyticsIndexName(),
        body: {
          query: {
            range: {
              timestamp: {
                lt: cutoffDate.toISOString()
              }
            }
          }
        }
      });

      const deletedCount = response.body.deleted || 0;
      logger.info(`清理了 ${deletedCount} 條過期分析數據`);
      
      return { deletedCount };
    } catch (error) {
      logger.error('清理分析數據失敗:', error);
      return { deletedCount: 0 };
    }
  }

  /**
   * 檢查是否支持高級指標
   */
  private supportsAdvancedMetrics(): boolean {
    // 這裡可以根據 Elasticsearch 版本或配置來決定是否支持高級指標
    return true;
  }
}

// 導出單例實例
export const searchAnalyticsService = new SearchAnalyticsService();