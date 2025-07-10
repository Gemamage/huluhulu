import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { AIService } from '../services/aiService';
import { S3Service } from '../services/s3Service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { Pet } from '../models/Pet';

const router = express.Router();

// Multer 配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for AI processing
    files: 1,
  },
  fileFilter: (req, file, cb) => {
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
      cb(new AppError('不支援的文件類型，請上傳圖片文件', 400));
    }
  },
});

// 驗證 schema
const imageOptimizeSchema = z.object({
  maxWidth: z.number().min(100).max(2000).optional(),
  maxHeight: z.number().min(100).max(2000).optional(),
  quality: z.number().min(10).max(100).optional(),
  format: z.enum(['jpeg', 'png', 'webp']).optional(),
});

const imageCropSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
});

const similaritySearchSchema = z.object({
  petId: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(50).default(10),
});

/**
 * @route POST /api/ai/analyze
 * @desc 分析上傳的圖片，識別寵物品種和特徵
 * @access Private
 */
router.post('/analyze', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請上傳圖片文件', 400);
    }

    const userId = (req.user as IUser)!._id.toString();

    logger.info('開始 AI 圖像分析', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    // 執行 AI 分析
    const analysisResult = await AIService.analyzeImageWithVision(req.file.buffer);

    // 生成搜尋建議
    const searchSuggestions = AIService.generateSearchSuggestions(analysisResult);

    logger.info('AI 圖像分析完成', {
      userId,
      petType: analysisResult.petType,
      breed: analysisResult.breed,
      confidence: analysisResult.confidence
    });

    res.json({
      success: true,
      message: '圖像分析完成',
      data: {
        analysis: {
          petType: analysisResult.petType,
          breed: analysisResult.breed,
          confidence: analysisResult.confidence,
          labels: analysisResult.labels,
          safeSearch: analysisResult.safeSearch
        },
        searchSuggestions,
        features: {
          dominantColors: analysisResult.features.dominantColors,
          // 不返回完整的特徵向量以減少響應大小
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/optimize
 * @desc 優化圖片（壓縮、調整大小）
 * @access Private
 */
router.post('/optimize', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請上傳圖片文件', 400);
    }

    const userId = (req.user as IUser)!._id.toString();
    const options = imageOptimizeSchema.parse(req.body);

    logger.info('開始圖像優化', {
      userId,
      fileName: req.file.originalname,
      originalSize: req.file.size,
      options
    });

    // 優化圖像
    const { buffer: optimizedBuffer, metadata } = await AIService.optimizeImage(
      req.file.buffer,
      options
    );

    // 上傳優化後的圖像到 S3
    const uploadResult = await S3Service.uploadFile(
      optimizedBuffer,
      `optimized_${req.file.originalname}`,
      options.format === 'png' ? 'image/png' : 
      options.format === 'webp' ? 'image/webp' : 'image/jpeg',
      userId,
      'pet'
    );

    logger.info('圖像優化完成', {
      userId,
      originalSize: req.file.size,
      optimizedSize: optimizedBuffer.length,
      url: uploadResult.url
    });

    res.json({
      success: true,
      message: '圖像優化完成',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: optimizedBuffer.length,
          originalSize: req.file.size,
          compressionRatio: ((req.file.size - optimizedBuffer.length) / req.file.size * 100).toFixed(2) + '%'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/crop
 * @desc 裁剪圖片
 * @access Private
 */
router.post('/crop', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請上傳圖片文件', 400);
    }

    const userId = (req.user as IUser)!._id.toString();
    const cropOptions = imageCropSchema.parse(req.body);

    logger.info('開始圖像裁剪', {
      userId,
      fileName: req.file.originalname,
      cropOptions
    });

    // 裁剪圖像
    const croppedBuffer = await AIService.cropImage(req.file.buffer, cropOptions);

    // 上傳裁剪後的圖像到 S3
    const uploadResult = await S3Service.uploadFile(
      croppedBuffer,
      `cropped_${req.file.originalname}`,
      req.file.mimetype,
      userId,
      'pet'
    );

    logger.info('圖像裁剪完成', {
      userId,
      url: uploadResult.url
    });

    res.json({
      success: true,
      message: '圖像裁剪完成',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        cropOptions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/similarity-search
 * @desc 基於圖像相似度搜尋寵物
 * @access Private
 */
router.post('/similarity-search', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('請上傳圖片文件', 400);
    }

    const userId = (req.user as IUser)!._id.toString();
    const { threshold, limit } = similaritySearchSchema.parse(req.body);

    logger.info('開始相似度搜尋', {
      userId,
      fileName: req.file.originalname,
      threshold,
      limit
    });

    // 提取上傳圖像的特徵
    const queryFeatures = await AIService.extractImageFeatures(req.file.buffer);

    // 獲取所有寵物記錄（實際應用中應該分批處理）
    const pets = await Pet.find({ status: 'active' })
      .populate('owner', 'username email')
      .limit(1000); // 限制搜尋範圍

    // 計算相似度並排序
    const similarities: Array<{
      pet: any;
      similarity: number;
    }> = [];

    for (const pet of pets) {
      if (pet.aiFeatures) {
        try {
          const similarity = AIService.calculateImageSimilarity(
            queryFeatures,
            pet.aiFeatures
          );
          
          if (similarity >= threshold) {
            similarities.push({ pet, similarity });
          }
        } catch (error) {
          logger.warn('相似度計算失敗', { petId: pet._id, error });
        }
      }
    }

    // 按相似度排序並限制結果數量
    similarities.sort((a, b) => b.similarity - a.similarity);
    const results = similarities.slice(0, limit);

    logger.info('相似度搜尋完成', {
      userId,
      totalPets: pets.length,
      matchedPets: results.length,
      threshold
    });

    res.json({
      success: true,
      message: `找到 ${results.length} 個相似的寵物`,
      data: {
        results: results.map(({ pet, similarity }) => ({
          pet: {
            _id: pet._id,
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            description: pet.description,
            images: pet.images,
            location: pet.location,
            status: pet.status,
            createdAt: pet.createdAt,
            owner: pet.owner
          },
          similarity: Math.round(similarity * 100) / 100
        })),
        searchParams: {
          threshold,
          limit,
          totalScanned: pets.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/suggestions/:petId
 * @desc 基於寵物資料生成搜尋建議
 * @access Private
 */
router.get('/suggestions/:petId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = (req.user as IUser)!._id.toString();

    // 獲取寵物資料
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new AppError('寵物資料不存在', 404);
    }

    // 基於寵物資料生成建議
    const suggestions: string[] = [];
    
    // 基本資訊建議
    if (pet.type) suggestions.push(pet.type);
    if (pet.breed && pet.breed !== '混種') suggestions.push(pet.breed);
    if (pet.color) suggestions.push(pet.color);
    if (pet.size) suggestions.push(pet.size);
    
    // 位置建議
    if (pet.location?.city) suggestions.push(pet.location.city);
    if (pet.location?.district) suggestions.push(pet.location.district);
    
    // 特徵建議
    if (pet.characteristics && pet.characteristics.length > 0) {
      suggestions.push(...pet.characteristics.slice(0, 3));
    }

    logger.info('生成搜尋建議', {
      userId,
      petId,
      suggestionsCount: suggestions.length
    });

    res.json({
      success: true,
      message: '搜尋建議生成完成',
      data: {
        suggestions: suggestions.slice(0, 8), // 限制為 8 個建議
        petInfo: {
          name: pet.name,
          type: pet.type,
          breed: pet.breed
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;