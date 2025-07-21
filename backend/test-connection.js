const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/pet-finder';

console.log('嘗試連接到 MongoDB...');
console.log('URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB 連接成功!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB 連接失敗:', error.message);
  process.exit(1);
});

// 設置超時
setTimeout(() => {
  console.error('❌ 連接超時');
  process.exit(1);
}, 10000);