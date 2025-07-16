import express from 'express';
import { Request, Response } from 'express';
import { commentService } from '../services/commentService';
import { messageService } from '../services/messageService';
import { reviewService } from '../services/reviewService';
import { reportService } from '../services/reportService';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

// ==================== 留言相關路由 ====================

/**
 * 創建留言
 */
router.post('/comments',
  authenticateToken,
  [
    body('petId').isMongoId().withMessage('無效的寵物ID'),
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('留言內容長度必須在1-1000字之間'),
    body('parentId').optional().isMongoId().withMessage('無效的父留言ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { petId, content, parentId } = req.body;
      const userId = req.user!.id;

      const comment = await commentService.createComment({
        petId,
        userId,
        content,
        parentId
      });

      res.status(201).json({
        success: true,
        data: comment,
        message: '留言創建成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '創建留言失敗'
      });
    }
  }
);

/**
 * 獲取寵物留言列表
 */
router.get('/pets/:petId/comments',
  [
    param('petId').isMongoId().withMessage('無效的寵物ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每頁數量必須在1-50之間'),
    query('sortBy').optional().isIn(['createdAt', 'likes']).withMessage('排序字段無效'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序順序無效')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await commentService.getCommentsByPet(petId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取留言失敗'
      });
    }
  }
);

/**
 * 獲取留言樹狀結構
 */
router.get('/pets/:petId/comments/tree',
  [
    param('petId').isMongoId().withMessage('無效的寵物ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const commentTree = await commentService.getCommentTree(petId);

      res.json({
        success: true,
        data: commentTree
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取留言樹狀結構失敗'
      });
    }
  }
);

/**
 * 更新留言
 */
router.put('/comments/:commentId',
  authenticateToken,
  [
    param('commentId').isMongoId().withMessage('無效的留言ID'),
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('留言內容長度必須在1-1000字之間')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const comment = await commentService.updateComment(commentId, userId, { content });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '留言不存在或無權限修改'
        });
      }

      res.json({
        success: true,
        data: comment,
        message: '留言更新成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新留言失敗'
      });
    }
  }
);

/**
 * 刪除留言
 */
router.delete('/comments/:commentId',
  authenticateToken,
  [
    param('commentId').isMongoId().withMessage('無效的留言ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      const success = await commentService.deleteComment(commentId, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '留言不存在或無權限刪除'
        });
      }

      res.json({
        success: true,
        message: '留言刪除成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '刪除留言失敗'
      });
    }
  }
);

/**
 * 舉報留言
 */
router.post('/comments/:commentId/report',
  authenticateToken,
  [
    param('commentId').isMongoId().withMessage('無效的留言ID'),
    body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('舉報原因長度必須在1-200字之間')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      await commentService.reportComment(commentId, userId, reason);

      res.json({
        success: true,
        message: '舉報提交成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '舉報失敗'
      });
    }
  }
);

// ==================== 私訊相關路由 ====================

/**
 * 發送私訊
 */
router.post('/messages',
  authenticateToken,
  [
    body('receiverId').isMongoId().withMessage('無效的接收者ID'),
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('訊息內容長度必須在1-1000字之間'),
    body('petId').optional().isMongoId().withMessage('無效的寵物ID'),
    body('messageType').optional().isIn(['text', 'image']).withMessage('無效的訊息類型')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { receiverId, content, petId, messageType = 'text' } = req.body;
      const senderId = req.user!.id;

      const message = await messageService.sendMessage({
        senderId,
        receiverId,
        content,
        petId,
        messageType
      });

      res.status(201).json({
        success: true,
        data: message,
        message: '訊息發送成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '發送訊息失敗'
      });
    }
  }
);

/**
 * 獲取對話列表
 */
router.get('/conversations',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每頁數量必須在1-50之間')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await messageService.getUserConversations(userId, {
        page: Number(page),
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取對話列表失敗'
      });
    }
  }
);

/**
 * 獲取對話訊息
 */
router.get('/conversations/:conversationId/messages',
  authenticateToken,
  [
    param('conversationId').isMongoId().withMessage('無效的對話ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每頁數量必須在1-100之間')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user!.id;

      const result = await messageService.getConversationMessages(conversationId, userId, {
        page: Number(page),
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取對話訊息失敗'
      });
    }
  }
);

/**
 * 標記訊息為已讀
 */
router.put('/conversations/:conversationId/read',
  authenticateToken,
  [
    param('conversationId').isMongoId().withMessage('無效的對話ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;

      await messageService.markAsRead(conversationId, userId);

      res.json({
        success: true,
        message: '訊息已標記為已讀'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '標記已讀失敗'
      });
    }
  }
);

/**
 * 刪除訊息
 */
