import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { createServer } from 'http';


import { config } from './config/environment';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { swaggerSetup } from './config/swagger';

// 服務導入
import { SocketService } from './services/socketService';
import { NotificationService } from './services/notificationService';
import { SmartNotificationService } from './services/smartNotificationService';
import { elasticsearchService } from './services/elasticsearchService';
import { petSearchService } from './services/petSearchService';
import { mockElasticsearchService } from './services/mockElasticsearchService';

// Passport 配置
import './config/passport';

// 路由導入
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { petRoutes } from './routes/pets';
import { searchRoutes } from './routes/search';
import { default as uploadRoutes } from './routes/upload';
import { oauthRoutes } from './routes/oauth';
import { privacyRoutes } from './routes/privacy';
import { adminRoutes } from './routes/admin';
import { aiRoutes } from './routes/ai';
import notificationRoutes from './routes/notifications';
import { smartNotificationRoutes } from './routes/smartNotifications';
import communityRoutes from './routes/community';
import advancedSearchRoutes from './routes/advancedSearch';

// 建立 Express 應用程式和 HTTP 伺服器
const app = express();
const httpServer = createServer(app);

// 初始化 Socket 服務
const io = SocketService.initialize(httpServer);

// 安全性中介軟體
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS 設定
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 壓縮回應
app.use(compression());

// 請求日誌
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: config.env === 'production' ? 100 : 1000, // 限制請求次數
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15 分鐘',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 解析請求體
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session 配置
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.database.uri,
    touchAfter: 24 * 3600, // 24 小時內只更新一次
  }),
  cookie: {
    secure: config.env === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 小時
  },
}));

// Passport 中介軟體
app.use(passport.initialize());
app.use(passport.session());

// API 文件
if (config.env !== 'production') {
  swaggerSetup(app);
}

// 根路徑歡迎頁面
app.get('/', (_req, res) => {
  res.status(200).json({
    message: '歡迎使用呼嚕寵物協尋網站 API',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiDocs: config.env !== 'production' ? '/api-docs' : null,
      api: '/api'
    },
    description: '這是一個專為寵物協尋設計的後端 API 服務'
  });
});

// 健康檢查端點
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/advanced-search', advancedSearchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/smart-notifications', smartNotificationRoutes);
app.use('/api/community', communityRoutes);

// 404 處理
app.use(notFoundHandler);

// 錯誤處理
app.use(errorHandler);

// 啟動伺服器
const startServer = async (): Promise<void> => {
  try {
    // 連接資料庫
    await connectDatabase();
    logger.info('資料庫連接成功');

    // 初始化搜尋服務
    const useElasticsearch = process.env.ELASTICSEARCH_URL && process.env.NODE_ENV !== 'development';
    
    if (useElasticsearch) {
      try {
        const elasticsearchConnected = await elasticsearchService.connect();
        if (elasticsearchConnected) {
          logger.info('Elasticsearch 服務已啟動');
          
          // 初始化搜尋索引
          await petSearchService.initializePetIndex();
          await petSearchService.initializeSearchAnalyticsIndex();
          logger.info('搜尋索引初始化完成');
        } else {
          logger.warn('Elasticsearch 連接失敗，切換到模擬服務');
          await mockElasticsearchService.initializeIndex();
          logger.info('模擬搜尋服務初始化完成');
        }
      } catch (error) {
        logger.error('Elasticsearch 初始化失敗，切換到模擬服務:', error);
        await mockElasticsearchService.initializeIndex();
        logger.info('模擬搜尋服務初始化完成');
      }
    } else {
      await mockElasticsearchService.initializeIndex();
      logger.info('開發模式：使用模擬搜尋服務');
    }

    // 啟動伺服器
    const server = httpServer.listen(config.port, () => {
      logger.info(`伺服器運行在 http://localhost:${config.port}`);
      logger.info(`環境: ${config.env}`);
      logger.info('Socket.IO 服務已啟動');
      
      if (config.env !== 'production') {
        logger.info(`API 文件: http://localhost:${config.port}/api-docs`);
      }
    });

    // 啟動通知服務的定期任務
    NotificationService.startScheduledTasks();
    logger.info('通知服務定期任務已啟動');

    // 初始化智能通知服務
    await SmartNotificationService.initialize();
    logger.info('智能通知服務已初始化');

    // 優雅關閉
    const gracefulShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信號，開始優雅關閉...`);
      
      try {
        // 停止通知服務定期任務
        NotificationService.stopScheduledTasks();
        
        // 停止智能通知服務
        await SmartNotificationService.stop();
        logger.info('智能通知服務已停止');
        
        // 關閉搜尋服務連接
        if (process.env.ELASTICSEARCH_URL && process.env.NODE_ENV !== 'development') {
          await elasticsearchService.close();
          logger.info('Elasticsearch 連接已關閉');
        } else {
          logger.info('模擬搜尋服務已清理');
        }
      } catch (error) {
        logger.error('停止服務時發生錯誤:', error);
      }
      
      // 關閉 Socket.IO 連接
      io.close(() => {
        logger.info('Socket.IO 伺服器已關閉');
      });
      
      server.close(() => {
        logger.info('HTTP 伺服器已關閉');
        process.exit(0);
      });

      // 強制關閉
      setTimeout(() => {
        logger.error('強制關閉伺服器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.error('未捕獲的異常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未處理的 Promise 拒絕:', { reason, promise });
  process.exit(1);
});

// 啟動應用程式
if (require.main === module) {
  startServer();
}

export { app, httpServer, io };