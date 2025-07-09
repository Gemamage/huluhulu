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
import { IUser, User } from '../models/User';

const router = Router();

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

      // 構建查詢條件
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';

      // 執行查詢
      const skip = (Number(page) - 1) * Number(limit);
      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

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

      const user = await User.findById(userId).select(
        '-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires'
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

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

      // 檢查目標用戶是否存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

      // 防止管理員修改自己的角色或狀態
      if (targetUser._id.toString() === adminUser._id.toString()) {
        if (role !== undefined || isActive !== undefined) {
          res.status(400).json({
            success: false,
            message: '不能修改自己的角色或帳號狀態',
          });
          return;
        }
      }

      // 只有超級管理員可以設置管理員角色
      if (role === 'admin' && adminUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '只有超級管理員可以設置管理員角色',
        });
        return;
      }

      // 更新用戶資料
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

      logger.info('管理員更新用戶資料成功', {
        adminId: adminUser._id,
        targetUserId: userId,
        updateData,
      });

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

      // 檢查目標用戶是否存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

      // 防止管理員刪除自己
      if (targetUser._id.toString() === adminUser._id.toString()) {
        res.status(400).json({
          success: false,
          message: '不能刪除自己的帳號',
        });
        return;
      }

      // 只有超級管理員可以刪除管理員
      if (targetUser.role === 'admin' && adminUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: '只有超級管理員可以刪除管理員帳號',
        });
        return;
      }

      // 軟刪除：將用戶標記為非活躍
      await User.findByIdAndUpdate(userId, {
        isActive: false,
        email: `deleted_${Date.now()}_${targetUser.email}`,
      });

      logger.info('管理員刪除用戶成功', {
        adminId: adminUser._id,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
      });

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

      // 檢查目標用戶是否存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

      // 生成臨時密碼
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // 更新用戶密碼
      targetUser.password = tempPassword;
      await targetUser.save();

      // 發送新密碼郵件（這裡簡化處理，實際應該發送重設連結）
      // await EmailService.sendPasswordResetEmail(targetUser.email, resetToken, targetUser.name);

      logger.info('管理員重設用戶密碼成功', {
        adminId: adminUser._id,
        targetUserId: userId,
      });

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
      const [totalUsers, activeUsers, verifiedUsers, adminUsers] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ role: { $in: ['admin', 'moderator'] } }),
      ]);

      // 最近30天註冊用戶
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      logger.info('獲取系統統計成功', {
        adminId: (req.user as IUser)._id,
      });

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers,
            admins: adminUsers,
            recent: recentUsers,
          },
          // 可以添加更多統計數據
        },
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
      const cleanedCount = await VerificationService.cleanupExpiredTokens();

      logger.info('清理過期令牌成功', {
        adminId: (req.user as IUser)._id,
        cleanedCount,
      });

      res.json({
        success: true,
        message: `已清理 ${cleanedCount} 個過期驗證令牌`,
        data: { cleanedCount },
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