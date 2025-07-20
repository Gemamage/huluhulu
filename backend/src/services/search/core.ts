import { elasticsearchService, SearchResponse } from '../elasticsearchService';
import { logger } from '../../utils/logger';
import { indexingService } from './indexing';

// 寵物搜尋查詢介面
export interface PetSearchQuery {
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
  fuzzy?: boolean;
  radius?: number;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

/**
 * 搜尋核心服務
 * 負責處理寵物搜尋的主要邏輯，包括查詢建構、篩選條件、排序等
 */
export class SearchCoreService {
  /**
   * 搜尋寵物
   */
  public async searchPets(searchQuery: PetSearchQuery): Promise<SearchResponse> {
    try {
      const {
        query = '',
        type,
        status,
        breed,
        location,
        size,
        gender,
        color,
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        fuzzy = false,
        radius = 10,
        coordinates
      } = searchQuery;

      // 建立查詢條件
      const must: any[] = [];
      const filter: any[] = [];
      const should: any[] = [];

      // 文字搜尋
      if (query.trim()) {
        if (fuzzy) {
          // 模糊搜尋
          should.push(
            {
              multi_match: {
                query: query,
                fields: ['name^3', 'breed^2', 'description', 'lastSeenLocation^2'],
                fuzziness: 'AUTO',
                operator: 'or'
              }
            },
            {
              wildcard: {
                'name.keyword': `*${query}*`
              }
            },
            {
              wildcard: {
                'breed.keyword': `*${query}*`
              }
            }
          );
        } else {
          // 精確搜尋
          must.push({
            multi_match: {
              query: query,
              fields: ['name^3', 'breed^2', 'description', 'lastSeenLocation^2'],
              operator: 'and'
            }
          });
        }
      }

      // 篩選條件
      this.addFilters(filter, { type, status, breed, size, gender, color, location });

      // 地理位置搜尋
      if (coordinates && radius) {
        filter.push({
          geo_distance: {
            distance: `${radius}km`,
            location: coordinates
          }
        });
      }

      // 排序
      const sort = this.buildSortCriteria(sortBy, sortOrder);

      // 建立查詢體
      const searchBody = this.buildSearchBody({
        must,
        filter,
        should,
        sort,
        page,
        limit
      });

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getPetIndexName(),
        body: searchBody
      });

      const hits = response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlights: hit.highlight
      }));

      return {
        hits,
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
        took: response.body.took
      };
    } catch (error) {
      logger.error('搜尋寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 添加篩選條件
   */
  private addFilters(filter: any[], filters: {
    type?: string;
    status?: string;
    breed?: string;
    size?: string;
    gender?: string;
    color?: string;
    location?: string;
  }): void {
    const { type, status, breed, size, gender, color, location } = filters;

    if (type) filter.push({ term: { type } });
    if (status) filter.push({ term: { status } });
    if (breed) filter.push({ term: { 'breed.keyword': breed } });
    if (size) filter.push({ term: { size } });
    if (gender) filter.push({ term: { gender } });
    if (color) filter.push({ match: { color } });
    if (location) {
      filter.push({
        match: {
          lastSeenLocation: location
        }
      });
    }
  }

  /**
   * 建立排序條件
   */
  private buildSortCriteria(sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
    const sort: any[] = [];
    
    if (sortBy === 'relevance') {
      sort.push({ _score: { order: sortOrder } });
    } else if (sortBy === 'createdAt') {
      sort.push({ isUrgent: { order: 'desc' } });
      sort.push({ createdAt: { order: sortOrder } });
    } else {
      sort.push({ [sortBy]: { order: sortOrder } });
    }
    
    return sort;
  }

  /**
   * 建立搜尋查詢體
   */
  private buildSearchBody(params: {
    must: any[];
    filter: any[];
    should: any[];
    sort: any[];
    page: number;
    limit: number;
  }): any {
    const { must, filter, should, sort, page, limit } = params;

    return {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
          should: should.length > 0 ? should : undefined,
          minimum_should_match: should.length > 0 ? 1 : undefined
        }
      },
      sort,
      from: (page - 1) * limit,
      size: limit,
      highlight: {
        fields: {
          name: {},
          description: {},
          breed: {},
          lastSeenLocation: {}
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      }
    };
  }

  /**
   * 高級搜尋 - 支援更複雜的查詢條件
   */
  public async advancedSearch(params: {
    textQuery?: string;
    filters?: Record<string, any>;
    dateRange?: {
      field: string;
      from?: Date;
      to?: Date;
    };
    geoSearch?: {
      coordinates: { lat: number; lon: number };
      radius: number;
    };
    aggregations?: Record<string, any>;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SearchResponse & { aggregations?: any }> {
    try {
      const {
        textQuery,
        filters = {},
        dateRange,
        geoSearch,
        aggregations,
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const must: any[] = [];
      const filter: any[] = [];

      // 文字查詢
      if (textQuery) {
        must.push({
          multi_match: {
            query: textQuery,
            fields: ['name^3', 'breed^2', 'description', 'lastSeenLocation^2'],
            operator: 'and'
          }
        });
      }

      // 篩選條件
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            filter.push({ terms: { [key]: value } });
          } else {
            filter.push({ term: { [key]: value } });
          }
        }
      });

      // 日期範圍
      if (dateRange) {
        const rangeQuery: any = {};
        if (dateRange.from) rangeQuery.gte = dateRange.from.toISOString();
        if (dateRange.to) rangeQuery.lte = dateRange.to.toISOString();
        
        filter.push({
          range: {
            [dateRange.field]: rangeQuery
          }
        });
      }

      // 地理搜尋
      if (geoSearch) {
        filter.push({
          geo_distance: {
            distance: `${geoSearch.radius}km`,
            location: geoSearch.coordinates
          }
        });
      }

      // 排序
      const sort = this.buildSortCriteria(sortBy, sortOrder);

      // 建立查詢體
      const searchBody: any = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort,
        from: (page - 1) * limit,
        size: limit,
        highlight: {
          fields: {
            name: {},
            description: {},
            breed: {},
            lastSeenLocation: {}
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      };

      // 添加聚合查詢
      if (aggregations) {
        searchBody.aggs = aggregations;
      }

      const response = await elasticsearchService.getClient().search({
        index: indexingService.getPetIndexName(),
        body: searchBody
      });

      const hits = response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlights: hit.highlight
      }));

      const result: SearchResponse & { aggregations?: any } = {
        hits,
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
        took: response.body.took
      };

      if (response.body.aggregations) {
        result.aggregations = response.body.aggregations;
      }

      return result;
    } catch (error) {
      logger.error('高級搜尋失敗:', error);
      throw error;
    }
  }

  /**
   * 相似寵物搜尋
   */
  public async findSimilarPets(petId: string, limit: number = 5): Promise<SearchResponse> {
    try {
      const response = await elasticsearchService.getClient().search({
        index: indexingService.getPetIndexName(),
        body: {
          query: {
            more_like_this: {
              fields: ['name', 'breed', 'description', 'type', 'color'],
              like: [
                {
                  _index: indexingService.getPetIndexName(),
                  _id: petId
                }
              ],
              min_term_freq: 1,
              max_query_terms: 12
            }
          },
          size: limit
        }
      });

      const hits = response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlights: hit.highlight
      }));

      return {
        hits,
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
        took: response.body.took
      };
    } catch (error) {
      logger.error('相似寵物搜尋失敗:', error);
      throw error;
    }
  }
}

// 導出單例實例
export const searchCoreService = new SearchCoreService();