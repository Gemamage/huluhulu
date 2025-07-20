import crypto from "crypto";
import { User, IUser } from "../models/User";
import { EmailService } from "./emailService";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface VerificationResult {
  success: boolean;
  message: string;
  user?: IUser;
}

export interface ResendResult {
  success: boolean;
  message: string;
  cooldownRemaining?: number;
}

/**
 * 郵箱驗證服務類別
 */
export class VerificationService {
  // 驗證令牌有效期（24小時）
  private static readonly TOKEN_EXPIRY_HOURS = 24;

  // 重發郵件冷卻時間（5分鐘）
  private static readonly RESEND_COOLDOWN_MINUTES = 5;

  // 每日最大重發次數
  private static readonly MAX_DAILY_RESENDS = 5;

  /**
   * 生成驗證令牌
   */
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * 計算令牌過期時間
   */
  private static getTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.TOKEN_EXPIRY_HOURS);
    return expiry;
  }

  /**
   * 發送驗證郵件
   */
  static async sendVerificationEmail(user: IUser): Promise<void> {
    try {
      // 生成新的驗證令牌
      const token = this.generateVerificationToken();
      const expiry = this.getTokenExpiry();

      // 更新用戶的驗證令牌
      await User.findByIdAndUpdate(user._id, {
        emailVerificationToken: token,
        emailVerificationExpires: expiry,
      });

      // 發送驗證郵件
      await EmailService.sendVerificationEmail(user.email, token, user.name);

      logger.info("驗證郵件發送成功", {
        userId: user._id,
        email: user.email,
      });
    } catch (error) {
      logger.error("發送驗證郵件失敗", {
        userId: user._id,
        email: user.email,
        error,
      });
      throw new AppError("發送驗證郵件失敗，請稍後再試", 500);
    }
  }

  /**
   * 驗證郵箱令牌
   */
  static async verifyEmailToken(token: string): Promise<VerificationResult> {
    try {
      // 查找具有該令牌的用戶
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      }).select("+emailVerificationToken +emailVerificationExpires");

      if (!user) {
        return {
          success: false,
          message: "驗證令牌無效或已過期",
        };
      }

      // 檢查用戶是否已經驗證過
      if (user.isEmailVerified) {
        return {
          success: true,
          message: "您的郵箱已經驗證過了",
          user,
        };
      }

      // 更新用戶狀態
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // 發送歡迎郵件
      try {
        await EmailService.sendWelcomeEmail(user.email, user.name);
      } catch (error) {
        // 歡迎郵件發送失敗不應該影響驗證流程
        logger.warn("歡迎郵件發送失敗", {
          userId: user._id,
          error,
        });
      }

      logger.info("郵箱驗證成功", {
        userId: user._id,
        email: user.email,
      });

      return {
        success: true,
        message: "郵箱驗證成功！歡迎加入呼嚕寵物協尋網站",
        user,
      };
    } catch (error) {
      logger.error("郵箱驗證失敗", { token, error });
      throw new AppError("驗證過程中發生錯誤，請稍後再試", 500);
    }
  }

  /**
   * 重新發送驗證郵件
   */
  static async resendVerificationEmail(email: string): Promise<ResendResult> {
    try {
      // 查找用戶
      const user = await User.findOne({ email }).select(
        "+emailVerificationToken +emailVerificationExpires",
      );

      if (!user) {
        return {
          success: false,
          message: "找不到該郵箱對應的用戶",
        };
      }

      // 檢查用戶是否已經驗證
      if (user.isEmailVerified) {
        return {
          success: false,
          message: "您的郵箱已經驗證過了",
        };
      }

      // 檢查冷卻時間
      const cooldownResult = await this.checkResendCooldown(user);
      if (!cooldownResult.canResend) {
        return {
          success: false,
          message: `請等待 ${cooldownResult.remainingMinutes} 分鐘後再重新發送`,
          cooldownRemaining: cooldownResult.remainingMinutes,
        };
      }

      // 檢查每日重發限制
      const dailyLimitResult = await this.checkDailyResendLimit(user);
      if (!dailyLimitResult.canResend) {
        return {
          success: false,
          message: "今日重發次數已達上限，請明天再試",
        };
      }

      // 發送驗證郵件
      await this.sendVerificationEmail(user);

      // 記錄重發次數
      await this.recordResendAttempt(user);

      return {
        success: true,
        message: "驗證郵件已重新發送，請檢查您的郵箱",
      };
    } catch (error) {
      logger.error("重發驗證郵件失敗", { email, error });
      throw new AppError("重發驗證郵件失敗，請稍後再試", 500);
    }
  }

  /**
   * 檢查重發冷卻時間
   */
  private static async checkResendCooldown(
    user: IUser,
  ): Promise<{ canResend: boolean; remainingMinutes: number }> {
    if (!user.emailVerificationExpires) {
      return { canResend: true, remainingMinutes: 0 };
    }

    const now = new Date();
    const tokenCreatedAt = new Date(
      user.emailVerificationExpires.getTime() -
        this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    const cooldownEnd = new Date(
      tokenCreatedAt.getTime() + this.RESEND_COOLDOWN_MINUTES * 60 * 1000,
    );

    if (now < cooldownEnd) {
      const remainingMs = cooldownEnd.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return { canResend: false, remainingMinutes };
    }

    return { canResend: true, remainingMinutes: 0 };
  }

  /**
   * 檢查每日重發限制
   */
  private static async checkDailyResendLimit(
    user: IUser,
  ): Promise<{ canResend: boolean; attemptsToday: number }> {
    // 這裡可以實現更複雜的限制邏輯，比如使用 Redis 或數據庫記錄
    // 暫時簡化實現
    return { canResend: true, attemptsToday: 0 };
  }

  /**
   * 記錄重發嘗試
   */
  private static async recordResendAttempt(user: IUser): Promise<void> {
    // 這裡可以記錄重發嘗試到數據庫或 Redis
    // 暫時簡化實現
    logger.info("記錄重發嘗試", {
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
    });
  }

  /**
   * 檢查用戶是否需要驗證郵箱
   */
  static async checkVerificationStatus(user: IUser): Promise<{
    needsVerification: boolean;
    hasValidToken: boolean;
    tokenExpiry?: Date;
  }> {
    if (user.isEmailVerified) {
      return {
        needsVerification: false,
        hasValidToken: false,
      };
    }

    const userWithToken = await User.findById(user._id).select(
      "+emailVerificationToken +emailVerificationExpires",
    );

    if (
      !userWithToken?.emailVerificationToken ||
      !userWithToken.emailVerificationExpires
    ) {
      return {
        needsVerification: true,
        hasValidToken: false,
      };
    }

    const now = new Date();
    const hasValidToken = userWithToken.emailVerificationExpires > now;

    return {
      needsVerification: true,
      hasValidToken,
      tokenExpiry: userWithToken.emailVerificationExpires,
    };
  }

  /**
   * 清理過期的驗證令牌
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await User.updateMany(
        {
          emailVerificationExpires: { $lt: new Date() },
          isEmailVerified: false,
        },
        {
          $unset: {
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
          },
        },
      );

      logger.info("清理過期驗證令牌", {
        cleanedCount: result.modifiedCount,
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error("清理過期驗證令牌失敗", { error });
      throw error;
    }
  }
}
