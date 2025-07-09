import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { IUser } from '../models/User';

const router = Router();

// Google OAuth 登入路由
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth 回調路由
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.clientUrl}/login?error=oauth_failed` }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      
      if (!user) {
        logger.error('Google OAuth 回調中沒有用戶資料');
        res.redirect(`${config.clientUrl}/login?error=oauth_failed`);
        return;
      }

      // 生成 JWT 令牌
      const token = user.generateAuthToken();
      
      logger.info('Google OAuth 登入成功', { 
        userId: user._id, 
        email: user.email,
        googleId: user.googleId 
      });

      // 重定向到前端，並在 URL 中包含令牌
      // 注意：在生產環境中，建議使用更安全的方式傳遞令牌
      res.redirect(`${config.clientUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }))}`);      
    } catch (error) {
      logger.error('Google OAuth 回調處理失敗', { error });
      res.redirect(`${config.clientUrl}/login?error=oauth_callback_failed`);
    }
  }
);

// 檢查 OAuth 連結狀態
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供認證令牌',
      });
      return;
    }

    // 這裡可以添加 JWT 驗證邏輯
    // 暫時返回基本狀態
    res.json({
      success: true,
      data: {
        hasGoogleAccount: false, // 需要根據實際用戶資料判斷
        providers: ['email'], // 可用的登入方式
      },
    });
  } catch (error) {
    logger.error('獲取 OAuth 狀態失敗', { error });
    res.status(500).json({
      success: false,
      message: '獲取狀態失敗',
    });
  }
});

// 解除 Google 帳號連結
router.delete('/google/unlink', async (req: Request, res: Response): Promise<void> => {
  try {
    // 這裡需要添加認證中介軟體
    // 暫時返回成功響應
    res.json({
      success: true,
      message: 'Google 帳號連結已解除',
    });
  } catch (error) {
    logger.error('解除 Google 帳號連結失敗', { error });
    res.status(500).json({
      success: false,
      message: '解除連結失敗',
    });
  }
});

export { router as oauthRoutes };