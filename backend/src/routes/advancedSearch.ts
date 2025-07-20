import express from "express";
import { Request, Response } from "express";
import { petSearchService, PetSearchQuery } from "../services/petSearchService";
import { elasticsearchService } from "../services/elasticsearchService";
import { mockElasticsearchService } from "../services/mockElasticsearchService";
import { auth } from "../middleware/auth";
import { logger } from "../utils/logger";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 檢測是否使用模擬服務
const USE_MOCK_ELASTICSEARCH =
  process.env.NODE_ENV === "development" && !process.env.ELASTICSEARCH_URL;

// 搜尋頻率限制
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分鐘
  max: 30, // 每分鐘最多30次搜尋
  message: {
    error: "搜尋頻率過高，請稍後再試",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 建議搜尋頻率限制
const suggestionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分鐘
  max: 60, // 每分鐘最多60次建議請求
  message: {
    error: "建議請求頻率過高，請稍後再試",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/advanced-search/pets
 * @desc 進階寵物搜尋
 * @access Public
 */
router.post("/pets", searchLimiter, async (req: Request, res: Response) => {
  try {
    const {
      query = "",
      type,
      status,
      breed,
      location,
      size,
      gender,
      color,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
      fuzzy = false,
      radius = 10,
      coordinates,
    } = req.body as PetSearchQuery;

    // 驗證參數
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        error: "無效的分頁參數",
        code: "INVALID_PAGINATION",
      });
    }

    if (radius && (radius < 1 || radius > 100)) {
      return res.status(400).json({
        error: "搜尋半徑必須在 1-100 公里之間",
        code: "INVALID_RADIUS",
      });
    }

    const searchQuery: PetSearchQuery = {
      query: query.trim(),
      type,
      status,
      breed,
      location,
      size,
      gender,
      color,
      page,
      limit,
      sortBy,
      sortOrder,
      fuzzy,
      radius,
      coordinates,
    };

    let searchResult;
    let searchTime;
    const startTime = Date.now();

    if (USE_MOCK_ELASTICSEARCH) {
      // 使用模擬服務
      searchResult = await mockElasticsearchService.searchPets(searchQuery);
      searchTime = Date.now() - startTime;
    } else {
      // 檢查 Elasticsearch 連接
      if (!elasticsearchService.isConnected()) {
        logger.warn("Elasticsearch 未連接，使用基礎搜尋");
        return res.status(503).json({
          error: "搜尋服務暫時不可用，請稍後再試",
          code: "SEARCH_SERVICE_UNAVAILABLE",
        });
      }

      // 執行搜尋
      searchResult = await petSearchService.searchPets(searchQuery);
      searchTime = Date.now() - startTime;

      // 記錄搜尋分析
      const userId = req.user?.id;
      const sessionId = req.sessionID;
      const userAgent = req.get("User-Agent");
      const ipAddress = req.ip;

      await petSearchService.recordSearchAnalytics(
        query,
        { type, status, breed, location, size, gender, color },
        userId,
        searchResult.total,
        sessionId,
        userAgent,
        ipAddress,
      );
    }

    // 回傳結果
    res.json({
      success: true,
      data: {
        pets: searchResult.hits.map((hit) => ({
          id: hit.id,
          ...hit.source,
          highlights: hit.highlights,
          relevanceScore: hit.score,
        })),
        pagination: {
          page,
          limit,
          total: searchResult.total,
          totalPages: Math.ceil(searchResult.total / limit),
          hasNext: page * limit < searchResult.total,
          hasPrev: page > 1,
        },
        searchInfo: {
          query: query.trim(),
          filters: { type, status, breed, location, size, gender, color },
          fuzzy,
          searchTime,
          maxScore: searchResult.maxScore,
        },
      },
      mock: USE_MOCK_ELASTICSEARCH,
    });
  } catch (error) {
    logger.error("進階搜尋失敗:", error);
    res.status(500).json({
      error: "搜尋失敗，請稍後再試",
      code: "SEARCH_ERROR",
    });
  }
});

/**
 * @route GET /api/advanced-search/suggestions
 * @desc 獲取搜尋建議
 * @access Public
 */