router.delete('/messages/:messageId',
  authenticateToken,
  [
    param('messageId').isMongoId().withMessage('無效的訊息ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      const success = await messageService.deleteMessage(messageId, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '訊息不存在或無權限刪除'
        });
      }

      res.json({
        success: true,
        message: '訊息刪除成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '刪除訊息失敗'
      });
    }
  }
);

/**
 * 獲取未讀訊息統計
 */
router.get('/messages/unread/stats',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const stats = await messageService.getUnreadStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取未讀統計失敗'
      });
    }
  }
);

// ==================== 評價相關路由 ====================

/**
 * 創建評價
 */
router.post('/reviews',
  authenticateToken,
  [
    body('reviewedUserId').isMongoId().withMessage('無效的被評價用戶ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('評分必須在1-5之間'),
    body('content').optional().trim().isLength({ max: 500 }).withMessage('評價內容不能超過500字'),
    body('tags').optional().isArray().withMessage('標籤必須是陣列'),
    body('petId').optional().isMongoId().withMessage('無效的寵物ID'),
    body('conversationId').optional().isMongoId().withMessage('無效的對話ID'),
    body('isAnonymous').optional().isBoolean().withMessage('匿名標記必須是布林值')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        reviewedUserId,
        rating,
        content = '',
        tags = [],
        petId,
        conversationId,
        isAnonymous = false
      } = req.body;
      const reviewerId = req.user!.id;

      const review = await reviewService.createReview({
        reviewerId,
        reviewedUserId,
        rating,
        content,
        tags,
        petId,
        conversationId,
        isAnonymous
      });

      res.status(201).json({
        success: true,
        data: review,
        message: '評價創建成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '創建評價失敗'
      });
    }
  }
);

/**
 * 獲取用戶評價列表
 */
router.get('/users/:userId/reviews',
  [
    param('userId').isMongoId().withMessage('無效的用戶ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每頁數量必須在1-50之間'),
    query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('評分篩選必須在1-5之間'),
    query('sortBy').optional().isIn(['createdAt', 'rating']).withMessage('排序字段無效'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序順序無效')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await reviewService.getUserReviews(userId, {
        page: Number(page),
        limit: Number(limit),
        rating: rating ? Number(rating) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取評價列表失敗'
      });
    }
  }
);

/**
 * 獲取用戶評價統計
 */
router.get('/users/:userId/reviews/stats',
  [
    param('userId').isMongoId().withMessage('無效的用戶ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const stats = await reviewService.getUserReviewStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取評價統計失敗'
      });
    }
  }
);

/**
 * 更新評價
 */
router.put('/reviews/:reviewId',
  authenticateToken,
  [
    param('reviewId').isMongoId().withMessage('無效的評價ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('評分必須在1-5之間'),
    body('content').optional().trim().isLength({ max: 500 }).withMessage('評價內容不能超過500字'),
    body('tags').optional().isArray().withMessage('標籤必須是陣列')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { rating, content, tags } = req.body;
      const userId = req.user!.id;

      const review = await reviewService.updateReview(reviewId, userId, {
        rating,
        content,
        tags
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: '評價不存在或無權限修改'
        });
      }

      res.json({
        success: true,
        data: review,
        message: '評價更新成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新評價失敗'
      });
    }
  }
);

/**
 * 刪除評價
 */
router.delete('/reviews/:reviewId',
  authenticateToken,
  [
    param('reviewId').isMongoId().withMessage('無效的評價ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user!.id;

      const success = await reviewService.deleteReview(reviewId, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '評價不存在或無權限刪除'
        });
      }

      res.json({
        success: true,
        message: '評價刪除成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '刪除評價失敗'
      });
    }
  }
);

/**
 * 舉報評價
 */
router.post('/reviews/:reviewId/report',
  authenticateToken,
  [
    param('reviewId').isMongoId().withMessage('無效的評價ID'),
    body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('舉報原因長度必須在1-200字之間')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      await reviewService.reportReview(reviewId, userId, reason);

      res.json({
        success: true,
        message: '舉報提交成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '舉報失敗'
      });
    }
  }
);

/**
 * 檢查是否可以評價
 */
router.get('/users/:userId/can-review',
  authenticateToken,
  [
    param('userId').isMongoId().withMessage('無效的用戶ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const reviewerId = req.user!.id;

      const canReview = await reviewService.canReview(reviewerId, userId);

      res.json({
        success: true,
        data: { canReview }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '檢查評價權限失敗'
      });
    }
  }
);

// ==================== 舉報相關路由 ====================

/**
 * 創建舉報
 */
