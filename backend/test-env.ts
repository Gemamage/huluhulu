import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

console.log('Testing environment variables...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');

try {
  console.log('\nTesting config import...');
  const { config } = require('./src/config/environment');
  console.log('✓ Config loaded successfully');
  console.log('Config port:', config.port);
  console.log('Config env:', config.env);
} catch (error) {
  console.error('✗ Config loading failed:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }
}