/**
 * 自定義錯誤類別
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // 確保錯誤堆疊追蹤正確
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string = '輸入資料驗證失敗') {
    super(message, 400);
  }
}

/**
 * 認證錯誤
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗') {
    super(message, 401);
  }
}

/**
 * 授權錯誤
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '權限不足') {
    super(message, 403);
  }
}

/**
 * 資源未找到錯誤
 */
export class NotFoundError extends AppError {
  constructor(message: string = '資源未找到') {
    super(message, 404);
  }
}

/**
 * 衝突錯誤
 */
export class ConflictError extends AppError {
  constructor(message: string = '資源衝突') {
    super(message, 409);
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends AppError {
  constructor(message: string = '請求過於頻繁') {
    super(message, 429);
  }
}

/**
 * 內部伺服器錯誤
 */
export class InternalServerError extends AppError {
  constructor(message: string = '內部伺服器錯誤') {
    super(message, 500, false);
  }
}

/**
 * 服務不可用錯誤
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = '服務暫時不可用') {
    super(message, 503, false);
  }
}

/**
 * 檢查錯誤是否為操作性錯誤
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};