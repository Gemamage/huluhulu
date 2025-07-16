import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

/**
 * 連接到 MongoDB 資料庫
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // 在開發環境中，如果 MongoDB 不可用，跳過連接
    if (config.env === 'development') {
      logger.warn('開發模式：跳過 MongoDB 連接（MongoDB 服務未運行）');
      return;
    }
    
    // 設置 Mongoose 選項
    mongoose.set('strictQuery', true);
    
    // 連接資料庫
    await mongoose.connect(config.database.uri, {
      ...config.database.options,
      dbName: getDatabaseName(),
    });
    
    logger.info(`MongoDB 連接成功: ${getDatabaseName()}`);
    
    // 監聽連接事件
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB 連接錯誤:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 連接中斷');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB 重新連接成功');
    });
    
  } catch (error) {
    logger.error('MongoDB 連接失敗:', error);
    if (config.env === 'development') {
      logger.warn('開發模式：忽略 MongoDB 連接錯誤，繼續啟動伺服器');
      return;
    }
    throw error;
  }
};

/**
 * 斷開資料庫連接
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB 連接已關閉');
  } catch (error) {
    logger.error('關閉 MongoDB 連接時發生錯誤:', error);
    throw error;
  }
};

/**
 * 清空資料庫（僅用於測試環境）
 */
export const clearDatabase = async (): Promise<void> => {
  if (config.env !== 'test') {
    throw new Error('清空資料庫操作僅允許在測試環境中執行');
  }
  
  try {
    if (!mongoose.connection.db) {
      throw new Error('資料庫連接未建立');
    }
    
    const collections = await mongoose.connection.db.collections();
    
    await Promise.all(
      collections.map(collection => collection.deleteMany({}))
    );
    
    logger.info('測試資料庫已清空');
  } catch (error) {
    logger.error('清空資料庫時發生錯誤:', error);
    throw error;
  }
};

/**
 * 檢查資料庫連接狀態
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * 獲取資料庫名稱
 */
function getDatabaseName(): string {
  const baseDbName = 'pet-finder';
  
  switch (config.env) {
    case 'test':
      return `${baseDbName}-test`;
    case 'development':
      return `${baseDbName}-dev`;
    case 'production':
      return baseDbName;
    default:
      return `${baseDbName}-dev`;
  }
}

/**
 * 資料庫健康檢查
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    readyState: number;
    host?: string;
    name?: string;
  };
}> => {
  try {
    const isConnected = isDatabaseConnected();
    
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      details: {
        connected: isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
    };
  } catch (error) {
    logger.error('資料庫健康檢查失敗:', error);
    
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: mongoose.connection.readyState,
      },
    };
  }
};

// 導出 mongoose 實例
export { mongoose };