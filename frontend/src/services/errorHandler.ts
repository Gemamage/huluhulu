// 統一錯誤處理服務
// 提供錯誤分析、處理和用戶通知功能

import {
  ApiError,
  ApiErrorCode,
  ErrorHandlingResult,
  ErrorHandlerConfig,
  ERROR_MESSAGES,
} from '@/types/errors';

// 預設配置
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true,
  enableUserNotification: true,
};

class ErrorHandlerService {
  private config: ErrorHandlerConfig;
  private retryCount: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 從 HTTP 回應建立 ApiError
   */
  createErrorFromResponse(response: Response, details?: any): ApiError {
    const statusCode = response.status;
    let code: ApiErrorCode;
    let message: string;

    switch (statusCode) {
      case 400:
        code = ApiErrorCode.VALIDATION_ERROR;
        message = '請求資料格式不正確';
        break;
      case 401:
        code = ApiErrorCode.UNAUTHORIZED;
        message = '未授權的請求';
        break;
      case 403:
        code = ApiErrorCode.FORBIDDEN;
        message = '禁止存取';
        break;
      case 404:
        code = ApiErrorCode.NOT_FOUND;
        message = '找不到請求的資源';
        break;
      case 409:
        code = ApiErrorCode.RESOURCE_EXISTS;
        message = '資源衝突';
        break;
      case 422:
        code = ApiErrorCode.INVALID_INPUT;
        message = '輸入資料無效';
        break;
      case 429:
        code = ApiErrorCode.QUOTA_EXCEEDED;
        message = '請求過於頻繁';
        break;
      case 500:
        code = ApiErrorCode.SERVER_ERROR;
        message = '服務器內部錯誤';
        break;
      case 502:
      case 503:
        code = ApiErrorCode.SERVICE_UNAVAILABLE;
        message = '服務暫時無法使用';
        break;
      case 504:
        code = ApiErrorCode.TIMEOUT_ERROR;
        message = '請求逾時';
        break;
      default:
        code = ApiErrorCode.UNKNOWN_ERROR;
        message = `HTTP ${statusCode} 錯誤`;
    }

    return new ApiError(code, message, details, statusCode);
  }

  /**
   * 從網路錯誤建立 ApiError
   */
  createErrorFromNetworkError(error: Error): ApiError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new ApiError(ApiErrorCode.NETWORK_ERROR, '網路連線失敗', {
        originalError: error.message,
      });
    }

    if (error.name === 'AbortError') {
      return new ApiError(ApiErrorCode.TIMEOUT_ERROR, '請求被中止', {
        originalError: error.message,
      });
    }

    return new ApiError(ApiErrorCode.CONNECTION_ERROR, '連線錯誤', {
      originalError: error.message,
    });
  }

  /**
   * 處理錯誤並返回處理結果
   */
  handleError(error: Error | ApiError, context?: string): ErrorHandlingResult {
    let apiError: ApiError;

    // 轉換為 ApiError
    if (error instanceof ApiError) {
      apiError = error;
    } else {
      apiError = new ApiError(
        ApiErrorCode.UNKNOWN_ERROR,
        error.message || '未知錯誤',
        { originalError: error }
      );
    }

    // 記錄錯誤
    if (this.config.enableLogging) {
      this.logError(apiError, context);
    }

    // 分析錯誤並決定處理策略
    const result = this.analyzeError(apiError, context);

    // 用戶通知
    if (this.config.enableUserNotification) {
      this.notifyUser(result.userMessage, result.logLevel);
    }

    return result;
  }

  /**
   * 分析錯誤並決定處理策略
   */
  private analyzeError(error: ApiError, context?: string): ErrorHandlingResult {
    const contextKey = context || 'default';
    const currentRetries = this.retryCount.get(contextKey) || 0;

    // 決定是否應該重試
    const shouldRetry = this.shouldRetry(error, currentRetries);

    if (shouldRetry) {
      this.retryCount.set(contextKey, currentRetries + 1);
    } else {
      this.retryCount.delete(contextKey);
    }

    // 獲取用戶友好的錯誤訊息
    const userMessage = this.getUserMessage(error);

    // 決定日誌級別
    const logLevel = this.getLogLevel(error);

    // 決定是否需要重定向
    const shouldRedirect = this.getShouldRedirect(error);

    return {
      shouldRetry,
      retryDelay: shouldRetry
        ? this.config.retryDelay * Math.pow(2, currentRetries)
        : undefined,
      userMessage,
      logLevel,
      shouldRedirect,
    };
  }

  /**
   * 判斷是否應該重試
   */
  private shouldRetry(error: ApiError, currentRetries: number): boolean {
    if (currentRetries >= this.config.maxRetries) {
      return false;
    }

    // 網路錯誤通常可以重試
    if (error.isNetworkError()) {
      return true;
    }

    // 服務器錯誤可以重試
    if (
      error.isType(ApiErrorCode.SERVER_ERROR) ||
      error.isType(ApiErrorCode.SERVICE_UNAVAILABLE) ||
      error.isType(ApiErrorCode.TIMEOUT_ERROR)
    ) {
      return true;
    }

    // 認證和驗證錯誤不應該重試
    if (error.isAuthError() || error.isValidationError()) {
      return false;
    }

    return false;
  }

  /**
   * 獲取用戶友好的錯誤訊息
   */
  private getUserMessage(error: ApiError): string {
    return (
      ERROR_MESSAGES[error.code as ApiErrorCode] ||
      error.message ||
      '發生未知錯誤'
    );
  }

  /**
   * 獲取日誌級別
   */
  private getLogLevel(error: ApiError): 'error' | 'warn' | 'info' {
    if (error.isAuthError()) {
      return 'warn';
    }

    if (error.isValidationError()) {
      return 'info';
    }

    if (error.isNetworkError()) {
      return 'warn';
    }

    return 'error';
  }

  /**
   * 決定是否需要重定向
   */
  private getShouldRedirect(error: ApiError): string | undefined {
    if (
      error.isType(ApiErrorCode.UNAUTHORIZED) ||
      error.isType(ApiErrorCode.TOKEN_EXPIRED)
    ) {
      return '/login';
    }

    if (error.isType(ApiErrorCode.FORBIDDEN)) {
      return '/403';
    }

    if (error.isType(ApiErrorCode.NOT_FOUND)) {
      return '/404';
    }

    return undefined;
  }

  /**
   * 記錄錯誤
   */
  private logError(error: ApiError, context?: string): void {
    const logData = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      context,
      details: error.details,
      stack: error.stack,
    };

    console.error('[ErrorHandler]', logData);

    // 在生產環境中，這裡可以發送到錯誤追蹤服務
    // 例如：Sentry, LogRocket, 或自定義的錯誤收集服務
  }

  /**
   * 通知用戶
   */
  private notifyUser(message: string, level: 'error' | 'warn' | 'info'): void {
    // 這裡可以整合 toast 通知系統
    // 例如：react-hot-toast, react-toastify 等
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  /**
   * 重置重試計數
   */
  resetRetryCount(context?: string): void {
    if (context) {
      this.retryCount.delete(context);
    } else {
      this.retryCount.clear();
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 導出單例實例
export const errorHandler = new ErrorHandlerService();
export { ErrorHandlerService, ApiError, ApiErrorCode };
