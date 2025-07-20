// 搜尋服務 - 專門處理 Elasticsearch 相關功能
// 從 petService 中分離出來以提升程式碼組織性

import { Pet, PetSearchResult } from '@/types';
import {
  SearchFilters,
  AdvancedSearchResponse,
  SearchAnalytics,
  ElasticsearchHealth,
} from '@/types/search';
import { errorHandler, ApiError, ApiErrorCode } from './errorHandler';
import { authService } from './authService';

// 搜尋服務介面定義
interface SearchServiceMethods {
  // 基本搜尋功能
  searchPets(
    query: string,
    filters?: Omit<SearchFilters, 'q'>
  ): Promise<PetSearchResult>;
  advancedSearch(
    query: string,
    filters?: SearchFilters
  ): Promise<AdvancedSearchResponse<Pet>>;
  getSearchSuggestions(query: string): Promise<string[]>;

  // 搜尋分析與健康檢查
  getSearchAnalytics(timeRange?: string): Promise<SearchAnalytics>;
  checkSearchHealth(): Promise<{
    data: { elasticsearch: ElasticsearchHealth };
  }>;
}

class SearchService implements SearchServiceMethods {
  private baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  private async makeRequest<T = any>(
    url: string,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    const requestContext = context || `${options.method || 'GET'} ${url}`;

    try {
      const token = authService.getToken();
      const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 安全地合併headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 設置請求超時
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時

      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 嘗試解析錯誤回應
        let errorDetails;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorDetails = await response.json();
          }
        } catch {
          // 忽略解析錯誤
        }

        const apiError = errorHandler.createErrorFromResponse(
          response,
          errorDetails
        );
        const handlingResult = errorHandler.handleError(
          apiError,
          requestContext
        );

        // 處理認證錯誤
        if (apiError.isAuthError()) {
          authService.removeToken();
          if (typeof window !== 'undefined' && handlingResult.shouldRedirect) {
            window.location.href = handlingResult.shouldRedirect;
          }
        }

        // 如果需要重試，則重試
        if (handlingResult.shouldRetry && handlingResult.retryDelay) {
          await new Promise(resolve =>
            setTimeout(resolve, handlingResult.retryDelay)
          );
          return this.makeRequest(url, options, context);
        }

        throw apiError;
      }

      // 重置重試計數（成功時）
      errorHandler.resetRetryCount(requestContext);

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return response as unknown as T;
    } catch (error) {
      // 處理網路錯誤
      if (error instanceof ApiError) {
        throw error; // 重新拋出已處理的 ApiError
      }

      const networkError = errorHandler.createErrorFromNetworkError(
        error as Error
      );
      const handlingResult = errorHandler.handleError(
        networkError,
        requestContext
      );

      // 如果需要重試，則重試
      if (handlingResult.shouldRetry && handlingResult.retryDelay) {
        await new Promise(resolve =>
          setTimeout(resolve, handlingResult.retryDelay)
        );
        return this.makeRequest(url, options, context);
      }

      throw networkError;
    }
  }

  // 基本搜尋功能
  async searchPets(
    query: string,
    filters: Omit<SearchFilters, 'q'> = {}
  ): Promise<PetSearchResult> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      return this.makeRequest<PetSearchResult>(
        `/pets/search?${params.toString()}`,
        {},
        'searchPets'
      );
    } catch (error) {
      throw new ApiError(ApiErrorCode.SERVER_ERROR, '搜尋寵物失敗', {
        query,
        filters,
        originalError: error,
      });
    }
  }

  // Elasticsearch 進階搜尋
  async advancedSearch(
    query: string,
    filters: SearchFilters = {}
  ): Promise<AdvancedSearchResponse<Pet>> {
    try {
      const searchData = {
        q: query,
        ...filters,
      };

      return this.makeRequest(
        '/advanced-search/pets',
        {
          method: 'POST',
          body: JSON.stringify(searchData),
        },
        'advancedSearch'
      );
    } catch (error) {
      throw new ApiError(ApiErrorCode.SERVER_ERROR, '進階搜尋失敗', {
        query,
        filters,
        originalError: error,
      });
    }
  }

  // 獲取搜尋建議
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      const response = await this.makeRequest(
        `/advanced-search/suggestions?${params.toString()}`,
        {},
        'getSearchSuggestions'
      );
      return response.suggestions || [];
    } catch (error) {
      throw new ApiError(ApiErrorCode.SERVER_ERROR, '獲取搜尋建議失敗', {
        query,
        originalError: error,
      });
    }
  }

  // 獲取搜尋分析數據
  async getSearchAnalytics(timeRange: string = '7d'): Promise<SearchAnalytics> {
    try {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);

      const response = await this.makeRequest(
        `/advanced-search/analytics?${params.toString()}`,
        {},
        'getSearchAnalytics'
      );
      return response.data || response;
    } catch (error) {
      throw new ApiError(ApiErrorCode.SERVER_ERROR, '獲取搜尋分析失敗', {
        timeRange,
        originalError: error,
      });
    }
  }

  // 檢查 Elasticsearch 服務健康狀態
  async checkSearchHealth(): Promise<{
    data: { elasticsearch: ElasticsearchHealth };
  }> {
    try {
      return this.makeRequest<{
        data: { elasticsearch: ElasticsearchHealth };
      }>(
        '/advanced-search/health',
        {},
        'checkSearchHealth'
      );
    } catch (error) {
      throw new ApiError(
        ApiErrorCode.SERVICE_UNAVAILABLE,
        '檢查搜尋服務健康狀態失敗',
        { originalError: error }
      );
    }
  }
}

export const searchService = new SearchService();
export type { SearchServiceMethods };
