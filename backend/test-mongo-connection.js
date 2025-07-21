const mongoose = require('mongoose');

// MongoDB 連接字串
const MONGODB_URI = 'mongodb://localhost:27017/pet-finder';

async function testConnection() {
  try {
    console.log('正在嘗試連接 MongoDB...');
    console.log('連接字串:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB 連接成功！');
    console.log('資料庫名稱:', mongoose.connection.db.databaseName);
    console.log('連接狀態:', mongoose.connection.readyState);
    
    // 測試基本操作
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('現有集合:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:');
    console.error('錯誤類型:', error.name);
    console.error('錯誤訊息:', error.message);
    console.error('完整錯誤:', error);
  } finally {
    // 關閉連接
    await mongoose.connection.close();
    console.log('連接已關閉');
    process.exit(0);
  }
}

// 執行測試
testConnection();