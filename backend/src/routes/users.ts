import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UserService } from '../services/userService';
import { EmailService } from '../services/emailService';
import { CloudinaryService } from '../services/cloudinaryService';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';
import { IUser } from '../models/User';
import { config } from '../config/environment';
import multer from 'multer';

const router = Router();

// Cloudinary 配置已移至 CloudinaryService

// 配置 multer 用於檔案上傳
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new AppError('不支援的檔案格式', 400));
    }
  },
});

// 獲取用戶列表（僅管理員）
router.get(
  '/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isIn(['user', 'admin']),
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
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // 獲取用戶列表
      const queryOptions: any = {
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      if (role) {
        queryOptions.role = role as 'user' | 'admin';
      }
      
      if (isActive !== undefined) {
        queryOptions.isActive = Boolean(isActive);
      }
      
      if (isEmailVerified !== undefined) {
        queryOptions.isEmailVerified = Boolean(isEmailVerified);
      }
      
      const result = await UserService.getUsers(queryOptions);

      logger.info('獲取用戶列表成功', {
        page,
        limit,
        total: result.total,
        adminId: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        data: result,
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

// 獲取特定用戶資訊
router.get(
  '/:id',
  authenticate,
  authorizeOwnerOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }

      // 獲取用戶資訊
      const user = await UserService.getUserById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

      logger.info('獲取用戶資訊成功', { userId: id, requesterId: (req.user as IUser)?._id.toString() });

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
          },
        },
      });
    } catch (error) {
      logger.error('獲取用戶資訊失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '獲取用戶資訊失敗，請稍後再試',
      });
    }
  }
);

// 更新用戶資訊
router.put(
  '/:id',
  authenticate,
  authorizeOwnerOrAdmin,
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('姓名不能為空'),
    body('phone').optional().isMobilePhone('zh-TW').withMessage('請提供有效的手機號碼'),
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

      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }

      // 更新用戶資訊
      const updatedUser = await UserService.updateUser(id, updateData);

      logger.info('用戶資訊更新成功', {
        userId: id,
        updateData,
        updaterId: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '用戶資訊更新成功',
        data: {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            isEmailVerified: updatedUser.isEmailVerified,
            isActive: updatedUser.isActive,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('用戶資訊更新失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '用戶資訊更新失敗，請稍後再試',
      });
    }
  }
);

// 停用用戶帳號（軟刪除）
router.delete(
  '/:id',
  authenticate,
  authorizeOwnerOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }

      // 停用用戶帳號
      await UserService.deactivateUser(id);

      logger.info('用戶帳號已停用', {
        userId: id,
        deactivatedBy: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '用戶帳號已停用',
      });
    } catch (error) {
      logger.error('停用用戶帳號失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '停用用戶帳號失敗，請稍後再試',
      });
    }
  }
);

// 上傳用戶頭像
router.post(
  '/:id/avatar',
  authenticate,
  authorizeOwnerOrAdmin,
  upload.single('avatar'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          message: '請選擇要上傳的頭像檔案',
        });
        return;
      }

      // 上傳到 Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        id,
        'avatar'
      );

      const avatarUrl = uploadResult.secureUrl;

      // 更新用戶頭像
      const updatedUser = await UserService.updateUser(id, { avatar: avatarUrl });

      logger.info('用戶頭像上傳成功', {
        userId: id,
        avatarUrl,
        uploaderId: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '頭像上傳成功',
        data: {
          avatarUrl,
          user: {
            id: updatedUser._id,
            avatar: updatedUser.avatar,
          },
        },
      });
    } catch (error) {
      logger.error('頭像上傳失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '頭像上傳失敗，請稍後再試',
      });
    }
  }
);

// 發送電子郵件驗證
router.post(
  '/:id/send-verification',
  authenticate,
  authorizeOwnerOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }

      // 獲取用戶資訊
      const user = await UserService.getUserById(id);
      
      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: '電子郵件已經驗證過了',
        });
        return;
      }

      // 生成驗證令牌
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // 發送驗證郵件
      await EmailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      logger.info('驗證郵件發送成功', {
        userId: id,
        email: user.email,
        requesterId: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '驗證郵件已發送，請檢查您的信箱',
      });
    } catch (error) {
      logger.error('發送驗證郵件失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '發送驗證郵件失敗，請稍後再試',
      });
    }
  }
);

// 驗證電子郵件
router.post(
  '/:id/verify-email',
  [
    body('token').notEmpty().withMessage('請提供驗證令牌'),
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

      const { id } = req.params;
      const { token } = req.body;

      // 驗證電子郵件
      await UserService.verifyEmailByToken(token);

      logger.info('電子郵件驗證成功', {
         userId: id,
       });

      res.json({
        success: true,
        message: '電子郵件驗證成功',
      });
    } catch (error) {
      logger.error('電子郵件驗證失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '電子郵件驗證失敗，請稍後再試',
      });
    }
  }
);

// 獲取用戶的寵物列表
router.get(
  '/:id/pets',
  authenticate,
  authorizeOwnerOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['lost', 'found', 'adopted']),
    query('type').optional().isIn(['dog', 'cat', 'other']),
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

      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少用戶 ID',
        });
        return;
      }
      
      const {
        page = 1,
        limit = 10,
        status,
        type,
        // sortBy = 'createdAt',
        // sortOrder = 'desc',
      } = req.query;

      // 構建查詢條件
      const query: any = { owner: id };
      
      if (status) {
        query.status = status;
      }
      
      if (type) {
        query.type = type;
      }

      // 分頁參數
      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

      // 查詢寵物（這裡假設有 Pet 模型，實際需要根據寵物模組實作）
      // 暫時返回空列表，等寵物模組完成後再實作
      const pets: any[] = [];
      const total = 0;

      logger.info('獲取用戶寵物列表成功', {
        userId: id,
        query,
        pagination: { page: pageNum, limit: limitNum },
        requesterId: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '獲取用戶寵物列表成功',
        data: {
          pets,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < Math.ceil(total / limitNum),
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      logger.error('獲取用戶寵物列表失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '獲取用戶寵物列表失敗，請稍後再試',
      });
    }
  }
);

// 更改密碼
router.put(
  '/:id/change-password',
  authenticate,
  authorizeOwnerOrAdmin,
  [
    body('currentPassword').notEmpty().withMessage('請提供當前密碼'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('新密碼長度至少為 8 個字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('新密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'),
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

      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!id || !currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: '缺少必要參數',
        });
        return;
      }

      // 更改密碼
      await UserService.changePassword(id, currentPassword, newPassword);

      logger.info('密碼更改成功', {
        userId: id,
        changedBy: (req.user as IUser)?._id.toString(),
      });

      res.json({
        success: true,
        message: '密碼更改成功',
      });
    } catch (error) {
      logger.error('密碼更改失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '密碼更改失敗，請稍後再試',
      });
    }
  }
);

export { router as userRoutes };