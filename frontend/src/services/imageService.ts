// 圖片服務 - 專門處理圖片上傳和管理功能
// 從 petService 中分離出來以提升程式碼組織性

import { errorHandler, ApiError, ApiErrorCode } from './errorHandler';
import { authService } from './authService';

// 圖片服務介面定義
interface ImageServiceMethods {
  // 圖片管理
  uploadPetImage(petId: string, file: File): Promise<string>;
  deletePetImage(petId: string, imageUrl: string): Promise<void>;

  // 圖片處理輔助方法
  validateImageFile(file: File): boolean;
  compressImage(
    file: File,
    maxWidth?: number,
    maxHeight?: number,
    quality?: number
  ): Promise<File>;
  getImagePreview(file: File): Promise<string>;
}

class ImageService implements ImageServiceMethods {
  private baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // 支援的圖片格式
  private readonly SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  // 最大檔案大小 (5MB)
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  private async makeRequest(
    url: string,
    options: RequestInit = {},
    context?: string
  ): Promise<any> {
    const requestContext = context || `${options.method || 'GET'} ${url}`;

    try {
      const token = authService.getToken();
      const headers: Record<string, string> = {};

      // 設置Content-Type（除非是FormData）
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

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

      // 設置請求超時（圖片上傳需要更長時間）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超時

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

  // 驗證圖片檔案
  validateImageFile(file: File): boolean {
    // 檢查檔案類型
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        `不支援的圖片格式。支援格式：${this.SUPPORTED_FORMATS.join(', ')}`,
        { fileType: file.type, supportedFormats: this.SUPPORTED_FORMATS }
      );
    }

    // 檢查檔案大小
    if (file.size > this.MAX_FILE_SIZE) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        `圖片檔案過大。最大允許大小：${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
        { fileSize: file.size, maxSize: this.MAX_FILE_SIZE }
      );
    }

    return true;
  }

  // 上傳寵物圖片
  async uploadPetImage(petId: string, file: File): Promise<string> {
    try {
      // 驗證檔案
      this.validateImageFile(file);

      const formData = new FormData();
      formData.append('image', file);

      const response = await this.makeRequest(
        `/pets/${petId}/images`,
        {
          method: 'POST',
          body: formData,
        },
        'uploadPetImage'
      );

      return response.imageUrl;
    } catch (error) {
      throw new ApiError(ApiErrorCode.UPLOAD_FAILED, '上傳寵物圖片失敗', {
        petId,
        fileName: file.name,
        fileSize: file.size,
        originalError: error,
      });
    }
  }

  // 刪除寵物圖片
  async deletePetImage(petId: string, imageUrl: string): Promise<void> {
    try {
      await this.makeRequest(
        `/pets/${petId}/images`,
        {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl }),
        },
        'deletePetImage'
      );
    } catch (error) {
      throw new ApiError(ApiErrorCode.SERVER_ERROR, '刪除寵物圖片失敗', {
        petId,
        imageUrl,
        originalError: error,
      });
    }
  }

  // 壓縮圖片
  async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 計算新的尺寸
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製壓縮後的圖片
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('圖片壓縮失敗'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('無法載入圖片'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 獲取圖片預覽
  async getImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('無法讀取圖片檔案'));
        }
      };

      reader.onerror = () => reject(new Error('讀取圖片檔案時發生錯誤'));
      reader.readAsDataURL(file);
    });
  }
}

export const imageService = new ImageService();
export type { ImageServiceMethods };
