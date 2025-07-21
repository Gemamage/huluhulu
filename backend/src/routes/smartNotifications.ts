import { Router } from "express";
import { Request, Response } from "express";
import { SmartNotificationService } from "../services/smartNotificationService";
import { authenticate as auth } from "../middleware/auth";
import { validateRequest } from "../utils/validation";
import { body, query, param } from "express-validator";
import { logger } from "../utils/logger";

const router = Router();

// 獲取智能通知統計
router.get(
  "/statistics",
  auth,
  [
    query("startDate").optional().isISO8601().withMessage("開始日期格式無效"),
    query("endDate").optional().isISO8601().withMessage("結束日期格式無效"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user!._id.toString();

      const statistics =
        await SmartNotificationService.getSmartNotificationStatistics({
          userId,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
        });

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      logger.error("獲取智能通知統計失敗:", error);
      res.status(500).json({
        success: false,
        message: "獲取統計資料失敗",
      });
    }
  },
);

// 獲取智能通知配置
router.get("/config", auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const config = await SmartNotificationService.getConfig(userId);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error("獲取智能通知配置失敗:", error);
    res.status(500).json({
      success: false,
      message: "獲取配置失敗",
    });
  }
});

// 更新智能通知配置
router.put(
  "/config",
  auth,
  [
    body("aiMatching")
      .optional()
      .isObject()
      .withMessage("AI 配對設定必須是物件"),
    body("aiMatching.enabled")
      .optional()
      .isBoolean()
      .withMessage("AI 配對啟用狀態必須是布林值"),
    body("aiMatching.minSimilarity")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("最小相似度必須在 0-1 之間"),
    body("aiMatching.checkInterval")
      .optional()
      .isInt({ min: 1 })
      .withMessage("檢查間隔必須是正整數"),
    body("aiMatching.maxNotificationsPerDay")
      .optional()
      .isInt({ min: 1 })
      .withMessage("每日最大通知數必須是正整數"),

    body("geofencing")
      .optional()
      .isObject()
      .withMessage("地理圍欄設定必須是物件"),
    body("geofencing.enabled")
      .optional()
      .isBoolean()
      .withMessage("地理圍欄啟用狀態必須是布林值"),
    body("geofencing.radius")
      .optional()
      .isFloat({ min: 0.1 })
      .withMessage("半徑必須大於 0.1"),
    body("geofencing.checkInterval")
      .optional()
      .isInt({ min: 1 })
      .withMessage("檢查間隔必須是正整數"),

    body("reminders").optional().isObject().withMessage("提醒設定必須是物件"),
    body("reminders.enabled")
      .optional()
      .isBoolean()
      .withMessage("提醒啟用狀態必須是布林值"),
    body("reminders.updateReminder")
      .optional()
      .isInt({ min: 1 })
      .withMessage("更新提醒間隔必須是正整數"),
    body("reminders.searchReminder")
      .optional()
      .isInt({ min: 1 })
      .withMessage("搜尋提醒間隔必須是正整數"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id.toString();
      const configUpdate = req.body;

      const updatedConfig = await SmartNotificationService.updateConfig(
        userId,
        configUpdate,
      );

      res.json({
        success: true,
        data: updatedConfig,
        message: "配置更新成功",
      });
    } catch (error) {
      logger.error("更新智能通知配置失敗:", error);
      res.status(500).json({
        success: false,
        message: "更新配置失敗",
      });
    }
  },
);

// 創建地理圍欄
router.post(
  "/geofence",
  auth,
  [
    body("petId").isMongoId().withMessage("寵物 ID 格式無效"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("緯度必須在 -90 到 90 之間"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("經度必須在 -180 到 180 之間"),
    body("radius")
      .isFloat({ min: 0.1, max: 50 })
      .withMessage("半徑必須在 0.1 到 50 公里之間"),
    body("name")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("名稱長度不能超過 100 字元"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id.toString();
      const { petId, latitude, longitude, radius, name } = req.body;

      const geofence = await SmartNotificationService.createGeofence({
        userId,
        petId,
        latitude,
        longitude,
        radius,
        name,
      });

      return res.status(201).json({
        success: true,
        data: geofence,
        message: "地理圍欄創建成功",
      });
    } catch (error) {
      logger.error("創建地理圍欄失敗:", error);
      return res.status(500).json({
        success: false,
        message: "創建地理圍欄失敗",
      });
    }
  },
);

// 移除地理圍欄
router.delete(
  "/geofence/:geofenceId",
  auth,
  [param("geofenceId").isMongoId().withMessage("地理圍欄 ID 格式無效")],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id.toString();
      const { geofenceId } = req.params;

      if (!geofenceId) {
        return res.status(400).json({
          success: false,
          message: "地理圍欄 ID 為必填項目",
        });
      }

      await SmartNotificationService.removeGeofence(userId, geofenceId);

      return res.json({
        success: true,
        message: "地理圍欄移除成功",
      });
    } catch (error) {
      logger.error("移除地理圍欄失敗:", error);
      return res.status(500).json({
        success: false,
        message: "移除地理圍欄失敗",
      });
    }
  },
);

// 獲取用戶的地理圍欄列表
router.get("/geofences", auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const geofences = await SmartNotificationService.getUserGeofences(userId);

    return res.json({
      success: true,
      data: geofences,
    });
  } catch (error) {
    logger.error("獲取地理圍欄列表失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取地理圍欄列表失敗",
    });
  }
});

// 手動觸發 AI 配對檢查
router.post(
  "/trigger-ai-matching",
  auth,
  [body("petId").optional().isMongoId().withMessage("寵物 ID 格式無效")],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id.toString();
      const { petId } = req.body;

      const result = await SmartNotificationService.triggerAIMatching(
        userId,
        petId,
      );

      return res.json({
        success: true,
        data: result,
        message: "AI 配對檢查已觸發",
      });
    } catch (error) {
      logger.error("觸發 AI 配對檢查失敗:", error);
      return res.status(500).json({
        success: false,
        message: "觸發 AI 配對檢查失敗",
      });
    }
  },
);

// 測試智能通知（僅開發環境）
router.post(
  "/test",
  auth,
  [
    body("type")
      .isIn(["ai_matching", "geofencing", "reminder"])
      .withMessage("通知類型無效"),
    body("petId").optional().isMongoId().withMessage("寵物 ID 格式無效"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // 僅在非生產環境允許測試
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "生產環境不允許測試功能",
        });
      }

      const userId = req.user!._id.toString();
      const { type, petId } = req.body;

      let result;
      switch (type) {
        case "ai_matching":
          result = await SmartNotificationService.triggerAIMatching(
            userId,
            petId,
          );
          break;
        case "geofencing":
          // 模擬地理圍欄觸發
          result = { message: "地理圍欄測試通知已發送" };
          break;
        case "reminder":
          // 模擬提醒通知
          result = { message: "提醒測試通知已發送" };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "不支援的測試類型",
          });
      }

      return res.json({
        success: true,
        data: result,
        message: `${type} 測試通知已發送`,
      });
    } catch (error) {
      logger.error("發送測試通知失敗:", error);
      return res.status(500).json({
        success: false,
        message: "發送測試通知失敗",
      });
    }
  },
);

export { router as smartNotificationRoutes };
