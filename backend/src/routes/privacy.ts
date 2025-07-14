import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { privacySettingsSchema } from '../schemas/common';
import { IUser, User } from '../models/User';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = Router();

// 獲取用戶隱私設定
router.get('/settings', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id.toString();
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未授權的請求',
      });
      return;
    }

    const user = await User.findById(userId).select('privacySettings');
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在',
      });
      return;
    }

    logger.info('獲取隱私設定成功', { userId });

    res.json({
      success: true,
      data: {
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    logger.error('獲取隱私設定失敗', { error });
    res.status(500).json({
      success: false,
      message: '獲取隱私設定失敗，請稍後再試',
    });
  }
});

// 更新用戶隱私設定
router.put('/settings', 
  authenticate, 
  validateRequest(privacySettingsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req.user as IUser)?._id.toString();
      const privacySettings = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用戶不存在',
        });
        return;
      }

      // 更新隱私設定
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings,
      };

      await user.save();

      logger.info('隱私設定更新成功', { userId, settings: privacySettings });

      res.json({
        success: true,
        message: '隱私設定更新成功',
        data: {
          privacySettings: user.privacySettings,
        },
      });
    } catch (error) {
      logger.error('更新隱私設定失敗', { error });
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '更新隱私設定失敗，請稍後再試',
      });
    }
  }
);

// 重置隱私設定為預設值
router.post('/settings/reset', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id.toString();
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未授權的請求',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用戶不存在',
      });
      return;
    }

    // 重置為預設隱私設定
    user.privacySettings = {
      showEmail: false,
      showPhone: true,
      allowDirectContact: true,
      showFullName: false,
      profileVisibility: 'registered',
      emailNotifications: {
        newMatches: true,
        messages: true,
        updates: false,
        marketing: false,
      },
      smsNotifications: {
        urgentAlerts: true,
        matches: false,
      },
    };

    await user.save();

    logger.info('隱私設定重置成功', { userId });

    res.json({
      success: true,
      message: '隱私設定已重置為預設值',
      data: {
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    logger.error('重置隱私設定失敗', { error });
    res.status(500).json({
      success: false,
      message: '重置隱私設定失敗，請稍後再試',
    });
  }
});

// 獲取隱私設定選項說明
router.get('/settings/options', async (req: Request, res: Response): Promise<void> => {
  try {
    const options = {
      profileVisibility: {
        public: {
          label: '公開',
          description: '任何人都可以查看您的個人資料',
        },
        registered: {
          label: '僅註冊用戶',
          description: '只有註冊用戶可以查看您的個人資料',
        },
        private: {
          label: '私人',
          description: '只有您自己可以查看完整的個人資料',
        },
      },
      contactSettings: {
        showEmail: {
          label: '顯示電子郵件',
          description: '在您的個人資料中顯示電子郵件地址',
        },
        showPhone: {
          label: '顯示電話號碼',
          description: '在您的個人資料中顯示電話號碼',
        },
        allowDirectContact: {
          label: '允許直接聯絡',
          description: '允許其他用戶通過網站直接聯絡您',
        },
        showFullName: {
          label: '顯示完整姓名',
          description: '顯示您的完整姓名而非暱稱',
        },
      },
      notifications: {
        email: {
          newMatches: '新的寵物匹配通知',
          messages: '新訊息通知',
          updates: '系統更新通知',
          marketing: '行銷資訊',
        },
        sms: {
          urgentAlerts: '緊急警報',
          matches: '匹配通知',
        },
      },
    };

    res.json({
      success: true,
      data: { options },
    });
  } catch (error) {
    logger.error('獲取隱私設定選項失敗', { error });
    res.status(500).json({
      success: false,
      message: '獲取選項失敗，請稍後再試',
    });
  }
});

export { router as privacyRoutes };