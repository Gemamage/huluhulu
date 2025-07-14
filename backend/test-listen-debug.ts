import express from 'express';
import { config } from './src/config/environment';
import { connectDatabase } from './src/config/database';
import { logger } from './src/utils/logger';

const app = express();

const startServer = async (): Promise<void> => {
  try {
    console.log('Starting listen debug test...');
    
    // 連接資料庫
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected successfully!');
    
    // 基本中介軟體
    app.use(express.json());
    
    // 簡單路由
    app.get('/', (_req, res) => {
      res.json({ message: 'Hello from debug server!' });
    });
    
    console.log('Routes added successfully!');
    console.log('Attempting to start server on port:', config.port);
    
    // 詳細的 listen 調用
    const server = app.listen(config.port, () => {
      console.log('✓ Server listen callback executed successfully!');
      console.log(`✓ Server running on http://localhost:${config.port}`);
      logger.info(`Server running on http://localhost:${config.port}`);
      
      // 設置定時器來保持服務器運行
      setTimeout(() => {
        console.log('Server has been running for 5 seconds, shutting down...');
        server.close(() => {
          console.log('Server closed successfully');
          process.exit(0);
        });
      }, 5000);
    });
    
    // 監聽服務器錯誤
    server.on('error', (error: any) => {
      console.error('✗ Server error occurred:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`✗ Port ${config.port} is already in use`);
      }
      process.exit(1);
    });
    
    // 監聽服務器關閉
    server.on('close', () => {
      console.log('Server close event triggered');
    });
    
    console.log('Server listen call completed, waiting for callback...');
    
  } catch (error) {
    console.error('✗ Server startup failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

// 監聽進程事件
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();