require('dotenv').config();
require('ts-node/register');

async function testDatabase() {
  try {
    console.log('🔍 開始測試資料庫連接...');
    
    // 測試環境變數
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已設定' : '未設定');
    
    // 測試 mongoose 連接
    const mongoose = require('mongoose');
    
    console.log('📡 嘗試連接 MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas 連接成功！');
    console.log('📊 連接狀態:', mongoose.connection.readyState);
    console.log('🏠 資料庫名稱:', mongoose.connection.name);
    console.log('🌐 主機:', mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log('🔌 連接已關閉');
    
  } catch (error) {
    console.error('❌ 資料庫連接失敗:');
    console.error('錯誤訊息:', error.message);
    console.error('錯誤代碼:', error.code);
    console.error('完整錯誤:', error);
  }
}

testDatabase();