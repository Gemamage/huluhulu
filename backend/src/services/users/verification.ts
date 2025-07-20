import mongoose from 'mongoose';
import crypto from 'crypto';
import { IUser } from '../../models/User';
import { UserRepository } from '../../repositories/UserRepository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { EmailService } from '../emailService';

/**
 * 郵件驗證服務 - 處理郵件驗證相關功能
 */
export class VerificationService {
  private userRepository: UserRepository;
  private emailService: EmailService;

  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
  }

  /**
   * 發送郵件驗證
   */
  async sendEmailVerification(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      // 檢查是否已經驗證
      if (user.isEmailVerified) {
        throw new ValidationError('郵箱已經驗證過了');
      }

      // 檢查帳號狀態
      if (!user.isActive) {
        throw new ValidationError('帳號已被停用');
      }

      // 生成驗證令牌
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小時後過期

      // 保存驗證令牌
      await this.userRepository.updateWithValidation(userId, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // 發送驗證郵件
      await this.emailService.sendEmailVerification(user.email, user.name, verificationToken);

      logger.info('郵件驗證發送成功', { userId, email: user.email });
    } catch (error) {
      logger.error('發送郵件驗證失敗', { error, userId });
      throw error;
    }
  }

  /**
   * 驗證郵箱（通過用戶ID）
   */
  async verifyEmailByUserId(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      // 檢查是否已經驗證
      if (user.isEmailVerified) {
        throw new ValidationError('郵箱已經驗證過了');
      }

      // 更新驗證狀態
      await this.userRepository.updateWithValidation(userId, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
      });

      logger.info('郵箱驗證成功', { userId });

      // 發送歡迎郵件
      try {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        logger.warn('歡迎郵件發送失敗', { error: emailError, userId });
      }
    } catch (error) {
      logger.error('郵箱驗證失敗', { error, userId });
      throw error;
    }
  }

  /**
   * 驗證郵箱（通過令牌）
   */
  async verifyEmailByToken(token: string): Promise<void> {
    try {
      // 查找有效的驗證令牌
      const user = await this.userRepository.findByVerificationToken(token);
      if (!user) {
        throw new ValidationError('無效或已過期的驗證令牌');
      }

      // 檢查令牌是否過期
      if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        throw new ValidationError('驗證令牌已過期');
      }

      // 檢查是否已經驗證
      if (user.isEmailVerified) {
        throw new ValidationError('郵箱已經驗證過了');
      }

      // 更新驗證狀態
      await this.userRepository.updateWithValidation(user._id.toString(), {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
      });

      logger.info('郵箱驗證成功', { userId: user._id, email: user.email });

      // 發送歡迎郵件
      try {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        logger.warn('歡迎郵件發送失敗', { error: emailError, userId: user._id });
      }
    } catch (error) {
      logger.error('通過令牌驗證郵箱失敗', { error, token });
      throw error;
    }
  }

  /**
   * 重新發送驗證郵件
   */
  async resendEmailVerification(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // 為了安全考慮，即使用戶不存在也返回成功
        logger.info('重新發送驗證郵件 - 用戶不存在', { email });
        return;
      }

      // 檢查是否已經驗證
      if (user.isEmailVerified) {
        throw new ValidationError('郵箱已經驗證過了');
      }

      // 檢查帳號狀態
      if (!user.isActive) {
        throw new ValidationError('帳號已被停用');
      }

      // 檢查是否在冷卻期內（防止濫用）
      const lastSent = user.emailVerificationExpires;
      if (lastSent && lastSent > new Date(Date.now() - 5 * 60 * 1000)) {
        throw new ValidationError('請等待5分鐘後再重新發送驗證郵件');
      }

      // 生成新的驗證令牌
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小時後過期

      // 更新驗證令牌
      await this.userRepository.updateWithValidation(user._id.toString(), {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // 發送驗證郵件
      await this.emailService.sendEmailVerification(email, user.name, verificationToken);

      logger.info('重新發送驗證郵件成功', { userId: user._id, email });
    } catch (error) {
      logger.error('重新發送驗證郵件失敗', { error, email });
      throw error;
    }
  }

  /**
   * 驗證郵件驗證令牌
   */
  async validateVerificationToken(token: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByVerificationToken(token);
      
      if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('驗證郵件驗證令牌失敗', { error, token });
      return false;
    }
  }

  /**
   * 清理過期的郵件驗證令牌
   */
  async cleanupExpiredVerificationTokens(): Promise<{ deletedCount: number }> {
    try {
      const result = await this.userRepository.cleanupExpiredEmailVerificationTokens();
      
      logger.info('清理過期郵件驗證令牌成功', { deletedCount: result.deletedCount });
      return result;
    } catch (error) {
      logger.error('清理過期郵件驗證令牌失敗', { error });
      throw error;
    }
  }

  /**
   * 獲取用戶驗證狀態
   */
  async getVerificationStatus(userId: string): Promise<{
    isEmailVerified: boolean;
    hasVerificationToken: boolean;
    tokenExpires?: Date;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      return {
        isEmailVerified: user.isEmailVerified,
        hasVerificationToken: !!user.emailVerificationToken,
        tokenExpires: user.emailVerificationExpires,
      };
    } catch (error) {
      logger.error('獲取驗證狀態失敗', { error, userId });
      throw error;
    }
  }
}