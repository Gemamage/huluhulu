import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { config } from '../src/config/environment';

let mongod: MongoMemoryServer;

// 測試前設置
beforeAll(async () => {
  // 啟動內存中的 MongoDB 實例
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // 連接到測試資料庫
  await mongoose.connect(uri);
});

// 每個測試後清理
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 測試後清理
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

// 設置測試環境變數
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pet-finder-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-with-minimum-32-characters-length';
process.env.EMAIL_FROM = 'test@example.com';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.OPENAI_API_KEY = 'test-openai-key';

// 模擬外部服務
jest.mock('../src/services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendNotificationEmail: jest.fn().mockResolvedValue(true)
  }
}));

// cloudinaryService not implemented yet

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