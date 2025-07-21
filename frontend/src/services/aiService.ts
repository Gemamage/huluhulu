import { toast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// AI 分析結果介面
export interface AIAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
  }>;
  objects: Array<{
    name: string;
    score: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  breedPrediction?: {
    breed: string;
    confidence: number;
    alternatives: Array<{
      breed: string;
      confidence: number;
    }>;
  };
  features: {
    colorHistogram: number[];
    textureFeatures: number[];
    shapeFeatures: number[];
  };
  tags: string[];
  confidence: number;
}

// 圖像優化結果介面
export interface ImageOptimizationResult {
  optimizedImageUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
}

// 圖像裁剪結果介面
export interface ImageCropResult {
  croppedImageUrl: string;
  originalDimensions: {
    width: number;
    height: number;
  };
  croppedDimensions: {
    width: number;
    height: number;
  };
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 相似寵物搜尋結果介面
export interface SimilarPetsResult {
  similarPets: Array<{
    id: string;
    name: string;
    type: string;
    breed?: string;
    imageUrl: string;
    similarity: number;
    status: 'lost' | 'found';
    location: string;
    lastSeenDate: string;
  }>;
  searchTime: number;
  totalFound: number;
}

// AI 搜尋建議結果介面
export interface AISearchSuggestions {
  suggestions: Array<{
    type: 'breed' | 'location' | 'color' | 'size' | 'keyword';
    value: string;
    confidence: number;
    reason: string;
  }>;
  recommendedFilters: {
    type?: string;
    breed?: string;
    color?: string;
    size?: string;
    location?: string;
  };
}

// API 回應介面
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class AIService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
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
        if (response.status === 400 && data.errors) {
          const errorMessages = data.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
          toast({
            title: 'AI 處理失敗',
            description: errorMessages,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'AI 服務錯誤',
            description: data.message || '發生未知錯誤',
            variant: 'destructive',
          });
        }
        throw new Error(data.message || 'AI 服務請求失敗');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('AI 服務連接失敗');
    }
  }

  /**
   * 分析圖像內容和寵物品種
   */
  async analyzeImage(imageUrl: string): Promise<ApiResponse<AIAnalysisResult>> {
    const response = await this.makeRequest<AIAnalysisResult>(
      '/api/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      }
    );

    if (response.success) {
      toast({
        title: '圖像分析完成',
        description: 'AI 已成功分析圖像內容',
      });
    }

    return response;
  }

  /**
   * 分析上傳的圖像文件
   */
  async analyzeImageFile(
    imageFile: File
  ): Promise<ApiResponse<AIAnalysisResult>> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await this.makeRequest<AIAnalysisResult>(
      '/api/ai/analyze',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.success) {
      toast({
        title: '圖像分析完成',
        description: 'AI 已成功分析上傳的圖像',
      });
    }

    return response;
  }

  /**
   * 優化圖像（壓縮、調整大小）
   */
  async optimizeImage(params: {
    imageUrl?: string;
    imageFile?: File;
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }): Promise<ApiResponse<ImageOptimizationResult>> {
    let body: FormData | string;

    if (params.imageFile) {
      body = new FormData();
      body.append('image', params.imageFile);
      if (params.width) body.append('width', params.width.toString());
      if (params.height) body.append('height', params.height.toString());
      if (params.quality) body.append('quality', params.quality.toString());
      if (params.format) body.append('format', params.format);
    } else {
      body = JSON.stringify(params);
    }

    const response = await this.makeRequest<ImageOptimizationResult>(
      '/api/ai/optimize',
      {
        method: 'POST',
        body,
      }
    );

    if (response.success) {
      toast({
        title: '圖像優化完成',
        description: `圖像已優化，壓縮率：${response.data?.compressionRatio?.toFixed(1)}%`,
      });
    }

    return response;
  }

  /**
   * 裁剪圖像
   */
  async cropImage(params: {
    imageUrl?: string;
    imageFile?: File;
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<ApiResponse<ImageCropResult>> {
    let body: FormData | string;

    if (params.imageFile) {
      body = new FormData();
      body.append('image', params.imageFile);
      body.append('x', params.x.toString());
      body.append('y', params.y.toString());
      body.append('width', params.width.toString());
      body.append('height', params.height.toString());
    } else {
      body = JSON.stringify(params);
    }

    const response = await this.makeRequest<ImageCropResult>('/api/ai/crop', {
      method: 'POST',
      body,
    });

    if (response.success) {
      toast({
        title: '圖像裁剪完成',
        description: '圖像已成功裁剪',
      });
    }

    return response;
  }

  /**
   * 基於圖像相似度搜尋寵物
   */
  async searchSimilarPets(params: {
    imageUrl?: string;
    imageFile?: File;
    petType?: string;
    location?: string;
    radius?: number;
    limit?: number;
  }): Promise<ApiResponse<SimilarPetsResult>> {
    let body: FormData | string;

    if (params.imageFile) {
      body = new FormData();
      body.append('image', params.imageFile);
      if (params.petType) body.append('petType', params.petType);
      if (params.location) body.append('location', params.location);
      if (params.radius) body.append('radius', params.radius.toString());
      if (params.limit) body.append('limit', params.limit.toString());
    } else {
      body = JSON.stringify(params);
    }

    const response = await this.makeRequest<SimilarPetsResult>(
      '/api/ai/similarity-search',
      {
        method: 'POST',
        body,
      }
    );

    if (response.success) {
      toast({
        title: '相似寵物搜尋完成',
        description: `找到 ${response.data?.totalFound || 0} 隻相似的寵物`,
      });
    }

    return response;
  }

  /**
   * 獲取 AI 搜尋建議
   */
  async getSearchSuggestions(
    petId: string
  ): Promise<ApiResponse<AISearchSuggestions>> {
    const response = await this.makeRequest<AISearchSuggestions>(
      `/api/ai/suggestions/${petId}`
    );

    return response;
  }

  /**
   * 批量處理圖像（上傳 + AI 分析）
   */
  async processImageWithAI(
    imageFile: File,
    options?: {
      analyze?: boolean;
      optimize?: boolean;
      optimizeOptions?: {
        width?: number;
        height?: number;
        quality?: number;
      };
    }
  ): Promise<
    ApiResponse<{
      uploadResult: { imageUrl: string };
      analysisResult?: AIAnalysisResult;
      optimizationResult?: ImageOptimizationResult;
    }>
  > {
    const formData = new FormData();
    formData.append('image', imageFile);

    if (options?.analyze) {
      formData.append('analyze', 'true');
    }

    if (options?.optimize) {
      formData.append('optimize', 'true');
      if (options.optimizeOptions?.width) {
        formData.append('width', options.optimizeOptions.width.toString());
      }
      if (options.optimizeOptions?.height) {
        formData.append('height', options.optimizeOptions.height.toString());
      }
      if (options.optimizeOptions?.quality) {
        formData.append('quality', options.optimizeOptions.quality.toString());
      }
    }

    const response = await this.makeRequest<{
      uploadResult: { imageUrl: string };
      analysisResult?: AIAnalysisResult;
      optimizationResult?: ImageOptimizationResult;
    }>('/api/upload/process-with-ai', {
      method: 'POST',
      body: formData,
    });

    if (response.success) {
      toast({
        title: '圖像處理完成',
        description: 'AI 已完成圖像上傳和分析',
      });
    }

    return response;
  }
}

// 導出單例實例
export const aiService = new AIService();
export default aiService;
