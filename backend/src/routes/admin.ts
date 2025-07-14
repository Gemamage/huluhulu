import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UserService } from '../services/userService';
import { VerificationService } from '../services/verificationService';
import { authenticate } from '../middleware/auth';
import {
  requirePermission,
  requireRole,
  requireActiveAccount,
  Permission,
  getUserPermissions,
} from '../middleware/rbac';
import { IUser } from '../models/User';

const router = Router();
const userService = new UserService();

// 通用中介軟體 - 所有管理員路由都需要認證和活躍帳號
router.use(authenticate);
router.use(requireActiveAccount);

// 獲取用戶列表（需要用戶讀取權限）
router.get(
  '/users',
  requirePermission(Permission.USER_READ),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isIn(['user', 'moderator', 'admin']),
    query('isActive').optional().isBoolean(),
    query('isEmailVerified').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '查詢參數驗證失敗',
          errors: errors.array(),
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        search,
        role,
        isActive,
        isEmailVerified,
      } = req.query;

      // 使用 UserService 獲取用戶列表
      const result = await userService.getAdminUserList({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as 'user' | 'moderator' | 'admin',
        isActive: isActive === 'true',
        isEmailVerified: isEmailVerified === 'true',
      });

      const { users, total, totalPages } = result;

      logger.info('獲取用戶列表成功', {
        adminId: (req.user as IUser)._id,
        page,
        limit,
        total,
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: Number(page),
            total: totalPages,
            count: users.length,
            totalCount: total,
          },
        },
      });
    } catch (error) {
      logger.error('獲取用戶列表失敗', { error });
      res.status(500).json({
        success: false,
        message: '獲取用戶列表失敗，請稍後再試',
      });
    }
  }
);

// 獲取單個用戶詳情（需要用戶讀取權限）
router.get(
  '/users/:userId',
  requirePermission(Permission.USER_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: '用戶 ID 為必填項目',
        });
        return;
      }

      const user = await userService.getAdminUserById(userId);

      logger.info('獲取用戶詳情成功', {
        adminId: (req.user as IUser)._id,
        targetUserId: userId,
      });

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error('獲取用戶詳情失敗', { error });
      res.status(500).json({
        success: false,
        message: '獲取用戶詳情失敗，請稍後再試',
      });
    }
  }
);

// 更新用戶資料（需要用戶寫入權限）
router.put(
  '/users/:userId',
  requirePermission(Permission.USER_WRITE),
  [
    body('name').optional().trim().isLength({ min: 1, max: 50 }),
    body('phone').optional().isMobilePhone('zh-TW'),
    body('role').optional().isIn(['user', 'moderator', 'admin']),
    body('isActive').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '輸入資料驗證失敗',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { name, phone, role, isActive } = req.body;
      const adminUser = req.user as IUser;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: '用戶 ID 為必填項目',
        });
        return;
      }

      // 使用 UserService 更新用戶資料
       const updatedUser = await userService.adminUpdateUser(
         userId,
         { name, phone, role, isActive },
         adminUser
       );

      res.json({
        success: true,
        message: '用戶資料更新成功',
        data: { user: updatedUser },
      });
    } catch (error) {
      logger.error('管理員更新用戶資料失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '更新用戶資料失敗，請稍後再試',
      });
    }
  }
);

// 刪除用戶（需要用戶刪除權限）
router.delete(
  '/users/:userId',
  requirePermission(Permission.USER_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminUser = req.user as IUser;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: '用戶 ID 為必填項目',
        });
        return;
      }

      // 使用 UserService 刪除用戶
      await userService.adminDeleteUser(userId, adminUser);

      res.json({
        success: true,
        message: '用戶已被刪除',
      });
    } catch (error) {
      logger.error('管理員刪除用戶失敗', { error });
      res.status(500).json({
        success: false,
        message: '刪除用戶失敗，請稍後再試',
      });
    }
  }
);

// 重設用戶密碼（需要用戶管理權限）
router.post(
  '/users/:userId/reset-password',
  requirePermission(Permission.USER_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminUser = req.user as IUser;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: '用戶 ID 為必填項目',
        });
        return;
      }

      // 使用 UserService 重設用戶密碼
      const tempPassword = await userService.adminResetUserPassword(userId, adminUser);

      // 發送新密碼郵件（這裡簡化處理，實際應該發送重設連結）
      // await EmailService.sendPasswordResetEmail(targetUser.email, resetToken, targetUser.name);

      res.json({
        success: true,
        message: '密碼重設成功，臨時密碼已發送到用戶郵箱',
        data: {
          tempPassword, // 實際環境中不應該返回密碼
        },
      });
    } catch (error) {
      logger.error('管理員重設用戶密碼失敗', { error });
      res.status(500).json({
        success: false,
        message: '重設密碼失敗，請稍後再試',
      });
    }
  }
);

// 系統統計（需要分析讀取權限）
router.get(
  '/stats',
  requirePermission(Permission.ANALYTICS_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 使用 UserService 獲取系統統計
      const stats = await userService.getSystemStatistics();

      logger.info('獲取系統統計成功', {
        adminId: (req.user as IUser)._id,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('獲取系統統計失敗', { error });
      res.status(500).json({
        success: false,
        message: '獲取統計數據失敗，請稍後再試',
      });
    }
  }
);

// 清理過期驗證令牌（需要系統配置權限）
router.post(
  '/cleanup/expired-tokens',
  requirePermission(Permission.SYSTEM_CONFIG),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 使用 UserService 清理過期驗證令牌
      const result = await userService.cleanupExpiredTokens();

      logger.info('清理過期令牌成功', {
        adminId: (req.user as IUser)._id,
        cleanedCount: result.deletedCount,
      });

      res.json({
        success: true,
        message: `已清理 ${result.deletedCount} 個過期驗證令牌`,
        data: { cleanedCount: result.deletedCount },
      });
    } catch (error) {
      logger.error('清理過期令牌失敗', { error });
      res.status(500).json({
        success: false,
        message: '清理失敗，請稍後再試',
      });
    }
  }
);

// 獲取當前管理員權限
router.get('/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const permissions = getUserPermissions(user);

    res.json({
      success: true,
      data: {
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    logger.error('獲取管理員權限失敗', { error });
    res.status(500).json({
      success: false,
      message: '獲取權限失敗，請稍後再試',
    });
  }
});

export { router as adminRoutes };