router.post('/reports',
  authenticateToken,
  [
    body('reportedUserId').optional().isMongoId().withMessage('無效的被舉報用戶ID'),
    body('reportedContentId').optional().isMongoId().withMessage('無效的被舉報內容ID'),
    body('contentType').isIn(['user', 'comment', 'review', 'message', 'pet']).withMessage('無效的內容類型'),
    body('reportType').trim().isLength({ min: 1, max: 50 }).withMessage('舉報類型長度必須在1-50字之間'),
    body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('舉報原因長度必須在1-200字之間'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('描述不能超過1000字'),
    body('evidence').optional().isArray().withMessage('證據必須是陣列')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        reportedUserId,
        reportedContentId,
        contentType,
        reportType,
        reason,
        description = '',
        evidence = []
      } = req.body;
      const reporterId = req.user!.id;

      const report = await reportService.createReport({
        reporterId,
        reportedUserId,
        reportedContentId,
        contentType,
        reportType,
        reason,
        description,
        evidence
      });

      res.status(201).json({
        success: true,
        data: report,
        message: '舉報提交成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '提交舉報失敗'
      });
    }
  }
);

/**
 * 獲取我的舉報歷史
 */
router.get('/reports/my',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每頁數量必須在1-50之間'),
    query('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']).withMessage('無效的狀態'),
    query('contentType').optional().isIn(['user', 'comment', 'review', 'message', 'pet']).withMessage('無效的內容類型')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        page = 1,
        limit = 20,
        status,
        contentType
      } = req.query;

      const result = await reportService.getReports({
        reporterId: userId,
        status: status as string,
        contentType: contentType as string,
        page: Number(page),
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取舉報歷史失敗'
      });
    }
  }
);

// ==================== 管理員專用路由 ====================

/**
 * 獲取所有舉報（管理員）
 */
router.get('/admin/reports',
  authenticateToken,
  checkPermission('admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每頁數量必須在1-100之間'),
    query('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']).withMessage('無效的狀態'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('無效的優先級'),
    query('contentType').optional().isIn(['user', 'comment', 'review', 'message', 'pet']).withMessage('無效的內容類型'),
    query('assignedTo').optional().isMongoId().withMessage('無效的指派對象ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        contentType,
        assignedTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await reportService.getReports({
        status: status as string,
        priority: priority as string,
        contentType: contentType as string,
        assignedTo: assignedTo as string,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取舉報列表失敗'
      });
    }
  }
);

/**
 * 更新舉報狀態（管理員）
 */
router.put('/admin/reports/:reportId',
  authenticateToken,
  checkPermission('admin'),
  [
    param('reportId').isMongoId().withMessage('無效的舉報ID'),
    body('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']).withMessage('無效的狀態'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('無效的優先級'),
    body('assignedTo').optional().isMongoId().withMessage('無效的指派對象ID'),
    body('resolution').optional().trim().isLength({ max: 1000 }).withMessage('處理結果不能超過1000字')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { status, priority, assignedTo, resolution } = req.body;
      const adminId = req.user!.id;

      const report = await reportService.updateReport(reportId, adminId, {
        status,
        priority,
        assignedTo,
        resolution
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '舉報不存在'
        });
      }

      res.json({
        success: true,
        data: report,
        message: '舉報更新成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新舉報失敗'
      });
    }
  }
);

/**
 * 批量處理舉報（管理員）
 */
router.put('/admin/reports/batch',
  authenticateToken,
  checkPermission('admin'),
  [
    body('reportIds').isArray({ min: 1 }).withMessage('舉報ID列表不能為空'),
    body('reportIds.*').isMongoId().withMessage('無效的舉報ID'),
    body('status').optional().isIn(['pending', 'investigating', 'resolved', 'dismissed']).withMessage('無效的狀態'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('無效的優先級'),
    body('assignedTo').optional().isMongoId().withMessage('無效的指派對象ID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { reportIds, status, priority, assignedTo } = req.body;
      const adminId = req.user!.id;

      const updatedCount = await reportService.batchUpdateReports(reportIds, adminId, {
        status,
        priority,
        assignedTo
      });

      res.json({
        success: true,
        data: { updatedCount },
        message: `成功更新 ${updatedCount} 個舉報`
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '批量更新舉報失敗'
      });
    }
  }
);

/**
 * 獲取舉報統計（管理員）
 */
router.get('/admin/reports/stats',
  authenticateToken,
  checkPermission('admin'),
  [
    query('timeRange').optional().isIn(['day', 'week', 'month', 'year']).withMessage('無效的時間範圍')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { timeRange } = req.query;
      const stats = await reportService.getReportStats(timeRange as any);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '獲取舉報統計失敗'
      });
    }
  }
);

/**
 * 自動處理舉報（管理員）
 */
router.post('/admin/reports/auto-process',
  authenticateToken,
  checkPermission('admin'),
  async (req: Request, res: Response) => {
    try {
      const result = await reportService.autoProcessReports();

      res.json({
        success: true,
        data: result,
        message: `自動處理完成，處理了 ${result.processed} 個舉報`
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '自動處理舉報失敗'
      });
    }
  }
);

export default router;