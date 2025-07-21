import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/environment";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

// 配置 Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any[];
  resourceType?: "image" | "video" | "raw" | "auto";
  format?: string;
  quality?: string | number;
}

export class CloudinaryService {
  /**
   * 驗證文件類型
   */
  private static validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    return allowedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 驗證文件大小
   */
  private static validateFileSize(size: number): boolean {
    const maxSize = config.upload.maxFileSize; // 5MB
    return size <= maxSize;
  }

  /**
   * 上傳文件到 Cloudinary
   */
  static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    type: "avatar" | "pet" | "general" = "general",
    options: CloudinaryUploadOptions = {},
  ): Promise<CloudinaryUploadResult> {
    try {
      // 驗證文件類型
      if (!this.validateFileType(mimeType)) {
        throw new AppError(
          "不支援的文件類型，請上傳 JPG、PNG、WebP 或 GIF 格式的圖片",
          400,
        );
      }

      // 驗證文件大小
      if (!this.validateFileSize(fileBuffer.length)) {
        throw new AppError("文件大小超過限制，請上傳小於 5MB 的圖片", 400);
      }

      // 設定預設選項
      const defaultOptions: CloudinaryUploadOptions = {
        folder: `pet-finder/${type}s`,
        publicId: `${type}-${userId}-${Date.now()}`,
        resourceType: "image",
        quality: "auto",
        format: "auto",
        ...options,
      };

      // 根據類型設定不同的轉換選項
      if (type === "avatar") {
        defaultOptions.transformation = [
          { width: 200, height: 200, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ];
      } else if (type === "pet") {
        defaultOptions.transformation = [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ];
      }

      // 上傳到 Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(defaultOptions, (error, result) => {
            if (error) {
              logger.error("Cloudinary 上傳失敗", { error, userId, type });
              reject(new AppError("圖片上傳失敗，請稍後再試", 500));
            } else {
              resolve(result);
            }
          })
          .end(fileBuffer);
      });

      logger.info("Cloudinary 上傳成功", {
        userId,
        type,
        publicId: result.public_id,
        url: result.secure_url,
        originalName,
      });

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      logger.error("Cloudinary 服務錯誤", { error, userId, type });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("圖片上傳服務暫時不可用，請稍後再試", 500);
    }
  }

  /**
   * 刪除 Cloudinary 上的文件
   */
  static async deleteFile(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== "ok") {
        throw new AppError("文件刪除失敗", 500);
      }

      logger.info("Cloudinary 文件刪除成功", { publicId });
    } catch (error) {
      logger.error("Cloudinary 刪除失敗", { error, publicId });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("文件刪除失敗，請稍後再試", 500);
    }
  }

  /**
   * 獲取圖片的優化 URL
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      quality: "auto",
      fetch_format: "auto",
      ...options,
    });
  }

  /**
   * 批量上傳文件
   */
  static async uploadMultipleFiles(
    files: Array<{
      buffer: Buffer;
      originalName: string;
      mimeType: string;
    }>,
    userId: string,
    type: "avatar" | "pet" | "general" = "general",
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(
          file.buffer,
          file.originalName,
          file.mimeType,
          userId,
          type,
        ),
      );

      const results = await Promise.all(uploadPromises);

      logger.info("批量上傳完成", {
        userId,
        type,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error("批量上傳失敗", { error, userId, type });
      throw new AppError("批量上傳失敗，請稍後再試", 500);
    }
  }

  /**
   * 檢查 Cloudinary 連接狀態
   */
  static async checkConnection(): Promise<boolean> {
    try {
      // 嘗試獲取帳戶資訊來測試連接
      await cloudinary.api.ping();
      return true;
    } catch (error) {
      logger.error("Cloudinary 連接測試失敗", { error });
      return false;
    }
  }

  /**
   * 獲取文件夾中的所有圖片
   */
  static async getImagesByFolder(
    folder: string,
    maxResults: number = 50,
  ): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .sort_by("created_at", "desc")
        .max_results(maxResults)
        .execute();

      return result.resources;
    } catch (error) {
      logger.error("獲取文件夾圖片失敗", { error, folder });
      throw new AppError("獲取圖片列表失敗", 500);
    }
  }

  /**
   * 獲取圖片詳細資訊
   */
  static async getImageDetails(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        image_metadata: true,
        colors: true,
        faces: true,
      });

      return result;
    } catch (error) {
      logger.error("獲取圖片詳細資訊失敗", { error, publicId });
      throw new AppError("獲取圖片資訊失敗", 500);
    }
  }
}

export default CloudinaryService;
