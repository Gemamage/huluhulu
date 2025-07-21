// CacheService 單元測試
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// 設置測試環境變數
process.env.NODE_ENV = 'test';

// 模擬 logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// 導入要測試的服務
import { CacheService } from '../../src/services/cacheService';

describe('CacheService 測試', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // 重置單例實例
    CacheService.resetInstance();
    // 為每個測試創建新的快取實例
    cacheService = CacheService.getInstance({
      defaultTTL: 1000, // 1秒，方便測試
      maxSize: 5,
      cleanupInterval: 500
    });
    cacheService.clear();
  });

  afterEach(() => {
    cacheService.clear();
    cacheService.stopCleanup();
    CacheService.resetInstance();
  });

  describe('基本快取操作', () => {
    it('應該能夠設置和獲取快取', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      const result = cacheService.get(key);
      
      expect(result).toEqual(value);
    });

    it('應該在快取不存在時返回 null', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('應該能夠刪除快取', () => {
      const key = 'test-key';
      const value = 'test-value';
      
      cacheService.set(key, value);
      expect(cacheService.get(key)).toBe(value);
      
      const deleted = cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(cacheService.get(key)).toBeNull();
    });

    it('應該能夠清空所有快取', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      cacheService.clear();
      
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
    });
  });

  describe('TTL 功能', () => {
    it('應該在 TTL 過期後自動清除快取', async () => {
      const key = 'ttl-test';
      const value = 'test-value';
      
      cacheService.set(key, value, 100); // 100ms TTL
      expect(cacheService.get(key)).toBe(value);
      
      // 等待 TTL 過期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cacheService.get(key)).toBeNull();
    });

    it('應該使用預設 TTL', () => {
      const key = 'default-ttl-test';
      const value = 'test-value';
      
      cacheService.set(key, value); // 使用預設 TTL
      expect(cacheService.get(key)).toBe(value);
    });
  });

  describe('withCache 方法', () => {
    it('應該執行函數並快取結果', async () => {
      const mockFn = jest.fn().mockResolvedValue('function-result');
      const cacheKey = 'function-cache';
      
      const result = await cacheService.withCache(cacheKey, mockFn);
      
      expect(result).toBe('function-result');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // 第二次調用應該使用快取
      const result2 = await cacheService.withCache(cacheKey, mockFn);
      expect(result2).toBe('function-result');
      expect(mockFn).toHaveBeenCalledTimes(1); // 沒有再次調用
    });

    it('應該實現請求去重', async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve('async-result'), 50);
        });
      });
      
      const cacheKey = 'dedup-test';
      
      // 同時發起多個相同的請求
      const promises = [
        cacheService.withCache(cacheKey, mockFn),
        cacheService.withCache(cacheKey, mockFn),
        cacheService.withCache(cacheKey, mockFn)
      ];
      
      const results = await Promise.all(promises);
      
      // 所有結果應該相同
      expect(results).toEqual(['async-result', 'async-result', 'async-result']);
      // 函數只應該被調用一次（請求去重）
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('應該處理函數執行錯誤', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Function error'));
      const cacheKey = 'error-test';
      
      await expect(cacheService.withCache(cacheKey, mockFn))
        .rejects.toThrow('Function error');
      
      // 錯誤不應該被快取
      expect(cacheService.get(cacheKey)).toBeNull();
    });
  });

  describe('模式匹配刪除', () => {
    it('應該能夠根據模式刪除快取', () => {
      cacheService.set('pets:1', 'pet1');
      cacheService.set('pets:2', 'pet2');
      cacheService.set('users:1', 'user1');
      cacheService.set('pets:owner:123', 'owner-pets');
      
      const deletedCount = cacheService.deletePattern('^pets:');
      
      expect(deletedCount).toBe(3);
      expect(cacheService.get('pets:1')).toBeNull();
      expect(cacheService.get('pets:2')).toBeNull();
      expect(cacheService.get('pets:owner:123')).toBeNull();
      expect(cacheService.get('users:1')).toBe('user1'); // 不應該被刪除
    });
  });

  describe('快取大小限制', () => {
    it('應該在達到最大大小時移除最舊的項目', () => {
      // 設置最大大小為 5
      for (let i = 1; i <= 6; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }
      
      // 第一個項目應該被移除
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key6')).toBe('value6');
    });
  });

  describe('統計資訊', () => {
    it('應該提供正確的統計資訊', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      const stats = cacheService.getStats();
      
      expect(stats.cacheSize).toBe(2);
      expect(stats.pendingRequests).toBe(0);
      expect(stats.maxSize).toBe(5);
      expect(stats.defaultTTL).toBe(1000);
    });
  });

  describe('單例模式', () => {
    it('應該返回相同的實例', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});

console.log('✅ CacheService 測試檔案已載入');