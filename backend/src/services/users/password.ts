import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IUser } from "../../models/User";
import { UserRepository } from "../../repositories/UserRepository";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { validatePassword } from "../../utils/validation";
import { EmailService } from "../emailService";

/**
 * 密碼管理服務 - 處理密碼變更、重設等功能
 */
export class PasswordService {
  private userRepository: UserRepository;
  private emailService: EmailService;

  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
  }

  /**
   * 變更密碼
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      // 驗證新密碼
      if (!validatePassword(newPassword)) {
        throw new ValidationError("新密碼必須至少8位，包含字母和數字");
      }

      // 獲取用戶（包含密碼）
      const user = await this.userRepository.findByIdWithPassword(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      // 驗證當前密碼
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new ValidationError("當前密碼錯誤");
      }

      // 檢查新密碼是否與當前密碼相同
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new ValidationError("新密碼不能與當前密碼相同");
      }

      // 更新密碼
      await this.userRepository.updatePassword(userId, newPassword);

      logger.info("用戶密碼變更成功", { userId });

      // 發送密碼變更通知郵件
      try {
        await this.emailService.sendPasswordChangeNotification(
          user.email,
          user.name,
        );
      } catch (emailError) {
        logger.warn("密碼變更通知郵件發送失敗", { error: emailError, userId });
      }
    } catch (error) {
      logger.error("變更密碼失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 請求密碼重設
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // 查找用戶
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // 為了安全考慮，即使用戶不存在也返回成功
        logger.info("密碼重設請求 - 用戶不存在", { email });
        return;
      }

      // 檢查帳號狀態
      if (!user.isActive) {
        throw new ValidationError("帳號已被停用，無法重設密碼");
      }

      // 生成重設令牌
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小時後過期

      // 保存重設令牌
      await this.userRepository.updateWithValidation(user._id.toString(), {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // 發送重設郵件
      await this.emailService.sendPasswordResetEmail(
        email,
        user.name,
        resetToken,
      );

      logger.info("密碼重設郵件發送成功", { userId: user._id, email });
    } catch (error) {
      logger.error("請求密碼重設失敗", { error, email });
      throw error;
    }
  }

  /**
   * 重設密碼
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 驗證新密碼
      if (!validatePassword(newPassword)) {
        throw new ValidationError("密碼必須至少8位，包含字母和數字");
      }

      // 查找有效的重設令牌
      const user = await this.userRepository.findByResetToken(token);
      if (!user) {
        throw new ValidationError("無效或已過期的重設令牌");
      }

      // 檢查令牌是否過期
      if (
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
      ) {
        throw new ValidationError("重設令牌已過期");
      }

      // 更新密碼並清除重設令牌
      await this.userRepository.updateWithValidation(user._id.toString(), {
        password: await bcrypt.hash(newPassword, 12),
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });

      logger.info("密碼重設成功", { userId: user._id });

      // 發送密碼重設成功通知
      try {
        await this.emailService.sendPasswordResetSuccessNotification(
          user.email,
          user.name,
        );
      } catch (emailError) {
        logger.warn("密碼重設成功通知郵件發送失敗", {
          error: emailError,
          userId: user._id,
        });
      }
    } catch (error) {
      logger.error("重設密碼失敗", { error, token });
      throw error;
    }
  }

  /**
   * 驗證密碼重設令牌
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByResetToken(token);

      if (
        !user ||
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
      ) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("驗證重設令牌失敗", { error, token });
      return false;
    }
  }

  /**
   * 清理過期的密碼重設令牌
   */
  async cleanupExpiredResetTokens(): Promise<{ deletedCount: number }> {
    try {
      const result =
        await this.userRepository.cleanupExpiredPasswordResetTokens();

      logger.info("清理過期密碼重設令牌成功", {
        deletedCount: result.deletedCount,
      });
      return result;
    } catch (error) {
      logger.error("清理過期密碼重設令牌失敗", { error });
      throw error;
    }
  }
}
