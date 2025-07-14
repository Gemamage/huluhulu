// 測試步驟1：基本導入和配置載入
import express from 'express';
import { config } from './src/config/environment';
import { logger } from './src/utils/logger';

console.log('Step 1: Testing basic imports and config loading...');
console.log('Config loaded:', {
  env: config.env,
  port: config.port,
  database: config.database.uri ? 'SET' : 'NOT SET'
});

const app = express();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Step 1 server running',
    config: {
      env: config.env,
      port: config.port
    }
  });
});

app.listen(config.port, () => {
  logger.info(`Step 1 server running on http://localhost:${config.port}`);
  console.log(`Step 1 server running on http://localhost:${config.port}`);
});