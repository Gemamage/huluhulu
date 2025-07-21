console.log('=== Server Debug Test ===');

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  console.log('2. Loading mongoose...');
  const mongoose = require('mongoose');
  console.log('✅ mongoose loaded');

  console.log('3. Loading express...');
  const express = require('express');
  console.log('✅ express loaded');

  console.log('4. Testing environment variables...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('✅ environment variables loaded');

  console.log('5. Testing MongoDB connection...');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-finder')
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      
      console.log('6. Creating Express app...');
      const app = express();
      console.log('✅ Express app created');
      
      console.log('7. Starting server...');
      const server = app.listen(process.env.PORT || 5000, () => {
        console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
        console.log('=== All tests passed! ===');
        server.close();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Error during initialization:', error);
  process.exit(1);
}

// 設置超時
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 15000);