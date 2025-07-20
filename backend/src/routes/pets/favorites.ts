import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { 
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
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
 * @route   POST /api/pets/:id/favorite
 * @desc    收藏寵物
 * @access  Private
 */
router.post('/:id/favorite', 
  authenticate, 
  requireActiveAccount,
  createCacheInvalidationMiddleware({
    patterns: ['pets:*'] // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('請提供有效的寵物 ID');
  }

  logger.info('收藏寵物請求', { petId: id, userId });

  // 查找寵物
  const pet = await Pet.findById(id);
  if (!pet) {
    throw new NotFoundError('找不到指定的寵物資訊');
  }

  // 檢查是否已經收藏
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isAlreadyFavorited = pet.favoritedBy.some(favUserId => 
    favUserId.toString() === userId
  );

  if (isAlreadyFavorited) {
    return res.json({
      success: true,
      message: '您已經收藏過這隻寵物了',
      data: {
        isFavorited: true,
        favoriteCount: pet.favoritedBy.length
      },
    });
  }

  // 添加到收藏列表
  await Pet.findByIdAndUpdate(
    id,
    { $addToSet: { favoritedBy: userObjectId } },
    { new: true }
  );

  res.json({
    success: true,
    message: '寵物已加入收藏',
    data: {
      isFavorited: true,
      favoriteCount: pet.favoritedBy.length + 1
    },
  });
}));

/**
 * @route   DELETE /api/pets/:id/favorite
 * @desc    取消收藏寵物
 * @access  Private
 */
router.delete('/:id/favorite', 
  authenticate, 
  requireActiveAccount,
  createCacheInvalidationMiddleware({
    patterns: ['pets:*'] // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('請提供有效的寵物 ID');
  }

  logger.info('取消收藏寵物請求', { petId: id, userId });

  // 查找寵物
  const pet = await Pet.findById(id);
  if (!pet) {
    throw new NotFoundError('找不到指定的寵物資訊');
  }

  // 檢查是否已經收藏
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isAlreadyFavorited = pet.favoritedBy.some(favUserId => 
    favUserId.toString() === userId
  );

  if (!isAlreadyFavorited) {
    return res.json({
      success: true,
      message: '您尚未收藏這隻寵物',
      data: {
        isFavorited: false,
        favoriteCount: pet.favoritedBy.length
      },
    });
  }

  // 從收藏列表移除
  await Pet.findByIdAndUpdate(
    id,
    { $pull: { favoritedBy: userObjectId } },
    { new: true }
  );

  res.json({
    success: true,
    message: '已取消收藏',
    data: {
      isFavorited: false,
      favoriteCount: Math.max(0, pet.favoritedBy.length - 1)
    },
  });
}));

/**
 * @route   GET /api/pets/favorites
 * @desc    獲取用戶收藏的寵物列表
 * @access  Private
 */
router.get('/favorites', 
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

  logger.info('獲取用戶收藏寵物列表請求', {
    userId, page, limit, status, type, sortBy, sortOrder
  });

  // 建立查詢條件
  const query: any = {
    favoritedBy: new mongoose.Types.ObjectId(userId)
  };
  
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
      .populate('userId', 'name email')
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