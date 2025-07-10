import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { TEST_USERS, SEARCH_TEST_DATA } from '../../fixtures/test-data';

test.describe('寵物搜尋功能', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
  });

  test('基本關鍵字搜尋', async ({ page }) => {
    const searchKeyword = SEARCH_TEST_DATA.keywords.petNames[0];
    
    // 在搜尋框輸入關鍵字
    await page.fill('[data-testid="search-input"]', searchKeyword);
    await page.click('[data-testid="search-button"]');
    
    // 等待搜尋結果載入
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證搜尋結果
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="pet-card"]')).toHaveCount.greaterThan(0);
    
    // 驗證搜尋結果包含關鍵字
    const petCards = page.locator('[data-testid="pet-card"]');
    const firstCard = petCards.first();
    await expect(firstCard).toContainText(searchKeyword, { ignoreCase: true });
  });

  test('進階篩選搜尋', async ({ page }) => {
    // 點擊進階搜尋
    await page.click('[data-testid="advanced-search-toggle"]');
    
    // 設置篩選條件
    await page.selectOption('[data-testid="pet-type-filter"]', 'dog');
    await page.selectOption('[data-testid="pet-status-filter"]', 'lost');
    await page.selectOption('[data-testid="pet-size-filter"]', 'medium');
    await page.selectOption('[data-testid="location-city-filter"]', '台北市');
    
    // 執行搜尋
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證篩選結果
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // 驗證每個結果都符合篩選條件
    const petCards = page.locator('[data-testid="pet-card"]');
    const cardCount = await petCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = petCards.nth(i);
      await expect(card.locator('[data-testid="pet-type"]')).toContainText('狗');
      await expect(card.locator('[data-testid="pet-status"]')).toContainText('走失');
    }
  });

  test('地圖搜尋功能', async ({ page }) => {
    // 切換到地圖檢視
    await page.click('[data-testid="map-view-toggle"]');
    
    // 等待地圖載入
    await expect(page.locator('[data-testid="pet-map"]')).toBeVisible();
    
    // 點擊地圖上的標記
    await page.click('[data-testid="map-marker"]');
    
    // 驗證彈出視窗
    await expect(page.locator('[data-testid="map-popup"]')).toBeVisible();
    await expect(page.locator('[data-testid="pet-info-popup"]')).toBeVisible();
    
    // 點擊查看詳情
    await page.click('[data-testid="view-pet-details"]');
    
    // 驗證跳轉到寵物詳情頁面
    expect(page.url()).toContain('/pets/');
  });

  test('搜尋結果排序', async ({ page }) => {
    // 執行基本搜尋
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 測試按日期排序
    await page.selectOption('[data-testid="sort-select"]', 'date-desc');
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證排序結果
    const dates = await page.locator('[data-testid="pet-date"]').allTextContents();
    const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    expect(dates).toEqual(sortedDates);
    
    // 測試按距離排序（需要位置權限）
    await page.selectOption('[data-testid="sort-select"]', 'distance');
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證距離排序（如果有實現）
    const distanceElements = page.locator('[data-testid="pet-distance"]');
    if (await distanceElements.count() > 0) {
      const distances = await distanceElements.allTextContents();
      // 驗證距離是遞增排序
      for (let i = 1; i < distances.length; i++) {
        const prevDistance = parseFloat(distances[i-1]);
        const currDistance = parseFloat(distances[i]);
        expect(currDistance).toBeGreaterThanOrEqual(prevDistance);
      }
    }
  });

  test('搜尋結果分頁', async ({ page }) => {
    // 執行會產生多頁結果的搜尋
    await page.fill('[data-testid="search-input"]', '寵物');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證分頁控制項
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // 記錄第一頁的結果
    const firstPageResults = await page.locator('[data-testid="pet-card"] [data-testid="pet-name"]').allTextContents();
    
    // 點擊下一頁
    await page.click('[data-testid="next-page"]');
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證頁面內容改變
    const secondPageResults = await page.locator('[data-testid="pet-card"] [data-testid="pet-name"]').allTextContents();
    expect(secondPageResults).not.toEqual(firstPageResults);
    
    // 驗證頁碼顯示
    await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    
    // 測試返回上一頁
    await page.click('[data-testid="prev-page"]');
    await helpers.waitForApiResponse('/api/pets/search');
    
    const backToFirstPage = await page.locator('[data-testid="pet-card"] [data-testid="pet-name"]').allTextContents();
    expect(backToFirstPage).toEqual(firstPageResults);
  });

  test('無搜尋結果處理', async ({ page }) => {
    // 搜尋不存在的內容
    await page.fill('[data-testid="search-input"]', 'xyz123不存在的寵物');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證無結果訊息
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results-message"]')).toContainText('找不到符合條件的寵物');
    
    // 驗證建議操作
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="clear-filters-button"]')).toBeVisible();
  });

  test('搜尋歷史記錄', async ({ page }) => {
    const searchTerms = ['小白', '柴犬', '台北市'];
    
    // 執行多次搜尋
    for (const term of searchTerms) {
      await page.fill('[data-testid="search-input"]', term);
      await page.click('[data-testid="search-button"]');
      await helpers.waitForApiResponse('/api/pets/search');
    }
    
    // 點擊搜尋框顯示歷史記錄
    await page.click('[data-testid="search-input"]');
    
    // 驗證搜尋歷史
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
    
    for (const term of searchTerms) {
      await expect(page.locator(`[data-testid="history-item-${term}"]`)).toBeVisible();
    }
    
    // 點擊歷史記錄項目
    await page.click(`[data-testid="history-item-${searchTerms[0]}"]`);
    
    // 驗證搜尋框填入歷史記錄
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue(searchTerms[0]);
  });

  test('即時搜尋建議', async ({ page }) => {
    // 開始輸入搜尋關鍵字
    await page.fill('[data-testid="search-input"]', '小');
    
    // 等待搜尋建議出現
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    
    // 驗證建議項目
    const suggestions = page.locator('[data-testid="suggestion-item"]');
    expect(await suggestions.count()).toBeGreaterThan(0);
    
    // 點擊建議項目
    await suggestions.first().click();
    
    // 驗證搜尋執行
    await helpers.waitForApiResponse('/api/pets/search');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('收藏寵物功能', async ({ page }) => {
    // 需要登入才能收藏
    await helpers.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
    
    // 執行搜尋
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 點擊收藏按鈕
    const firstPetCard = page.locator('[data-testid="pet-card"]').first();
    await firstPetCard.locator('[data-testid="favorite-button"]').click();
    
    // 等待收藏 API 回應
    await helpers.waitForApiResponse('/api/pets/favorite');
    
    // 驗證收藏狀態改變
    await expect(firstPetCard.locator('[data-testid="favorite-button"]')).toHaveClass(/favorited/);
    
    // 再次點擊取消收藏
    await firstPetCard.locator('[data-testid="favorite-button"]').click();
    await helpers.waitForApiResponse('/api/pets/favorite');
    
    // 驗證收藏狀態取消
    await expect(firstPetCard.locator('[data-testid="favorite-button"]')).not.toHaveClass(/favorited/);
  });

  test('分享寵物資訊', async ({ page }) => {
    // 執行搜尋
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 點擊分享按鈕
    const firstPetCard = page.locator('[data-testid="pet-card"]').first();
    await firstPetCard.locator('[data-testid="share-button"]').click();
    
    // 驗證分享選項
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-line"]')).toBeVisible();
    await expect(page.locator('[data-testid="copy-link"]')).toBeVisible();
    
    // 測試複製連結
    await page.click('[data-testid="copy-link"]');
    
    // 驗證複製成功訊息
    await expect(page.locator('[data-testid="copy-success-message"]')).toBeVisible();
  });

  test('搜尋篩選器重置', async ({ page }) => {
    // 設置多個篩選條件
    await page.click('[data-testid="advanced-search-toggle"]');
    
    await page.selectOption('[data-testid="pet-type-filter"]', 'dog');
    await page.selectOption('[data-testid="pet-status-filter"]', 'lost');
    await page.selectOption('[data-testid="pet-size-filter"]', 'medium');
    await page.fill('[data-testid="search-input"]', '測試關鍵字');
    
    // 執行搜尋
    await page.click('[data-testid="search-button"]');
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 點擊重置按鈕
    await page.click('[data-testid="reset-filters-button"]');
    
    // 驗證所有篩選條件被重置
    await expect(page.locator('[data-testid="pet-type-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="pet-status-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="pet-size-filter"]')).toHaveValue('');
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
  });

  test('響應式搜尋介面', async ({ page }) => {
    // 測試桌面版
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="desktop-search-layout"]')).toBeVisible();
    
    // 測試平板版
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="tablet-search-layout"]')).toBeVisible();
    
    // 測試手機版
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-search-layout"]')).toBeVisible();
    
    // 在手機版測試搜尋功能
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    await helpers.waitForApiResponse('/api/pets/search');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('搜尋載入狀態', async ({ page }) => {
    // 執行搜尋
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    // 驗證載入狀態
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeDisabled();
    
    // 等待搜尋完成
    await helpers.waitForApiResponse('/api/pets/search');
    
    // 驗證載入狀態消失
    await expect(page.locator('[data-testid="search-loading"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeEnabled();
  });
});