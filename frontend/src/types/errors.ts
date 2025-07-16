// 錯誤處理相關類型定義
// 提供統一的錯誤處理機制和錯誤類型

// 基礎錯誤介面
export interface BaseError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// API 錯誤類型
export enum ApiErrorCode {
  // 網路相關錯誤
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // 認證相關錯誤
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // 資源相關錯誤
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  
  // 驗證相關錯誤
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 業務邏輯錯誤
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // 服務相關錯誤
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ELASTICSEARCH_ERROR = 'ELASTICSEARCH_ERROR',
  
  // 檔案相關錯誤
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // 未知錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// API 錯誤類別
export class ApiError extends Error implements BaseError {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly statusCode?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: any,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.statusCode = statusCode;
    
    // 確保錯誤堆疊正確顯示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // 轉換為 JSON 格式
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      statusCode: this.statusCode,
      stack: this.stack
    };
  }

  // 檢查是否為特定錯誤類型
  isType(code: ApiErrorCode): boolean {
    return this.code === code;
  }

  // 檢查是否為網路相關錯誤
  isNetworkError(): boolean {
    return [
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.TIMEOUT_ERROR,
      ApiErrorCode.CONNECTION_ERROR
    ].includes(this.code as ApiErrorCode);
  }

  // 檢查是否為認證相關錯誤
  isAuthError(): boolean {
    return [
      ApiErrorCode.UNAUTHORIZED,
      ApiErrorCode.FORBIDDEN,
      ApiErrorCode.TOKEN_EXPIRED,
      ApiErrorCode.INVALID_CREDENTIALS
    ].includes(this.code as ApiErrorCode);
  }

  // 檢查是否為驗證相關錯誤
  isValidationError(): boolean {
    return [
      ApiErrorCode.VALIDATION_ERROR,
      ApiErrorCode.INVALID_INPUT,
      ApiErrorCode.MISSING_REQUIRED_FIELD
    ].includes(this.code as ApiErrorCode);
  }
}

// 錯誤處理結果
export interface ErrorHandlingResult {
  shouldRetry: boolean;
  retryDelay?: number;
  userMessage: string;
  logLevel: 'error' | 'warn' | 'info';
  shouldRedirect?: string;
}

// 錯誤處理配置
export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableUserNotification: boolean;
}

// 預設錯誤訊息映射
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.NETWORK_ERROR]: '網路連線發生問題，請檢查您的網路連線',
  [ApiErrorCode.TIMEOUT_ERROR]: '請求逾時，請稍後再試',
  [ApiErrorCode.CONNECTION_ERROR]: '無法連接到服務器，請稍後再試',
  
  [ApiErrorCode.UNAUTHORIZED]: '您需要登入才能執行此操作',
  [ApiErrorCode.FORBIDDEN]: '您沒有權限執行此操作',
  [ApiErrorCode.TOKEN_EXPIRED]: '登入已過期，請重新登入',
  [ApiErrorCode.INVALID_CREDENTIALS]: '帳號或密碼錯誤',
  
  [ApiErrorCode.NOT_FOUND]: '找不到請求的資源',
  [ApiErrorCode.RESOURCE_EXISTS]: '資源已存在',
  [ApiErrorCode.RESOURCE_DELETED]: '資源已被刪除',
  
  [ApiErrorCode.VALIDATION_ERROR]: '輸入資料格式不正確',
  [ApiErrorCode.INVALID_INPUT]: '輸入資料無效',
  [ApiErrorCode.MISSING_REQUIRED_FIELD]: '缺少必填欄位',
  
  [ApiErrorCode.BUSINESS_RULE_VIOLATION]: '操作違反業務規則',
  [ApiErrorCode.OPERATION_NOT_ALLOWED]: '不允許執行此操作',
  [ApiErrorCode.QUOTA_EXCEEDED]: '已超過使用限額',
  
  [ApiErrorCode.SERVER_ERROR]: '服務器發生錯誤，請稍後再試',
  [ApiErrorCode.SERVICE_UNAVAILABLE]: '服務暫時無法使用，請稍後再試',
  [ApiErrorCode.DATABASE_ERROR]: '資料庫操作失敗',
  [ApiErrorCode.ELASTICSEARCH_ERROR]: '搜尋服務發生錯誤',
  
  [ApiErrorCode.FILE_TOO_LARGE]: '檔案大小超過限制',
  [ApiErrorCode.INVALID_FILE_TYPE]: '不支援的檔案類型',
  [ApiErrorCode.UPLOAD_FAILED]: '檔案上傳失敗',
  
  [ApiErrorCode.UNKNOWN_ERROR]: '發生未知錯誤，請稍後再試'
};