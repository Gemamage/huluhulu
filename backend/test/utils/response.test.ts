import { Response } from 'express';
import { ResponseUtil, SuccessResponse, ErrorResponse } from '../../src/utils/response';
import { AppError, ValidationError, ErrorCode } from '../../src/utils/errors';

describe('ResponseUtil', () => {
  let mockResponse: Partial<Response>;
  let statusSpy: jest.SpyInstance;
  let jsonSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: '測試' };
      const message = '操作成功';

      ResponseUtil.success(mockResponse as Response, data, message);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        timestamp: expect.any(String),
      });
    });

    it('should send success response without message', () => {
      const data = { id: 1, name: '測試' };

      ResponseUtil.success(mockResponse as Response, data);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data,
        timestamp: expect.any(String),
      });
    });
  });

  describe('created', () => {
    it('should send created response', () => {
      const data = { id: 1, name: '新建項目' };
      const message = '創建成功';

      ResponseUtil.created(mockResponse as Response, data, message);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        timestamp: expect.any(String),
      });
    });
  });

  describe('updated', () => {
    it('should send updated response', () => {
      const data = { id: 1, name: '更新項目' };
      const message = '更新成功';

      ResponseUtil.updated(mockResponse as Response, data, message);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        timestamp: expect.any(String),
      });
    });
  });

  describe('deleted', () => {
    it('should send deleted response', () => {
      const message = '刪除成功';

      ResponseUtil.deleted(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        timestamp: expect.any(String),
      });
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const message = '查詢成功';

      ResponseUtil.paginated(mockResponse as Response, data, pagination, message);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        pagination,
        timestamp: expect.any(String),
      });
    });
  });

  describe('error', () => {
    it('should send error response with AppError', () => {
      const error = new ValidationError('驗證失敗', [
        { field: 'email', message: '無效的電子郵件' },
      ]);
      const path = '/api/test';
      const method = 'POST';

      ResponseUtil.error(mockResponse as Response, error, path, method);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '驗證失敗',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: [
            { field: 'email', message: '無效的電子郵件' },
          ],
          path,
          method,
          timestamp: expect.any(String),
        },
      });
    });

    it('should send error response with generic Error', () => {
      const error = new Error('一般錯誤');
      const path = '/api/test';
      const method = 'GET';

      ResponseUtil.error(mockResponse as Response, error, path, method);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '內部伺服器錯誤',
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500,
          path,
          method,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('validationError', () => {
    it('should send validation error response', () => {
      const errors = [
        { field: 'email', message: '電子郵件格式無效' },
        { field: 'password', message: '密碼長度不足' },
      ];
      const message = '輸入驗證失敗';

      ResponseUtil.validationError(mockResponse as Response, errors, message);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: errors,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('unauthorized', () => {
    it('should send unauthorized response', () => {
      const message = '未授權訪問';

      ResponseUtil.unauthorized(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.AUTHENTICATION_FAILED,
          statusCode: 401,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('forbidden', () => {
    it('should send forbidden response', () => {
      const message = '禁止訪問';

      ResponseUtil.forbidden(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.AUTHORIZATION_FAILED,
          statusCode: 403,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('notFound', () => {
    it('should send not found response', () => {
      const message = '資源未找到';

      ResponseUtil.notFound(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.RESOURCE_NOT_FOUND,
          statusCode: 404,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('conflict', () => {
    it('should send conflict response', () => {
      const message = '資源衝突';

      ResponseUtil.conflict(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.RESOURCE_CONFLICT,
          statusCode: 409,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('rateLimited', () => {
    it('should send rate limited response', () => {
      const message = '請求過於頻繁';

      ResponseUtil.rateLimited(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(429);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          statusCode: 429,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('internalServerError', () => {
    it('should send internal server error response', () => {
      const message = '內部伺服器錯誤';

      ResponseUtil.internalServerError(mockResponse as Response, message);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('timestamp format', () => {
    it('should use ISO string format for timestamp', () => {
      const data = { test: true };
      ResponseUtil.success(mockResponse as Response, data);

      const callArgs = jsonSpy.mock.calls[0][0];
      const timestamp = callArgs.timestamp;
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp)).toBeInstanceOf(Date);
    });
  });
});