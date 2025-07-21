import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../src/middleware/error-handler';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ErrorCode,
  ErrorFactory,
} from '../../src/utils/errors';
import { ZodError, z } from 'zod';

describe('Error Handler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle ValidationError correctly', async () => {
      app.get('/test', (req, res, next) => {
        const error = new ValidationError('測試驗證錯誤', [
          { field: 'email', message: '無效的電子郵件格式' },
        ]);
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '測試驗證錯誤',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: [
            { field: 'email', message: '無效的電子郵件格式' },
          ],
        },
      });
    });

    it('should handle AuthenticationError correctly', async () => {
      app.get('/test', (req, res, next) => {
        const error = ErrorFactory.createAuthenticationError('invalid_token');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '無效的認證令牌',
          code: ErrorCode.INVALID_TOKEN,
          statusCode: 401,
        },
      });
    });

    it('should handle NotFoundError correctly', async () => {
      app.get('/test', (req, res, next) => {
        const error = ErrorFactory.createNotFoundError('用戶', '123');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '用戶 (123) 未找到',
          code: ErrorCode.RESOURCE_NOT_FOUND,
          statusCode: 404,
        },
      });
    });

    it('should handle ConflictError correctly', async () => {
      app.get('/test', (req, res, next) => {
        const error = ErrorFactory.createConflictError('用戶', 'email', 'test@example.com');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: '用戶 的 email 已存在',
          code: ErrorCode.RESOURCE_CONFLICT,
          statusCode: 409,
        },
      });
    });
  });

  describe('Zod error handling', () => {
    it('should convert ZodError to ValidationError', async () => {
      app.get('/test', (req, res, next) => {
        const schema = z.object({
          email: z.string().email(),
          age: z.number().min(0),
        });

        try {
          schema.parse({ email: 'invalid-email', age: -1 });
        } catch (error) {
          next(error);
        }
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
        },
      });
      expect(response.body.error.details).toHaveLength(2);
    });
  });

  describe('Mongoose error handling', () => {
    it('should handle Mongoose ValidationError', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'ValidationError',
          errors: {
            email: {
              path: 'email',
              value: 'invalid-email',
              kind: 'required',
              message: 'Email is required',
            },
          },
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
        },
      });
    });

    it('should handle Mongoose duplicate key error', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'MongoServerError',
          code: 11000,
          keyValue: { email: 'test@example.com' },
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.RESOURCE_CONFLICT,
          statusCode: 409,
        },
      });
    });

    it('should handle Mongoose CastError', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'CastError',
          path: '_id',
          value: 'invalid-id',
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
        },
      });
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'JsonWebTokenError',
          message: 'invalid token',
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.INVALID_TOKEN,
          statusCode: 401,
        },
      });
    });

    it('should handle TokenExpiredError', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.TOKEN_EXPIRED,
          statusCode: 401,
        },
      });
    });
  });

  describe('Multer error handling', () => {
    it('should handle MulterError', async () => {
      app.get('/test', (req, res, next) => {
        const error = {
          name: 'MulterError',
          message: 'File too large',
        };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          message: '檔案上傳失敗: File too large',
        },
      });
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors as internal server error', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error('Unknown error');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        },
      });
    });
  });

  describe('Request context', () => {
    it('should include request path and method in error response', async () => {
      app.get('/test-path', (req, res, next) => {
        const error = new ValidationError('測試錯誤');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-path');

      expect(response.body.error.path).toBe('/test-path');
      expect(response.body.error.method).toBe('GET');
    });

    it('should include timestamp in error response', async () => {
      app.get('/test', (req, res, next) => {
        const error = new ValidationError('測試錯誤');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body.error.timestamp).toBeDefined();
      expect(new Date(response.body.error.timestamp)).toBeInstanceOf(Date);
    });
  });
});