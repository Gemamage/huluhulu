import { elasticsearchService, SearchResult, SearchResponse, AggregationResult } from './elasticsearchService';
import { logger } from '../utils/logger';
import { IPet } from '../models/Pet';

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

// 搜尋建議介面
export interface SearchSuggestion {
  text: string;
  score: number;
  type: 'breed' | 'location' | 'description';
}

// 搜尋分析結果介面
export interface SearchAnalytics {
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
}

class PetSearchService {
  private readonly PET_INDEX = 'pets';
  private readonly SEARCH_ANALYTICS_INDEX = 'search_analytics';

  /**
   * 初始化寵物搜尋索引
   */
  public async initializePetIndex(): Promise<boolean> {
    const mapping = {
      properties: {
        name: {
          type: 'text',
          analyzer: 'chinese_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            suggest: {
              type: 'completion',
              analyzer: 'simple'
            }
          }
        },
        type: { type: 'keyword' },
        breed: {
          type: 'text',
          analyzer: 'chinese_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            suggest: {
              type: 'completion',
              analyzer: 'simple'
            }
          }
        },
        gender: { type: 'keyword' },
        age: { type: 'integer' },
        color: {
          type: 'text',
          analyzer: 'chinese_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        size: { type: 'keyword' },
        status: { type: 'keyword' },
        description: {
          type: 'text',
          analyzer: 'chinese_analyzer'
        },
        lastSeenLocation: {
          type: 'text',
          analyzer: 'chinese_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            suggest: {
              type: 'completion',
              analyzer: 'simple'
            }
          }
        },
        location: {
          type: 'geo_point'
        },
        lastSeenDate: { type: 'date' },
        contactInfo: {
          properties: {
            name: {
              type: 'text',
              analyzer: 'chinese_analyzer'
            },
            phone: { type: 'keyword' },
            email: { type: 'keyword' }
          }
        },
        images: { type: 'keyword' },
        reward: { type: 'integer' },
        isUrgent: { type: 'boolean' },
        microchipId: { type: 'keyword' },
        vaccinations: { type: 'keyword' },
        medicalConditions: { type: 'keyword' },
        specialMarks: {
          type: 'text',
          analyzer: 'chinese_analyzer'
        },
        personality: { type: 'keyword' },
        viewCount: { type: 'integer' },
        shareCount: { type: 'integer' },
        userId: { type: 'keyword' },
        aiTags: { type: 'keyword' },
        aiBreedPrediction: { type: 'keyword' },
        aiConfidence: { type: 'float' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    };

    return await elasticsearchService.createIndex(this.PET_INDEX, mapping);
  }

  /**
   * 初始化搜尋分析索引
   */
  public async initializeSearchAnalyticsIndex(): Promise<boolean> {
    const mapping = {
      properties: {
        query: {
          type: 'text',
          analyzer: 'chinese_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        filters: {
          properties: {
            type: { type: 'keyword' },
            status: { type: 'keyword' },
            location: { type: 'keyword' },
            breed: { type: 'keyword' },
            size: { type: 'keyword' },
            gender: { type: 'keyword' }
          }
        },
        userId: { type: 'keyword' },
        resultCount: { type: 'integer' },
        timestamp: { type: 'date' },
        sessionId: { type: 'keyword' },
        userAgent: { type: 'text' },
        ipAddress: { type: 'ip' }
      }
    };

    return await elasticsearchService.createIndex(this.SEARCH_ANALYTICS_INDEX, mapping);
  }

  /**
   * 索引寵物文檔
   */
  public async indexPet(pet: IPet): Promise<boolean> {
    const document = {
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      gender: pet.gender,
      age: pet.age,
      color: pet.color,
      size: pet.size,
      status: pet.status,
      description: pet.description,
      lastSeenLocation: pet.lastSeenLocation,
      lastSeenDate: pet.lastSeenDate,
      contactInfo: pet.contactInfo,
      images: pet.images,
      reward: pet.reward,
      isUrgent: pet.isUrgent,
      microchipId: pet.microchipId,
      vaccinations: pet.vaccinations,
      medicalConditions: pet.medicalConditions,
      specialMarks: pet.specialMarks,
      personality: pet.personality,
      viewCount: pet.viewCount,
      shareCount: pet.shareCount,
      userId: pet.userId.toString(),
      aiTags: pet.aiTags,
      aiBreedPrediction: pet.aiBreedPrediction,
      aiConfidence: pet.aiConfidence,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt
    };

    return await elasticsearchService.indexDocument(
      this.PET_INDEX,
      pet._id.toString(),
      document
    );
  }

  /**
   * 批量索引寵物文檔
   */
  public async bulkIndexPets(pets: IPet[]): Promise<boolean> {
    const documents = pets.map(pet => ({
      id: pet._id.toString(),
      document: {
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        gender: pet.gender,
        age: pet.age,
        color: pet.color,
        size: pet.size,
        status: pet.status,
        description: pet.description,
        lastSeenLocation: pet.lastSeenLocation,
        lastSeenDate: pet.lastSeenDate,
        contactInfo: pet.contactInfo,
        images: pet.images,
        reward: pet.reward,
        isUrgent: pet.isUrgent,
        microchipId: pet.microchipId,
        vaccinations: pet.vaccinations,
        medicalConditions: pet.medicalConditions,
        specialMarks: pet.specialMarks,
        personality: pet.personality,
        viewCount: pet.viewCount,
        shareCount: pet.shareCount,
        userId: pet.userId.toString(),
        aiTags: pet.aiTags,
        aiBreedPrediction: pet.aiBreedPrediction,
        aiConfidence: pet.aiConfidence,
        createdAt: pet.createdAt,
        updatedAt: pet.updatedAt
      }
    }));

    return await elasticsearchService.bulkIndex(this.PET_INDEX, documents);
  }

  /**
   * 刪除寵物文檔
   */
  public async deletePet(petId: string): Promise<boolean> {
    return await elasticsearchService.deleteDocument(this.PET_INDEX, petId);
  }

  /**
   * 更新寵物文檔
   */
  public async updatePet(pet: IPet): Promise<boolean> {
    const document = {
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      gender: pet.gender,
      age: pet.age,
      color: pet.color,
      size: pet.size,
      status: pet.status,
      description: pet.description,
      lastSeenLocation: pet.lastSeenLocation,
      lastSeenDate: pet.lastSeenDate,
      contactInfo: pet.contactInfo,
      images: pet.images,
      reward: pet.reward,
      isUrgent: pet.isUrgent,
      microchipId: pet.microchipId,
      vaccinations: pet.vaccinations,
      medicalConditions: pet.medicalConditions,
      specialMarks: pet.specialMarks,
      personality: pet.personality,
      viewCount: pet.viewCount,
      shareCount: pet.shareCount,
      userId: pet.userId.toString(),
      aiTags: pet.aiTags,
      aiBreedPrediction: pet.aiBreedPrediction,
      aiConfidence: pet.aiConfidence,
      updatedAt: new Date()
    };

    return await elasticsearchService.updateDocument(
      this.PET_INDEX,
      pet._id.toString(),
      document
    );
  }

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
      const sort: any[] = [];
      if (sortBy === 'relevance') {
        sort.push({ _score: { order: sortOrder } });
      } else if (sortBy === 'createdAt') {
        sort.push({ isUrgent: { order: 'desc' } });
        sort.push({ createdAt: { order: sortOrder } });
      } else {
        sort.push({ [sortBy]: { order: sortOrder } });
      }

      // 建立查詢體
      const searchBody: any = {
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

      const response = await elasticsearchService.getClient().search({
        index: this.PET_INDEX,
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
   * 獲取搜尋建議
   */
  public async getSearchSuggestions(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      const response = await elasticsearchService.getClient().search({
        index: this.PET_INDEX,
        body: {
          suggest: {
            name_suggest: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: limit
              }
            },
            breed_suggest: {
              prefix: query,
              completion: {
                field: 'breed.suggest',
                size: limit
              }
            },
            location_suggest: {
              prefix: query,
              completion: {
                field: 'lastSeenLocation.suggest',
                size: limit
              }
            }
          }
        }
      });

      const suggestions: SearchSuggestion[] = [];
      const suggest = response.body.suggest;

      // 處理名稱建議
      suggest.name_suggest[0].options.forEach((option: any) => {
        suggestions.push({
          text: option.text,
          score: option._score,
          type: 'breed'
        });
      });

      // 處理品種建議
      suggest.breed_suggest[0].options.forEach((option: any) => {
        suggestions.push({
          text: option.text,
          score: option._score,
          type: 'breed'
        });
      });

      // 處理地點建議
      suggest.location_suggest[0].options.forEach((option: any) => {
        suggestions.push({
          text: option.text,
          score: option._score,
          type: 'location'
        });
      });

      // 去重並排序
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text === suggestion.text)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return uniqueSuggestions;
    } catch (error) {
      logger.error('獲取搜尋建議失敗:', error);
      return [];
    }
  }

  /**
   * 記錄搜尋分析
   */
  public async recordSearchAnalytics(
    query: string,
    filters: any,
    userId?: string,
    resultCount: number = 0,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      const document = {
        query,
        filters,
        userId,
        resultCount,
        timestamp: new Date(),
        sessionId,
        userAgent,
        ipAddress
      };

      return await elasticsearchService.indexDocument(
        this.SEARCH_ANALYTICS_INDEX,
        `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        document
      );
    } catch (error) {
      logger.error('記錄搜尋分析失敗:', error);
      return false;
    }
  }

  /**
   * 獲取搜尋分析數據
   */
  public async getSearchAnalytics(days: number = 30): Promise<SearchAnalytics> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await elasticsearchService.getClient().search({
        index: this.SEARCH_ANALYTICS_INDEX,
        body: {
          query: {
            range: {
              timestamp: {
                gte: fromDate.toISOString()
              }
            }
          },
          aggs: {
            total_searches: {
              value_count: {
                field: 'query.keyword'
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
                field: 'filters.location',
                size: 10
              }
            },
            popular_breeds: {
              terms: {
                field: 'filters.breed',
                size: 10
              }
            },
            search_trends: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: 'day'
              }
            }
          },
          size: 0
        }
      });

      const aggs = response.body.aggregations;

      return {
        totalSearches: aggs.total_searches.value,
        popularQueries: aggs.popular_queries.buckets.map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count
        })),
        popularFilters: {
          types: aggs.popular_types.buckets.map((bucket: any) => ({
            key: bucket.key,
            count: bucket.doc_count
          })),
          locations: aggs.popular_locations.buckets.map((bucket: any) => ({
            key: bucket.key,
            count: bucket.doc_count
          })),
          breeds: aggs.popular_breeds.buckets.map((bucket: any) => ({
            key: bucket.key,
            count: bucket.doc_count
          }))
        },
        searchTrends: aggs.search_trends.buckets.map((bucket: any) => ({
          date: bucket.key_as_string,
          count: bucket.doc_count
        }))
      };
    } catch (error) {
      logger.error('獲取搜尋分析失敗:', error);
      throw error;
    }
  }
}

// 導出單例實例
export const petSearchService = new PetSearchService();
export default petSearchService;