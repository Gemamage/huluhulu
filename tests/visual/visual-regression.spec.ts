import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

/**
 * 視覺回歸測試套件
 * 使用 Playwright 內建的視覺比較功能
 * 確保 UI 外觀的一致性和穩定性
 */
test.describe('視覺回歸測試', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('首頁視覺測試', () => {
    test('首頁完整截圖', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 等待所有圖片載入完成
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete);
      });

      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 100
      });
    });

    test('導航欄視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navbar = page.locator('nav, .navbar, [data-testid="navbar"]').first();
      await expect(navbar).toHaveScreenshot('navbar.png', {
        threshold: 0.1
      });
    });

    test('搜尋區域視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const searchSection = page.locator('.search-section, [data-testid="search-section"]').first();
      await expect(searchSection).toHaveScreenshot('search-section.png', {
        threshold: 0.1
      });
    });

    test('特色寵物區域視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 遮罩動態內容（如時間戳記）
      const dynamicElements = page.locator('.timestamp, .time-ago, [data-testid="dynamic-time"]');
      
      const featuredSection = page.locator('.featured-pets, [data-testid="featured-pets"]').first();
      await expect(featuredSection).toHaveScreenshot('featured-pets.png', {
        mask: [dynamicElements],
        threshold: 0.2
      });
    });
  });

  test.describe('用戶認證頁面視覺測試', () => {
    test('登入頁面視覺測試', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-page.png', {
        threshold: 0.1
      });
    });

    test('註冊頁面視覺測試', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('register-page.png', {
        threshold: 0.1
      });
    });

    test('登入表單錯誤狀態視覺測試', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // 觸發表單驗證錯誤
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', '123');
      await page.click('[data-testid="login-button"]');
      
      // 等待錯誤訊息顯示
      await page.waitForSelector('.error-message, .field-error', { state: 'visible' });
      
      await expect(page).toHaveScreenshot('login-form-errors.png', {
        threshold: 0.1
      });
    });
  });

  test.describe('寵物相關頁面視覺測試', () => {
    test('寵物搜尋頁面視覺測試', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('pet-search-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('寵物發布頁面視覺測試', async ({ page }) => {
      // 需要先登入
      await helpers.loginUser(TestData.users.testUser.email, TestData.users.testUser.password);
      
      await page.goto('/post-pet');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('pet-post-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('寵物詳情頁面視覺測試', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // 點擊第一個寵物卡片
      const firstPetCard = page.locator('.pet-card, [data-testid="pet-card"]').first();
      await firstPetCard.click();
      
      await page.waitForLoadState('networkidle');
      
      // 遮罩動態內容
      const dynamicElements = page.locator('.timestamp, .view-count, [data-testid="dynamic-content"]');
      
      await expect(page).toHaveScreenshot('pet-detail-page.png', {
        fullPage: true,
        mask: [dynamicElements],
        threshold: 0.2
      });
    });

    test('寵物搜尋結果視覺測試', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // 執行搜尋
      await page.fill('[data-testid="search-input"]', '黃金獵犬');
      await page.click('[data-testid="search-button"]');
      
      // 等待搜尋結果載入
      await page.waitForSelector('.search-results, [data-testid="search-results"]', { state: 'visible' });
      await page.waitForLoadState('networkidle');
      
      const searchResults = page.locator('.search-results, [data-testid="search-results"]');
      await expect(searchResults).toHaveScreenshot('search-results.png', {
        threshold: 0.2
      });
    });
  });

  test.describe('AI 功能視覺測試', () => {
    test('AI 寵物識別介面視覺測試', async ({ page }) => {
      await page.goto('/ai-identify');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('ai-identify-page.png', {
        threshold: 0.1
      });
    });

    test('AI 聊天助手介面視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 開啟 AI 聊天助手
      const chatButton = page.locator('[data-testid="ai-chat-button"], .ai-chat-toggle');
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForSelector('.ai-chat-window, [data-testid="ai-chat-window"]', { state: 'visible' });
        
        const chatWindow = page.locator('.ai-chat-window, [data-testid="ai-chat-window"]');
        await expect(chatWindow).toHaveScreenshot('ai-chat-window.png', {
          threshold: 0.1
        });
      }
    });
  });

  test.describe('響應式設計視覺測試', () => {
    test('手機版首頁視覺測試', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('平板版搜尋頁面視覺測試', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('search-page-tablet.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('桌面版寬螢幕視覺測試', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-desktop-wide.png', {
        fullPage: true,
        threshold: 0.2
      });
    });
  });

  test.describe('主題和樣式視覺測試', () => {
    test('深色主題視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 切換到深色主題（如果有的話）
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-switch');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500); // 等待主題切換動畫
        
        await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
          fullPage: true,
          threshold: 0.2
        });
      }
    });

    test('高對比度模式視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 模擬高對比度模式
      await page.addStyleTag({
        content: `
          * {
            filter: contrast(150%) !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('互動狀態視覺測試', () => {
    test('按鈕懸停狀態視覺測試', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const primaryButton = page.locator('.btn-primary, [data-testid="primary-button"]').first();
      await primaryButton.hover();
      
      await expect(primaryButton).toHaveScreenshot('button-hover-state.png', {
        threshold: 0.1
      });
    });

    test('表單焦點狀態視覺測試', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('[data-testid="email-input"]');
      await emailInput.focus();
      
      await expect(emailInput).toHaveScreenshot('input-focus-state.png', {
        threshold: 0.1
      });
    });

    test('載入狀態視覺測試', async ({ page }) => {
      await page.goto('/search');
      
      // 攔截 API 請求以延遲響應
      await page.route('**/api/pets/search**', async route => {
        await page.waitForTimeout(2000); // 延遲 2 秒
        route.continue();
      });
      
      await page.fill('[data-testid="search-input"]', '測試');
      await page.click('[data-testid="search-button"]');
      
      // 捕獲載入狀態
      const loadingElement = page.locator('.loading, [data-testid="loading"]');
      if (await loadingElement.isVisible()) {
        await expect(loadingElement).toHaveScreenshot('loading-state.png', {
          threshold: 0.1
        });
      }
    });
  });

  test.describe('錯誤狀態視覺測試', () => {
    test('404 頁面視覺測試', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-page.png', {
        threshold: 0.1
      });
    });

    test('網路錯誤狀態視覺測試', async ({ page }) => {
      // 模擬網路錯誤
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/search');
      await page.fill('[data-testid="search-input"]', '測試');
      await page.click('[data-testid="search-button"]');
      
      // 等待錯誤訊息顯示
      await page.waitForSelector('.error-message, [data-testid="error-message"]', { 
        state: 'visible',
        timeout: 5000 
      });
      
      const errorMessage = page.locator('.error-message, [data-testid="error-message"]');
      await expect(errorMessage).toHaveScreenshot('network-error.png', {
        threshold: 0.1
      });
    });
  });
});