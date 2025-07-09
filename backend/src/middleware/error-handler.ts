import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

// 自定義錯誤類別
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 驗證錯誤類別
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// 認證錯誤類別
export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗') {
    super(message, 401);
  }
}

// 授權錯誤類別
export class AuthorizationError extends AppError {
  constructor(message: string = '權限不足') {
    super(message, 403);
  }
}

// 資源未找到錯誤類別
export class NotFoundError extends AppError {
  constructor(message: string = '資源未找到') {
    super(message, 404);
  }
}

// 衝突錯誤類別
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// 速率限制錯誤類別
export class RateLimitError extends AppError {
  constructor(message: string = '請求過於頻繁') {
    super(message, 429);
  }
}

// 錯誤處理中介軟體
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '伺服器內部錯誤';
  let details: any = undefined;

  // 記錄錯誤
  logger.error('錯誤處理中介軟體捕獲錯誤:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 處理自定義應用程式錯誤
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // 處理 Mongoose 驗證錯誤
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '資料驗證失敗';
    details = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  }
  // 處理 Mongoose 重複鍵錯誤
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = '資料已存在';
    const field = Object.keys((error as any).keyValue)[0];
    details = { field, message: `${field} 已被使用` };
  }
  // 處理 Mongoose CastError
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = '無效的資料格式';
    details = { field: (error as any).path, message: '無效的 ID 格式' };
  }
  // 處理 JWT 錯誤
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '無效的認證令牌';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '認證令牌已過期';
  }
  // 處理 Joi 驗證錯誤
  else if (error.name === 'ValidationError' && (error as any).isJoi) {
    statusCode = 400;
    message = '請求資料驗證失敗';
    details = (error as any).details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }

  // 建構錯誤回應
  const errorResponse: any = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // 在開發環境中包含更多錯誤詳情
  if (config.env === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = details;
  } else if (details) {
    errorResponse.error.details = details;
  }

  // 發送錯誤回應
  res.status(statusCode).json(errorResponse);
};

// 非同步錯誤處理包裝器
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 錯誤處理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`路由 ${req.originalUrl} 不存在`);
  next(error);
};

export default errorHandler;