import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './environment';
import { IUser, User } from '../models/User';
import { logger } from '../utils/logger';

// 序列化用戶 - 將用戶 ID 存儲到 session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// 反序列化用戶 - 從 session 中的 ID 獲取完整用戶資料
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error('用戶反序列化失敗', { error, userId: id });
    done(error, null);
  }
});

// Google OAuth 策略配置
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth 回調觸發', { 
          profileId: profile.id, 
          email: profile.emails?.[0]?.value 
        });

        // 檢查是否已存在該 Google 帳號的用戶
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails?.[0]?.value }
          ]
        });

        if (user) {
          // 如果用戶存在但沒有 Google ID，則更新
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isEmailVerified = true; // Google 帳號預設已驗證
            await user.save();
            logger.info('現有用戶已連結 Google 帳號', { userId: user._id, googleId: profile.id });
          }
          
          // 更新最後登入時間
          user.lastLoginAt = new Date();
          await user.save();
          
          return done(null, user);
        }

        // 創建新用戶
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.name?.givenName || 'Google 用戶';
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          logger.error('Google 帳號缺少電子郵件', { profileId: profile.id });
          return done(new Error('無法從 Google 帳號獲取電子郵件地址'), false);
        }

        user = new User({
          email: email,
          name,
          avatar,
          googleId: profile.id,
          isEmailVerified: true, // Google 帳號預設已驗證
          password: Math.random().toString(36).slice(-8), // 生成隨機密碼（不會被使用）
          lastLoginAt: new Date(),
          authProvider: 'google',
          privacySettings: {
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
          },
        });

        await user.save();
        logger.info('新 Google 用戶創建成功', { userId: user._id, email, googleId: profile.id });

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth 處理失敗', { error, profileId: profile.id });
        return done(error, false);
      }
    }
  )
);

export default passport;