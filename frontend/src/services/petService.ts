// 寵物服務
// 這個文件提供前端測試所需的寵物服務

import { Pet, CreatePetData, UpdatePetData, PetSearchResult } from '@/types/pet';
import { SearchFilters, AdvancedSearchResponse, SearchAnalytics, ElasticsearchHealth } from '@/types/search';
import { authService } from './authService';

// PetService 介面定義 - 提升類型安全性
interface PetServiceMethods {
  // 基本 CRUD 操作
  getPets(filters?: SearchFilters): Promise<PetSearchResult>;
  getAllPets(filters?: SearchFilters): Promise<PetSearchResult>;
  getPetById(id: string): Promise<Pet>;
  createPet(data: CreatePetData): Promise<Pet>;
  updatePet(id: string, data: UpdatePetData): Promise<Pet>;
  deletePet(id: string): Promise<void>;
  
  // 搜尋功能
  searchPets(query: string, filters?: Omit<SearchFilters, 'q'>): Promise<PetSearchResult>;
  advancedSearch(query: string, filters?: SearchFilters): Promise<AdvancedSearchResponse<Pet>>;
  getSearchSuggestions(query: string): Promise<string[]>;
  
  // 用戶相關
  getMyPets(): Promise<PetSearchResult>;
  favoritePet(petId: string): Promise<void>;
  unfavoritePet(petId: string): Promise<void>;
  getFavoritePets(): Promise<PetSearchResult>;
  
  // 圖片管理
  uploadPetImage(petId: string, file: File): Promise<string>;
  deletePetImage(petId: string, imageUrl: string): Promise<void>;
  
  // 統計與分析
  incrementViewCount(petId: string): Promise<void>;
  incrementShareCount(petId: string): Promise<void>;
  getSearchAnalytics(timeRange?: string): Promise<SearchAnalytics>;
  
  // 系統功能
  reportPet(petId: string, reason: string): Promise<void>;
  checkSearchHealth(): Promise<{ data: { elasticsearch: ElasticsearchHealth } }>;
}

class PetService implements PetServiceMethods {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response;
  }

  async getAllPets(filters?: SearchFilters): Promise<PetSearchResult> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = `/pets${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest(url);
  }

  // API 命名一致性：getPets 作為 getAllPets 的別名
  async getPets(filters?: SearchFilters): Promise<PetSearchResult> {
    return this.getAllPets(filters);
  }

  async getPetById(id: string): Promise<Pet> {
    return this.makeRequest(`/pets/${id}`);
  }

  async createPet(data: CreatePetData): Promise<Pet> {
    return this.makeRequest('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePet(id: string, data: UpdatePetData): Promise<Pet> {
    return this.makeRequest(`/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePet(id: string): Promise<void> {
    await this.makeRequest(`/pets/${id}`, {
      method: 'DELETE',
    });
  }

  async searchPets(
    query: string,
    filters: Omit<SearchFilters, 'q'> = {}
  ): Promise<PetSearchResult> {
    const params = new URLSearchParams();
    params.append('q', query);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value.toString());
      }
    });

    return this.makeRequest<PetSearchResult>(
      `/pets/search?${params.toString()}`
    );
  }

  // Elasticsearch 進階搜尋
  async advancedSearch(
    query: string,
    filters: SearchFilters = {}
  ): Promise<AdvancedSearchResponse<Pet>> {
    const searchData = {
      q: query,
      ...filters
    };

    return this.makeRequest('/advanced-search/pets', {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  }

  // 獲取搜尋建議
  async getSearchSuggestions(query: string): Promise<string[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    const response = await this.makeRequest(`/advanced-search/suggestions?${params.toString()}`);
    return response.suggestions || [];
  }

  // 獲取搜尋分析數據
  async getSearchAnalytics(timeRange: string = '7d'): Promise<SearchAnalytics> {
    const params = new URLSearchParams();
    params.append('timeRange', timeRange);
    
    const response = await this.makeRequest(`/advanced-search/analytics?${params.toString()}`);
    return response.data || response;
  }

  // 檢查 Elasticsearch 服務健康狀態
  async checkSearchHealth(): Promise<{ data: { elasticsearch: ElasticsearchHealth } }> {
    return this.makeRequest('/advanced-search/health');
  }

  async getMyPets(): Promise<PetSearchResult> {
    return this.makeRequest('/pets/my');
  }

  async uploadPetImage(petId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const token = authService.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/pets/${petId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;
  }

  async deletePetImage(petId: string, imageUrl: string): Promise<void> {
    await this.makeRequest(`/pets/${petId}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl }),
    });
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
}

export const petService = new PetService();