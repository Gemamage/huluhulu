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
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/pets/:id/similar
 * @desc    搜尋相似的寵物
 * @access  Public
 */
router.get('/:id/similar', 
  validateQuery(petSearchSchema),
  createCacheMiddleware({
    ttl: 15 * 60 * 1000, // 15分鐘快取
    keyGenerator: petCacheKeyGenerator
  }),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    limit = 6,
    radius = 10
  } = req.validatedQuery;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('請提供有效的寵物 ID');
  }

  logger.info('搜尋相似寵物請求', { petId: id, limit, radius });

  // 獲取原始寵物資訊
  const originalPet = await Pet.findById(id).lean();
  if (!originalPet) {
    throw new ValidationError('找不到指定的寵物資訊');
  }

  // 建立相似性查詢條件
  const similarityQuery: any = {
    _id: { $ne: new mongoose.Types.ObjectId(id) }, // 排除自己
    status: { $ne: 'reunited' } // 排除已團聚的案例
  };

  // 優先條件：相同類型
  if (originalPet.type) {
    similarityQuery.type = originalPet.type;
  }

  // 次要條件：相同品種（如果有）
  const breedQuery = { ...similarityQuery };
  if (originalPet.breed) {
    breedQuery.breed = new RegExp(originalPet.breed, 'i');
  }

  // 第三條件：相同顏色（如果有）
  const colorQuery = { ...similarityQuery };
  if (originalPet.color) {
    colorQuery.color = new RegExp(originalPet.color, 'i');
  }

  // 地理位置條件（如果有）
  const locationQuery = { ...similarityQuery };
  if (originalPet.lastSeenLocation) {
    locationQuery.lastSeenLocation = new RegExp(originalPet.lastSeenLocation, 'i');
  }

  // 執行多個查詢以獲得不同層級的相似性
  const [breedMatches, colorMatches, locationMatches, typeMatches] = await Promise.all([
    // 品種相同的寵物
    originalPet.breed ? Pet.find(breedQuery)
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 2))
      .populate('userId', 'name')
      .lean() : [],
    
    // 顏色相同的寵物
    originalPet.color ? Pet.find(colorQuery)
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 3))
      .populate('userId', 'name')
      .lean() : [],
    
    // 地點相近的寵物
    originalPet.lastSeenLocation ? Pet.find(locationQuery)
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 3))
      .populate('userId', 'name')
      .lean() : [],
    
    // 同類型的寵物（作為後備）
    Pet.find(similarityQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .lean()
  ]);

  // 合併結果並去重
  const allMatches = [...breedMatches, ...colorMatches, ...locationMatches, ...typeMatches];
  const uniqueMatches = allMatches.filter((pet, index, self) => 
    index === self.findIndex(p => p._id.toString() === pet._id.toString())
  );

  // 按相似度排序（品種 > 顏色 > 地點 > 類型）
  const sortedMatches = uniqueMatches.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // 品種匹配得分最高
    if (originalPet.breed && a.breed && 
        a.breed.toLowerCase().includes(originalPet.breed.toLowerCase())) {
      scoreA += 4;
    }
    if (originalPet.breed && b.breed && 
        b.breed.toLowerCase().includes(originalPet.breed.toLowerCase())) {
      scoreB += 4;
    }

    // 顏色匹配
    if (originalPet.color && a.color && 
        a.color.toLowerCase().includes(originalPet.color.toLowerCase())) {
      scoreA += 3;
    }
    if (originalPet.color && b.color && 
        b.color.toLowerCase().includes(originalPet.color.toLowerCase())) {
      scoreB += 3;
    }

    // 地點匹配
    if (originalPet.lastSeenLocation && a.lastSeenLocation && 
        a.lastSeenLocation.toLowerCase().includes(originalPet.lastSeenLocation.toLowerCase())) {
      scoreA += 2;
    }
    if (originalPet.lastSeenLocation && b.lastSeenLocation && 
        b.lastSeenLocation.toLowerCase().includes(originalPet.lastSeenLocation.toLowerCase())) {
      scoreB += 2;
    }

    // 類型匹配
    if (a.type === originalPet.type) scoreA += 1;
    if (b.type === originalPet.type) scoreB += 1;

    return scoreB - scoreA; // 降序排列
  });

  // 限制結果數量
  const finalResults = sortedMatches.slice(0, limit);

  res.json({
    success: true,
    data: {
      originalPet: {
        id: originalPet._id,
        name: originalPet.name,
        type: originalPet.type,
        breed: originalPet.breed,
        color: originalPet.color,
        lastSeenLocation: originalPet.lastSeenLocation
      },
      similarPets: finalResults,
      totalFound: finalResults.length,
      searchCriteria: {
        type: originalPet.type,
        breed: originalPet.breed,
        color: originalPet.color,
        location: originalPet.lastSeenLocation,
        radius
      }
    },
  });
}));

export default router;