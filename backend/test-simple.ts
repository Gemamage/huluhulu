console.log('Simple TypeScript test');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Test basic imports
try {
  console.log('Testing imports...');
  const express = require('express');
  console.log('Express imported successfully');
} catch (error: any) {
  console.error('Import error:', error.message);
}

console.log('Test completed successfully');