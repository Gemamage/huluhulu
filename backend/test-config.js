// 測試環境配置
require('dotenv').config();

console.log('環境變數檢查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已設定' : '未設定');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('EMAIL_FROM_EMAIL:', process.env.EMAIL_FROM_EMAIL);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);

// 測試 TypeScript 模組載入
console.log('\n嘗試載入 TypeScript 配置...');
try {
  require('ts-node/register');
  const { config } = require('./src/config/environment.ts');
  console.log('環境配置載入成功!');
  console.log('配置對象:', {
    env: config.env,
    port: config.port,
    cors: config.cors,
    clientUrl: config.clientUrl
  });
} catch (error) {
  console.error('環境配置載入失敗:', error.message);
  console.error('錯誤堆疊:', error.stack);
}