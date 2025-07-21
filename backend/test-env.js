require('dotenv').config();

console.log('=== 環境變數檢查 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已設定' : '未設定');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已設定' : '未設定');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('EMAIL_FROM_EMAIL:', process.env.EMAIL_FROM_EMAIL);

console.log('\n=== 嘗試載入配置 ===');
try {
  require('ts-node/register');
  const { config } = require('./src/config/environment.ts');
  console.log('✅ 配置載入成功');
  console.log('資料庫 URI:', config.database.uri.substring(0, 50) + '...');
} catch (error) {
  console.log('❌ 配置載入失敗:', error.message);
}