import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { S3Service } from '../services/s3Service';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

// Multer 配置 - 使用內存存儲
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // 最多 5 個文件
  },
  fileFilter: (req, file, cb) => {
    // 檢查文件類型
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('不支援的文件類型，請上傳 JPG、PNG、WebP 或 GIF 格式的圖片', 400));
    }
  },
});

// 驗證 schema
const presignedUrlSchema = z.object({
  fileName: z.string().min(1, '文件名不能為空'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/, '不支援的文件類型'),
  type: z.enum(['avatar', 'pet']).default('pet'),
});

/**
 * @route POST /api/upload/single
 * @desc 上傳單個圖片文件
 * @access Private
 */
router.post('/single', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請選擇要上傳的圖片', 400);
    }

    const { type = 'pet' } = req.body;
    const userId = (req.user as IUser)!._id.toString();

    // 驗證 type 參數
    if (!['avatar', 'pet'].includes(type)) {
      throw new AppError('無效的上傳類型', 400);
    }

    // 上傳到 S3
    const result = await S3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      type
    );

    logger.info('文件上傳成功', {
      userId,
      fileName: req.file.originalname,
      type,
      url: result.url
    });

    res.status(201).json({
      success: true,
      message: '文件上傳成功',
      data: {
        url: result.url,
        key: result.key,
        type,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/upload/multiple
 * @desc 上傳多個圖片文件
 * @access Private
 */
router.post('/multiple', authenticate, upload.array('images', 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('請選擇要上傳的圖片', 400);
    }

    const { type = 'pet' } = req.body;
    const userId = (req.user as IUser)!._id.toString();

    // 驗證 type 參數
    if (!['avatar', 'pet'].includes(type)) {
      throw new AppError('無效的上傳類型', 400);
    }

    // 批量上傳到 S3
    const uploadPromises = files.map(file => 
      S3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        type
      )
    );

    const results = await Promise.all(uploadPromises);

    logger.info('批量文件上傳成功', {
      userId,
      count: files.length,
      type
    });

    res.status(201).json({
      success: true,
      message: `成功上傳 ${files.length} 個文件`,
      data: results.map((result, index) => ({
        url: result.url,
        key: result.key,
        type,
        originalName: files[index].originalname,
        size: files[index].size,
        mimeType: files[index].mimetype,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/upload/avatar
 * @desc 上傳用戶頭像
 * @access Private
 */
router.post('/avatar', authenticate, upload.single('avatar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請選擇要上傳的頭像', 400);
    }

    const userId = (req.user as IUser)!._id.toString();

    // 上傳到 S3
    const result = await S3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      'avatar'
    );

    logger.info('頭像上傳成功', {
      userId,
      fileName: req.file.originalname,
      url: result.url
    });

    res.status(201).json({
      success: true,
      message: '頭像上傳成功',
      data: {
        url: result.url,
        key: result.key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/upload/:key
 * @desc 刪除上傳的文件
 * @access Private
 */
router.delete('/:key(*)', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      throw new AppError('文件 key 不能為空', 400);
    }

    // 檢查文件是否屬於當前用戶
    const userId = (req.user as IUser)!._id.toString();
    if (!key.includes(userId)) {
      throw new AppError('無權限刪除此文件', 403);
    }

    await S3Service.deleteFile(key);

    logger.info('文件刪除成功', {
      userId,
      key
    });

    res.json({
      success: true,
      message: '文件刪除成功',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/upload/analyze
 * @desc    AI 圖片分析
 * @access  Private
 */
router.post('/analyze', asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new ValidationError('請提供圖片 URL');
  }

  // TODO: 實作 AI 圖片分析邏輯
  // - Google Vision AI 分析
  // - 寵物品種識別
  // - 特徵提取
  // - 情感分析

  logger.info('AI 圖片分析請求', { imageUrl });

  res.json({
    success: true,
    message: '圖片分析完成',
    data: {
      analysis: {
        petType: 'dog',
        breed: '柴犬',
        confidence: 0.92,
        colors: ['白色', '棕色'],
        features: {
          size: 'medium',
          age: 'young',
          gender: 'unknown',
        },
        emotions: ['happy', 'alert'],
        objects: [
          { name: '狗', confidence: 0.98 },
          { name: '項圈', confidence: 0.85 },
        ],
        text: [], // OCR 結果
        safeSearch: {
          adult: 'VERY_UNLIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'UNLIKELY',
        },
      },
    },
  });
}));

/**
 * @route POST /api/upload/presigned-url
 * @desc 生成預簽名上傳 URL
 * @access Private
 */
router.post('/presigned-url', authenticate, validateRequest(presignedUrlSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, mimeType, type } = req.body;
    const userId = (req.user as IUser)!._id.toString();

    const result = await S3Service.generatePresignedUploadUrl(
      userId,
      fileName,
      mimeType,
      type
    );

    logger.info('預簽名 URL 生成成功', {
      userId,
      fileName,
      type
    });

    res.json({
      success: true,
      message: '預簽名 URL 生成成功',
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
        expiresIn: 300, // 5 分鐘
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/upload/delete-multiple
 * @desc 批量刪除文件
 * @access Private
 */
router.post('/delete-multiple', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new AppError('請提供要刪除的文件列表', 400);
    }

    const userId = (req.user as IUser)!._id.toString();
    
    // 檢查所有文件是否屬於當前用戶
    const invalidKeys = keys.filter(key => !key.includes(userId));
    if (invalidKeys.length > 0) {
      throw new AppError('無權限刪除部分文件', 403);
    }

    await S3Service.deleteMultipleFiles(keys);

    logger.info('批量文件刪除成功', {
      userId,
      count: keys.length
    });

    res.json({
      success: true,
      message: `成功刪除 ${keys.length} 個文件`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/upload/download/:key
 * @desc 生成預簽名下載 URL
 * @access Private
 */
router.get('/download/:key(*)', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      throw new AppError('文件 key 不能為空', 400);
    }

    // 檢查文件是否屬於當前用戶或是公開文件
    const userId = (req.user as IUser)!._id.toString();
    if (!key.includes(userId) && !key.includes('public/')) {
      throw new AppError('無權限訪問此文件', 403);
    }

    const downloadUrl = await S3Service.generatePresignedDownloadUrl(key);

    logger.info('預簽名下載 URL 生成成功', {
      userId,
      key
    });

    res.json({
      success: true,
      message: '下載 URL 生成成功',
      data: {
        downloadUrl,
        expiresIn: 3600, // 1 小時
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/upload/health
 * @desc S3 服務健康檢查
 * @access Private (Admin)
 */
router.get('/health', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 只允許管理員訪問
    if ((req.user as IUser)!.role !== 'admin') {
      throw new AppError('無權限訪問', 403);
    }

    const isHealthy = await S3Service.healthCheck();

    res.json({
      success: true,
      message: 'S3 服務狀態檢查完成',
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;