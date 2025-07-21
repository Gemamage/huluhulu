import { Router, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import {
  NotificationService,
  NotificationOptions,
  BatchNotificationOptions,
} from "../services/notificationService";
import { NotificationPreference } from "../models/NotificationPreference";
import { NotificationType, NotificationPriority } from "../models/Notification";
import { authenticate } from "../middleware/auth";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

const router = Router();

/**
 * 驗證錯誤處理中介軟體
 */
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "請求參數驗證失敗",
      errors: errors.array(),
    });
  }
  next();
  return;
};

/**
 * @route POST /api/notifications/send
 * @desc 發送單一通知
 * @access Private
 */
router.post(
  "/send",
  authenticate,
  [
    body("userId").isMongoId().withMessage("用戶 ID 格式不正確"),
    body("type")
      .isIn(Object.values(NotificationType))
      .withMessage("通知類型不正確"),
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("標題長度必須在 1-100 字元之間"),
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("訊息長度必須在 1-500 字元之間"),
    body("priority")
      .optional()
      .isIn(Object.values(NotificationPriority))
      .withMessage("優先級不正確"),
    body("actionUrl").optional().isURL().withMessage("動作連結格式不正確"),
    body("imageUrl").optional().isURL().withMessage("圖片連結格式不正確"),
    body("channels.push")
      .optional()
      .isBoolean()
      .withMessage("推播通知設定必須為布林值"),
    body("channels.email")
      .optional()
      .isBoolean()
      .withMessage("Email 通知設定必須為布林值"),
    body("channels.inApp")
      .optional()
      .isBoolean()
      .withMessage("站內通知設定必須為布林值"),
    body("scheduledAt")
      .optional()
      .isISO8601()
      .withMessage("排程時間格式不正確"),
    body("expiresAt").optional().isISO8601().withMessage("過期時間格式不正確"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const options: NotificationOptions = {
        userId: req.body.userId,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        priority: req.body.priority,
        data: req.body.data,
        actionUrl: req.body.actionUrl,
        imageUrl: req.body.imageUrl,
        channels: req.body.channels,
        scheduledAt: req.body.scheduledAt
          ? new Date(req.body.scheduledAt)
          : undefined,
        expiresAt: req.body.expiresAt
          ? new Date(req.body.expiresAt)
          : undefined,
      };

      const result = await NotificationService.sendNotification(options);

      res.json({
        success: result.success,
        message: result.success ? "通知發送成功" : "通知發送失敗",
        data: {
          notificationId: result.notificationId,
          channels: result.channels,
        },
      });
    } catch (error) {
      logger.error("發送通知 API 錯誤", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route POST /api/notifications/batch
 * @desc 批次發送通知
 * @access Private
 */
router.post(
  "/batch",
  authenticate,
  [
    body("userIds").isArray({ min: 1 }).withMessage("用戶 ID 列表不能為空"),
    body("userIds.*").isMongoId().withMessage("用戶 ID 格式不正確"),
    body("type")
      .isIn(Object.values(NotificationType))
      .withMessage("通知類型不正確"),
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("標題長度必須在 1-100 字元之間"),
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("訊息長度必須在 1-500 字元之間"),
    body("priority")
      .optional()
      .isIn(Object.values(NotificationPriority))
      .withMessage("優先級不正確"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const options: BatchNotificationOptions = {
        userIds: req.body.userIds,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        priority: req.body.priority,
        data: req.body.data,
        actionUrl: req.body.actionUrl,
        imageUrl: req.body.imageUrl,
        channels: req.body.channels,
        scheduledAt: req.body.scheduledAt
          ? new Date(req.body.scheduledAt)
          : undefined,
        expiresAt: req.body.expiresAt
          ? new Date(req.body.expiresAt)
          : undefined,
      };

      const result = await NotificationService.sendBatchNotification(options);

      res.json({
        success: true,
        message: "批次通知發送完成",
        data: result,
      });
    } catch (error) {
      logger.error("批次發送通知 API 錯誤", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route GET /api/notifications
 * @desc 取得用戶通知列表
 * @access Private
 */
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須為正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每頁數量必須在 1-50 之間"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getUserNotifications(
        userId,
        page,
        limit,
      );

      res.json({
        success: true,
        message: "取得通知列表成功",
        data: {
          notifications: result.notifications,
          pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
          },
        },
      });
    } catch (error) {
      logger.error("取得通知列表 API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route PUT /api/notifications/:id/read
 * @desc 標記通知為已讀
 * @access Private
 */
router.put(
  "/:id/read",
  authenticate,
  [param("id").isMongoId().withMessage("通知 ID 格式不正確")],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "用戶未認證",
        });
      }

      const success = await NotificationService.markAsRead(
        notificationId as string,
        userId as string,
      );

      if (success) {
        return res.json({
          success: true,
          message: "通知已標記為已讀",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "找不到指定的通知",
        });
      }
    } catch (error) {
      logger.error("標記通知已讀 API 錯誤", {
        error,
        notificationId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route GET /api/notifications/unread-count
 * @desc 取得未讀通知數量
 * @access Private
 */
router.get(
  "/unread-count",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const count = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        message: "取得未讀通知數量成功",
        data: { count },
      });
    } catch (error) {
      logger.error("取得未讀通知數量 API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route GET /api/notifications/preferences
 * @desc 取得用戶通知偏好設定
 * @access Private
 */
router.get(
  "/preferences",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const preferences = await NotificationPreference.findByUserId(userId);

      if (!preferences) {
        return res.status(404).json({
          success: false,
          message: "找不到通知偏好設定",
        });
      }

      res.json({
        success: true,
        message: "取得通知偏好設定成功",
        data: preferences,
      });
      return;
    } catch (error) {
      logger.error("取得通知偏好設定 API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route PUT /api/notifications/preferences
 * @desc 更新用戶通知偏好設定
 * @access Private
 */
router.put(
  "/preferences",
  authenticate,
  [
    body("pushNotifications")
      .optional()
      .isObject()
      .withMessage("推播通知設定必須為物件"),
    body("emailNotifications")
      .optional()
      .isObject()
      .withMessage("Email 通知設定必須為物件"),
    body("inAppNotifications")
      .optional()
      .isObject()
      .withMessage("站內通知設定必須為物件"),
    body("globalSettings.pushEnabled")
      .optional()
      .isBoolean()
      .withMessage("推播開關必須為布林值"),
    body("globalSettings.emailEnabled")
      .optional()
      .isBoolean()
      .withMessage("Email 開關必須為布林值"),
    body("globalSettings.quietHours.enabled")
      .optional()
      .isBoolean()
      .withMessage("勿擾時段開關必須為布林值"),
    body("globalSettings.quietHours.start")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("勿擾開始時間格式不正確"),
    body("globalSettings.quietHours.end")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("勿擾結束時間格式不正確"),
    body("globalSettings.frequency")
      .optional()
      .isIn(["immediate", "hourly", "daily"])
      .withMessage("通知頻率設定不正確"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const updateData = req.body;

      const preferences = await NotificationPreference.findByUserId(userId);
      if (!preferences) {
        return res.status(404).json({
          success: false,
          message: "找不到通知偏好設定",
        });
      }

      // 更新偏好設定
      if (updateData.preferences) {
        Object.assign(preferences.preferences, updateData.preferences);
        preferences.markModified("preferences");
      }

      // 更新全域設定
      if (updateData.globalSettings) {
        Object.assign(preferences.globalSettings, updateData.globalSettings);
        preferences.markModified("globalSettings");
      }

      const updatedPreferences = await preferences.save();

      res.json({
        success: true,
        message: "通知偏好設定更新成功",
        data: updatedPreferences,
      });
      return;
    } catch (error) {
      logger.error("更新通知偏好設定 API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route POST /api/notifications/device-token
 * @desc 新增裝置 Token
 * @access Private
 */
router.post(
  "/device-token",
  authenticate,
  [
    body("token")
      .trim()
      .isLength({ min: 1 })
      .withMessage("裝置 Token 不能為空"),
    body("platform")
      .optional()
      .isIn(["ios", "android", "web"])
      .withMessage("平台類型不正確"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { token, platform } = req.body;

      const preferences = await NotificationPreference.findByUserId(userId);
      if (!preferences) {
        return res.status(404).json({
          success: false,
          message: "找不到通知偏好設定",
        });
      }

      await preferences.addDeviceToken(token, platform);

      res.json({
        success: true,
        message: "裝置 Token 新增成功",
      });
      return;
    } catch (error) {
      logger.error("新增裝置 Token API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route DELETE /api/notifications/device-token
 * @desc 移除裝置 Token
 * @access Private
 */
router.delete(
  "/device-token",
  authenticate,
  [
    body("token")
      .trim()
      .isLength({ min: 1 })
      .withMessage("裝置 Token 不能為空"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { token } = req.body;

      const preferences = await NotificationPreference.findByUserId(userId);
      if (!preferences) {
        return res.status(404).json({
          success: false,
          message: "找不到通知偏好設定",
        });
      }

      await preferences.removeDeviceTokens([token]);

      res.json({
        success: true,
        message: "裝置 Token 移除成功",
      });
      return;
    } catch (error) {
      logger.error("移除裝置 Token API 錯誤", {
        error,
        userId: (req as any).user?.userId,
      });
      res.status(500).json({
        success: false,
        message: "伺服器內部錯誤",
      });
      return;
    }
  },
);

/**
 * @route GET /api/notifications/stats
 * @desc 取得通知統計資訊
 * @access Private
 */
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await NotificationService.getNotificationStats(userId);

    res.json({
      success: true,
      message: "取得通知統計成功",
      data: stats,
    });
    return;
  } catch (error) {
    logger.error("取得通知統計 API 錯誤", {
      error,
      userId: (req as any).user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "伺服器內部錯誤",
    });
    return;
  }
});

/**
 * @route POST /api/notifications/test
 * @desc 發送測試通知（僅開發環境）
 * @access Private
 */
if (process.env.NODE_ENV === "development") {
  router.post(
    "/test",
    authenticate,
    [
      body("type")
        .optional()
        .isIn(Object.values(NotificationType))
        .withMessage("通知類型不正確"),
      body("priority")
        .optional()
        .isIn(Object.values(NotificationPriority))
        .withMessage("優先級不正確"),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.userId;
        const {
          type = NotificationType.SYSTEM_UPDATE,
          priority = NotificationPriority.NORMAL,
        } = req.body;

        const options: NotificationOptions = {
          userId,
          type,
          title: "測試通知",
          message: "這是一個測試通知，用於驗證通知系統是否正常運作。",
          priority,
          data: {
            test: true,
            timestamp: new Date().toISOString(),
          },
        };

        const result = await NotificationService.sendNotification(options);

        res.json({
          success: result.success,
          message: "測試通知發送完成",
          data: {
            notificationId: result.notificationId,
            channels: result.channels,
          },
        });
        return;
      } catch (error) {
        logger.error("發送測試通知 API 錯誤", {
          error,
          userId: (req as any).user?.userId,
        });
        res.status(500).json({
          success: false,
          message: "伺服器內部錯誤",
        });
        return;
      }
    },
  );
}

export default router;
