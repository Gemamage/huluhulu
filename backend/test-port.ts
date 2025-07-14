import express from 'express';
import { config } from './src/config/environment';

const testPort = async () => {
  try {
    console.log('Testing port availability...');
    console.log('Config port:', config.port);
    console.log('Environment:', config.env);
    
    const app = express();
    
    app.get('/', (req, res) => {
      res.json({ message: 'Port test successful!', port: config.port });
    });
    
    const server = app.listen(config.port, () => {
      console.log(`✓ Server successfully started on port ${config.port}`);
      console.log(`✓ Server URL: http://localhost:${config.port}`);
      
      // 立即關閉服務器
      setTimeout(() => {
        console.log('Closing server...');
        server.close(() => {
          console.log('✓ Server closed successfully');
          process.exit(0);
        });
      }, 1000);
    });
    
    server.on('error', (error: any) => {
      console.error('✗ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`✗ Port ${config.port} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('✗ Port test failed:', error);
    process.exit(1);
  }
};

testPort();