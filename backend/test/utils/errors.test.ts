import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  BusinessRuleError,
  ExternalServiceError,
  DatabaseError,
  ErrorCode,
  ErrorFactory,
  formatErrorResponse,
  formatErrorForLogging,
  isOperationalError,
} from '../../src/utils/errors';
import { ZodError, z } from 'zod';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with basic properties', () => {
      const error = new AppError('測試錯誤', 400, ErrorCode.VALIDATION_ERROR);

      expect(error.message).toBe('測試錯誤');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create AppError with details', () => {
      const details = [{ field: 'email', message: '無效格式' }];
      const error = new AppError('測試錯誤', 400, ErrorCode.VALIDATION_ERROR, details);

      expect(error.details).toEqual(details);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('測試錯誤', 400, ErrorCode.VALIDATION_ERROR);
      const json = error.toJSON();

      expect(json).toMatchObject({
        message: '測試錯誤',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default values', () => {
      const error = new ValidationError('驗證失敗');

      expect(error.message).toBe('驗證失敗');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create ValidationError with custom error code and details', () => {
      const details = [{ field: 'password', message: '密碼太短' }];
      const error = new ValidationError('密碼驗證失敗', details, ErrorCode.INVALID_INPUT);

      expect(error.errorCode).toBe(ErrorCode.INVALID_INPUT);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with default values', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('認證失敗');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe(ErrorCode.AUTHENTICATION_FAILED);
    });

    it('should create AuthenticationError with custom values', () => {
      const error = new AuthenticationError('令牌無效', ErrorCode.INVALID_TOKEN);

      expect(error.message).toBe('令牌無效');
      expect(error.errorCode).toBe(ErrorCode.INVALID_TOKEN);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('資源未找到');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('資源衝突');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe(ErrorCode.RESOURCE_CONFLICT);
    });
  });

  describe('BusinessRuleError', () => {
    it('should create BusinessRuleError with correct properties', () => {
      const error = new BusinessRuleError('業務規則違反');

      expect(error.message).toBe('業務規則違反');
      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe(ErrorCode.BUSINESS_RULE_VIOLATION);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create ExternalServiceError with correct properties', () => {
      const error = new ExternalServiceError('外部服務錯誤');

      expect(error.message).toBe('外部服務錯誤');
      expect(error.statusCode).toBe(502);
      expect(error.errorCode).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('資料庫錯誤');

      expect(error.message).toBe('資料庫錯誤');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe(ErrorCode.DATABASE_ERROR);
    });
  });
});

