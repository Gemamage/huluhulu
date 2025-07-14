import { Response } from 'express';
import { AppError, ErrorCode } from './errors';

/**
 * 成功響應介面
 */
export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  timestamp: string;
}

/**
 * 錯誤響應介面
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    statusCode: number;
    details?: any[];
    path?: string;
    method?: string;
    timestamp: string;
  };
}

/**
 * 分頁資訊介面
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 響應工具類
 */
export class ResponseUtil {
  /**
   * 發送成功響應
   */
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200,
    meta?: Partial<PaginationMeta>
  ): void {
    const response: SuccessResponse<T> = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (message) {
      response.message = message;
    }

    if (data !== undefined) {
      response.data = data;
    }

    if (meta) {
      response.meta = meta;
    }

    res.status(statusCode).json(response);
  }

  /**
   * 發送創建成功響應
   */
  static created<T>(
    res: Response,
    data?: T,
    message: string = '創建成功'
  ): void {
    ResponseUtil.success(res, data, message, 201);
  }

  /**
   * 發送更新成功響應
   */
  static updated<T>(
    res: Response,
    data?: T,
    message: string = '更新成功'
  ): void {
    ResponseUtil.success(res, data, message, 200);
  }

  /**
   * 發送刪除成功響應
   */
  static deleted(
    res: Response,
    message: string = '刪除成功'
  ): void {
    ResponseUtil.success(res, undefined, message, 200);
  }

  /**
   * 發送分頁響應
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): void {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };

    ResponseUtil.success(res, data, message, 200, meta);
  }

  /**
   * 發送錯誤響應
   */
  static error(
    res: Response,
    error: AppError,
    path?: string,
    method?: string
  ): void {
    const response: ErrorResponse = {
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

    if (path) {
      response.error.path = path;
    }

    if (method) {
      response.error.method = method;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * 發送驗證錯誤響應
   */
  static validationError(
    res: Response,
    errors: Array<{ field: string; message: string; value?: any }>,
    message: string = '輸入資料驗證失敗'
  ): void {
    const appError = new AppError(
      message,
      400,
      ErrorCode.VALIDATION_ERROR,
      errors
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送未授權響應
   */
  static unauthorized(
    res: Response,
    message: string = '認證失敗'
  ): void {
    const appError = new AppError(
      message,
      401,
      ErrorCode.AUTHENTICATION_FAILED
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送禁止訪問響應
   */
  static forbidden(
    res: Response,
    message: string = '權限不足'
  ): void {
    const appError = new AppError(
      message,
      403,
      ErrorCode.INSUFFICIENT_PERMISSIONS
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送未找到響應
   */
  static notFound(
    res: Response,
    resource: string = '資源',
    identifier?: string | number
  ): void {
    const message = identifier
      ? `${resource} (${identifier}) 未找到`
      : `${resource} 未找到`;
    
    const appError = new AppError(
      message,
      404,
      ErrorCode.RESOURCE_NOT_FOUND,
      [{ resource, identifier }]
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送衝突響應
   */
  static conflict(
    res: Response,
    resource: string,
    field: string,
    value: any
  ): void {
    const message = `${resource} 的 ${field} 已存在`;
    const appError = new AppError(
      message,
      409,
      ErrorCode.RESOURCE_CONFLICT,
      [{ resource, field, value, constraint: 'unique' }]
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送速率限制響應
   */
  static rateLimited(
    res: Response,
    message: string = '請求過於頻繁，請稍後再試'
  ): void {
    const appError = new AppError(
      message,
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
    ResponseUtil.error(res, appError);
  }

  /**
   * 發送內部伺服器錯誤響應
   */
  static internalError(
    res: Response,
    message: string = '內部伺服器錯誤'
  ): void {
    const appError = new AppError(
      message,
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      undefined,
      false
    );
    ResponseUtil.error(res, appError);
  }
}

/**
 * 響應中間件 - 為 Response 對象添加便捷方法
 */
export const responseMiddleware = (
  req: any,
  res: Response,
  next: any
): void => {
  // 添加便捷方法到 Response 對象
  res.success = function<T>(
    data?: T,
    message?: string,
    statusCode?: number,
    meta?: Partial<PaginationMeta>
  ) {
    return ResponseUtil.success(this, data, message, statusCode, meta);
  };

  res.created = function<T>(data?: T, message?: string) {
    return ResponseUtil.created(this, data, message);
  };

  res.updated = function<T>(data?: T, message?: string) {
    return ResponseUtil.updated(this, data, message);
  };

  res.deleted = function(message?: string) {
    return ResponseUtil.deleted(this, message);
  };

  res.paginated = function<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message?: string
  ) {
    return ResponseUtil.paginated(this, data, pagination, message);
  };

  res.validationError = function(
    errors: Array<{ field: string; message: string; value?: any }>,
    message?: string
  ) {
    return ResponseUtil.validationError(this, errors, message);
  };

  res.unauthorized = function(message?: string) {
    return ResponseUtil.unauthorized(this, message);
  };

  res.forbidden = function(message?: string) {
    return ResponseUtil.forbidden(this, message);
  };

  res.notFound = function(resource?: string, identifier?: string | number) {
    return ResponseUtil.notFound(this, resource, identifier);
  };

  res.conflict = function(resource: string, field: string, value: any) {
    return ResponseUtil.conflict(this, resource, field, value);
  };

  res.rateLimited = function(message?: string) {
    return ResponseUtil.rateLimited(this, message);
  };

  res.internalError = function(message?: string) {
    return ResponseUtil.internalError(this, message);
  };

  next();
};

// 擴展 Express Response 介面
declare global {
  namespace Express {
    interface Response {
      success<T>(
        data?: T,
        message?: string,
        statusCode?: number,
        meta?: Partial<PaginationMeta>
      ): void;
      created<T>(data?: T, message?: string): void;
      updated<T>(data?: T, message?: string): void;
      deleted(message?: string): void;
      paginated<T>(
        data: T[],
        pagination: { page: number; limit: number; total: number },
        message?: string
      ): void;
      validationError(
        errors: Array<{ field: string; message: string; value?: any }>,
        message?: string
      ): void;
      unauthorized(message?: string): void;
      forbidden(message?: string): void;
      notFound(resource?: string, identifier?: string | number): void;
      conflict(resource: string, field: string, value: any): void;
      rateLimited(message?: string): void;
      internalError(message?: string): void;
    }
  }
}

export default ResponseUtil;