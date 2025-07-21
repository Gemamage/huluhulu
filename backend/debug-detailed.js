console.log('🔍 開始詳細調試...');

try {
  console.log('1. 測試 dotenv 載入...');
  require('dotenv').config();
  console.log('✅ dotenv 載入成功');
  
  console.log('2. 測試環境變數...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已設置' : '未設置');
  console.log('JWT_SECRET 長度:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : '未設置');
  console.log('SESSION_SECRET 長度:', process.env.SESSION_SECRET ? process.env.SESSION_SECRET.length : '未設置');
  
  console.log('3. 測試 Joi 驗證...');
  const Joi = require('joi');
  
  const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3001),
    MONGODB_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    SESSION_SECRET: Joi.string().min(32).required(),
    CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),
    EMAIL_USER: Joi.string().email().required(),
    EMAIL_PASS: Joi.string().required(),
    EMAIL_FROM_EMAIL: Joi.string().email().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
  }).unknown();
  
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    console.error('❌ 環境變數驗證失敗:', error.message);
    process.exit(1);
  }
  
  console.log('✅ 環境變數驗證成功');
  
  console.log('4. 測試 Express 導入...');
  const express = require('express');
  console.log('✅ Express 導入成功');
  
  console.log('5. 測試 Mongoose 連接...');
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB 連接成功');
    
    console.log('6. 測試基本 Express 應用...');
    const app = express();
    
    app.get('/test', (req, res) => {
      res.json({ message: 'Test successful' });
    });
    
    const server = app.listen(process.env.PORT || 5000, () => {
      console.log('✅ Express 服務器啟動成功');
      console.log('🎉 所有測試通過！');
      
      server.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    });
    
  })
  .catch((error) => {
    console.error('❌ MongoDB 連接失敗:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ 調試過程中發生錯誤:', error.message);
  console.error('錯誤堆疊:', error.stack);
  process.exit(1);
}