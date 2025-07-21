import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

// 導入配置和工具
import { config } from './src/config/environment';
import { connectDatabase } from './src/config/database';
import { logger } from './src/utils/logger';

// Passport 配置
import './src/config/passport';

const app = express();

const startServer = async (): Promise<void> => {
  try {
    console.log('Step 3: Testing with middleware...');
    
    // 連接資料庫
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected successfully!');
    
    // 安全性中介軟體
    console.log('Adding helmet middleware...');
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
    console.log('Adding CORS middleware...');
    app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // 壓縮回應
    console.log('Adding compression middleware...');
    app.use(compression());
    
    // 請求日誌
    console.log('Adding morgan middleware...');
    if (config.env !== 'test') {
      app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }));
    }
    
    // 速率限制
    console.log('Adding rate limit middleware...');
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
    console.log('Adding body parser middleware...');
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Session 配置
    console.log('Adding session middleware...');
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
    console.log('Adding passport middleware...');
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log('All middleware added successfully!');
    
    // 健康檢查端點
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'Step 3 server running with all middleware',
        config: {
          env: config.env,
          port: config.port
        }
      });
    });
    
    // 啟動伺服器
    const server = app.listen(config.port, () => {
      console.log(`Step 3 server running on http://localhost:${config.port}`);
      logger.info(`Step 3 server running on http://localhost:${config.port}`);
    });
    
  } catch (error) {
    console.error('Step 3 server startup failed:', error);
    logger.error('Step 3 server startup failed:', error);
    process.exit(1);
  }
};

startServer();