import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_USERS, PERFORMANCE_TEST_DATA } from '../fixtures/test-data';

test.describe('性能測試', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('首頁載入性能', async ({ page }) => {
    // 開始性能監控
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 測量頁面載入時間
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstPaint: timing.responseEnd - timing.requestStart,
        domInteractive: timing.domInteractive - timing.navigationStart
      };
    });
    
    // 驗證載入時間在可接受範圍內
    expect(navigationTiming.domContentLoaded).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable);
    expect(navigationTiming.loadComplete).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable);
    
    console.log('首頁載入性能:', navigationTiming);
  });

  test('搜尋功能性能', async ({ page }) => {
    await page.goto('/search');
    
    // 測量搜尋響應時間
    const startTime = Date.now();
    
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    // 等待搜尋結果載入
    await page.waitForSelector('[data-testid="search-results"]');
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // 驗證搜尋響應時間
    expect(searchTime).toBeLessThan(PERFORMANCE_TEST_DATA.apiResponseTimes.acceptable);
    
    console.log('搜尋響應時間:', searchTime, 'ms');
  });

  test('圖片載入性能', async ({ page }) => {
    await page.goto('/pets');
    
    // 等待寵物列表載入
    await page.waitForSelector('[data-testid="pet-card"]');
    
    // 測量圖片載入時間
    const imageLoadTimes = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('[data-testid="pet-image"]')) as HTMLImageElement[];
      return Promise.all(images.map(img => {
        return new Promise<number>((resolve) => {
          const startTime = performance.now();
          if (img.complete) {
            resolve(0);
          } else {
            img.onload = () => {
              const loadTime = performance.now() - startTime;
              resolve(loadTime);
            };
          }
        });
      }));
    });
    
    // 驗證圖片載入時間
    const avgLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
    expect(avgLoadTime).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable);
    
    console.log('平均圖片載入時間:', avgLoadTime, 'ms');
  });

  test('API 響應時間測試', async ({ page }) => {
    await helpers.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
    
    // 測試各種 API 端點的響應時間
    const apiTests = [
      { name: '獲取寵物列表', url: '/api/pets', method: 'GET' },
      { name: '搜尋寵物', url: '/api/pets/search?q=dog', method: 'GET' },
      { name: '獲取用戶資料', url: '/api/user/profile', method: 'GET' }
    ];
    
    for (const apiTest of apiTests) {
      const startTime = Date.now();
      
      const response = await page.request.get(apiTest.url);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 驗證 API 響應時間
      expect(responseTime).toBeLessThan(PERFORMANCE_TEST_DATA.apiResponseTimes.acceptable);
      expect(response.status()).toBe(200);
      
      console.log(`${apiTest.name} 響應時間:`, responseTime, 'ms');
    }
  });

  test('並發用戶模擬', async ({ browser }) => {
    const concurrentUsers = 5;
    const contexts = [];
    const pages = [];
    
    // 創建多個瀏覽器上下文模擬並發用戶
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    // 同時載入首頁
    const loadPromises = pages.map(async (page, index) => {
      const startTime = Date.now();
      await page.goto('/');
      const endTime = Date.now();
      return {
        user: index + 1,
        loadTime: endTime - startTime
      };
    });
    
    const results = await Promise.all(loadPromises);
    
    // 驗證所有用戶的載入時間
    results.forEach(result => {
      expect(result.loadTime).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable * 2); // 並發時允許較長時間
      console.log(`用戶 ${result.user} 載入時間:`, result.loadTime, 'ms');
    });
    
    // 清理資源
    for (const context of contexts) {
      await context.close();
    }
  });

  test('記憶體使用監控', async ({ page }) => {
    await page.goto('/');
    
    // 測量初始記憶體使用
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log('初始記憶體使用:', initialMemory);
      
      // 執行一些操作
      await page.click('[data-testid="search-button"]');
      await page.fill('[data-testid="search-input"]', '測試搜尋');
      await page.click('[data-testid="search-button"]');
      
      // 等待操作完成
      await page.waitForTimeout(2000);
      
      // 測量操作後的記憶體使用
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      });
      
      console.log('操作後記憶體使用:', finalMemory);
      
      // 檢查記憶體洩漏（簡單檢查）
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      // 記憶體增長不應超過 50%
      expect(memoryIncreasePercent).toBeLessThan(50);
      
      console.log('記憶體增長:', memoryIncrease, 'bytes (', memoryIncreasePercent.toFixed(2), '%)');
    }
  });

  test('網路條件模擬', async ({ page }) => {
    // 模擬慢速網路
    await page.route('**/*', async route => {
      // 添加延遲模擬慢速網路
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log('慢速網路載入時間:', loadTime, 'ms');
    
    // 在慢速網路下，載入時間應該仍在合理範圍內
    expect(loadTime).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable * 3);
  });

  test('大量數據處理性能', async ({ page }) => {
    await page.goto('/search');
    
    // 模擬搜尋大量結果
    await page.fill('[data-testid="search-input"]', '寵物'); // 廣泛搜尋詞
    
    const startTime = Date.now();
    await page.click('[data-testid="search-button"]');
    
    // 等待結果載入
    await page.waitForSelector('[data-testid="search-results"]');
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // 驗證大量數據處理時間
    expect(searchTime).toBeLessThan(PERFORMANCE_TEST_DATA.apiResponseTimes.acceptable * 2);
    
    // 檢查分頁功能性能
    if (await page.locator('[data-testid="next-page"]').count() > 0) {
      const pageStartTime = Date.now();
      await page.click('[data-testid="next-page"]');
      await page.waitForSelector('[data-testid="search-results"]');
      const pageEndTime = Date.now();
      
      const pageLoadTime = pageEndTime - pageStartTime;
      expect(pageLoadTime).toBeLessThan(PERFORMANCE_TEST_DATA.apiResponseTimes.good);
      
      console.log('分頁載入時間:', pageLoadTime, 'ms');
    }
    
    console.log('大量數據搜尋時間:', searchTime, 'ms');
  });

  test('移動設備性能', async ({ page }) => {
    // 模擬移動設備
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ media: 'screen' });
    
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    
    const mobileLoadTime = endTime - startTime;
    
    // 移動設備載入時間可能稍長
    expect(mobileLoadTime).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.acceptable * 1.5);
    
    // 測試觸控操作性能
    const touchStartTime = Date.now();
    await page.tap('[data-testid="search-button"]');
    const touchEndTime = Date.now();
    
    const touchResponseTime = touchEndTime - touchStartTime;
    expect(touchResponseTime).toBeLessThan(100); // 觸控響應應該很快
    
    console.log('移動設備載入時間:', mobileLoadTime, 'ms');
    console.log('觸控響應時間:', touchResponseTime, 'ms');
  });

  test('資源載入優化檢查', async ({ page }) => {
    // 監控網路請求
    const requests: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });
    
    await page.goto('/');
    
    // 等待所有資源載入完成
    await page.waitForLoadState('networkidle');
    
    // 分析資源載入
    const imageRequests = requests.filter(req => req.resourceType === 'image');
    const scriptRequests = requests.filter(req => req.resourceType === 'script');
    const stylesheetRequests = requests.filter(req => req.resourceType === 'stylesheet');
    
    console.log('資源載入統計:');
    console.log('- 圖片請求:', imageRequests.length);
    console.log('- 腳本請求:', scriptRequests.length);
    console.log('- 樣式表請求:', stylesheetRequests.length);
    console.log('- 總請求數:', requests.length);
    
    // 驗證資源請求數量合理
    expect(requests.length).toBeLessThan(50); // 總請求數不應過多
    expect(imageRequests.length).toBeLessThan(20); // 圖片請求不應過多
  });

  test('快取效果測試', async ({ page }) => {
    // 第一次載入
    const firstLoadStart = Date.now();
    await page.goto('/');
    const firstLoadEnd = Date.now();
    const firstLoadTime = firstLoadEnd - firstLoadStart;
    
    // 重新載入（應該使用快取）
    const secondLoadStart = Date.now();
    await page.reload();
    const secondLoadEnd = Date.now();
    const secondLoadTime = secondLoadEnd - secondLoadStart;
    
    console.log('首次載入時間:', firstLoadTime, 'ms');
    console.log('快取載入時間:', secondLoadTime, 'ms');
    
    // 快取載入應該更快
    expect(secondLoadTime).toBeLessThan(firstLoadTime);
    
    // 快取載入時間應該在良好範圍內
    expect(secondLoadTime).toBeLessThan(PERFORMANCE_TEST_DATA.pageLoadTimes.good);
  });
});