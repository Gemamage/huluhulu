// 測試分組配置 - 用於優化測試執行順序和並行度

// 快速測試組 - 單元測試，執行時間 < 1秒
export const fastTests = [
  'test/models/*.test.ts',
  'test/utils/*.test.ts',
  'test/middleware/*.test.ts'
];

// 中等測試組 - 服務測試，執行時間 1-5秒
export const mediumTests = [
  'test/services/userService.test.ts',
  'test/services/petService.test.ts',
  'test/services/authService.test.ts'
];

// 慢速測試組 - 路由和集成測試，執行時間 > 5秒
export const slowTests = [
  'test/routes/auth.test.ts',
  'test/routes/users.test.ts',
  'test/routes/pets.test.ts'
];

// 關鍵測試組 - 核心功能測試，必須通過
export const criticalTests = [
  'test/routes/auth.test.ts',
  'test/services/authService.test.ts',
  'test/models/User.test.ts',
  'test/models/Pet.test.ts'
];

// 可選測試組 - 輔助功能測試，可以容忍偶爾失敗
export const optionalTests = [
  'test/services/emailService.test.ts',
  'test/services/aiService.test.ts'
];

// 測試執行策略配置
export const testExecutionConfig = {
  // 並行執行配置
  parallel: {
    fast: { maxWorkers: '75%', timeout: 5000 },
    medium: { maxWorkers: '50%', timeout: 15000 },
    slow: { maxWorkers: '25%', timeout: 30000 }
  },
  
  // 重試配置
  retry: {
    critical: 3, // 關鍵測試重試3次
    normal: 1,   // 普通測試重試1次
    optional: 0  // 可選測試不重試
  },
  
  // 超時配置
  timeout: {
    unit: 5000,        // 單元測試 5秒
    integration: 15000, // 集成測試 15秒
    e2e: 30000         // 端到端測試 30秒
  }
};

// Jest 項目配置 - 用於多項目並行執行
export const jestProjects = [
  {
    displayName: '🚀 Fast Tests',
    testMatch: fastTests,
    maxWorkers: '75%',
    testTimeout: 5000,
    setupFilesAfterEnv: ['<rootDir>/test/setup-optimized.ts']
  },
  {
    displayName: '⚡ Medium Tests', 
    testMatch: mediumTests,
    maxWorkers: '50%',
    testTimeout: 15000,
    setupFilesAfterEnv: ['<rootDir>/test/setup-optimized.ts']
  },
  {
    displayName: '🐌 Slow Tests',
    testMatch: slowTests,
    maxWorkers: '25%',
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/test/setup-optimized.ts']
  }
];

// 測試標籤配置
export const testTags = {
  '@fast': fastTests,
  '@medium': mediumTests,
  '@slow': slowTests,
  '@critical': criticalTests,
  '@optional': optionalTests
};

// 性能基準配置
export const performanceBenchmarks = {
  // 各類測試的預期執行時間（毫秒）
  expectedDuration: {
    unit: 100,        // 單元測試應在 100ms 內完成
    service: 1000,    // 服務測試應在 1s 內完成
    route: 3000,      // 路由測試應在 3s 內完成
    integration: 5000 // 集成測試應在 5s 內完成
  },
  
  // 性能警告閾值
  warningThresholds: {
    unit: 500,        // 單元測試超過 500ms 發出警告
    service: 3000,    // 服務測試超過 3s 發出警告
    route: 10000,     // 路由測試超過 10s 發出警告
    integration: 15000 // 集成測試超過 15s 發出警告
  }
};

// 測試數據管理配置
export const testDataConfig = {
  // 數據清理策略
  cleanup: {
    afterEach: ['users', 'pets', 'sessions'], // 每個測試後清理的集合
    afterAll: ['logs', 'temp_files'],         // 所有測試後清理的集合
    skip: ['system_config']                   // 跳過清理的集合
  },
  
  // 測試數據預設
  fixtures: {
    users: 5,     // 預設創建 5 個測試用戶
    pets: 10,     // 預設創建 10 個測試寵物
    sessions: 3   // 預設創建 3 個測試會話
  },
  
  // 數據生成策略
  generation: {
    lazy: true,      // 懶加載測試數據
    cache: true,     // 緩存生成的數據
    minimal: true    // 使用最小化數據集
  }
};

// 導出默認配置
export default {
  testExecutionConfig,
  jestProjects,
  testTags,
  performanceBenchmarks,
  testDataConfig
};