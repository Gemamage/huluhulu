/**
 * Mock Elasticsearch Service
 * 用於在沒有 Elasticsearch 環境時提供模擬搜尋功能
 */

import { Pet } from '../models/Pet';
import { SearchResult, SearchResponse } from './elasticsearchService';

export interface MockSearchQuery {
  query?: string;
  type?: string;
  status?: string;
  breed?: string;
  location?: string;
  size?: string;
  gender?: string;
  color?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MockSearchSuggestion {
  text: string;
  score: number;
  type: 'breed' | 'location' | 'description' | 'name';
}

export interface MockSearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{
    query: string;
    count: number;
  }>;
  popularFilters: {
    types: Array<{ key: string; count: number }>;
    locations: Array<{ key: string; count: number }>;
    breeds: Array<{ key: string; count: number }>;
  };
  searchTrends: Array<{
    date: string;
    count: number;
  }>;
  averageResponseTime: number;
  successRate: number;
}

class MockElasticsearchService {
  private searchHistory: Array<{ query: string; timestamp: Date; filters: any }> = [];

  /**
   * 模擬 Elasticsearch 連接檢查
   */
  async checkConnection(): Promise<boolean> {
    // 模擬連接延遲
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  /**
   * 模擬健康檢查
   */
  async getHealth(): Promise<any> {
    return {
      status: 'green',
      cluster_name: 'mock-cluster',
      number_of_nodes: 1,
      number_of_data_nodes: 1,
      active_primary_shards: 5,
      active_shards: 5,
      relocating_shards: 0,
      initializing_shards: 0,
      unassigned_shards: 0,
      delayed_unassigned_shards: 0,
      number_of_pending_tasks: 0,
      number_of_in_flight_fetch: 0,
      task_max_waiting_in_queue_millis: 0,
      active_shards_percent_as_number: 100.0
    };
  }

  /**
   * 模擬寵物搜尋
   */
  async searchPets(searchQuery: MockSearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // 記錄搜尋歷史
    this.searchHistory.push({
      query: searchQuery.query || '',
      timestamp: new Date(),
      filters: searchQuery
    });

    try {
      // 建構 MongoDB 查詢
      const mongoQuery: any = {};
      
      // 文字搜尋
      if (searchQuery.query) {
        mongoQuery.$or = [
          { name: { $regex: searchQuery.query, $options: 'i' } },
          { description: { $regex: searchQuery.query, $options: 'i' } },
          { lastSeenLocation: { $regex: searchQuery.query, $options: 'i' } },
          { breed: { $regex: searchQuery.query, $options: 'i' } }
        ];
      }

      // 篩選條件
      if (searchQuery.type) mongoQuery.type = searchQuery.type;
      if (searchQuery.status) mongoQuery.status = searchQuery.status;
      if (searchQuery.breed) mongoQuery.breed = searchQuery.breed;
      if (searchQuery.size) mongoQuery.size = searchQuery.size;
      if (searchQuery.gender) mongoQuery.gender = searchQuery.gender;
      if (searchQuery.color) mongoQuery.color = searchQuery.color;
      if (searchQuery.location) {
        mongoQuery.lastSeenLocation = { $regex: searchQuery.location, $options: 'i' };
      }

      // 分頁設定
      const page = searchQuery.page || 1;
      const limit = searchQuery.limit || 12;
      const skip = (page - 1) * limit;

      // 排序設定
      const sortBy = searchQuery.sortBy || 'createdAt';
      const sortOrder = searchQuery.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // 執行查詢
      const [pets, total] = await Promise.all([
        Pet.find(mongoQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username email')
          .lean(),
        Pet.countDocuments(mongoQuery)
      ]);

      const took = Date.now() - startTime;

      // 轉換為 Elasticsearch 格式
      const hits: SearchResult[] = pets.map((pet, index) => ({
        id: pet._id.toString(),
        score: 1.0 - (index * 0.1), // 模擬相關性分數
        source: pet,
        highlights: this.generateHighlights(pet, searchQuery.query)
      }));

      return {
        hits,
        total,
        maxScore: hits.length > 0 ? hits[0].score : 0,
        took
      };

    } catch (error) {
      console.error('Mock search error:', error);
      throw error;
    }
  }

  /**
   * 模擬搜尋建議
   */
  async getSearchSuggestions(query: string): Promise<MockSearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions: MockSearchSuggestion[] = [];

    try {
      // 品種建議
      const breeds = await Pet.distinct('breed', {
        breed: { $regex: query, $options: 'i' }
      });
      breeds.slice(0, 3).forEach(breed => {
        suggestions.push({
          text: breed,
          score: 0.9,
          type: 'breed'
        });
      });

      // 地點建議
      const locations = await Pet.distinct('lastSeenLocation', {
        lastSeenLocation: { $regex: query, $options: 'i' }
      });
      locations.slice(0, 3).forEach(location => {
        suggestions.push({
          text: location,
          score: 0.8,
          type: 'location'
        });
      });

      // 名稱建議
      const names = await Pet.find(
        { name: { $regex: query, $options: 'i' } },
        { name: 1 }
      ).limit(3);
      names.forEach(pet => {
        suggestions.push({
          text: pet.name,
          score: 0.7,
          type: 'name'
        });
      });

    } catch (error) {
      console.error('Mock suggestions error:', error);
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * 模擬搜尋分析
   */
  async getSearchAnalytics(timeRange: string = '7d'): Promise<MockSearchAnalytics> {
    const days = parseInt(timeRange.replace('d', '')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentSearches = this.searchHistory.filter(
      search => search.timestamp >= startDate
    );

    // 熱門查詢
    const queryCount: { [key: string]: number } = {};
    recentSearches.forEach(search => {
      if (search.query) {
        queryCount[search.query] = (queryCount[search.query] || 0) + 1;
      }
    });

    const popularQueries = Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 熱門篩選
    const typeCount: { [key: string]: number } = {};
    const locationCount: { [key: string]: number } = {};
    const breedCount: { [key: string]: number } = {};

    recentSearches.forEach(search => {
      if (search.filters.type) {
        typeCount[search.filters.type] = (typeCount[search.filters.type] || 0) + 1;
      }
      if (search.filters.location) {
        locationCount[search.filters.location] = (locationCount[search.filters.location] || 0) + 1;
      }
      if (search.filters.breed) {
        breedCount[search.filters.breed] = (breedCount[search.filters.breed] || 0) + 1;
      }
    });

    // 搜尋趨勢
    const searchTrends: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = recentSearches.filter(search => {
        const searchDate = search.timestamp.toISOString().split('T')[0];
        return searchDate === dateStr;
      }).length;
      
      searchTrends.push({ date: dateStr, count });
    }

    return {
      totalSearches: recentSearches.length,
      popularQueries,
      popularFilters: {
        types: Object.entries(typeCount).map(([key, count]) => ({ key, count })),
        locations: Object.entries(locationCount).map(([key, count]) => ({ key, count })),
        breeds: Object.entries(breedCount).map(([key, count]) => ({ key, count }))
      },
      searchTrends,
      averageResponseTime: 150, // 模擬平均回應時間
      successRate: 99.5 // 模擬成功率
    };
  }

  /**
   * 生成高亮顯示
   */
  private generateHighlights(pet: any, query?: string): any {
    if (!query) return {};

    const highlights: any = {};
    const regex = new RegExp(query, 'gi');

    if (pet.name && regex.test(pet.name)) {
      highlights.name = [pet.name.replace(regex, `<em>${query}</em>`)];
    }
    if (pet.description && regex.test(pet.description)) {
      const snippet = pet.description.substring(0, 200);
      highlights.description = [snippet.replace(regex, `<em>${query}</em>`)];
    }
    if (pet.lastSeenLocation && regex.test(pet.lastSeenLocation)) {
      highlights.lastSeenLocation = [pet.lastSeenLocation.replace(regex, `<em>${query}</em>`)];
    }

    return highlights;
  }

  /**
   * 模擬索引初始化
   */
  async initializeIndex(): Promise<boolean> {
    console.log('Mock Elasticsearch: 索引初始化完成');
    return true;
  }

  /**
   * 模擬文檔索引
   */
  async indexDocument(index: string, id: string, document: any): Promise<boolean> {
    console.log(`Mock Elasticsearch: 文檔已索引 - ${index}/${id}`);
    return true;
  }

  /**
   * 模擬批量索引
   */
  async bulkIndex(operations: any[]): Promise<any> {
    console.log(`Mock Elasticsearch: 批量索引 ${operations.length} 個文檔`);
    return {
      took: 100,
      errors: false,
      items: operations.map((_, index) => ({
        index: {
          _index: 'pets',
          _id: `mock_${index}`,
          _version: 1,
          result: 'created',
          status: 201
        }
      }))
    };
  }

  /**
   * 模擬重新索引
   */
  async reindexAllPets(): Promise<{ success: boolean; indexed: number; failed: number }> {
    try {
      const totalPets = await Pet.countDocuments();
      console.log(`Mock Elasticsearch: 重新索引 ${totalPets} 個寵物文檔`);
      
      return {
        success: true,
        indexed: totalPets,
        failed: 0
      };
    } catch (error) {
      console.error('Mock reindex error:', error);
      return {
        success: false,
        indexed: 0,
        failed: 1
      };
    }
  }

  /**
   * 模擬效能指標
   */
  getPerformanceMetrics(): any {
    return {
      totalRequests: this.searchHistory.length,
      averageResponseTime: 150,
      successRate: 99.5,
      errorRate: 0.5,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const mockElasticsearchService = new MockElasticsearchService();