router.get(
  "/suggestions",
  suggestionLimiter,
  async (req: Request, res: Response) => {
    try {
      const { q: query, limit = 5 } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "請提供搜尋關鍵字",
          code: "MISSING_QUERY",
        });
      }

      if (query.length < 1) {
        return res.json({
          success: true,
          data: {
            suggestions: [],
          },
        });
      }

      const limitNum = Math.min(parseInt(limit as string) || 5, 10);

      let suggestions;

      if (USE_MOCK_ELASTICSEARCH) {
        // 使用模擬服務
        suggestions = await mockElasticsearchService.getSearchSuggestions(
          query,
          limitNum,
        );
      } else {
        // 檢查 Elasticsearch 連接
        if (!elasticsearchService.isConnected()) {
          return res.json({
            success: true,
            data: {
              suggestions: [],
            },
          });
        }

        suggestions = await petSearchService.getSearchSuggestions(
          query,
          limitNum,
        );
      }

      res.json({
        success: true,
        data: {
          suggestions: suggestions.map((suggestion) => ({
            text: suggestion.text,
            type: suggestion.type,
            score: suggestion.score,
          })),
        },
        mock: USE_MOCK_ELASTICSEARCH,
      });
    } catch (error) {
      logger.error("獲取搜尋建議失敗:", error);
      res.status(500).json({
        error: "獲取建議失敗",
        code: "SUGGESTION_ERROR",
      });
    }
  },
);

/**
 * @route GET /api/advanced-search/analytics
 * @desc 獲取搜尋分析數據
 * @access Private (Admin)
 */
router.get("/analytics", auth, async (req: Request, res: Response) => {
  try {
    // 檢查管理員權限
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "權限不足",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days as string) || 30, 365);

    let analytics;

    if (USE_MOCK_ELASTICSEARCH) {
      // 使用模擬服務
      analytics = await mockElasticsearchService.getSearchAnalytics(daysNum);
    } else {
      // 檢查 Elasticsearch 連接
      if (!elasticsearchService.isConnected()) {
        return res.status(503).json({
          error: "分析服務暫時不可用",
          code: "ANALYTICS_SERVICE_UNAVAILABLE",
        });
      }

      analytics = await petSearchService.getSearchAnalytics(daysNum);
    }

    res.json({
      success: true,
      data: {
        analytics,
        period: {
          days: daysNum,
          from: new Date(
            Date.now() - daysNum * 24 * 60 * 60 * 1000,
          ).toISOString(),
          to: new Date().toISOString(),
        },
      },
      mock: USE_MOCK_ELASTICSEARCH,
    });
  } catch (error) {
    logger.error("獲取搜尋分析失敗:", error);
    res.status(500).json({
      error: "獲取分析數據失敗",
      code: "ANALYTICS_ERROR",
    });
  }
});

/**
 * @route GET /api/advanced-search/health
 * @desc 檢查搜尋服務健康狀態
 * @access Public
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    let isConnected, metrics;

    if (USE_MOCK_ELASTICSEARCH) {
      // 使用模擬服務
      isConnected = await mockElasticsearchService.checkConnection();
      metrics = mockElasticsearchService.getPerformanceMetrics();
    } else {
      // 使用真實 Elasticsearch 服務
      isConnected = await elasticsearchService.checkConnection();
      metrics = elasticsearchService.getPerformanceMetrics();
    }

    res.json({
      success: true,
      data: {
        elasticsearch: {
          connected: isConnected,
          status: isConnected ? "healthy" : "disconnected",
          mock: USE_MOCK_ELASTICSEARCH,
        },
        performance: {
          totalQueries: metrics.totalQueries,
          averageResponseTime: Math.round(metrics.averageResponseTime),
          slowQueries: metrics.slowQueries,
          errorRate: Math.round(metrics.errorRate * 100) / 100,
          lastUpdated: metrics.lastUpdated,
        },
        features: {
          advancedSearch: isConnected,
          fuzzySearch: isConnected,
          suggestions: isConnected,
          analytics: isConnected,
          geoSearch: isConnected,
        },
      },
    });
  } catch (error) {
    logger.error("檢查搜尋服務健康狀態失敗:", error);
    res.status(500).json({
      error: "健康檢查失敗",
      code: "HEALTH_CHECK_ERROR",
    });
  }
});

/**
 * @route POST /api/advanced-search/reindex
 * @desc 重新索引所有寵物數據
 * @access Private (Admin)
 */
router.post("/reindex", auth, async (req: Request, res: Response) => {
  try {
    // 檢查管理員權限
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "權限不足",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    let result;

    if (USE_MOCK_ELASTICSEARCH) {
      // 使用模擬服務
      result = await mockElasticsearchService.reindexAllPets();
    } else {
      // 檢查 Elasticsearch 連接
      if (!elasticsearchService.isConnected()) {
        return res.status(503).json({
          error: "搜尋服務暫時不可用",
          code: "SEARCH_SERVICE_UNAVAILABLE",
        });
      }

      // 使用真實 Elasticsearch 服務
      result = await petSearchService.reindexAllPets();
    }

    logger.info("重新索引寵物數據完成");

    res.json({
      success: true,
      message: "重新索引任務已完成",
      data: {
        ...result,
        mock: USE_MOCK_ELASTICSEARCH,
      },
    });
  } catch (error) {
    logger.error("重新索引失敗:", error);
    res.status(500).json({
      error: "重新索引失敗",
      code: "REINDEX_ERROR",
    });
  }
});

export default router;
