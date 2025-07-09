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
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
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
      bufferMaxEntries: 0,
      bufferCommands: false,
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
    auth: {
      user: envVars.EMAIL_USER as string,
      pass: envVars.EMAIL_PASS as string,
    },
  },
  
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
} as const;

// 型別定義
export type Config = typeof config;
export type Environment = typeof config.env;