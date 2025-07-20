import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { 
  createCacheMiddleware,
  petCacheKeyGenerator
} from '../../middleware/cacheMiddleware';
import { validateQuery } from '../../utils/validation';
import { petSearchSchema } from '../../schemas/search';
import { Pet } from '../../models/Pet';
import { authenticate } from '../../middleware/auth';
import { requireActiveAccount } from '../../middleware/rbac';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/pets/my
 * @desc    獲取用戶自己的寵物協尋案例
 * @access  Private
 */
router.get('/my', 
  authenticate, 
  requireActiveAccount,
  validateQuery(petSearchSchema),
  createCacheMiddleware({
    ttl: 5 * 60 * 1000, // 5分鐘快取
    keyGenerator: petCacheKeyGenerator
  }),
  asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    page = 1,
    limit = 12,
    status,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.validatedQuery;

  logger.info('獲取用戶寵物案例請求', {
    userId, page, limit, status, type, sortBy, sortOrder
  });

  // 建立查詢條件
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }

  // 計算分頁
  const skip = (page - 1) * limit;
  
  // 排序設定
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 執行查詢
  const [pets, totalItems] = await Promise.all([
    Pet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Pet.countDocuments(query)
  ]);

  // 計算分頁資訊
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: {
      pets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    },
  });
}));

/**
 * @route   GET /api/pets/user/:userId
 * @desc    獲取特定用戶的寵物協尋案例
 * @access  Public
 */
router.get('/user/:userId', 
  validateQuery(petSearchSchema),
  createCacheMiddleware({
    ttl: 10 * 60 * 1000, // 10分鐘快取
    keyGenerator: petCacheKeyGenerator
  }),
  asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 12,
    status,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.validatedQuery;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('請提供有效的用戶 ID');
  }

  logger.info('獲取特定用戶寵物案例請求', {
    userId, page, limit, status, type, sortBy, sortOrder
  });

  // 建立查詢條件
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }

  // 計算分頁
  const skip = (page - 1) * limit;
  
  // 排序設定
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 執行查詢
  const [pets, totalItems] = await Promise.all([
    Pet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name')
      .lean(),
    Pet.countDocuments(query)
  ]);

  // 計算分頁資訊
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: {
      pets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    },
  });
}));

export default router;