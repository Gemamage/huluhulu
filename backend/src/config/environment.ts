import dotenv from 'dotenv';
import Joi from 'joi';

// 載入環境變數
dotenv.config();

// 環境變數驗證 schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM_NAME: Joi.string().default('呼嚕寵物協尋網站'),
  EMAIL_FROM_EMAIL: Joi.string().email().required(),
  CLIENT_URL: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  // Google OAuth 配置
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().default('/api/auth/google/callback'),
  // Session 配置
  SESSION_SECRET: Joi.string().min(32).required(),

  // Google Vision AI 配置
  GOOGLE_VISION_PROJECT_ID: Joi.string().optional(),
  GOOGLE_VISION_KEY_PATH: Joi.string().optional(),
  
  // Firebase 配置
  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: Joi.string().optional(),
  
  // SendGrid 配置
  SENDGRID_API_KEY: Joi.string().optional(),
  SENDGRID_FROM_EMAIL: Joi.string().email().optional(),
  
  // 通知配置
  NOTIFICATION_CLEANUP_INTERVAL: Joi.number().default(60 * 60 * 1000), // 1 小時
  NOTIFICATION_RETENTION_DAYS: Joi.number().default(30),
}).unknown();

// 驗證環境變數
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`環境變數配置錯誤: ${error.message}`);
}

// 導出配置物件
export const config = {
  env: envVars.NODE_ENV as 'development' | 'production' | 'test',
  port: envVars.PORT as number,
  
  // 資料庫配置
  database: {
    uri: envVars.MONGODB_URI as string,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  
  // JWT 配置
  jwt: {
    secret: envVars.JWT_SECRET as string,
    expiresIn: envVars.JWT_EXPIRES_IN as string,
  },
  
  // CORS 配置
  cors: {
    allowedOrigins: envVars.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
  },
  
  // Cloudinary 配置
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME as string,
    apiKey: envVars.CLOUDINARY_API_KEY as string,
    apiSecret: envVars.CLOUDINARY_API_SECRET as string,
  },
  
  // 郵件配置
  email: {
    host: envVars.EMAIL_HOST as string,
    port: envVars.EMAIL_PORT as number,
    secure: envVars.EMAIL_PORT === 465,
    user: envVars.EMAIL_USER as string,
    password: envVars.EMAIL_PASS as string,
    fromName: envVars.EMAIL_FROM_NAME as string,
    fromEmail: envVars.EMAIL_FROM_EMAIL as string,
  },

  // 客戶端 URL
  clientUrl: envVars.CLIENT_URL as string,
  
  // 速率限制配置
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS as number,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS as number,
  },
  
  // 日誌配置
  logging: {
    level: envVars.LOG_LEVEL as string,
  },
  
  // 檔案上傳配置
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    maxFiles: 5,
  },
  
  // 分頁配置
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // 快取配置
  cache: {
    ttl: 5 * 60, // 5 分鐘
  },
  
  // Google 服務配置
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID as string,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
    callbackUrl: envVars.GOOGLE_CALLBACK_URL as string,
    projectId: envVars.GOOGLE_VISION_PROJECT_ID as string || '',
    visionKeyPath: envVars.GOOGLE_VISION_KEY_PATH as string || '',
  },
  
  // Session 配置
  session: {
    secret: envVars.SESSION_SECRET as string,
    maxAge: 24 * 60 * 60 * 1000, // 24 小時
  },
  
  // Firebase 配置
  firebase: {
    projectId: envVars.FIREBASE_PROJECT_ID as string || '',
    serviceAccountKey: envVars.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT_KEY as string) 
      : null,
  },
  
  // SendGrid 配置
  sendgrid: {
    apiKey: envVars.SENDGRID_API_KEY as string || '',
    fromEmail: envVars.SENDGRID_FROM_EMAIL as string || envVars.EMAIL_FROM_EMAIL as string,
  },
  
  // 通知配置
  notification: {
    cleanupInterval: envVars.NOTIFICATION_CLEANUP_INTERVAL as number,
    retentionDays: envVars.NOTIFICATION_RETENTION_DAYS as number,
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 5000, // 5 秒
  },

} as const;

// 型別定義
export type Config = typeof config;
export type Environment = typeof config.env;