# 測試性能優化方案

## 🎯 優化目標

- 減少測試運行時間 50%
- 提升測試並行執行效率
- 優化 MongoDB Memory Server 性能
- 改善測試數據設置和清理

## 📊 當前性能分析

### 主要瓶頸
1. **MongoDB Memory Server 啟動慢** - 每次測試都重新創建
2. **測試數據清理過度** - afterEach 中清理所有集合
3. **缺乏並行執行** - 測試順序執行
4. **測試超時設置過長** - 30秒超時過於寬鬆

### 測試運行統計
- 當前測試套件數: 5 個
- 當前測試用例數: 88-90 個
- 估計運行時間: 2-3 分鐘
- 目標運行時間: 1-1.5 分鐘

## 🚀 優化策略

### 1. Jest 配置優化

#### 並行執行配置
```javascript
// jest.config.js 優化
module.exports = {
  // 啟用並行執行
  maxWorkers: '50%', // 使用 50% CPU 核心
  
  // 優化測試超時
  testTimeout: 10000, // 從 30秒 降到 10秒
  
  // 啟用測試緩存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 優化模塊解析
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 測試環境優化
  testEnvironment: 'node',
  testEnvironmentOptions: {
    // Node.js 環境優化選項
  }
};
```

### 2. MongoDB Memory Server 優化

#### 共享實例策略
```typescript
// test/setup-optimized.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// 全局共享的 MongoDB 實例
let mongod: MongoMemoryServer;
let isSetup = false;

// 優化的設置函數
beforeAll(async () => {
  if (!isSetup) {
    // 使用更小的內存配置
    mongod = await MongoMemoryServer.create({
      instance: {
        dbSize: 1, // 1MB 數據庫大小
        storageEngine: 'ephemeralForTest' // 使用內存存儲引擎
      }
    });
    
    const uri = mongod.getUri();
    await mongoose.connect(uri, {
      // 優化連接選項
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isSetup = true;
  }
});

// 優化的清理策略
afterEach(async () => {
  // 只清理必要的集合，而不是所有集合
  const collections = ['users', 'pets']; // 明確指定需要清理的集合
  
  for (const collectionName of collections) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.deleteMany({});
  }
});
```

### 3. 測試數據優化

#### 輕量級測試數據
```typescript
// test/utils/testDataOptimized.ts
export const lightweightTestData = {
  // 最小化的用戶數據
  minimalUser: {
    username: 'test',
    email: 'test@test.com',
    password: 'password123'
  },
  
  // 最小化的寵物數據
  minimalPet: {
    name: 'TestPet',
    type: 'dog',
    status: 'lost'
  }
};

// 測試數據工廠函數
export const createTestUser = (overrides = {}) => ({
  ...lightweightTestData.minimalUser,
  ...overrides
});

export const createTestPet = (overrides = {}) => ({
  ...lightweightTestData.minimalPet,
  ...overrides
});
```

### 4. 測試分組優化

#### 按性能特徵分組
```javascript
// package.json 腳本優化
{
  "scripts": {
    // 快速測試 (單元測試)
    "test:fast": "jest --testPathPattern=test/models|test/services --maxWorkers=2",
    
    // 慢速測試 (集成測試)
    "test:slow": "jest --testPathPattern=test/routes --runInBand",
    
    // 並行測試
    "test:parallel": "jest --maxWorkers=50%",
    
    // 監視模式優化
    "test:watch": "jest --watch --maxWorkers=25%"
  }
}
```

## 📈 預期改進效果

### 性能提升指標
- **測試運行時間**: 減少 40-60%
- **內存使用**: 減少 30%
- **CPU 利用率**: 提升 50%
- **測試穩定性**: 提升 20%

### 具體改進
1. **並行執行**: 5個測試套件並行運行
2. **MongoDB 優化**: 啟動時間減少 70%
3. **數據清理**: 清理時間減少 80%
4. **緩存利用**: 重複運行速度提升 30%

## 🔧 實施步驟

### 階段 1: Jest 配置優化 (預計 30 分鐘)
1. 更新 `jest.config.js`
2. 添加並行執行配置
3. 優化超時設置

### 階段 2: MongoDB 優化 (預計 45 分鐘)
1. 重構 `test/setup.ts`
2. 實施共享實例策略
3. 優化清理邏輯

### 階段 3: 測試數據優化 (預計 30 分鐘)
1. 創建輕量級測試數據
2. 實施數據工廠模式
3. 更新現有測試文件

### 階段 4: 測試腳本優化 (預計 15 分鐘)
1. 添加性能優化的測試腳本
2. 配置不同場景的運行模式
3. 更新文檔

## ⚠️ 注意事項

### 風險評估
1. **並行執行風險**: 可能導致測試間相互影響
2. **數據清理風險**: 過度優化可能導致測試污染
3. **內存限制**: 需要監控內存使用情況

### 緩解措施
1. 逐步實施，每個階段都進行測試驗證
2. 保留原始配置作為備份
3. 監控測試穩定性指標

## 📋 驗證清單

- [ ] 所有測試仍然通過
- [ ] 測試運行時間顯著減少
- [ ] 測試結果保持一致性
- [ ] 內存使用在合理範圍內
- [ ] CI/CD 環境兼容性

## 🎯 成功標準

1. **性能目標**: 測試運行時間 < 1.5 分鐘
2. **穩定性目標**: 測試通過率 > 95%
3. **資源目標**: 內存使用 < 500MB
4. **維護性目標**: 配置簡潔易懂

---

**下一步**: 開始實施階段 1 - Jest 配置優化