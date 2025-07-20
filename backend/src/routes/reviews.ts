import express from "express";
import { Request, Response } from "express";
import { reviewService } from "../services/reviewService";
import { authenticate } from "../middleware/auth";
import { body, param, query } from "express-validator";

const router = express.Router();

/**
 * 創建評價
 */
router.post(
  "/",
  authenticate,
  [
    body("targetUserId").isMongoId().withMessage("無效的目標用戶ID"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("評分必須在1-5之間"),
    body("content")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("評價內容不能超過500字"),
    body("petId").optional().isMongoId().withMessage("無效的寵物ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { targetUserId, rating, content, petId } = req.body;
      const reviewerId = req.user!.id;

      const review = await reviewService.createReview({
        reviewerId,
        targetUserId,
        rating,
        content,
        petId,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: "評價創建成功",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "創建評價失敗",
      });
    }
  },
);

/**
 * 獲取用戶評價列表
 */
router.get(
  "/users/:userId",
  [
    param("userId").isMongoId().withMessage("無效的用戶ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每頁數量必須在1-50之間"),
    query("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("評分篩選必須在1-5之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, rating } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "缺少用戶ID參數",
        });
      }

      const result = await reviewService.getReviewsByUser(userId, {
        page: Number(page),
        limit: Number(limit),
        rating: rating ? Number(rating) : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "獲取評價列表失敗",
      });
    }
  },
);

/**
 * 獲取用戶評價統計
 */
router.get(
  "/users/:userId/stats",
  [param("userId").isMongoId().withMessage("無效的用戶ID")],
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "缺少用戶ID參數",
        });
      }

      const stats = await reviewService.getReviewStats(userId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "獲取評價統計失敗",
      });
    }
  },
);

/**
 * 更新評價
 */
router.put(
  "/:reviewId",
  authenticate,
  [
    param("reviewId").isMongoId().withMessage("無效的評價ID"),
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("評分必須在1-5之間"),
    body("content")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("評價內容不能超過500字"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { rating, content } = req.body;
      const userId = req.user!.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: "缺少評價ID參數",
        });
      }

      const review = await reviewService.updateReview(reviewId, userId, {
        rating,
        content,
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "評價不存在或無權限修改",
        });
      }

      return res.json({
        success: true,
        data: review,
        message: "評價更新成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "更新評價失敗",
      });
    }
  },
);

/**
 * 刪除評價
 */
router.delete(
  "/:reviewId",
  authenticate,
  [param("reviewId").isMongoId().withMessage("無效的評價ID")],
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user!.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: "缺少評價ID參數",
        });
      }

      const success = await reviewService.deleteReview(reviewId, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "評價不存在或無權限刪除",
        });
      }

      return res.json({
        success: true,
        message: "評價刪除成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "刪除評價失敗",
      });
    }
  },
);

/**
 * 舉報評價
 */
router.post(
  "/:reviewId/report",
  authenticate,
  [
    param("reviewId").isMongoId().withMessage("無效的評價ID"),
    body("reason")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("舉報原因長度必須在1-200字之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: "缺少評價ID參數",
        });
      }

      await reviewService.reportReview(reviewId, userId, reason);

      return res.json({
        success: true,
        message: "檢舉成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "檢舉失敗",
      });
    }
  },
);

/**
 * 檢查是否可以評價用戶
 */
router.get(
  "/can-review/:targetUserId",
  authenticate,
  [param("targetUserId").isMongoId().withMessage("無效的目標用戶ID")],
  async (req: Request, res: Response) => {
    try {
      const { targetUserId } = req.params;
      const reviewerId = req.user!.id;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "缺少目標用戶ID參數",
        });
      }

      const canReview = await reviewService.canReview(reviewerId, targetUserId);

      return res.json({
        success: true,
        data: { canReview },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "檢查評價權限失敗",
      });
    }
  },
);

export default router;
