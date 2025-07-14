import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateRequest,
  validateQuery,
  validateParams,
  validateFile,
} from '../../src/utils/validation';
import { ValidationError, ErrorCode } from '../../src/utils/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    const schema = z.object({
      email: z.string().email('無效的電子郵件格式'),
      password: z.string().min(6, '密碼至少需要6個字符'),
      age: z.number().min(0, '年齡必須為正數'),
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        age: 25,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError for invalid data', () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
        age: -1,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('輸入驗證失敗');
      expect(error.details).toHaveLength(3);
    });

    it('should handle missing request body', () => {
      mockRequest.body = undefined;

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
      search: z.string().optional(),
    });

    it('should pass validation with valid query parameters', () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      const middleware = validateQuery(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError for invalid query parameters', () => {
      mockRequest.query = {
        page: '0',
        limit: '200',
      };

      const middleware = validateQuery(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details).toHaveLength(2);
    });

    it('should handle missing query parameters', () => {
      mockRequest.query = {};

      const middleware = validateQuery(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, '無效的ID格式'),
      type: z.enum(['user', 'pet'], { errorMap: () => ({ message: '類型必須是user或pet' }) }),
    });

    it('should pass validation with valid parameters', () => {
      mockRequest.params = {
        id: '507f1f77bcf86cd799439011',
        type: 'user',
      };

      const middleware = validateParams(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError for invalid parameters', () => {
      mockRequest.params = {
        id: 'invalid-id',
        type: 'invalid-type',
      };

      const middleware = validateParams(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details).toHaveLength(2);
    });
  });

  describe('validateFile', () => {
    const options = {
      required: true,
      maxSize: 1024 * 1024, // 1MB
      allowedTypes: ['image/jpeg', 'image/png'],
    };

    it('should pass validation with valid file', () => {
      mockRequest.file = {
        fieldname: 'avatar',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 500000,
        destination: '/uploads',
        filename: 'test-123.jpg',
        path: '/uploads/test-123.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const middleware = validateFile(options);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError when file is required but missing', () => {
      mockRequest.file = undefined;

      const middleware = validateFile(options);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('檔案驗證失敗');
      expect(error.details[0].message).toBe('檔案是必需的');
    });

    it('should pass validation when file is optional and missing', () => {
      mockRequest.file = undefined;
      const optionalOptions = { ...options, required: false };

      const middleware = validateFile(optionalOptions);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError for file too large', () => {
      mockRequest.file = {
        fieldname: 'avatar',
        originalname: 'large.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        destination: '/uploads',
        filename: 'large-123.jpg',
        path: '/uploads/large-123.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const middleware = validateFile(options);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details[0].message).toBe('檔案大小不能超過 1MB');
    });

    it('should call next with ValidationError for invalid file type', () => {
      mockRequest.file = {
        fieldname: 'avatar',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 500000,
        destination: '/uploads',
        filename: 'test-123.pdf',
        path: '/uploads/test-123.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const middleware = validateFile(options);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details[0].message).toBe('不支援的檔案類型。允許的類型: image/jpeg, image/png');
    });

    it('should handle multiple validation errors', () => {
      mockRequest.file = {
        fieldname: 'avatar',
        originalname: 'large.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 2 * 1024 * 1024, // 2MB
        destination: '/uploads',
        filename: 'large-123.pdf',
        path: '/uploads/large-123.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const middleware = validateFile(options);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details).toHaveLength(2); // Size and type errors
    });

    it('should work without size and type restrictions', () => {
      mockRequest.file = {
        fieldname: 'document',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
        destination: '/uploads',
        filename: 'test-123.pdf',
        path: '/uploads/test-123.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const middleware = validateFile({ required: true });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Error handling', () => {
    it('should create ValidationError with correct error code', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should preserve original field names in error details', () => {
      const schema = z.object({
        userEmail: z.string().email('無效的電子郵件'),
        userAge: z.number().min(0, '年齡必須為正數'),
      });

      mockRequest.body = {
        userEmail: 'invalid',
        userAge: -1,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.details).toContainEqual({
        field: 'userEmail',
        message: '無效的電子郵件',
      });
      expect(error.details).toContainEqual({
        field: 'userAge',
        message: '年齡必須為正數',
      });
    });
  });
});