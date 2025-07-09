import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';
import path from 'path';

// S3 客戶端配置
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export class S3Service {
  private static bucketName = config.aws.s3Bucket;

  /**
   * 生成唯一的文件名
   */
  private static generateFileName(originalName: string, userId: string, type: 'avatar' | 'pet'): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    return `${type}/${userId}/${timestamp}-${randomString}${extension}`;
  }

  /**
   * 驗證文件類型
   */
  private static validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    return allowedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 驗證文件大小
   */
  private static validateFileSize(size: number): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return size <= maxSize;
  }

  /**
   * 上傳文件到 S3
   */
  static async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    type: 'avatar' | 'pet' = 'pet'
  ): Promise<{ url: string; key: string }> {
    try {
      // 驗證文件類型
      if (!this.validateFileType(mimeType)) {
        throw new AppError('不支援的文件類型，請上傳 JPG、PNG、WebP 或 GIF 格式的圖片', 400);
      }

      // 驗證文件大小
      if (!this.validateFileSize(file.length)) {
        throw new AppError('文件大小超過限制，請上傳小於 5MB 的圖片', 400);
      }

      // 生成文件名
      const fileName = this.generateFileName(originalName, userId, type);

      // 上傳到 S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: mimeType,
        ACL: 'public-read', // 設置為公開讀取
        Metadata: {
          userId,
          type,
          originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // 生成公開 URL
      const url = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

      logger.info('文件上傳成功', { 
        fileName, 
        userId, 
        type, 
        size: file.length,
        mimeType 
      });

      return { url, key: fileName };
    } catch (error) {
      logger.error('S3 文件上傳失敗', { error, userId, type });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('文件上傳失敗，請稍後再試', 500);
    }
  }

  /**
   * 刪除 S3 中的文件
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      
      logger.info('S3 文件刪除成功', { key });
    } catch (error) {
      logger.error('S3 文件刪除失敗', { error, key });
      throw new AppError('文件刪除失敗', 500);
    }
  }

  /**
   * 生成預簽名 URL 用於直接上傳
   */
  static async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    type: 'avatar' | 'pet' = 'pet'
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    try {
      // 驗證文件類型
      if (!this.validateFileType(mimeType)) {
        throw new AppError('不支援的文件類型', 400);
      }

      // 生成文件名
      const key = this.generateFileName(fileName, userId, type);

      // 創建預簽名 URL
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
        ACL: 'public-read',
        Metadata: {
          userId,
          type,
          originalName: fileName,
        },
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 分鐘有效
      const publicUrl = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

      logger.info('預簽名 URL 生成成功', { key, userId, type });

      return { uploadUrl, key, publicUrl };
    } catch (error) {
      logger.error('預簽名 URL 生成失敗', { error, userId, type });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('生成上傳 URL 失敗', 500);
    }
  }

  /**
   * 生成預簽名下載 URL
   */
  static async generatePresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      
      logger.info('預簽名下載 URL 生成成功', { key });
      
      return url;
    } catch (error) {
      logger.error('預簽名下載 URL 生成失敗', { error, key });
      throw new AppError('生成下載 URL 失敗', 500);
    }
  }

  /**
   * 批量刪除文件
   */
  static async deleteMultipleFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map(key => this.deleteFile(key));
      await Promise.all(deletePromises);
      
      logger.info('批量刪除文件成功', { count: keys.length });
    } catch (error) {
      logger.error('批量刪除文件失敗', { error, keys });
      throw new AppError('批量刪除文件失敗', 500);
    }
  }

  /**
   * 從 URL 中提取 S3 key
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlPattern = new RegExp(`https://${this.bucketName}\.s3\.${config.aws.region}\.amazonaws\.com/(.+)`);
      const match = url.match(urlPattern);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('提取 S3 key 失敗', { error, url });
      return null;
    }
  }

  /**
   * 檢查 S3 服務是否可用
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // 嘗試列出 bucket 來檢查連接
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'health-check-dummy-key',
      });
      
      // 這個請求會失敗（因為文件不存在），但如果是權限或連接問題會有不同的錯誤
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      // 如果是 NoSuchKey 錯誤，表示連接正常
      if (error.name === 'NoSuchKey') {
        return true;
      }
      
      logger.error('S3 健康檢查失敗', { error });
      return false;
    }
  }
}