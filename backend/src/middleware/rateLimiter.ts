import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { ErrorFactory } from "../utils/errors";
import { logger } from "../utils/logger";

// 基礎速率限制配置
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "請求過於頻繁，請稍後再試",
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator:
      options.keyGenerator ||
      ((req: Request) => {
        // 優先使用用戶 ID，其次使用 IP 地址
        return req.user?.id || req.ip || "unknown";
      }),
    handler: (req: Request, res: Response) => {
      const error = ErrorFactory.createRateLimitError(
        options.message || "請求過於頻繁，請稍後再試",
      );

      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        userAgent: req.get("User-Agent"),
      });

      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.errorCode,
          statusCode: error.statusCode,
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 一般 API 速率限制 (每 15 分鐘 100 次請求)
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100,
  message: "請求過於頻繁，請在 15 分鐘後再試",
});

// 認證相關速率限制 (每 15 分鐘 5 次請求)
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5,
  message: "登入嘗試過於頻繁，請在 15 分鐘後再試",
  skipSuccessfulRequests: true, // 成功的請求不計入限制
});

// 密碼重設速率限制 (每小時 3 次請求)
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 3,
  message: "密碼重設請求過於頻繁，請在 1 小時後再試",
});

// 電子郵件驗證速率限制 (每 5 分鐘 3 次請求)
export const emailVerificationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 3,
  message: "驗證郵件發送過於頻繁，請在 5 分鐘後再試",
});

// 檔案上傳速率限制 (每分鐘 10 次請求)
export const fileUploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 分鐘
  max: 10,
  message: "檔案上傳過於頻繁，請稍後再試",
});

// 搜尋 API 速率限制 (每分鐘 30 次請求)
export const searchRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 分鐘
  max: 30,
  message: "搜尋請求過於頻繁，請稍後再試",
});

// AI 服務速率限制 (每分鐘 5 次請求)
export const aiServiceRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 分鐘
  max: 5,
  message: "AI 服務請求過於頻繁，請稍後再試",
});

// 嚴格的速率限制 (每分鐘 1 次請求) - 用於敏感操作
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 分鐘
  max: 1,
  message: "此操作每分鐘只能執行一次",
});

// 基於 IP 的速率限制 (忽略用戶認證狀態)
export const ipBasedRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 200,
  message: "來自此 IP 的請求過於頻繁",
  keyGenerator: (req: Request) => req.ip || "unknown",
});

// 動態速率限制 - 根據用戶類型調整限制
export const dynamicRateLimit = (options: {
  guestMax: number;
  userMax: number;
  premiumMax: number;
  windowMs: number;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: (req: Request) => {
      if (!req.user) return options.guestMax;
      // 暫時使用 admin 角色作為 premium 用戶的判斷
      if (req.user.role === "admin") return options.premiumMax;
      return options.userMax;
    },
    message: "請求過於頻繁，請稍後再試",
    keyGenerator: (req: Request) => {
      return req.user?.id || req.ip || "unknown";
    },
    handler: (req: Request, res: Response) => {
      const error =
        ErrorFactory.createRateLimitError("請求過於頻繁，請稍後再試");

      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        userAgent: req.get("User-Agent"),
      });

      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.errorCode,
          statusCode: error.statusCode,
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 導出速率限制工具函數
export const createCustomRateLimit = createRateLimiter;
