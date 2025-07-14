// 測試步驟2：加入資料庫連接
import express from 'express';
import { config } from './src/config/environment';
import { logger } from './src/utils/logger';
import { connectDatabase } from './src/config/database';

console.log('Step 2: Testing with database connection...');

const app = express();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Step 2 server running with database',
    config: {
      env: config.env,
      port: config.port
    }
  });
});

const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    logger.info('資料庫連接成功');
    console.log('Database connected successfully!');
    
    app.listen(config.port, () => {
      logger.info(`Step 2 server running on http://localhost:${config.port}`);
      console.log(`Step 2 server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Server startup failed:', error);
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();