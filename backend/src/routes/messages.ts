import express from "express";
import { Request, Response } from "express";
import { messageService } from "../services/messageService";
import { authenticate } from "../middleware/auth";
import { body, param, query } from "express-validator";

const router = express.Router();

/**
 * 發送私訊
 */
router.post(
  "/",
  authenticate,
  [
    body("receiverId").isMongoId().withMessage("無效的接收者ID"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("訊息內容長度必須在1-1000字之間"),
    body("petId").optional().isMongoId().withMessage("無效的寵物ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { receiverId, content, petId } = req.body;
      const senderId = req.user!.id;

      const message = await messageService.sendMessage({
        senderId,
        receiverId,
        content,
        petId,
      });

      res.status(201).json({
        success: true,
        data: message,
        message: "訊息發送成功",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "發送訊息失敗",
      });
    }
  },
);

/**
 * 獲取對話列表
 */
router.get(
  "/conversations",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每頁數量必須在1-50之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await messageService.getConversations(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "獲取對話列表失敗",
      });
    }
  },
);

/**
 * 獲取對話中的訊息
 */
router.get(
  "/conversations/:otherUserId",
  authenticate,
  [
    param("otherUserId").isMongoId().withMessage("無效的用戶ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每頁數量必須在1-100之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { otherUserId } = req.params;
      const userId = req.user!.id;
      const { page = 1, limit = 50 } = req.query;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "缺少用戶ID參數",
        });
      }

      const result = await messageService.getMessages(userId, otherUserId, {
        page: Number(page),
        limit: Number(limit),
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "獲取訊息失敗",
      });
    }
  },
);

/**
 * 標記訊息為已讀
 */
router.put(
  "/conversations/:otherUserId/read",
  authenticate,
  [param("otherUserId").isMongoId().withMessage("無效的用戶ID")],
  async (req: Request, res: Response) => {
    try {
      const { otherUserId } = req.params;
      const userId = req.user!.id;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "缺少用戶ID參數",
        });
      }

      await messageService.markAsRead(userId, otherUserId);

      return res.json({
        success: true,
        message: "訊息已標記為已讀",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "標記已讀失敗",
      });
    }
  },
);

/**
 * 刪除對話
 */
router.delete(
  "/conversations/:otherUserId",
  authenticate,
  [param("otherUserId").isMongoId().withMessage("無效的用戶ID")],
  async (req: Request, res: Response) => {
    try {
      const { otherUserId } = req.params;
      const userId = req.user!.id;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "缺少用戶ID參數",
        });
      }

      await messageService.deleteConversation(userId, otherUserId);

      return res.json({
        success: true,
        message: "對話刪除成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "刪除對話失敗",
      });
    }
  },
);

/**
 * 獲取未讀訊息數量
 */
router.get(
  "/unread-count",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const count = await messageService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "獲取未讀數量失敗",
      });
    }
  },
);

export default router;
