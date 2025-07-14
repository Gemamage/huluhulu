import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 載入環境變數
dotenv.config();

const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 20) + '...');
    
    // 設置 Mongoose 選項
    mongoose.set('strictQuery', true);
    
    // 連接資料庫
    await mongoose.connect(process.env.MONGODB_URI!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'pet-finder-dev'
    });
    
    console.log('Database connected successfully!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // 斷開連接
    await mongoose.disconnect();
    console.log('Database disconnected successfully!');
    
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    console.error('Error details:', error);
  }
};

testDatabaseConnection();