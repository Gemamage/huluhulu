import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UserService } from '../services/userService';
import { EmailService } from '../services/emailService';
import { VerificationService } from '../services/verificationService';
import { authenticate } from '../middleware/auth';
import { requireActiveAccount, requireEmailVerification } from '../middleware/rbac';
import { User, IUser } from '../models/User';

const router = Router();

// 用戶註冊
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 1 }),
    body('phone').optional().isMobilePhone('zh-TW'),
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

      const { email, password, name, phone } = req.body;
      const userData = { email, password, name, phone };

      // 檢查電子郵件是否已存在
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '此電子郵件已被註冊'
        });
      }

      // 註冊用戶
      const result = await UserService.registerUser(userData);

      logger.info('用戶註冊成功', { email, name, userId: result.user._id });

      res.status(201).json({
        success: true,
        message: '註冊成功，請檢查您的電子郵件以驗證帳號',
        data: {
          user: {
            id: result.user._id,
            email: result.user.email,
            name: result.user.name,
            isEmailVerified: result.user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      logger.error('用戶註冊失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '註冊失敗，請稍後再試',
      });
    }
  }
);

// 用戶登入
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
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

      const { email, password } = req.body;
      const loginData = { email, password };

      // 用戶登入
      const { user, token } = await UserService.loginUser(loginData);

      logger.info('用戶登入成功', { email, userId: user._id });

      res.json({
        success: true,
        message: '登入成功',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('用戶登入失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '登入失敗，請稍後再試',
      });
    }
  }
);

// 用戶登出
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id.toString();
    
    // TODO: 實作令牌黑名單機制（可選）
    // 目前採用客戶端刪除令牌的方式

    logger.info('用戶登出成功', { userId });

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    logger.error('用戶登出失敗', { error });
    res.status(500).json({
      success: false,
      message: '登出失敗，請稍後再試',
    });
  }
});

// 刷新令牌
router.post('/refresh', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id.toString();
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '無效的令牌',
      });
      return;
    }

    // 獲取用戶資料
    const user = await UserService.getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在',
      });
      return;
    }

    // 生成新令牌
    const newToken = user.generateAuthToken();

    logger.info('令牌刷新成功', { userId });

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    logger.error('令牌刷新失敗', { error });
    res.status(500).json({
      success: false,
      message: '令牌刷新失敗，請稍後再試',
    });
  }
});

// 忘記密碼
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
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

      const { email } = req.body;

      // 查找用戶
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        // 為了安全考量，即使用戶不存在也返回成功訊息
        res.json({
          success: true,
          message: '如果該電子郵件地址存在於我們的系統中，您將收到密碼重設郵件',
        });
        return;
      }

      // 生成密碼重設令牌
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // 發送密碼重設郵件
      await EmailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name
      );

      logger.info('密碼重設郵件已發送', { email, userId: user._id });

      res.json({
        success: true,
        message: '密碼重設郵件已發送，請檢查您的電子郵件',
      });
    } catch (error) {
      logger.error('忘記密碼處理失敗', { error });
      res.status(500).json({
        success: false,
        message: '處理失敗，請稍後再試',
      });
    }
  }
);

// 重設密碼
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('請提供重設令牌'),
    body('newPassword').isLength({ min: 6 }).withMessage('密碼長度至少6個字符'),
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

      const { token, newPassword } = req.body;

      // 重設密碼
      await UserService.resetPassword(token, newPassword);

      logger.info('密碼重設成功');

      res.json({
        success: true,
        message: '密碼重設成功，請使用新密碼登入',
      });
    } catch (error) {
      logger.error('密碼重設失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '密碼重設失敗，請稍後再試',
      });
    }
  }
);

// 獲取當前用戶資訊
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id.toString();
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未授權的請求',
      });
      return;
    }

    // 獲取用戶資訊
    const user = await UserService.getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在',
      });
      return;
    }

    logger.info('獲取用戶資訊成功', { userId });

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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    logger.error('獲取用戶資訊失敗', { error });
    res.status(500).json({
      success: false,
      message: '獲取用戶資訊失敗，請稍後再試',
    });
  }
});

// 電子郵件驗證
router.get('/verify-email/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        message: '請提供驗證令牌',
      });
      return;
    }

    // 使用新的驗證服務
    const result = await VerificationService.verifyEmailToken(token);

    if (result.success) {
      logger.info('電子郵件驗證成功', { token });
      res.json({
        success: true,
        message: result.message,
        data: result.user ? {
          user: {
            id: result.user._id,
            email: result.user.email,
            name: result.user.name,
            isEmailVerified: result.user.isEmailVerified,
          },
        } : undefined,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
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
});

// 重新發送驗證郵件（需要登入）
router.post('/resend-verification', authenticate, requireActiveAccount, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    
    // 使用新的驗證服務
    const result = await VerificationService.resendVerificationEmail(user.email);

    if (result.success) {
      logger.info('重新發送驗證郵件成功', { userId: user._id, email: user.email });
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        cooldownRemaining: result.cooldownRemaining,
      });
    }
  } catch (error) {
    logger.error('重新發送驗證郵件失敗', { error });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '發送失敗，請稍後再試',
    });
  }
});

// 重新發送驗證郵件（無需登入）
router.post('/resend-verification-email', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response): Promise<void> => {
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

    const { email } = req.body;

    // 使用新的驗證服務
    const result = await VerificationService.resendVerificationEmail(email);

    if (result.success) {
      logger.info('重新發送驗證郵件成功', { email });
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        cooldownRemaining: result.cooldownRemaining,
      });
    }
  } catch (error) {
    logger.error('重新發送驗證郵件失敗', { error });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '發送失敗，請稍後再試',
    });
  }
});

// 檢查驗證狀態
router.get('/verification-status', authenticate, requireActiveAccount, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    
    const status = await VerificationService.checkVerificationStatus(user);

    res.json({
      success: true,
      data: {
        needsVerification: status.needsVerification,
        hasValidToken: status.hasValidToken,
        tokenExpiry: status.tokenExpiry,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error('檢查驗證狀態失敗', { error });
    res.status(500).json({
      success: false,
      message: '檢查狀態失敗，請稍後再試',
    });
  }
});

export { router as authRoutes };