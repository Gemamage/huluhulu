import express from 'express';
import { connectDatabase } from './src/config/database';

const testRoutes = async () => {
  try {
    console.log('Testing individual route imports...');
    
    // 連接資料庫
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected successfully!');
    
    console.log('Testing auth routes import...');
    try {
      const { authRoutes } = await import('./src/routes/auth');
      console.log('✓ Auth routes imported successfully');
    } catch (error) {
      console.error('✗ Auth routes import failed:', error);
      return;
    }
    
    console.log('Testing user routes import...');
    try {
      const { userRoutes } = await import('./src/routes/users');
      console.log('✓ User routes imported successfully');
    } catch (error) {
      console.error('✗ User routes import failed:', error);
      return;
    }
    
    console.log('Testing pet routes import...');
    try {
      const { petRoutes } = await import('./src/routes/pets');
      console.log('✓ Pet routes imported successfully');
    } catch (error) {
      console.error('✗ Pet routes import failed:', error);
      return;
    }
    
    console.log('All routes imported successfully!');
    
    // 測試創建 Express 應用
    console.log('Testing Express app creation...');
    const app = express();
    
    // 添加基本中介軟體
    app.use(express.json());
    
    // 導入路由
    const { authRoutes } = await import('./src/routes/auth');
    const { userRoutes } = await import('./src/routes/users');
    const { petRoutes } = await import('./src/routes/pets');
    
    console.log('Adding routes to Express app...');
    app.use('/api/auth', authRoutes);
    console.log('✓ Auth routes added');
    
    app.use('/api/users', userRoutes);
    console.log('✓ User routes added');
    
    app.use('/api/pets', petRoutes);
    console.log('✓ Pet routes added');
    
    console.log('All tests passed! Routes are working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('Route testing failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
};

testRoutes();