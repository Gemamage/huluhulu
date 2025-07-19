// 快取中間件 - 為 Express 路由提供自動快取功能
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

/**
 * 快取中間件選項
 */
interface CacheOptions {
  ttl?: number; // 快取存活時間（毫秒）
  keyGenerator?: (req: Request) => string; // 自定義快取鍵生成器
  condition?: (req: Request) => boolean; // 快取條件判斷
  skipMethods?: string[]; // 跳過快取的 HTTP 方法
}

/**
 * 創建快取中間件
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 預設5分鐘
    keyGenerator = defaultKeyGenerator,
    condition = () => true,
    skipMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // 檢查是否應該跳過快取
    if (skipMethods.includes(req.method) || !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // 嘗試從快取獲取數據
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`快取命中: ${cacheKey}`);
        return res.json(cachedData);
      }

      // 攔截 res.json 方法來快取回應
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // 只快取成功的回應
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl);
          logger.debug(`快取設置: ${cacheKey}`);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('快取中間件錯誤:', error);
      next(); // 發生錯誤時繼續執行，不影響正常流程
    }
  };
}

/**
 * 預設快取鍵生成器
 */
function defaultKeyGenerator(req: Request): string {
  const { method, originalUrl, query, params } = req;
  const queryStr = Object.keys(query).length > 0 ? JSON.stringify(query) : '';
  const paramsStr = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
  
  return `route:${method}:${originalUrl}:${queryStr}:${paramsStr}`;
}

/**
 * 寵物相關路由的快取鍵生成器
 */
export function petCacheKeyGenerator(req: Request): string {
  const { method, path, params, query } = req;
  
  if (path.includes('/pets/:id')) {
    return `pet:${params.id}`;
  }
  
  if (path.includes('/pets/owner/:ownerId')) {
    return `pets:owner:${params.ownerId}`;
  }
  
  if (path.includes('/pets')) {
    const { page = 1, limit = 10, ...filters } = query;
    const filterStr = Object.keys(filters).length > 0 ? JSON.stringify(filters) : 'none';
    return `pets:all:page:${page}:limit:${limit}:filters:${filterStr}`;
  }
  
  return defaultKeyGenerator(req);
}

/**
 * 搜尋相關路由的快取鍵生成器
 */
export function searchCacheKeyGenerator(req: Request): string {
  const { query } = req;
  const { q, ...filters } = query;
  const filterStr = Object.keys(filters).length > 0 ? JSON.stringify(filters) : 'none';
  
  return `search:${q}:filters:${filterStr}`;
}

/**
 * 快取失效中間件 - 用於數據修改後清除相關快取
 */
export function createCacheInvalidationMiddleware(patterns: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 攔截回應，在成功後清除快取
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // 只在成功回應時清除快取
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          // 替換模式中的參數
          const dynamicPattern = pattern.replace(/:(\w+)/g, (match, paramName) => {
            return req.params[paramName] || match;
          });
          
          if (dynamicPattern.includes('*') || dynamicPattern.startsWith('^')) {
            cacheService.deletePattern(dynamicPattern);
          } else {
            cacheService.delete(dynamicPattern);
          }
          
          logger.debug(`快取失效: ${dynamicPattern}`);
        });
      }
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * 條件快取中間件 - 根據用戶角色或其他條件決定是否快取
 */
export function conditionalCacheMiddleware(options: CacheOptions & {
  userCondition?: (req: Request) => boolean;
}) {
  const { userCondition, ...cacheOptions } = options;
  
  return createCacheMiddleware({
    ...cacheOptions,
    condition: (req: Request) => {
      // 檢查基本條件
      if (cacheOptions.condition && !cacheOptions.condition(req)) {
        return false;
      }
      
      // 檢查用戶條件
      if (userCondition && !userCondition(req)) {
        return false;
      }
      
      return true;
    }
  });
}

/**
 * 快取統計中間件 - 記錄快取使用統計
 */
export function cacheStatsMiddleware() {
  let requestCount = 0;
  let cacheHits = 0;
  
  return (req: Request, res: Response, next: NextFunction) => {
    requestCount++;
    
    // 檢查是否為快取命中（通過檢查回應時間）
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      // 如果回應時間很短，可能是快取命中
      if (responseTime < 10) {
        cacheHits++;
      }
      
      // 每100個請求記錄一次統計
      if (requestCount % 100 === 0) {
        const hitRate = ((cacheHits / requestCount) * 100).toFixed(2);
        logger.info(`快取統計 - 請求數: ${requestCount}, 命中率: ${hitRate}%`);
      }
    });
    
    next();
  };
}

console.log('✅ CacheMiddleware 已載入');