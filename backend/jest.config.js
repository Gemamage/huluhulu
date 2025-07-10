module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/database.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // 性能優化配置
  testTimeout: 10000, // 從 30秒 減少到 10秒
  maxWorkers: '50%', // 使用 50% CPU 核心進行並行執行
  
  // 緩存優化
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 模塊解析優化
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 測試執行優化
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false, // 避免過度重置，提升性能
  
  // 輸出優化
  verbose: false, // 減少輸出，提升性能
  silent: false,
  
  // 錯誤處理優化
  bail: 0, // 不在第一個失敗時停止
  errorOnDeprecated: false
};

// 針對不同環境的配置
if (process.env.CI) {
  // CI 環境優化
  module.exports.maxWorkers = 2;
  module.exports.cache = false;
}