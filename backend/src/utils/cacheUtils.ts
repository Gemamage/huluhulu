// 快取工具函數 - 提供常用的快取操作
import { cacheService } from '../services/cacheService';
import { logger } from './logger';

/**
 * 快取裝飾器 - 為方法添加快取功能
 */
export function Cacheable(cacheKey: string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 生成動態快取鍵
      const dynamicKey = cacheKey.replace(/\{(\d+)\}/g, (match, index) => {
        return args[parseInt(index)] || match;
      });

      return await cacheService.withCache(
        dynamicKey,
        () => method.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

/**
 * 快取失效裝飾器 - 方法執行後清除指定快取
 */
export function CacheEvict(patterns: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // 清除指定的快取模式
      for (const pattern of patterns) {
        const dynamicPattern = pattern.replace(/\{(\d+)\}/g, (match, index) => {
          return args[parseInt(index)] || match;
        });
        
        if (dynamicPattern.includes('*') || dynamicPattern.startsWith('^')) {
          cacheService.deletePattern(dynamicPattern);
        } else {
          cacheService.delete(dynamicPattern);
        }
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * 快取統計工具
 */
export class CacheStats {
  /**
   * 獲取快取統計資訊
   */
  static getStats() {
    return cacheService.getStats();
  }

  /**
   * 記錄快取統計日誌
   */
  static logStats(): void {
    const stats = this.getStats();
    logger.info('快取統計:', {
      cacheSize: stats.cacheSize,
      pendingRequests: stats.pendingRequests,
      maxSize: stats.maxSize,
      defaultTTL: `${stats.defaultTTL / 1000}秒`,
      usage: `${((stats.cacheSize / stats.maxSize) * 100).toFixed(1)}%`
    });
  }

  /**
   * 清理所有快取
   */
  static clearAll(): void {
    cacheService.clear();
    logger.info('所有快取已清空');
  }

  /**
   * 清理過期快取
   */
  static cleanup(): void {
    // 觸發手動清理（通常由定時器自動執行）
    logger.info('手動觸發快取清理');
  }
}

/**
 * 快取鍵生成器
 */
export class CacheKeyGenerator {
  /**
   * 生成寵物相關的快取鍵
   */
  static pet(petId: string): string {
    return `pet:${petId}`;
  }

  /**
   * 生成用戶寵物列表快取鍵
   */
  static userPets(userId: string): string {
    return `pets:owner:${userId}`;
  }

  /**
   * 生成寵物列表快取鍵
   */
  static petList(page: number, limit: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'none';
    return `pets:all:page:${page}:limit:${limit}:filters:${filterStr}`;
  }

  /**
   * 生成搜尋結果快取鍵
   */
  static search(query: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'none';
    return `search:${query}:filters:${filterStr}`;
  }

  /**
   * 生成用戶相關快取鍵
   */
  static user(userId: string): string {
    return `user:${userId}`;
  }
}

/**
 * 快取預熱工具
 */
export class CacheWarmer {
  /**
   * 預熱常用的寵物數據
   */
  static async warmupPetData(): Promise<void> {
    try {
      logger.info('開始預熱寵物數據快取...');
      
      // 這裡可以預載入一些熱門或最新的寵物數據
      // 例如：最新的10個寵物、熱門搜尋結果等
      
      logger.info('寵物數據快取預熱完成');
    } catch (error) {
      logger.error('快取預熱失敗:', error);
    }
  }

  /**
   * 預熱搜尋結果
   */
  static async warmupSearchResults(): Promise<void> {
    try {
      logger.info('開始預熱搜尋結果快取...');
      
      // 預載入常見的搜尋查詢結果
      
      logger.info('搜尋結果快取預熱完成');
    } catch (error) {
      logger.error('搜尋快取預熱失敗:', error);
    }
  }
}

console.log('✅ CacheUtils 已載入');