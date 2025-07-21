import express from 'express';
import { config } from './src/config/environment';
import { logger } from './src/utils/logger';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const port = config.port || 3001;

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  logger.info(`Test server running on port ${port}`);
});

console.log('Starting test server...');