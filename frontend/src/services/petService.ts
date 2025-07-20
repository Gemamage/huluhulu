// 寵物服務
// 這個文件提供前端測試所需的寵物服務

import {
  Pet,
  CreatePetData,
  UpdatePetData,
  PetSearchResult,
  SearchFilters,
  AdvancedSearchResponse,
  SearchAnalytics,
  ElasticsearchHealth,
} from '@/types';
import { errorHandler, ApiError, ApiErrorCode } from './errorHandler';
import { authService } from './authService';
import { searchService } from './searchService';
import { imageService } from './imageService';

// PetService 介面定義 - 提升類型安全性
// 專注於核心寵物 CRUD 操作和用戶相關功能
interface PetServiceMethods {
  // 基本 CRUD 操作
  getPets(filters?: SearchFilters): Promise<PetSearchResult>;
  getAllPets(filters?: SearchFilters): Promise<PetSearchResult>;
  getPetById(id: string): Promise<Pet>;
  createPet(data: CreatePetData): Promise<Pet>;
  updatePet(id: string, data: UpdatePetData): Promise<Pet>;
  deletePet(id: string): Promise<void>;

  // 用戶相關
  getMyPets(): Promise<PetSearchResult>;
  favoritePet(petId: string): Promise<void>;
  unfavoritePet(petId: string): Promise<void>;
  getFavoritePets(): Promise<PetSearchResult>;

  // 統計與互動
  incrementViewCount(petId: string): Promise<void>;
  incrementShareCount(petId: string): Promise<void>;
  reportPet(petId: string, reason: string): Promise<void>;

  // 委託方法 - 提供統一介面但實際由其他服務處理
  searchPets(
    query: string,
    filters?: Omit<SearchFilters, 'q'>
  ): Promise<PetSearchResult>;
  advancedSearch(
    query: string,
    filters?: SearchFilters
  ): Promise<AdvancedSearchResponse<Pet>>;
  getSearchSuggestions(query: string): Promise<string[]>;
  getSearchAnalytics(timeRange?: string): Promise<SearchAnalytics>;
  checkSearchHealth(): Promise<{
    data: { elasticsearch: ElasticsearchHealth };
  }>;
  uploadPetImage(petId: string, file: File): Promise<string>;
  deletePetImage(petId: string, imageUrl: string): Promise<void>;
}

class PetService implements PetServiceMethods {
  private baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  private async makeRequest(
    url: string,
    options: RequestInit = {},
    context?: string
  ): Promise<any> {
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
      return response;
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

  async getAllPets(filters?: SearchFilters): Promise<PetSearchResult> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const url = `/pets${params.toString() ? `?${params.toString()}` : ''}`;
      return this.makeRequest(url, {}, 'getAllPets');
    } catch (error) {
      throw new ApiError(ApiErrorCode.UNKNOWN_ERROR, '獲取寵物列表失敗', {
        filters,
        originalError: error,
      });
    }
  }

  // API 命名一致性：getPets 作為 getAllPets 的別名
  async getPets(filters?: SearchFilters): Promise<PetSearchResult> {
    return this.getAllPets(filters);
  }

  async getPetById(id: string): Promise<Pet> {
    return this.makeRequest(`/pets/${id}`);
  }

  async createPet(data: CreatePetData): Promise<Pet> {
    try {
      return this.makeRequest(
        '/pets',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        'createPet'
      );
    } catch (error) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, '創建寵物資料失敗', {
        data,
        originalError: error,
      });
    }
  }

  async updatePet(id: string, data: UpdatePetData): Promise<Pet> {
    try {
      return this.makeRequest(
        `/pets/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        'updatePet'
      );
    } catch (error) {
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, '更新寵物資料失敗', {
        id,
        data,
        originalError: error,
      });
    }
  }

  async deletePet(id: string): Promise<void> {
    await this.makeRequest(`/pets/${id}`, {
      method: 'DELETE',
    });
  }

  // 委託給 searchService 的搜尋方法
  async searchPets(
    query: string,
    filters: Omit<SearchFilters, 'q'> = {}
  ): Promise<PetSearchResult> {
    return searchService.searchPets(query, filters);
  }

  async advancedSearch(
    query: string,
    filters: SearchFilters = {}
  ): Promise<AdvancedSearchResponse<Pet>> {
    return searchService.advancedSearch(query, filters);
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    return searchService.getSearchSuggestions(query);
  }

  async getSearchAnalytics(timeRange: string = '7d'): Promise<SearchAnalytics> {
    return searchService.getSearchAnalytics(timeRange);
  }

  async checkSearchHealth(): Promise<{
    data: { elasticsearch: ElasticsearchHealth };
  }> {
    return searchService.checkSearchHealth();
  }

  async getMyPets(): Promise<PetSearchResult> {
    return this.makeRequest('/pets/my');
  }

  // 委託給 imageService 的圖片處理方法
  async uploadPetImage(petId: string, file: File): Promise<string> {
    return imageService.uploadPetImage(petId, file);
  }

  async deletePetImage(petId: string, imageUrl: string): Promise<void> {
    return imageService.deletePetImage(petId, imageUrl);
  }

  async incrementViewCount(petId: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/view`, {
      method: 'POST',
    });
  }

  async incrementShareCount(petId: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/share`, {
      method: 'POST',
    });
  }

  async reportPet(petId: string, reason: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async favoritePet(petId: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/favorite`, {
      method: 'POST',
    });
  }

  async unfavoritePet(petId: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/favorite`, {
      method: 'DELETE',
    });
  }

  async getFavoritePets(): Promise<PetSearchResult> {
    return this.makeRequest('/pets/favorites');
  }

  async getPopularSearches(limit: number = 10): Promise<{
    success: boolean;
    data: { popularSearches: Array<{ _id: string; count: number }> };
  }> {
    // 模擬熱門搜尋數據
    return {
      success: true,
      data: {
        popularSearches: [
          { _id: '黃金獵犬', count: 150 },
          { _id: '拉布拉多', count: 120 },
          { _id: '柴犬', count: 100 },
          { _id: '貴賓犬', count: 85 },
          { _id: '哈士奇', count: 70 },
          { _id: '邊境牧羊犬', count: 65 },
          { _id: '法國鬥牛犬', count: 55 },
          { _id: '德國牧羊犬', count: 50 },
        ].slice(0, limit),
      },
     };
   }

  async getSearchHistory(limit: number = 10): Promise<{
    success: boolean;
    data: { searchHistory: Array<any> };
  }> {
    // 模擬搜尋歷史數據
    return {
      success: true,
      data: {
        searchHistory: [].slice(0, limit), // 使用 limit 參數
      },
    };
  }

  async clearSearchHistory(): Promise<{ success: boolean }> {
    // 模擬清除搜尋歷史
    return { success: true };
  }
}

export const petService = new PetService();
export { PetService };
// 導出 Pet 型別以供其他模組使用
export type { Pet, CreatePetData, UpdatePetData, PetSearchResult } from '@/types';
