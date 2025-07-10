import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { config } from '../src/config/environment';

// 全局共享的 MongoDB 實例
let mongod: MongoMemoryServer;
let isSetup = false;

// 優化的 MongoDB Memory Server 設置
beforeAll(async () => {
  if (!isSetup) {
    try {
      // 使用更小的內存配置和優化選項
      mongod = await MongoMemoryServer.create({
        instance: {
          dbSize: 1, // 1MB 數據庫大小
          storageEngine: 'ephemeralForTest', // 使用內存存儲引擎
          port: undefined, // 讓系統自動分配端口
        },
        binary: {
          version: '6.0.0', // 使用較新但穩定的版本
          skipMD5: true, // 跳過 MD5 檢查以提升啟動速度
        }
      });
      
      const uri = mongod.getUri();
      
      // 優化的連接配置
      await mongoose.connect(uri, {
        maxPoolSize: 5, // 限制連接池大小
        serverSelectionTimeoutMS: 5000, // 5秒服務器選擇超時
        socketTimeoutMS: 10000, // 10秒套接字超時
        connectTimeoutMS: 5000, // 5秒連接超時
        maxIdleTimeMS: 30000, // 30秒最大空閒時間
        bufferMaxEntries: 0, // 禁用緩衝
      });
      
      isSetup = true;
      console.log('✅ 優化的測試數據庫已啟動');
    } catch (error) {
      console.error('❌ 測試數據庫啟動失敗:', error);
      throw error;
    }
  }
}, 30000); // 增加超時時間以應對慢速啟動

// 優化的數據清理策略
afterEach(async () => {
  try {
    // 只清理必要的集合，而不是所有集合
    const collectionsToClean = ['users', 'pets', 'sessions'];
    
    // 並行清理集合以提升速度
    const cleanupPromises = collectionsToClean.map(async (collectionName) => {
      try {
        const collection = mongoose.connection.collection(collectionName);
        await collection.deleteMany({});
      } catch (error) {
        // 忽略不存在的集合錯誤
        if (!error.message.includes('ns not found')) {
          console.warn(`清理集合 ${collectionName} 時出現警告:`, error.message);
        }
      }
    });
    
    await Promise.all(cleanupPromises);
  } catch (error) {
    console.warn('數據清理時出現警告:', error.message);
  }
});

// 優化的測試後清理
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('✅ 測試數據庫已清理完成');
  } catch (error) {
    console.warn('測試清理時出現警告:', error.message);
  }
}, 10000);

// 優化的環境變數設置
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

// 優化的外部服務模擬
jest.mock('../src/services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendNotificationEmail: jest.fn().mockResolvedValue(true)
  }
}));

// 優化的 AI 服務模擬 - 使用更快的響應
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
process.on('unhandledRejection', (reason, promise) => {
  console.warn('測試中出現未處理的 Promise 拒絕:', reason);
});

process.on('uncaughtException', (error) => {
  console.warn('測試中出現未捕獲的異常:', error.message);
});

// 導出工具函數供測試使用
export const getTestDbUri = () => mongod?.getUri();
export const isTestDbReady = () => isSetup && mongoose.connection.readyState === 1;

// 測試性能監控
const testStartTime = Date.now();

afterAll(() => {
  const testDuration = Date.now() - testStartTime;
  console.log(`📊 測試總耗時: ${testDuration}ms`);
});