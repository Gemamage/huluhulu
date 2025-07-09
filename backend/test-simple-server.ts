import express from 'express';
import { config } from './src/config/environment';
import { connectDatabase } from './src/config/database';

console.log('Starting simple server test...');

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async (): Promise<void> => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected successfully');

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();