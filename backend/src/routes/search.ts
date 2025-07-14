import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { requireActiveAccount } from '../middleware/rbac';
import { SearchHistory } from '../models/SearchHistory';
import { validateQuery } from '../utils/validation';
import { searchHistoryQuerySchema } from '../schemas/upload';

const router = Router();

/**
 * @route   GET /api/search/history
 * @desc    獲取用戶搜尋歷史
 * @access  Private
 */
router.get('/history', 
  authenticate, 
  requireActiveAccount, 
  validateQuery(searchHistoryQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const userId = req.user!.id;
    const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);

    logger.info('獲取搜尋歷史請求', { userId, limit: limitNumber });

    const searchHistory = await SearchHistory.getUserSearchHistory(userId, limitNumber);

    res.json({
      success: true,
      data: {
        searchHistory
      }
    });
  })
);

/**
 * @route   DELETE /api/search/history
 * @desc    清除用戶搜尋歷史
 * @access  Private
 */
router.delete('/history', 
  authenticate, 
  requireActiveAccount,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    logger.info('清除搜尋歷史請求', { userId });

    await SearchHistory.clearUserHistory(userId);

    res.json({
      success: true,
      message: '搜尋歷史已清除'
    });
  })
);

/**
 * @route   GET /api/search/popular
 * @desc    獲取熱門搜尋關鍵字
 * @access  Public
 */
router.get('/popular', 
  validateQuery(searchHistoryQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);

    logger.info('獲取熱門搜尋請求', { limit: limitNumber });

    const popularSearches = await SearchHistory.getPopularSearches(limitNumber);

    res.json({
      success: true,
      data: {
        popularSearches
      }
    });
  })
);

/**
 * @route   POST /api/search/suggestions
 * @desc    獲取搜尋建議
 * @access  Public
 */
router.post('/suggestions', asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    throw new ValidationError('搜尋查詢至少需要 2 個字元');
  }

  logger.info('獲取搜尋建議請求', { query });

  // 基於搜尋歷史提供建議
  const suggestions = await SearchHistory.aggregate([
    {
      $match: {
        searchQuery: { $regex: query.trim(), $options: 'i' },
        searchedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 最近 30 天
      }
    },
    {
      $group: {
        _id: '$searchQuery',
        count: { $sum: 1 },
        lastSearched: { $max: '$searchedAt' }
      }
    },
    {
      $sort: { count: -1, lastSearched: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        suggestion: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      suggestions: suggestions.map(s => s.suggestion)
    }
  });
}));

export { router as searchRoutes };