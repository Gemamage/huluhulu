import express from "express";
import { Request, Response } from "express";
import { commentService } from "../services/commentService";
import { authenticate } from "../middleware/auth";
import { body, param, query } from "express-validator";

const router = express.Router();

/**
 * 創建留言
 */
router.post(
  "/",
  authenticate,
  [
    body("petId").isMongoId().withMessage("無效的寵物ID"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("留言內容長度必須在1-1000字之間"),
    body("parentId").optional().isMongoId().withMessage("無效的父留言ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { petId, content, parentId } = req.body;
      const userId = req.user!.id;

      const comment = await commentService.createComment({
        petId,
        userId,
        content,
        parentId,
      });

      res.status(201).json({
        success: true,
        data: comment,
        message: "留言創建成功",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "創建留言失敗",
      });
    }
  },
);

/**
 * 獲取寵物留言列表
 */
router.get(
  "/pets/:petId",
  [
    param("petId").isMongoId().withMessage("無效的寵物ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("頁碼必須是正整數"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每頁數量必須在1-50之間"),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "likes"])
      .withMessage("排序字段無效"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("排序順序無效"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      if (!petId) {
        return res.status(400).json({
          success: false,
          message: "缺少寵物ID參數",
        });
      }

      const result = await commentService.getCommentsByPet(petId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as "createdAt" | "updatedAt",
        sortOrder: sortOrder as "asc" | "desc",
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "獲取留言列表失敗",
      });
    }
  },
);

/**
 * 獲取留言樹狀結構
 */
router.get(
  "/pets/:petId/tree",
  [param("petId").isMongoId().withMessage("無效的寵物ID")],
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;

      if (!petId) {
        return res.status(400).json({
          success: false,
          message: "缺少寵物ID參數",
        });
      }

      const commentTree = await commentService.getCommentTree(petId);

      return res.json({
        success: true,
        data: commentTree,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "獲取留言樹失敗",
      });
    }
  },
);

/**
 * 更新留言
 */
router.put(
  "/:commentId",
  authenticate,
  [
    param("commentId").isMongoId().withMessage("無效的留言ID"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("留言內容長度必須在1-1000字之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "缺少留言ID參數",
        });
      }

      const comment = await commentService.updateComment(commentId, userId, {
        content,
      });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "留言不存在或無權限修改",
        });
      }

      return res.json({
        success: true,
        data: comment,
        message: "留言更新成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "更新留言失敗",
      });
    }
  },
);

/**
 * 刪除留言
 */
router.delete(
  "/:commentId",
  authenticate,
  [param("commentId").isMongoId().withMessage("無效的留言ID")],
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "缺少留言ID參數",
        });
      }

      const success = await commentService.deleteComment(commentId, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "留言不存在或無權限刪除",
        });
      }

      return res.json({
        success: true,
        message: "留言刪除成功",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "刪除留言失敗",
      });
    }
  },
);

/**
 * 舉報留言
 */
router.post(
  "/:commentId/report",
  authenticate,
  [
    param("commentId").isMongoId().withMessage("無效的留言ID"),
    body("reason")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("舉報原因長度必須在1-200字之間"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: "缺少留言ID參數",
        });
      }

      await commentService.reportComment(commentId, userId);

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

export default router;
