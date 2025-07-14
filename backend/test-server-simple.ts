import express from 'express';
import { config } from './src/config/environment';
import { connectDatabase } from './src/config/database';
import { logger } from './src/utils/logger';

// 路由導入
import { authRoutes } from './src/routes/auth';
import { userRoutes } from './src/routes/users';
import { petRoutes } from './src/routes/pets';

const app = express();

const startServer = async (): Promise<void> => {
  try {
    console.log('Starting simple server test...');
    
    // 連接資料庫
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected successfully!');
    
    // 基本中介軟體
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    console.log('Adding routes...');
    
    // 根路徑歡迎頁面
    app.get('/', (_req, res) => {
      res.status(200).json({
        message: '歡迎使用呼嚕寵物協尋網站 API',
        version: '1.0.0',
        environment: config.env,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/api'
        },
        description: '這是一個專為寵物協尋設計的後端 API 服務'
      });
    });
    
    // 健康檢查端點
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'Simple server running with all routes',
        config: {
          env: config.env,
          port: config.port
        }
      });
    });
    
    // API 路由
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/pets', petRoutes);
    
    console.log('Routes added successfully!');
    
    // 啟動伺服器
    const server = app.listen(config.port, () => {
      console.log(`Simple server running on http://localhost:${config.port}`);
      logger.info(`Simple server running on http://localhost:${config.port}`);
      console.log('Server started successfully! Press Ctrl+C to stop.');
    });
    
    // 優雅關閉
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Simple server startup failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    logger.error('Simple server startup failed:', error);
    process.exit(1);
  }
};

startServer();