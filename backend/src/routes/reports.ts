import express from "express";
import { Request, Response } from "express";
import { reportService } from "../services/reportService";
import { authenticate } from "../middleware/auth";
import { body, param, query } from "express-validator";

const router = express.Router();

/**
 * 創建舉報
 */
router.post(
  "/",
  authenticate,
  [
    body("contentType")
      .isIn(["user", "comment", "review", "message", "pet"])
      .withMessage("無效的內容類型"),
    body("contentId").isMongoId().withMessage("無效的內容ID"),
    body("reason")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("舉報原因長度必須在1-500字之間"),
    body("category")
      .optional()
      .isIn(["spam", "harassment", "inappropriate", "fake", "other"])
      .withMessage("無效的舉報類別"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { contentType, contentId, reason, category } = req.body;
      const reporterId = req.user!.id;

      const report = await reportService.createReport({
        reporterId,
        contentType,
        contentId,
        reason,
        category,
      });

      res.status(201).json({
        success: true,
        data: report,
        message: "舉報提交成功",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "提交舉報失敗",
      });
    }
  },
);

/**
 * 獲取用戶的舉報歷史
 */
router.get(
  "/my-reports",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每頁數量必須在1-50之間"),
    query("status")
      .optional()
      .isIn(["pending", "investigating", "resolved", "dismissed"])
      .withMessage("無效的狀態"),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, status } = req.query;

      const result = await reportService.getReportsByUser(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "獲取舉報歷史失敗",
      });
    }
  },
);

// ==================== 管理員專用路由 ====================

/**
 * 獲取所有舉報（管理員）
 */
router.get(
  "/admin/all",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每頁數量必須在1-100之間"),
    query("status")
      .optional()
      .isIn(["pending", "investigating", "resolved", "dismissed"])
      .withMessage("無效的狀態"),
    query("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("無效的優先級"),
    query("contentType")
      .optional()
      .isIn(["user", "comment", "review", "message", "pet"])
      .withMessage("無效的內容類型"),
    query("assignedTo").optional().isMongoId().withMessage("無效的指派對象ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        contentType,
        assignedTo,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const result = await reportService.getReports({
        status: status as string,
        priority: priority as string,
        contentType: contentType as string,
        assignedTo: assignedTo as string,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as "createdAt" | "priority" | "status",
        sortOrder: sortOrder as "asc" | "desc",
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "獲取舉報列表失敗",
      });
    }
  },
);

/**
 * 更新舉報狀態（管理員）
 */
router.put(
  "/admin/:reportId",
  authenticate,
  [
    param("reportId").isMongoId().withMessage("無效的舉報ID"),
    body("status")
      .optional()
      .isIn(["pending", "investigating", "resolved", "dismissed"])
      .withMessage("無效的狀態"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("無效的優先級"),
    body("assignedTo").optional().isMongoId().withMessage("無效的指派對象ID"),
    body("resolution")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("處理結果不能超過1000字"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { status, priority, assignedTo, resolution } = req.body;
      const adminId = req.user!.id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: "缺少舉報ID參數",
        });
      }

      const report = await reportService.updateReport(reportId, adminId, {
        status,
        priority,
        assignedTo,
        resolution,
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "舉報不存在",
        });
      }

      return res.json({
        success: true,
        data: report,
        message: "舉報更新成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "更新舉報失敗",
      });
    }
  },
);

/**
 * 批量處理舉報（管理員）
 */
router.put(
  "/admin/batch",
  authenticate,
  [
    body("reportIds").isArray({ min: 1 }).withMessage("舉報ID列表不能為空"),
    body("reportIds.*").isMongoId().withMessage("無效的舉報ID"),
    body("status")
      .optional()
      .isIn(["pending", "investigating", "resolved", "dismissed"])
      .withMessage("無效的狀態"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("無效的優先級"),
    body("assignedTo").optional().isMongoId().withMessage("無效的指派對象ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { reportIds, status, priority, assignedTo } = req.body;
      const adminId = req.user!.id;

      const updatedCount = await reportService.batchUpdateReports(
        reportIds,
        adminId,
        {
          status,
          priority,
          assignedTo,
        },
      );

      res.json({
        success: true,
        data: { updatedCount },
        message: `成功更新 ${updatedCount} 個舉報`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "批量更新舉報失敗",
      });
    }
  },
);

/**
 * 獲取舉報統計（管理員）
 */
router.get(
  "/admin/stats",
  authenticate,
  [
    query("timeRange")
      .optional()
      .isIn(["day", "week", "month", "year"])
      .withMessage("無效的時間範圍"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { timeRange } = req.query;
      const stats = await reportService.getReportStats(timeRange as any);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "獲取舉報統計失敗",
      });
    }
  },
);

/**
 * 自動處理舉報（管理員）
 */
router.post(
  "/admin/auto-process",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const result = await reportService.autoProcessReports();

      res.json({
        success: true,
        data: result,
        message: `自動處理完成，處理了 ${result.processed} 個舉報`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "自動處理舉報失敗",
      });
    }
  },
);

export default router;
