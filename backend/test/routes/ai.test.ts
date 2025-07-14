import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User, IUser } from '../../src/models/User';
import { Pet } from '../../src/models/Pet';
import { aiRoutes } from '../../src/routes/ai';
import { authenticate } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData, validPetData } from '../utils/testData';
import { AIService } from '../../src/services/aiService';
import { CloudinaryService } from '../../src/services/cloudinaryService';
import path from 'path';
import fs from 'fs';

// Mock services
jest.mock('../../src/services/aiService');
jest.mock('../../src/services/cloudinaryService');

const mockAIService = AIService as jest.Mocked<typeof AIService>;
const mockCloudinaryService = CloudinaryService as jest.Mocked<typeof CloudinaryService>;

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

// 創建測試圖片緩衝區
const createTestImageBuffer = (): Buffer => {
  // 創建一個簡單的 1x1 像素 PNG 圖片
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return pngHeader;
};

describe('AI Routes', () => {
  let testUser: IUser;
  let authToken: string;
  let testPet: any;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});

    testUser = await new User(validUserData).save();
    authToken = testUser.generateAuthToken();

    testPet = await new Pet({
      ...validPetData,
      userId: testUser._id,
      aiFeatures: [{
        features: new Array(264).fill(0.5),
        confidence: 0.8,
        extractedAt: new Date()
      }]
    }).save();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
  });

  describe('POST /api/ai/analyze', () => {
    const mockAnalysisResult = {
      petType: 'dog',
      breed: 'Golden Retriever',
      confidence: 0.85,
      labels: ['dog', 'golden retriever', 'pet'],
      safeSearch: {
        adult: 'VERY_UNLIKELY',
        spoof: 'UNLIKELY',
        medical: 'UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'UNLIKELY'
      },
      features: {
        dominantColors: ['#D4A574', '#8B4513', '#FFFFFF'],
        colorHistogram: new Array(256).fill(0.1),
        textureFeatures: [0.2, 0.3, 0.4, 0.5],
        shapeFeatures: [0.1, 0.2, 0.3, 0.4]
      }
    };

    beforeEach(() => {
      mockAIService.analyzeImageWithVision.mockResolvedValue(mockAnalysisResult);
      mockAIService.generateSearchSuggestions.mockReturnValue([
        'Golden Retriever',
        'large dog',
        'friendly pet'
      ]);
    });

    it('should analyze uploaded image successfully', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('圖像分析完成');
      expect(response.body.data.analysis).toMatchObject({
        petType: 'dog',
        breed: 'Golden Retriever',
        confidence: 0.85
      });
      expect(response.body.data.searchSuggestions).toEqual([
        'Golden Retriever',
        'large dog',
        'friendly pet'
      ]);
      expect(mockAIService.analyzeImageWithVision).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should return error when no image is uploaded', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請上傳圖片文件');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAIService.analyzeImageWithVision.mockRejectedValue(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('fake pdf content'), 'test.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/optimize', () => {
    const mockOptimizeResult = {
      buffer: createTestImageBuffer(),
      metadata: {
        width: 800,
        height: 600,
        format: 'jpeg'
      }
    };

    const mockUploadResult = {
      secureUrl: 'https://cloudinary.com/optimized.jpg',
      publicId: 'test/optimized_123',
      width: 800,
      height: 600
    };

    beforeEach(() => {
      mockAIService.optimizeImage.mockResolvedValue(mockOptimizeResult);
      mockCloudinaryService.uploadFile.mockResolvedValue(mockUploadResult);
    });

    it('should optimize image successfully', async () => {
      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('maxWidth', '800')
        .field('maxHeight', '600')
        .field('quality', '85')
        .field('format', 'jpeg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('圖像優化完成');
      expect(response.body.data.url).toBe(mockUploadResult.secureUrl);
      expect(response.body.data.metadata).toMatchObject({
        width: 800,
        height: 600,
        format: 'jpeg'
      });
      expect(mockAIService.optimizeImage).toHaveBeenCalled();
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalled();
    });

    it('should use default optimization options', async () => {
      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAIService.optimizeImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        {}
      );
    });

    it('should validate optimization parameters', async () => {
      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('maxWidth', '50') // Too small
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/crop', () => {
    const mockUploadResult = {
      secureUrl: 'https://cloudinary.com/cropped.jpg',
      publicId: 'test/cropped_123'
    };

    beforeEach(() => {
      mockAIService.cropImage.mockResolvedValue(createTestImageBuffer());
      mockCloudinaryService.uploadFile.mockResolvedValue(mockUploadResult);
    });

    it('should crop image successfully', async () => {
      const response = await request(app)
        .post('/api/ai/crop')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('x', '10')
        .field('y', '10')
        .field('width', '100')
        .field('height', '100')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('圖像裁剪完成');
      expect(response.body.data.url).toBe(mockUploadResult.secureUrl);
      expect(response.body.data.cropOptions).toEqual({
        x: 10,
        y: 10,
        width: 100,
        height: 100
      });
      expect(mockAIService.cropImage).toHaveBeenCalled();
    });

    it('should validate crop parameters', async () => {
      const response = await request(app)
        .post('/api/ai/crop')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('x', '-10') // Invalid negative value
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require all crop parameters', async () => {
      const response = await request(app)
        .post('/api/ai/crop')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('x', '10')
        // Missing y, width, height
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/similarity-search', () => {
    const mockQueryFeatures = {
      colorHistogram: new Array(256).fill(0.1),
      textureFeatures: [0.2, 0.3, 0.4, 0.5],
      shapeFeatures: [0.1, 0.2, 0.3, 0.4],
      dominantColors: ['#D4A574']
    };

    beforeEach(() => {
      mockAIService.extractImageFeatures.mockResolvedValue(mockQueryFeatures);
      mockAIService.calculateImageSimilarity.mockReturnValue(0.8);
    });

    it('should find similar pets successfully', async () => {
      const response = await request(app)
        .post('/api/ai/similarity-search')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('threshold', '0.7')
        .field('limit', '5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('找到');
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.searchParams).toEqual({
        threshold: 0.7,
        limit: 5,
        totalScanned: expect.any(Number)
      });
      expect(mockAIService.extractImageFeatures).toHaveBeenCalled();
    });

    it('should use default search parameters', async () => {
      const response = await request(app)
        .post('/api/ai/similarity-search')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.searchParams.threshold).toBe(0.7);
      expect(response.body.data.searchParams.limit).toBe(10);
    });

    it('should handle pets without AI features', async () => {
      // Create pet without AI features
      await new Pet({
        ...validPetData,
        name: 'Pet without AI',
        userId: testUser._id
      }).save();

      const response = await request(app)
        .post('/api/ai/similarity-search')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter results by similarity threshold', async () => {
      mockAIService.calculateImageSimilarity.mockReturnValue(0.5); // Below threshold

      const response = await request(app)
        .post('/api/ai/similarity-search')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .field('threshold', '0.7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(0);
    });
  });

  describe('GET /api/ai/suggestions/:petId', () => {
    it('should generate search suggestions for pet', async () => {
      const response = await request(app)
        .get(`/api/ai/suggestions/${testPet._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('搜尋建議生成完成');
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(response.body.data.petInfo).toMatchObject({
        name: testPet.name,
        type: testPet.type,
        breed: testPet.breed
      });
    });

    it('should return error for non-existent pet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/ai/suggestions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('寵物資料不存在');
    });

    it('should limit suggestions to 8 items', async () => {
      // Create pet with many tags
      const petWithManyTags = await new Pet({
        ...validPetData,
        name: 'Pet with many tags',
        userId: testUser._id,
        aiTags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10']
      }).save();

      const response = await request(app)
        .get(`/api/ai/suggestions/${petWithManyTags._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions.length).toBeLessThanOrEqual(8);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/ai/suggestions/${testPet._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle file size limit exceeded', async () => {
      // Create a large buffer (> 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large.png')
        .expect(413); // Payload too large
    });

    it('should handle invalid image format', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('not an image'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle service unavailable errors', async () => {
      mockAIService.analyzeImageWithVision.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});