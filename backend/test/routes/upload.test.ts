import request from 'supertest';
import express from 'express';
import { User, IUser } from '../../src/models/User';
import { uploadRoutes } from '../../src/routes/upload';
import { auth } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData } from '../utils/testData';
import { CloudinaryService } from '../../src/services/cloudinary';
import { AIService } from '../../src/services/ai';
import path from 'path';
import fs from 'fs';

// Mock services
jest.mock('../../src/services/cloudinary');
jest.mock('../../src/services/ai');

const mockCloudinaryService = CloudinaryService as jest.Mocked<typeof CloudinaryService>;
const mockAIService = AIService as jest.Mocked<typeof AIService>;

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);
app.use(errorHandler);

// Create test image buffer
const createTestImageBuffer = () => {
  // Simple 1x1 pixel PNG
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
};

describe('Upload Routes', () => {
  let testUser: IUser;
  let adminUser: IUser;
  let authToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    testUser = await new User({
      ...validUserData,
      isEmailVerified: true
    }).save();
    authToken = testUser.generateAuthToken();

    adminUser = await new User({
      ...validUserData,
      email: 'admin@example.com',
      role: 'admin',
      isEmailVerified: true
    }).save();
    adminToken = adminUser.generateAuthToken();

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockCloudinaryService.uploadImage.mockResolvedValue({
      public_id: 'test_image_123',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_123.jpg',
      width: 800,
      height: 600,
      format: 'jpg',
      bytes: 50000
    });

    mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });
    mockCloudinaryService.getOptimizedUrl.mockReturnValue('https://res.cloudinary.com/test/image/upload/c_fill,w_300,h_300/test_image_123.jpg');
    mockCloudinaryService.healthCheck.mockResolvedValue({ status: 'ok', timestamp: new Date() });

    mockAIService.analyzeImage.mockResolvedValue({
      breed: '黃金獵犬',
      confidence: 0.95,
      features: {
        color: '金色',
        size: '大型',
        coat: '長毛'
      },
      tags: ['狗', '黃金獵犬', '寵物']
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/upload/single', () => {
    it('should upload single image successfully', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        public_id: 'test_image_123',
        secure_url: expect.stringContaining('cloudinary.com'),
        width: 800,
        height: 600
      });
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledTimes(1);
    });

    it('should return error without image', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請選擇要上傳的圖片');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should handle cloudinary upload error', async () => {
      mockCloudinaryService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片上傳失敗');
    });

    it('should validate file type', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('not an image'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('檔案類型');
    });
  });

  describe('POST /api/upload/multiple', () => {
    it('should upload multiple images successfully', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', createTestImageBuffer(), 'test1.jpg')
        .attach('images', createTestImageBuffer(), 'test2.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        public_id: 'test_image_123',
        secure_url: expect.stringContaining('cloudinary.com')
      });
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledTimes(2);
    });

    it('should return error without images', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請選擇要上傳的圖片');
    });

    it('should handle partial upload failures', async () => {
      mockCloudinaryService.uploadImage
        .mockResolvedValueOnce({
          public_id: 'test_image_123',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_123.jpg',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 50000
        })
        .mockRejectedValueOnce(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', createTestImageBuffer(), 'test1.jpg')
        .attach('images', createTestImageBuffer(), 'test2.jpg')
        .expect(207); // Partial success

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
    });

    it('should limit number of files', async () => {
      const files = Array.from({ length: 11 }, (_, i) => createTestImageBuffer());
      
      let req = request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`);

      files.forEach((buffer, i) => {
        req = req.attach('images', buffer, `test${i}.jpg`);
      });

      const response = await req.expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('檔案數量');
    });
  });

  describe('POST /api/upload/avatar', () => {
    it('should upload avatar successfully', async () => {
      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestImageBuffer(), 'avatar.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        public_id: 'test_image_123',
        secure_url: expect.stringContaining('cloudinary.com')
      });
      expect(response.body.message).toBe('頭像上傳成功');

      // Verify user avatar is updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.avatar).toBe('https://res.cloudinary.com/test/image/upload/test_image_123.jpg');
    });

    it('should return error without avatar', async () => {
      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請選擇頭像圖片');
    });

    it('should delete old avatar when uploading new one', async () => {
      // Set existing avatar
      await User.findByIdAndUpdate(testUser._id, {
        avatar: 'https://res.cloudinary.com/test/image/upload/old_avatar_123.jpg'
      });

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestImageBuffer(), 'new_avatar.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith('old_avatar_123');
    });
  });

  describe('DELETE /api/upload/delete/:publicId', () => {
    it('should delete image successfully', async () => {
      const response = await request(app)
        .delete('/api/upload/delete/test_image_123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('圖片已刪除');
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith('test_image_123');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .delete('/api/upload/delete/test_image_123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should handle cloudinary delete error', async () => {
      mockCloudinaryService.deleteImage.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/upload/delete/test_image_123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片刪除失敗');
    });
  });

  describe('POST /api/upload/analyze', () => {
    it('should analyze image from file upload successfully', async () => {
      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        breed: '黃金獵犬',
        confidence: 0.95,
        features: expect.any(Object),
        tags: expect.any(Array)
      });
      expect(mockAIService.analyzeImage).toHaveBeenCalledTimes(1);
    });

    it('should analyze image from URL successfully', async () => {
      const imageUrl = 'https://example.com/test-image.jpg';
      
      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ imageUrl })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        breed: '黃金獵犬',
        confidence: 0.95
      });
      expect(mockAIService.analyzeImage).toHaveBeenCalledWith(imageUrl);
    });

    it('should return error without image or URL', async () => {
      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請提供圖片檔案或圖片 URL');
    });

    it('should handle AI analysis error', async () => {
      mockAIService.analyzeImage.mockRejectedValue(new Error('AI analysis failed'));

      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片分析失敗');
    });

    it('should validate image URL format', async () => {
      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ imageUrl: 'invalid-url' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });
  });

  describe('POST /api/upload/upload-and-analyze', () => {
    it('should upload and analyze image successfully', async () => {
      const response = await request(app)
        .post('/api/upload/upload-and-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .field('optimize', 'true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        upload: {
          public_id: 'test_image_123',
          secure_url: expect.stringContaining('cloudinary.com')
        },
        analysis: {
          breed: '黃金獵犬',
          confidence: 0.95
        }
      });
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledTimes(1);
      expect(mockAIService.analyzeImage).toHaveBeenCalledTimes(1);
    });

    it('should handle upload failure gracefully', async () => {
      mockCloudinaryService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/upload/upload-and-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片上傳失敗');
    });

    it('should handle analysis failure after successful upload', async () => {
      mockAIService.analyzeImage.mockRejectedValue(new Error('Analysis failed'));

      const response = await request(app)
        .post('/api/upload/upload-and-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upload).toBeDefined();
      expect(response.body.data.analysis).toBeNull();
      expect(response.body.data.analysisError).toBe('圖片分析失敗，但上傳成功');
    });
  });

  describe('GET /api/upload/config', () => {
    it('should return upload configuration', async () => {
      const response = await request(app)
        .get('/api/upload/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        maxFileSize: expect.any(Number),
        maxFiles: expect.any(Number),
        allowedTypes: expect.any(Array),
        allowedExtensions: expect.any(Array)
      });
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/upload/config')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/upload/batch-delete', () => {
    it('should delete multiple images successfully', async () => {
      const publicIds = ['image1', 'image2', 'image3'];
      
      const response = await request(app)
        .delete('/api/upload/batch-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publicIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(3);
      expect(response.body.data.failed).toHaveLength(0);
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledTimes(3);
    });

    it('should handle partial deletion failures', async () => {
      mockCloudinaryService.deleteImage
        .mockResolvedValueOnce({ result: 'ok' })
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce({ result: 'ok' });

      const publicIds = ['image1', 'image2', 'image3'];
      
      const response = await request(app)
        .delete('/api/upload/batch-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publicIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(1);
    });

    it('should validate publicIds array', async () => {
      const response = await request(app)
        .delete('/api/upload/batch-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publicIds: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should limit batch size', async () => {
      const publicIds = Array.from({ length: 101 }, (_, i) => `image${i}`);
      
      const response = await request(app)
        .delete('/api/upload/batch-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publicIds })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });
  });

  describe('GET /api/upload/optimize/:publicId', () => {
    it('should return optimized image URL successfully', async () => {
      const response = await request(app)
        .get('/api/upload/optimize/test_image_123')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ width: 300, height: 300, quality: 80 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        originalUrl: expect.stringContaining('test_image_123'),
        optimizedUrl: expect.stringContaining('c_fill,w_300,h_300')
      });
      expect(mockCloudinaryService.getOptimizedUrl).toHaveBeenCalledWith(
        'test_image_123',
        expect.objectContaining({ width: 300, height: 300, quality: 80 })
      );
    });

    it('should use default optimization parameters', async () => {
      const response = await request(app)
        .get('/api/upload/optimize/test_image_123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCloudinaryService.getOptimizedUrl).toHaveBeenCalledWith(
        'test_image_123',
        expect.objectContaining({ width: 800, height: 600, quality: 80 })
      );
    });

    it('should validate optimization parameters', async () => {
      const response = await request(app)
        .get('/api/upload/optimize/test_image_123')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ width: 5000, height: 5000, quality: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });
  });

  describe('GET /api/upload/health', () => {
    it('should return health status for admin', async () => {
      const response = await request(app)
        .get('/api/upload/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });
      expect(mockCloudinaryService.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('should return error for non-admin users', async () => {
      const response = await request(app)
        .get('/api/upload/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要管理員權限');
    });

    it('should handle health check failure', async () => {
      mockCloudinaryService.healthCheck.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/upload/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('健康檢查失敗');
    });
  });

  describe('File Validation', () => {
    it('should reject files that are too large', async () => {
      // Create a large buffer (simulate large file)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('檔案大小');
    });

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('test'), 'test.exe')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('檔案類型');
    });

    it('should accept valid image types', async () => {
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      for (const type of validTypes) {
        const response = await request(app)
          .post('/api/upload/single')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', createTestImageBuffer(), `test.${type}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/api/upload/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .delete('/api/upload/batch-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should handle service unavailability', async () => {
      mockCloudinaryService.uploadImage.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片上傳失敗');
    });
  });

  describe('Security', () => {
    it('should sanitize file names', async () => {
      const maliciousFileName = '../../../etc/passwd.jpg';
      
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), maliciousFileName)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify that the file name was sanitized in the upload call
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          // Should not contain path traversal
          public_id: expect.not.stringContaining('../')
        })
      );
    });

    it('should validate image content', async () => {
      // Test with non-image content
      const fakeImage = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fakeImage, 'fake.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent unauthorized access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/upload/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要管理員權限');
    });
  });
});