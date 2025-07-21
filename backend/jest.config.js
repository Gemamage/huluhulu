module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 暫時禁用全局設置檔案，直接在測試中處理
  // setupFilesAfterEnv: ['<rootDir>/test/setup-optimized.ts'],
  
  // 性能優化配置
  testTimeout: 30000,
  maxWorkers: 1, // 在 Windows 上使用單線程可能更穩定
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 模塊映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 測試配置
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  silent: false,
  bail: 1, // 遇到第一個失敗就停止
  errorOnDeprecated: true,
  
  // 針對 CI 環境的特殊配置
  ...(process.env.CI && {
    maxWorkers: 2,
    cache: false,
    silent: true
  })
};