# 快取系統使用指南

本專案實現了一個完整的快取系統，包括快取服務、中間件和路由整合。

## 快取服務 (CacheService)

### 基本用法

```typescript
import { CacheService } from '../src/services/cacheService';

const cache = CacheService.getInstance();

// 設置快取
await cache.set('user:123', userData, 5 * 60 * 1000); // 5分鐘TTL

// 獲取快取
const cachedData = await cache.get('user:123');

// 刪除快取
await cache.delete('user:123');

// 清空所有快取
await cache.clear();
```

### 使用 withCache 方法

```typescript
// 自動快取函數結果
const userData = await cache.withCache(
  'user:123',
  async () => {
    // 這個函數只有在快取未命中時才會執行
    return await User.findById(123);
  },
  5 * 60 * 1000 // 5分鐘TTL
);
```

### 模式匹配刪除

```typescript
// 刪除所有用戶相關的快取
await cache.deletePattern('user:*');

// 刪除特定類型的快取
await cache.deletePattern('pets:list:*');
```

## 快取中間件

### 基本快取中間件

```typescript
import { createCacheMiddleware } from '../src/middleware/cacheMiddleware';

// 為路由添加快取
router.get('/api/pets/:id', 
  createCacheMiddleware({
    ttl: 10 * 60 * 1000, // 10分鐘快取
    keyGenerator: (req) => `pet:${req.params.id}`
  }),
  async (req, res) => {
    // 路由處理邏輯
  }
);
```

### 條件快取中間件

```typescript
import { conditionalCacheMiddleware } from '../src/middleware/cacheMiddleware';

// 只對未登入用戶進行快取
router.get('/api/pets', 
  conditionalCacheMiddleware({
    ttl: 3 * 60 * 1000,
    keyGenerator: petCacheKeyGenerator,
    userCondition: (req) => !req.user // 只對未登入用戶快取
  }),
  async (req, res) => {
    // 路由處理邏輯
  }
);
```

### 快取失效中間件

```typescript
import { createCacheInvalidationMiddleware } from '../src/middleware/cacheMiddleware';

// 在數據更新時清除相關快取
router.post('/api/pets', 
  createCacheInvalidationMiddleware({
    patterns: ['pets:*'] // 清除所有寵物相關快取
  }),
  async (req, res) => {
    // 創建新寵物的邏輯
  }
);
```

## 快取鍵生成器

```typescript
import { petCacheKeyGenerator } from '../src/middleware/cacheMiddleware';

// 自動生成基於請求參數的快取鍵
const cacheKey = petCacheKeyGenerator(req);
// 例如: "pets:list:page=1&limit=10&type=dog"
```

## 快取統計

```typescript
const stats = cache.getStats();
console.log('快取統計:', {
  總項目數: stats.totalItems,
  命中次數: stats.hits,
  未命中次數: stats.misses,
  命中率: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`
});
```

## 最佳實踐

### 1. TTL 設置建議
- 靜態數據：30分鐘 - 1小時
- 用戶數據：5-15分鐘
- 搜索結果：3-10分鐘
- 實時數據：1-3分鐘

### 2. 快取鍵命名規範
- 使用冒號分隔層級：`user:123:profile`
- 包含版本信息：`api:v1:pets:list`
- 使用有意義的前綴：`pets:`, `users:`, `search:`

### 3. 快取失效策略
- 數據更新時立即清除相關快取
- 使用模式匹配批量清除
- 定期清理過期快取

### 4. 測試建議
- 在測試中重置快取實例
- 模擬快取服務以避免副作用
- 測試快取命中和未命中情況

## 配置選項

```typescript
const cache = CacheService.getInstance({
  maxSize: 1000,        // 最大快取項目數
  defaultTTL: 300000,   // 預設TTL (5分鐘)
  cleanupInterval: 60000 // 清理間隔 (1分鐘)
});
```

## 監控和調試

```typescript
// 啟用詳細日誌
process.env.CACHE_DEBUG = 'true';

// 監控快取性能
setInterval(() => {
  const stats = cache.getStats();
  console.log('快取性能:', stats);
}, 60000); // 每分鐘記錄一次
```