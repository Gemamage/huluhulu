// 簡化的測試設置 - 不使用真實數據庫
import mongoose from 'mongoose';

// 模擬 mongoose 連接
jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  
  // 創建模擬的連接對象
  const mockConnection = {
    readyState: 1, // 已連接狀態
    collections: {},
    close: jest.fn().mockResolvedValue(undefined),
    db: {
      dropDatabase: jest.fn().mockResolvedValue(undefined)
    }
  };
  
  return {
    ...originalMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: mockConnection,
    Schema: originalMongoose.Schema,
    model: originalMongoose.model,
    Types: originalMongoose.Types
  };
});

// 設置測試環境變數
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-with-minimum-32-characters-length';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';
process.env.EMAIL_FROM_NAME = '測試網站';
process.env.EMAIL_FROM_EMAIL = 'test@example.com';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.SESSION_SECRET = 'test-session-secret-key-with-minimum-32-characters';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// 模擬外部服務
jest.mock('../src/services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendNotificationEmail: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/services/cloudinaryService', () => ({
  CloudinaryService: {
    uploadFile: jest.fn().mockResolvedValue({
      public_id: 'test-image-id',
      secure_url: 'https://test.cloudinary.com/test-image.jpg',
      width: 800,
      height: 600
    }),
    deleteFile: jest.fn().mockResolvedValue(true),
    generateOptimizedUrl: jest.fn().mockReturnValue('https://test.cloudinary.com/optimized-image.jpg')
  }
}));

jest.mock('../src/services/aiService', () => ({
  analyzeImage: jest.fn().mockResolvedValue({
    breed: 'Golden Retriever',
    confidence: 0.95,
    features: {
      color: 'golden',
      size: 'large',
      age: 'adult'
    }
  }),
  findSimilarPets: jest.fn().mockResolvedValue([]),
  generateSearchSuggestions: jest.fn().mockResolvedValue(['golden retriever', 'labrador'])
}));

// 全局錯誤處理
process.on('unhandledRejection', (reason) => {
  console.warn('測試中出現未處理的 Promise 拒絕:', reason);
});

process.on('uncaughtException', (error) => {
  console.warn('測試中出現未捕獲的異常:', error.message);
});

console.log('✅ 測試環境已設置（模擬模式）');