describe('ErrorFactory', () => {
  describe('createValidationError', () => {
    it('should create validation error with field details', () => {
      const error = ErrorFactory.createValidationError('email', '無效的電子郵件格式');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('輸入驗證失敗');
      expect(error.details).toEqual([
        { field: 'email', message: '無效的電子郵件格式' },
      ]);
    });

    it('should create validation error with multiple fields', () => {
      const fields = [
        { field: 'email', message: '電子郵件必填' },
        { field: 'password', message: '密碼必填' },
      ];
      const error = ErrorFactory.createValidationError(fields);

      expect(error.details).toEqual(fields);
    });
  });

  describe('createAuthenticationError', () => {
    it('should create authentication error for invalid credentials', () => {
      const error = ErrorFactory.createAuthenticationError('invalid_credentials');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('無效的用戶名或密碼');
      expect(error.errorCode).toBe(ErrorCode.INVALID_CREDENTIALS);
    });

    it('should create authentication error for invalid token', () => {
      const error = ErrorFactory.createAuthenticationError('invalid_token');

      expect(error.message).toBe('無效的認證令牌');
      expect(error.errorCode).toBe(ErrorCode.INVALID_TOKEN);
    });

    it('should create authentication error for expired token', () => {
      const error = ErrorFactory.createAuthenticationError('token_expired');

      expect(error.message).toBe('認證令牌已過期');
      expect(error.errorCode).toBe(ErrorCode.TOKEN_EXPIRED);
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error with resource type', () => {
      const error = ErrorFactory.createNotFoundError('用戶');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('用戶 未找到');
    });

    it('should create not found error with resource type and id', () => {
      const error = ErrorFactory.createNotFoundError('寵物', '123');

      expect(error.message).toBe('寵物 (123) 未找到');
    });
  });

  describe('createConflictError', () => {
    it('should create conflict error with resource and field', () => {
      const error = ErrorFactory.createConflictError('用戶', 'email');

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('用戶 的 email 已存在');
    });

    it('should create conflict error with resource, field and value', () => {
      const error = ErrorFactory.createConflictError('用戶', 'email', 'test@example.com');

      expect(error.message).toBe('用戶 的 email 已存在');
      expect(error.details).toEqual([
        { field: 'email', value: 'test@example.com', message: '該值已存在' },
      ]);
    });
  });

  describe('fromMongooseError', () => {
    it('should convert Mongoose ValidationError', () => {
      const mongooseError = {
        name: 'ValidationError',
        errors: {
          email: {
            path: 'email',
            value: 'invalid-email',
            kind: 'required',
            message: 'Email is required',
          },
          age: {
            path: 'age',
            value: -1,
            kind: 'min',
            message: 'Age must be positive',
          },
        },
      };

      const error = ErrorFactory.fromMongooseError(mongooseError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveLength(2);
      expect(error.details).toContainEqual({
        field: 'email',
        message: 'Email is required',
        value: 'invalid-email',
      });
    });

    it('should convert Mongoose duplicate key error', () => {
      const mongooseError = {
        name: 'MongoServerError',
        code: 11000,
        keyValue: { email: 'test@example.com' },
      };

      const error = ErrorFactory.fromMongooseError(mongooseError);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('資源已存在');
    });

    it('should convert Mongoose CastError', () => {
      const mongooseError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id',
      };

      const error = ErrorFactory.fromMongooseError(mongooseError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('無效的資料格式');
    });

    it('should return original error for unknown Mongoose errors', () => {
      const mongooseError = {
        name: 'UnknownError',
        message: 'Unknown error',
      };

      const error = ErrorFactory.fromMongooseError(mongooseError);

      expect(error).toBe(mongooseError);
    });
  });

  describe('fromZodError', () => {
    it('should convert ZodError to ValidationError', () => {
      const schema = z.object({
        email: z.string().email('無效的電子郵件格式'),
        age: z.number().min(0, '年齡必須為正數'),
      });

      try {
        schema.parse({ email: 'invalid-email', age: -1 });
      } catch (zodError) {
        const error = ErrorFactory.fromZodError(zodError as ZodError);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('輸入驗證失敗');
        expect(error.details).toHaveLength(2);
        expect(error.details).toContainEqual({
          field: 'email',
          message: '無效的電子郵件格式',
        });
        expect(error.details).toContainEqual({
          field: 'age',
          message: '年齡必須為正數',
        });
      }
    });
  });
});

describe('Utility Functions', () => {
  describe('isOperationalError', () => {
    it('should return true for AppError instances', () => {
      const error = new ValidationError('測試錯誤');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for generic Error instances', () => {
      const error = new Error('一般錯誤');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isOperationalError('string')).toBe(false);
      expect(isOperationalError(null)).toBe(false);
      expect(isOperationalError(undefined)).toBe(false);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format AppError for response', () => {
      const error = new ValidationError('驗證失敗', [
        { field: 'email', message: '無效格式' },
      ]);
      const path = '/api/test';
      const method = 'POST';

      const formatted = formatErrorResponse(error, path, method);

      expect(formatted).toMatchObject({
        message: '驗證失敗',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: [{ field: 'email', message: '無效格式' }],
        path,
        method,
        timestamp: expect.any(String),
      });
    });

    it('should format generic Error for response', () => {
      const error = new Error('一般錯誤');
      const path = '/api/test';
      const method = 'GET';

      const formatted = formatErrorResponse(error, path, method);

      expect(formatted).toMatchObject({
        message: '內部伺服器錯誤',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500,
        path,
        method,
        timestamp: expect.any(String),
      });
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format AppError for logging', () => {
      const error = new ValidationError('驗證失敗');
      const path = '/api/test';
      const method = 'POST';

      const formatted = formatErrorForLogging(error, path, method);

      expect(formatted).toMatchObject({
        message: '驗證失敗',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        path,
        method,
        timestamp: expect.any(String),
        stack: expect.any(String),
      });
    });

    it('should format generic Error for logging', () => {
      const error = new Error('一般錯誤');
      const path = '/api/test';
      const method = 'GET';

      const formatted = formatErrorForLogging(error, path, method);

      expect(formatted).toMatchObject({
        message: '一般錯誤',
        path,
        method,
        timestamp: expect.any(String),
        stack: expect.any(String),
      });
    });
  });
});