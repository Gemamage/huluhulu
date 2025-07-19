// 快取服務 - 提供請求快取和去重功能
import { logger } from '../utils/logger';

// 快取項目介面
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 存活時間（毫秒）
}

// 進行中的請求追蹤
interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// 快取配置
interface CacheConfig {
  defaultTTL: number; // 預設快取時間（毫秒）
  maxSize: number; // 最大快取項目數量
  cleanupInterval: number; // 清理間隔（毫秒）
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5分鐘
      maxSize: 1000, // 最多1000個快取項目
      cleanupInterval: 60 * 1000, // 每分鐘清理一次
      ...config
    };

    // 啟動定期清理
    this.startCleanup();
  }

  /**
   * 獲取快取服務實例（單例模式）
   */
  static getInstance(config?: Partial<CacheConfig>): CacheService {
    // 在測試環境中，允許創建新實例
    if (process.env.NODE_ENV === 'test' && config) {
      return new CacheService(config);
    }
    
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  /**
   * 重置單例實例（僅用於測試）
   */
  static resetInstance(): void {
    if (process.env.NODE_ENV === 'test') {
      if (CacheService.instance) {
        CacheService.instance.stopCleanup();
      }
      CacheService.instance = null as any;
    }
  }

  /**
   * 生成快取鍵
   */
  private generateKey(prefix: string, params: any[]): string {
    const paramStr = params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join('|');
    return `${prefix}:${paramStr}`;
  }

  /**
   * 檢查快取項目是否過期
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * 獲取快取資料
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`快取命中: ${key}`);
    return item.data;
  }

  /**
   * 設置快取資料
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 檢查快取大小限制
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, item);
    logger.debug(`快取設置: ${key}`);
  }

  /**
   * 刪除快取項目
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`快取刪除: ${key}`);
    }
    return deleted;
  }

  /**
   * 清空所有快取
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    logger.info('所有快取已清空');
  }

  /**
   * 帶快取的函數執行（包含請求去重）
   */
  async withCache<T>(
    cacheKey: string,
    asyncFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 檢查快取
    const cached = this.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 檢查是否有相同的請求正在進行（請求去重）
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      logger.debug(`請求去重: ${cacheKey}`);
      return pending.promise;
    }

    // 執行新請求
    const promise = asyncFunction();
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    try {
      const result = await promise;
      // 將結果存入快取
      this.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      logger.error(`快取函數執行失敗: ${cacheKey}`, error);
      throw error;
    } finally {
      // 清除進行中的請求記錄
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * 批量刪除快取（支援模式匹配）
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`批量刪除快取: ${deletedCount} 個項目`);
    }
    return deletedCount;
  }

  /**
   * 移除最舊的快取項目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`移除最舊快取: ${oldestKey}`);
    }
  }

  /**
   * 清理過期的快取項目
   */
  private cleanup(): void {
    let cleanedCount = 0;
    const now = Date.now();

    // 清理過期快取
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    // 清理過期的進行中請求（超過5分鐘）
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 5 * 60 * 1000) {
        this.pendingRequests.delete(key);
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`清理過期快取: ${cleanedCount} 個項目`);
    }
  }

  /**
   * 啟動定期清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止定期清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 獲取快取統計資訊
   */
  getStats(): {
    cacheSize: number;
    pendingRequests: number;
    maxSize: number;
    defaultTTL: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL
    };
  }
}

// 預設快取實例
export const cacheService = CacheService.getInstance();

console.log('✅ CacheService 已載入');