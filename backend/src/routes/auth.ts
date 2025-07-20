import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { ErrorFactory } from "../utils/errors";
import { ResponseUtil } from "../utils/response";
import { validateRequest, validateParams } from "../utils/validation";
import {
  userRegistrationSchema,
  userLoginSchema,
  forgotPasswordSchema,
  passwordResetSchema,
  verifyEmailParamsSchema,
  resendVerificationEmailSchema,
} from "../schemas/auth";
import { UserService } from "../services/userService";
import { EmailService } from "../services/emailService";
import { VerificationService } from "../services/verificationService";
import { authenticate } from "../middleware/auth";
import {
  requireActiveAccount,
  requireEmailVerification,
} from "../middleware/rbac";
import { IUser } from "../models/User";
import { asyncHandler } from "../middleware/error-handler";

const router = Router();
const userService = new UserService();

// 用戶註冊
router.post(
  "/register",
  validateRequest(userRegistrationSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, phone } = req.body;
    const userData = { email, password, name, phone };

    // 註冊用戶（UserService 內部會檢查電子郵件是否已存在）
    const result = await userService.registerUser(userData);

    logger.info("用戶註冊成功", { email, name, userId: result.user._id });

    ResponseUtil.created(
      res,
      {
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
          isEmailVerified: result.user.isEmailVerified,
        },
      },
      "註冊成功，請檢查您的電子郵件以驗證帳號",
    );
  }),
);

// 用戶登入
router.post(
  "/login",
  validateRequest(userLoginSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const loginData = { email, password };

    // 用戶登入
    const { user, token } = await userService.loginUser(loginData);

    logger.info("用戶登入成功", { email, userId: user._id });

    ResponseUtil.success(
      res,
      {
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
      "登入成功",
    );
  }),
);

// 用戶登出
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as IUser)?._id?.toString();

    // TODO: 實作令牌黑名單機制（可選）
    // 目前採用客戶端刪除令牌的方式

    logger.info("用戶登出成功", { userId });

    ResponseUtil.success(res, null, "登出成功");
  }),
);

// 刷新令牌
router.post(
  "/refresh",
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as IUser)?._id?.toString();

    if (!userId) {
      throw ErrorFactory.createAuthenticationError("invalid_token");
    }

    // 獲取用戶資料
    const user = await userService.getUserById(userId);
    if (!user) {
      throw ErrorFactory.createNotFoundError("用戶", userId);
    }

    // 生成新令牌
    const newToken = user.generateAuthToken();

    logger.info("令牌刷新成功", { userId });

    ResponseUtil.success(
      res,
      {
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
      "令牌刷新成功",
    );
  }),
);

// 忘記密碼
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    // 查找用戶
    const user = await userService.getUserByEmail(email);
    if (!user) {
      // 為了安全考量，即使用戶不存在也返回成功訊息
      ResponseUtil.success(
        res,
        null,
        "如果該電子郵件地址存在於我們的系統中，您將收到密碼重設郵件",
      );
      return;
    }

    // 生成密碼重設令牌
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // 發送密碼重設郵件
    await EmailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name,
    );

    logger.info("密碼重設郵件已發送", { email, userId: user._id });

    ResponseUtil.success(res, null, "密碼重設郵件已發送，請檢查您的電子郵件");
  }),
);

// 重設密碼
router.post(
  "/reset-password",
  validateRequest(passwordResetSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    // 重設密碼
    await userService.resetPassword(token, newPassword);

    logger.info("密碼重設成功");

    ResponseUtil.success(res, null, "密碼重設成功，請使用新密碼登入");
  }),
);

// 獲取當前用戶資訊
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as IUser)?._id.toString();

    if (!userId) {
      throw ErrorFactory.createAuthenticationError("invalid_token");
    }

    // 獲取用戶資訊
    const user = await userService.getUserById(userId);
    if (!user) {
      throw ErrorFactory.createNotFoundError("用戶", userId);
    }

    logger.info("獲取用戶資訊成功", { userId });

    ResponseUtil.success(res, {
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
    });
  }),
);

// 電子郵件驗證
router.get(
  "/verify-email/:token",
  validateParams(verifyEmailParamsSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;

    if (!token) {
      throw ErrorFactory.createValidationError("驗證令牌為必填項目");
    }

    // 使用新的驗證服務
    const result = await VerificationService.verifyEmailToken(token);

    if (result.success) {
      logger.info("電子郵件驗證成功", { token });
      ResponseUtil.success(
        res,
        result.user
          ? {
              user: {
                id: result.user._id,
                email: result.user.email,
                name: result.user.name,
                isEmailVerified: result.user.isEmailVerified,
              },
            }
          : null,
        result.message,
      );
    } else {
      throw ErrorFactory.createValidationError(result.message);
    }
  }),
);

// 重新發送驗證郵件（需要登入）
router.post(
  "/resend-verification",
  authenticate,
  requireActiveAccount,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    // 使用新的驗證服務
    const result = await VerificationService.resendVerificationEmail(
      user.email,
    );

    if (result.success) {
      logger.info("重新發送驗證郵件成功", {
        userId: user._id,
        email: user.email,
      });
      ResponseUtil.success(res, null, result.message);
    } else {
      throw ErrorFactory.createValidationError(result.message);
    }
  }),
);

// 重新發送驗證郵件
router.post(
  "/resend-verification",
  validateRequest(resendVerificationEmailSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    // 使用新的驗證服務
    const result = await VerificationService.resendVerificationEmail(email);

    if (result.success) {
      logger.info("重新發送驗證郵件成功", { email });
      ResponseUtil.success(res, null, result.message);
    } else {
      throw ErrorFactory.createValidationError(result.message);
    }
  }),
);

// 檢查驗證狀態
router.get(
  "/verification-status",
  authenticate,
  requireActiveAccount,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    const status = await VerificationService.checkVerificationStatus(user);

    ResponseUtil.success(res, {
      needsVerification: status.needsVerification,
      hasValidToken: status.hasValidToken,
      tokenExpiry: status.tokenExpiry,
      isEmailVerified: user.isEmailVerified,
    });
  }),
);

export { router as authRoutes };
