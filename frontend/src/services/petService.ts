import { toast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PetData {
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  breed?: string;
  gender: 'male' | 'female' | 'unknown';
  age?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  status: 'lost' | 'found';
  description?: string;
  lastSeenLocation: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  lastSeenDate: string;
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
    preferredContact: 'phone' | 'email';
  };
  images?: string[];
  reward?: number;
  isUrgent: boolean;
  microchipId?: string;
  vaccinated?: boolean;
  medicalConditions?: string;
  specialMarks?: string;
  personality?: string;
}

export interface Pet extends PetData {
  id: string;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PetSearchParams {
  type?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  status?: 'lost' | 'found';
  location?: string;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastSeenDate' | 'reward';
  sortOrder?: 'asc' | 'desc';
}

export interface PetSearchResponse {
  success: boolean;
  data: {
    pets: Pet[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class PetService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authHeaders = this.getAuthHeaders();
      const isFormData = options.body instanceof FormData;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...authHeaders,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // 處理驗證錯誤
        if (response.status === 400 && data.errors) {
          const errorMessages = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          toast({
            title: '資料驗證失敗',
            description: errorMessages,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '請求失敗',
            description: data.message || '發生未知錯誤',
            variant: 'destructive',
          });
        }
        throw new Error(data.message || '請求失敗');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('網路連接失敗');
    }
  }

  /**
   * 獲取寵物列表
   */
  async getPets(params: PetSearchParams = {}): Promise<PetSearchResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/pets${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<PetSearchResponse['data']>(endpoint);
  }

  /**
   * 獲取用戶自己的寵物列表
   */
  async getMyPets(): Promise<PetSearchResponse> {
    return this.makeRequest<PetSearchResponse['data']>('/api/pets/my');
  }

  /**
   * 獲取單個寵物資訊
   */
  async getPet(id: string): Promise<ApiResponse<{ pet: Pet }>> {
    return this.makeRequest<{ pet: Pet }>(`/api/pets/${id}`);
  }

  /**
   * 創建新的寵物協尋案例
   */
  async createPet(petData: PetData): Promise<ApiResponse<{ pet: Pet }>> {
    const response = await this.makeRequest<{ pet: Pet }>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });

    if (response.success) {
      toast({
        title: '成功',
        description: '寵物協尋案例已成功建立',
      });
    }

    return response;
  }

  /**
   * 更新寵物資訊
   */
  async updatePet(id: string, petData: Partial<PetData>): Promise<ApiResponse<{ pet: Pet }>> {
    const response = await this.makeRequest<{ pet: Pet }>(`/api/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(petData),
    });

    if (response.success) {
      toast({
        title: '成功',
        description: '寵物資訊已成功更新',
      });
    }

    return response;
  }

  /**
   * 刪除寵物協尋案例
   */
  async deletePet(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(`/api/pets/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      toast({
        title: '成功',
        description: '寵物協尋案例已刪除',
      });
    }

    return response;
  }

  /**
   * 上傳寵物圖片
   */
  async uploadPetImages(id: string, images: File[]): Promise<ApiResponse<{ imageUrls: string[] }>> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`image${index}`, image);
    });

    const response = await this.makeRequest<{ imageUrls: string[] }>(`/api/pets/${id}/images`, {
      method: 'POST',
      body: formData,
      headers: {}, // 讓瀏覽器自動設置 Content-Type
    });

    if (response.success) {
      toast({
        title: '成功',
        description: '圖片上傳成功',
      });
    }

    return response;
  }

  /**
   * 分享寵物協尋案例
   */
  async sharePet(id: string, platform?: string): Promise<ApiResponse<{ shareUrl: string; shareCount: number }>> {
    return this.makeRequest<{ shareUrl: string; shareCount: number }>(`/api/pets/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  /**
   * 搜尋相似寵物
   */
  async searchSimilarPets(petId: string, params: {
    type?: string;
    breed?: string;
    color?: string;
    location?: string;
  }): Promise<ApiResponse<{ similarPets: Pet[] }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('excludeId', petId);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    return this.makeRequest(`/api/pets/search/similar?${queryParams.toString()}`);
  }

  /**
   * 獲取搜尋歷史
   */
  async getSearchHistory(limit: number = 10): Promise<ApiResponse<{ searchHistory: any[] }>> {
    return this.makeRequest(`/api/search/history?limit=${limit}`);
  }

  /**
   * 清除搜尋歷史
   */
  async clearSearchHistory(): Promise<ApiResponse<{}>> {
    return this.makeRequest('/api/search/history', {
      method: 'DELETE',
    });
  }

  /**
   * 獲取熱門搜尋關鍵字
   */
  async getPopularSearches(limit: number = 10): Promise<ApiResponse<{ popularSearches: any[] }>> {
    return this.makeRequest(`/api/search/popular?limit=${limit}`);
  }

  /**
   * 獲取搜尋建議
   */
  async getSearchSuggestions(query: string): Promise<ApiResponse<{ suggestions: string[] }>> {
    return this.makeRequest('/api/search/suggestions', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

// 導出單例實例
export const petService = new PetService();
export default petService;