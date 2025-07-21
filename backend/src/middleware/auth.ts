import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { config } from "../config/environment";
import { AuthenticationError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

// 擴展 Request 介面以包含用戶資訊
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

// JWT 令牌載荷介面
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * 認證中介軟體 - 驗證 JWT 令牌
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 從請求標頭中獲取令牌
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("請提供有效的認證令牌");
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前綴

    if (!token) {
      throw new AuthenticationError("認證令牌不能為空");
    }

    // 驗證令牌
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 查找用戶
    const user = await User.findById(decoded.id).select("+password");

    if (!user) {
      throw new AuthenticationError("用戶不存在");
    }

    if (!user.isActive) {
      throw new AuthenticationError("用戶帳號已被停用");
    }

    // 將用戶資訊附加到請求物件
    req.user = user as IUser;

    logger.debug("用戶認證成功", { userId: user._id, email: user.email });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("無效的 JWT 令牌", { error: error.message });
      next(new AuthenticationError("無效的認證令牌"));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn("JWT 令牌已過期", { error: error.message });
      next(new AuthenticationError("認證令牌已過期"));
    } else {
      logger.error("認證中介軟體錯誤", { error });
      next(error);
    }
  }
};

/**
 * 可選認證中介軟體 - 如果有令牌則驗證，沒有則繼續
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // 沒有令牌，繼續執行
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next(); // 空令牌，繼續執行
    }

    // 驗證令牌
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 查找用戶
    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user as IUser;
      logger.debug("可選認證成功", { userId: user._id, email: user.email });
    }

    next();
  } catch (error) {
    // 可選認證失敗時不拋出錯誤，只記錄日誌
    logger.debug("可選認證失敗", {
      error: error instanceof Error ? error.message : error,
    });
    next();
  }
};

/**
 * 角色授權中介軟體
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError("請先登入"));
      return;
    }

    if (!roles.includes((req.user as IUser).role)) {
      logger.warn("用戶權限不足", {
        userId: (req.user as IUser)._id,
        userRole: (req.user as IUser).role,
        requiredRoles: roles,
      });
      next(new AuthenticationError("權限不足"));
      return;
    }

    logger.debug("用戶授權成功", {
      userId: (req.user as IUser)._id,
      userRole: (req.user as IUser).role,
      requiredRoles: roles,
    });

    next();
  };
};

/**
 * 驗證用戶是否為資源擁有者或管理員
 */
export const authorizeOwnerOrAdmin = (getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError("請先登入"));
      return;
    }

    const resourceUserId = getUserId(req);
    const currentUserId = (req.user as IUser)._id.toString();

    // 檢查是否為資源擁有者或管理員
    if (
      currentUserId !== resourceUserId &&
      (req.user as IUser).role !== "admin"
    ) {
      logger.warn("用戶嘗試存取非自己的資源", {
        currentUserId,
        resourceUserId,
        userRole: (req.user as IUser).role,
      });
      next(new AuthenticationError("只能存取自己的資源"));
      return;
    }

    logger.debug("資源存取授權成功", {
      currentUserId,
      resourceUserId,
      userRole: (req.user as IUser).role,
    });

    next();
  };
};

/**
 * 驗證電子郵件是否已驗證
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new AuthenticationError("請先登入"));
    return;
  }

  if (!(req.user as IUser).isEmailVerified) {
    logger.warn("用戶嘗試存取需要電子郵件驗證的資源", {
      userId: (req.user as IUser)._id,
      email: (req.user as IUser).email,
    });
    next(new ValidationError("請先驗證您的電子郵件地址"));
    return;
  }

  next();
};
