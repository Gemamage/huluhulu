import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import {
  AppError,
  NotFoundError,
  ServiceUnavailableError,
  ErrorFactory,
  formatErrorResponse,
  formatErrorForLogging,
  isOperationalError,
  ErrorCode,
  InternalServerError,
} from '../utils/errors';
import { ZodError } from 'zod';

// 錯誤處理中介軟體
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // 建立請求上下文
  const requestContext = {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  // 轉換不同類型的錯誤為 AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = ErrorFactory.fromZodError(error);
  } else if (error.name === 'ValidationError') {
    // Mongoose 驗證錯誤
    appError = ErrorFactory.fromMongooseError(error);
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    // Mongoose 重複鍵錯誤
    appError = ErrorFactory.fromMongooseError(error);
  } else if (error.name === 'CastError') {
    // Mongoose CastError
    appError = ErrorFactory.fromMongooseError(error);
  } else if (error.name === 'JsonWebTokenError') {
    appError = ErrorFactory.createAuthenticationError('invalid_token');
  } else if (error.name === 'TokenExpiredError') {
    appError = ErrorFactory.createAuthenticationError('token_expired');
  } else if (error.name === 'MulterError') {
    // 檔案上傳錯誤
    appError = new AppError(
      '檔案上傳失敗: ' + error.message,
      400,
      ErrorCode.VALIDATION_ERROR
    );
  } else {
    // 未知錯誤，轉換為內部伺服器錯誤
    appError = new InternalServerError(
      config.env === 'development' ? error.message : '內部伺服器錯誤'
    );
  }

  // 記錄錯誤
  const logData = formatErrorForLogging(appError, requestContext);
  
  if (isOperationalError(appError)) {
    logger.warn('操作性錯誤:', logData);
  } else {
    logger.error('系統錯誤:', logData);
  }

  // 格式化錯誤響應
  const errorResponse = formatErrorResponse(
    appError,
    config.env === 'development'
  );

  // 添加請求路徑和方法到響應中
  errorResponse.error.path = req.path;
  errorResponse.error.method = req.method;

  // 發送錯誤回應
  res.status(appError.statusCode).json(errorResponse);
};

// 非同步錯誤處理包裝器
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 錯誤處理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`路由 ${req.originalUrl} 不存在`);
  next(error);
};

export default errorHandler;