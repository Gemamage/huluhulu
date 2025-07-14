import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { CloudinaryService } from '../services/cloudinaryService';
import { AIService } from '../services/aiService';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { validateRequest } from '../utils/validation';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/error-handler';
import { presignedUrlSchema } from '../schemas/upload';

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
    const userId = (req.user as IUser)?._id?.toString();
    if (!userId) {
      throw new AppError('用戶身份驗證失敗', 401);
    }

    // 驗證 type 參數
    if (!['avatar', 'pet'].includes(type)) {
      throw new AppError('無效的上傳類型', 400);
    }

    // 上傳到 Cloudinary
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      type as 'avatar' | 'pet' | 'general'
    );

    logger.info('文件上傳成功', {
      userId,
      fileName: req.file.originalname,
      type,
      url: result.secureUrl
    });

    res.status(201).json({
      success: true,
      message: '文件上傳成功',
      data: {
        url: result.secureUrl,
        publicId: result.publicId,
        type,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        width: result.width,
        height: result.height,
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
    const userId = (req.user as IUser)?._id?.toString();
    if (!userId) {
      throw new AppError('用戶身份驗證失敗', 401);
    }

    // 驗證 type 參數
    if (!['avatar', 'pet'].includes(type)) {
      throw new AppError('無效的上傳類型', 400);
    }

    // 批量上傳到 Cloudinary
    const uploadPromises = files.map(file => 
      CloudinaryService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        type as 'avatar' | 'pet' | 'general'
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
      data: results.map((result, index) => {
        const file = files[index];
        if (!file) {
          throw new AppError('文件索引錯誤', 500);
        }
        return {
          url: result.secureUrl,
          publicId: result.publicId,
          type,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          width: result.width,
          height: result.height,
        };
      }),
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

    const userId = (req.user as IUser)?._id?.toString();
    if (!userId) {
      throw new AppError('用戶身份驗證失敗', 401);
    }

    // 上傳到 Cloudinary
    const result = await CloudinaryService.uploadFile(
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
        url: result.secureUrl,
        publicId: result.publicId,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/upload/:publicId
 * @desc 刪除上傳的文件
 * @access Private
 */
router.delete('/:publicId(*)', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      throw new AppError('文件 publicId 不能為空', 400);
    }

    // 檢查文件是否屬於當前用戶
    const userId = (req.user as IUser)?._id?.toString();
    if (!userId) {
      throw new AppError('用戶身份驗證失敗', 401);
    }
    if (!publicId.includes(userId)) {
      throw new AppError('無權限刪除此文件', 403);
    }

    await CloudinaryService.deleteFile(publicId);

    logger.info('文件刪除成功', {
      userId,
      publicId
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
router.post('/analyze', authenticate, asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new ValidationError('請提供圖片 URL');
  }

  try {
    // 使用 AI 服務進行圖像分析
    const analysis = await AIService.analyzeImage(imageUrl);
    
    logger.info('AI 圖片分析完成', { 
      imageUrl, 
      userId: (req.user as IUser)._id,
      confidence: analysis.confidence 
    });

    res.json({
      success: true,
      message: '圖片分析完成',
      data: {
        analysis,
      },
    });
  } catch (error) {
    logger.error('AI 圖片分析失敗', { imageUrl, error });
    
    // 如果 AI 分析失敗，返回基本分析結果
    res.json({
      success: true,
      message: '圖片分析完成（使用備用分析）',
      data: {
        analysis: {
          confidence: 0.5,
          labels: ['寵物'],
          colors: ['未知'],
          features: ['圖像已上傳'],
          petType: 'unknown',
          breed: '未識別',
        },
      },
    });
  }
}));

/**
 * @route   POST /api/upload/process-with-ai
 * @desc    上傳並自動進行 AI 分析
 * @access  Private
 */
router.post('/process-with-ai', authenticate, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('請選擇要上傳的圖片', 400);
  }

  const { type = 'pet' } = req.body;
  const userId = (req.user as IUser)!._id.toString();

  try {
    // 1. 圖像優化處理
    const optimizedResult = await AIService.optimizeImage(req.file.buffer, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
    });

    // 2. 上傳優化後的圖像
    const uploadResult = await CloudinaryService.uploadFile(
      optimizedResult.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      type as 'avatar' | 'pet' | 'general'
    );

    // 3. AI 分析
    let analysis = null;
    try {
      analysis = await AIService.analyzeImage(uploadResult.secureUrl);
    } catch (aiError) {
      logger.warn('AI 分析失敗，繼續處理', { error: aiError });
    }

    logger.info('圖像上傳和 AI 分析完成', {
      userId,
      fileName: req.file.originalname,
      type,
      url: uploadResult.secureUrl,
      hasAnalysis: !!analysis
    });

    res.status(201).json({
      success: true,
      message: '圖像上傳和分析完成',
      data: {
        upload: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          type,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          width: uploadResult.width,
          height: uploadResult.height,
        },
        analysis,
      },
    });
  } catch (error) {
    logger.error('圖像處理失敗', { error, userId });
    throw error;
  }
}));

/**
 * @route GET /api/upload/config
 * @desc 獲取上傳配置信息
 * @access Private
 */
router.get('/config', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as IUser)!._id.toString();

    logger.info('獲取上傳配置', { userId });

    res.json({
      success: true,
      message: '上傳配置獲取成功',
      data: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        uploadEndpoint: '/api/upload/avatar',
        processEndpoint: '/api/upload/process-with-ai',
        service: 'cloudinary'
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

    // 批量刪除 Cloudinary 文件
    const deletePromises = keys.map(publicId => CloudinaryService.deleteFile(publicId));
    await Promise.all(deletePromises);

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
 * @route GET /api/upload/download/:publicId
 * @desc 獲取 Cloudinary 圖片的優化 URL
 * @access Private
 */
router.get('/download/:publicId(*)', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      throw new AppError('文件 publicId 不能為空', 400);
    }

    // 檢查文件是否屬於當前用戶
    const userId = (req.user as IUser)!._id.toString();
    if (!publicId.includes(userId)) {
      throw new AppError('無權限訪問此文件', 403);
    }

    const optimizedUrl = CloudinaryService.getOptimizedUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto',
      format: 'auto'
    });

    logger.info('優化 URL 生成成功', {
      userId,
      publicId
    });

    res.json({
      success: true,
      message: '優化 URL 生成成功',
      data: {
        downloadUrl: optimizedUrl,
        publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/upload/health
 * @desc Cloudinary 服務健康檢查
 * @access Private (Admin)
 */
router.get('/health', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 只允許管理員訪問
    if ((req.user as IUser)!.role !== 'admin') {
      throw new AppError('無權限訪問', 403);
    }

    const isHealthy = await CloudinaryService.checkConnection();

    res.json({
      success: true,
      message: 'Cloudinary 服務狀態檢查完成',
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