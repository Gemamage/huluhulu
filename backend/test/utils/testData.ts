// 共享測試數據和工具函數
import { IUser } from '../../src/models/User';
import { IPet } from '../../src/models/Pet';

// 輕量級用戶測試數據
export const validUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '0912345678'
};

export const otherUserData = {
  username: 'otheruser',
  email: 'other@example.com',
  password: 'password123',
  name: 'Other User',
  phone: '0987654321'
};

export const invalidUserData = {
  email: 'invalid-email',
  password: '123',
  name: '',
  phone: 'invalid-phone'
};

// 輕量級寵物測試數據
export const validPetData = {
  name: 'Buddy',
  type: 'dog' as const,
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male' as const,
  size: 'large' as const,
  color: 'golden',
  description: 'Friendly dog',
  lastSeenLocation: '123 Main St',
  lastSeenDate: new Date('2024-01-01'),
  contactInfo: { name: 'John Doe', phone: '0912345678', email: 'owner@example.com' },
  status: 'lost' as const,
  images: ['test-image.jpg'],
  isUrgent: false
};

export const invalidPetData = {
  name: '',
  type: 'invalid-type',
  age: -1,
  gender: 'invalid-gender',
  size: 'invalid-size',
  status: 'invalid-status'
};

// 測試工具函數
export const createTestUser = (userData = validUserData) => {
  return userData;
};

export const createTestPet = (petData = validPetData, userId?: string) => {
  return {
    ...petData,
    ...(userId && { userId })
  };
};

// 常用的測試常量
export const TEST_CONSTANTS = {
  INVALID_OBJECT_ID: '507f1f77bcf86cd799439011',
  VALID_JWT_SECRET: 'test-jwt-secret',
  TEST_EMAIL: 'test@example.com',
  TEST_PASSWORD: 'password123',
  INVALID_EMAIL: 'invalid-email',
  SHORT_PASSWORD: '123'
};

// 錯誤訊息常量
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '電子郵件或密碼錯誤',
  EMAIL_ALREADY_EXISTS: '此電子郵件已被註冊',
  INVALID_TOKEN: '請提供有效的認證令牌',
  PASSWORD_RESET_SUCCESS: '密碼重設郵件已發送，請檢查您的電子郵件',
  UNAUTHORIZED: '未授權訪問',
  NOT_FOUND: '找不到資源',
  VALIDATION_ERROR: '驗證失敗'
};