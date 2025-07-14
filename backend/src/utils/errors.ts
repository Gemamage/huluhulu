/**
 * 錯誤代碼枚舉
 */
export enum ErrorCode {
  // 通用錯誤
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // 驗證錯誤
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 認證錯誤
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // 授權錯誤
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // 資源錯誤
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 業務邏輯錯誤
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // 外部服務錯誤
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // 速率限制
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * 錯誤詳情介面
 */
export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  code?: string;
  [key: string]: any;
}

/**
 * 自定義錯誤類別
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: ErrorCode;
  public readonly details?: ErrorDetails[];
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: ErrorDetails[],
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // 確保錯誤堆疊追蹤正確
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 轉換為 JSON 格式
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
    };
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(
    message: string = '輸入資料驗證失敗',
    details?: ErrorDetails[]
  ) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * 認證錯誤
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = '認證失敗',
    errorCode: ErrorCode = ErrorCode.AUTHENTICATION_FAILED
  ) {
    super(message, 401, errorCode);
  }
}

/**
 * 授權錯誤
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = '權限不足',
    errorCode: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS
  ) {
    super(message, 403, errorCode);
  }
}

/**
 * 禁止訪問錯誤（AuthorizationError 的別名）
 */
export class ForbiddenError extends AuthorizationError {
  constructor(message: string = '禁止訪問') {
    super(message, ErrorCode.ACCESS_DENIED);
  }
}

/**
 * 資源未找到錯誤
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = '資源未找到',
    details?: ErrorDetails[]
  ) {
    super(message, 404, ErrorCode.RESOURCE_NOT_FOUND, details);
  }
}

/**
 * 衝突錯誤
 */
export class ConflictError extends AppError {
  constructor(
    message: string = '資源衝突',
    details?: ErrorDetails[]
  ) {
    super(message, 409, ErrorCode.RESOURCE_CONFLICT, details);
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = '請求過於頻繁',
    details?: ErrorDetails[]
  ) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, details);
  }
}

/**
 * 內部伺服器錯誤
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = '內部伺服器錯誤',
    details?: ErrorDetails[]
  ) {
    super(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, details, false);
  }
}

/**
 * 服務不可用錯誤
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = '服務暫時不可用',
    details?: ErrorDetails[]
  ) {
    super(message, 503, ErrorCode.SERVICE_UNAVAILABLE, details, false);
  }
}

/**
 * 業務邏輯錯誤
 */
export class BusinessRuleError extends AppError {
  constructor(
    message: string,
    details?: ErrorDetails[]
  ) {
    super(message, 400, ErrorCode.BUSINESS_RULE_VIOLATION, details);
  }
}

/**
 * 外部服務錯誤
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = '外部服務錯誤',
    details?: ErrorDetails[]
  ) {
    super(message, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, details, false);
  }
}

/**
 * 資料庫錯誤
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = '資料庫操作失敗',
    details?: ErrorDetails[]
  ) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
  }
}

/**
 * 錯誤工廠函數
 */
export class ErrorFactory {
  /**
   * 創建驗證錯誤
   */
  static createValidationError(
    message: string = '輸入資料驗證失敗',
    field?: string,
    value?: any,
    constraint?: string
  ): ValidationError {
    const details: ErrorDetails[] = [];
    if (field) {
      details.push({ field, value, constraint });
    }
    return new ValidationError(message, details);
  }

  /**
   * 創建認證錯誤
   */
  static createAuthenticationError(
    type: 'invalid_credentials' | 'invalid_token' | 'token_expired' = 'invalid_credentials'
  ): AuthenticationError {
    const messages = {
      invalid_credentials: '用戶名或密碼錯誤',
      invalid_token: '無效的認證令牌',
      token_expired: '認證令牌已過期',
    };
    
    const errorCodes = {
      invalid_credentials: ErrorCode.INVALID_CREDENTIALS,
      invalid_token: ErrorCode.INVALID_TOKEN,
      token_expired: ErrorCode.TOKEN_EXPIRED,
    };

    return new AuthenticationError(messages[type], errorCodes[type]);
  }

  /**
   * 創建資源未找到錯誤
   */
  static createNotFoundError(
    resource: string,
    identifier?: string | number
  ): NotFoundError {
    const message = identifier 
      ? `${resource} (${identifier}) 未找到`
      : `${resource} 未找到`;
    
    const details: ErrorDetails[] = [{
      resource,
      identifier,
    }];

    return new NotFoundError(message, details);
  }

  /**
   * 創建衝突錯誤
   */
  static createConflictError(
    resource: string,
    field: string,
    value: any
  ): ConflictError {
    const message = `${resource} 的 ${field} 已存在`;
    const details: ErrorDetails[] = [{
      resource,
      field,
      value,
      constraint: 'unique',
    }];

    return new ConflictError(message, details);
  }

  /**
   * 創建速率限制錯誤
   */
  static createRateLimitError(
    message: string = '請求過於頻繁，請稍後再試',
    details?: ErrorDetails[]
  ): RateLimitError {
    return new RateLimitError(message, details);
  }

  /**
   * 從 Mongoose 錯誤創建 AppError
   */
  static fromMongooseError(error: any): AppError {
    if (error.name === 'ValidationError') {
      const details: ErrorDetails[] = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        value: err.value,
        constraint: err.kind,
        message: err.message,
      }));
      return new ValidationError('資料驗證失敗', details);
    }

    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      if (field) {
        const value = error.keyValue[field];
        return ErrorFactory.createConflictError('資源', field, value);
      }
      return new ConflictError('資源衝突');
    }

    if (error.name === 'CastError') {
      const details: ErrorDetails[] = [{
        field: error.path,
        value: error.value,
        constraint: 'type',
        message: '無效的資料格式',
      }];
      return new ValidationError('無效的資料格式', details);
    }

    return new DatabaseError(error.message);
  }

  /**
   * 從 Zod 錯誤創建 ValidationError
   */
  static fromZodError(error: any): ValidationError {
    const details: ErrorDetails[] = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      value: err.received,
      constraint: err.code,
      message: err.message,
    }));
    return new ValidationError('輸入資料驗證失敗', details);
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

/**
 * 格式化錯誤響應
 */
export const formatErrorResponse = (
  error: AppError,
  includeStack: boolean = false
) => {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
    },
  };

  if (error.details && error.details.length > 0) {
    response.error.details = error.details;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * 錯誤日誌格式化
 */
export const formatErrorForLogging = (
  error: Error,
  context?: Record<string, any>
) => {
  const logData: any = {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };

  if (error instanceof AppError) {
    logData.errorCode = error.errorCode;
    logData.statusCode = error.statusCode;
    logData.isOperational = error.isOperational;
    logData.details = error.details;
  }

  if (context) {
    logData.context = context;
  }

  return logData;
};