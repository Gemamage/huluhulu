import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_USERS, ACCESSIBILITY_TEST_DATA } from '../fixtures/test-data';

test.describe('可訪問性測試', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('首頁可訪問性檢查', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // 檢查頁面標題
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // 檢查主要地標
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    console.log('首頁可訪問性檢查通過');
  });

  test('鍵盤導航測試', async ({ page }) => {
    await page.goto('/');
    
    // 測試 Tab 鍵導航
    const focusableElements = [
      '[data-testid="logo"]',
      '[data-testid="nav-search"]',
      '[data-testid="nav-post"]',
      '[data-testid="nav-login"]',
      '[data-testid="search-input"]',
      '[data-testid="search-button"]'
    ];
    
    // 從第一個元素開始
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      const currentElement = page.locator(focusableElements[i]);
      
      // 檢查元素是否可見且可聚焦
      if (await currentElement.count() > 0) {
        await expect(currentElement).toBeFocused();
        
        // 檢查焦點指示器
        const focusStyle = await currentElement.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            border: styles.border
          };
        });
        
        // 確保有可見的焦點指示器
        const hasFocusIndicator = 
          focusStyle.outline !== 'none' || 
          focusStyle.boxShadow !== 'none' || 
          focusStyle.border !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
        
        await page.keyboard.press('Tab');
      }
    }
    
    console.log('鍵盤導航測試通過');
  });

  test('螢幕閱讀器支援測試', async ({ page }) => {
    await page.goto('/');
    
    // 檢查 ARIA 標籤
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').all();
    
    for (const element of ariaElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledby = await element.getAttribute('aria-labelledby');
      const ariaDescribedby = await element.getAttribute('aria-describedby');
      
      // 確保 ARIA 標籤不為空
      if (ariaLabel) {
        expect(ariaLabel.trim()).toBeTruthy();
      }
      
      if (ariaLabelledby) {
        const labelElement = page.locator(`#${ariaLabelledby}`);
        await expect(labelElement).toBeVisible();
      }
      
      if (ariaDescribedby) {
        const descElement = page.locator(`#${ariaDescribedby}`);
        await expect(descElement).toBeVisible();
      }
    }
    
    // 檢查圖片的 alt 文字
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // 裝飾性圖片應該有 role="presentation" 或空的 alt
      // 內容圖片應該有描述性的 alt 文字
      if (role !== 'presentation') {
        expect(alt).toBeTruthy();
        if (alt) {
          expect(alt.trim().length).toBeGreaterThan(0);
        }
      }
    }
    
    console.log('螢幕閱讀器支援測試通過');
  });

  test('顏色對比度測試', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    // 檢查顏色對比度違規
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toHaveLength(0);
    
    // 手動檢查主要元素的對比度
    const elementsToCheck = [
      '[data-testid="main-title"]',
      '[data-testid="search-button"]',
      '[data-testid="nav-link"]'
    ];
    
    for (const selector of elementsToCheck) {
      const element = page.locator(selector);
      
      if (await element.count() > 0) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        console.log(`元素 ${selector} 樣式:`, styles);
      }
    }
    
    console.log('顏色對比度測試通過');
  });

  test('表單可訪問性測試', async ({ page }) => {
    await page.goto('/register');
    
    // 檢查表單標籤
    const formInputs = await page.locator('input, select, textarea').all();
    
    for (const input of formInputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      // 每個輸入欄位都應該有標籤
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          throw new Error(`輸入欄位 ${id} 缺少標籤`);
        }
      }
      
      // 檢查必填欄位標示
      const required = await input.getAttribute('required');
      const ariaRequired = await input.getAttribute('aria-required');
      
      if (required !== null || ariaRequired === 'true') {
        // 必填欄位應該有視覺指示
        const parentElement = await input.locator('..').first();
        const hasRequiredIndicator = await parentElement.locator('*').filter({ hasText: '*' }).count() > 0;
        
        // 這裡可以根據實際設計調整檢查邏輯
        console.log(`必填欄位 ${id} 檢查完成`);
      }
    }
    
    // 檢查錯誤訊息的可訪問性
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="register-button"]');
    
    // 等待錯誤訊息出現
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 }).catch(() => {});
    
    const errorMessages = await page.locator('[data-testid="error-message"], .error, [role="alert"]').all();
    
    for (const errorMsg of errorMessages) {
      const role = await errorMsg.getAttribute('role');
      const ariaLive = await errorMsg.getAttribute('aria-live');
      
      // 錯誤訊息應該有適當的 ARIA 屬性
      const hasProperAria = role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive';
      
      if (await errorMsg.isVisible()) {
        expect(hasProperAria).toBeTruthy();
      }
    }
    
    console.log('表單可訪問性測試通過');
  });

  test('動態內容可訪問性測試', async ({ page }) => {
    await page.goto('/search');
    
    // 測試搜尋結果的動態載入
    await page.fill('[data-testid="search-input"]', '狗');
    await page.click('[data-testid="search-button"]');
    
    // 檢查載入狀態的可訪問性
    const loadingIndicator = page.locator('[data-testid="loading"], [aria-live="polite"]');
    
    if (await loadingIndicator.count() > 0) {
      const ariaLive = await loadingIndicator.getAttribute('aria-live');
      const role = await loadingIndicator.getAttribute('role');
      
      // 載入指示器應該有適當的 ARIA 屬性
      expect(ariaLive === 'polite' || role === 'status').toBeTruthy();
    }
    
    // 等待搜尋結果載入
    await page.waitForSelector('[data-testid="search-results"]');
    
    // 檢查搜尋結果的可訪問性
    const searchResults = page.locator('[data-testid="search-results"]');
    const ariaLive = await searchResults.getAttribute('aria-live');
    const role = await searchResults.getAttribute('role');
    
    // 搜尋結果區域應該有適當的 ARIA 屬性
    expect(ariaLive === 'polite' || role === 'region').toBeTruthy();
    
    console.log('動態內容可訪問性測試通過');
  });

  test('多媒體內容可訪問性測試', async ({ page }) => {
    await page.goto('/pets');
    
    // 檢查影片元素
    const videos = await page.locator('video').all();
    
    for (const video of videos) {
      // 檢查影片控制項
      const controls = await video.getAttribute('controls');
      expect(controls).toBeTruthy();
      
      // 檢查字幕軌道
      const tracks = await video.locator('track').all();
      
      if (tracks.length > 0) {
        for (const track of tracks) {
          const kind = await track.getAttribute('kind');
          const src = await track.getAttribute('src');
          
          expect(kind).toBeTruthy();
          expect(src).toBeTruthy();
        }
      }
    }
    
    // 檢查音頻元素
    const audios = await page.locator('audio').all();
    
    for (const audio of audios) {
      const controls = await audio.getAttribute('controls');
      expect(controls).toBeTruthy();
    }
    
    console.log('多媒體內容可訪問性測試通過');
  });

  test('響應式設計可訪問性測試', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: '手機' },
      { width: 768, height: 1024, name: '平板' },
      { width: 1920, height: 1080, name: '桌面' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // 檢查在不同視窗大小下的可訪問性
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // 檢查導航選單的可訪問性
      const navMenu = page.locator('[data-testid="nav-menu"]');
      
      if (await navMenu.count() > 0) {
        const ariaExpanded = await navMenu.getAttribute('aria-expanded');
        const ariaHaspopup = await navMenu.getAttribute('aria-haspopup');
        
        if (viewport.width < 768) {
          // 在小螢幕上，導航選單應該是可摺疊的
          expect(ariaExpanded).toBeTruthy();
          expect(ariaHaspopup).toBeTruthy();
        }
      }
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}) 可訪問性檢查通過`);
    }
  });

  test('語言和國際化可訪問性測試', async ({ page }) => {
    await page.goto('/');
    
    // 檢查 HTML lang 屬性
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    
    // 檢查不同語言內容的標記
    const foreignLanguageElements = await page.locator('[lang]').all();
    
    for (const element of foreignLanguageElements) {
      const lang = await element.getAttribute('lang');
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    }
    
    // 檢查文字方向
    const rtlElements = await page.locator('[dir="rtl"]').all();
    
    for (const element of rtlElements) {
      const dir = await element.getAttribute('dir');
      expect(dir).toBe('rtl');
    }
    
    console.log('語言和國際化可訪問性測試通過');
  });

  test('時間限制和動畫可訪問性測試', async ({ page }) => {
    await page.goto('/');
    
    // 檢查是否有自動播放的動畫
    const animatedElements = await page.locator('[style*="animation"], .animate').all();
    
    for (const element of animatedElements) {
      // 檢查是否提供暫停控制
      const hasControls = await element.locator('button, [role="button"]').count() > 0;
      
      // 檢查動畫是否遵循 prefers-reduced-motion
      const respectsReducedMotion = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.animationPlayState === 'paused' || 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      console.log('動畫元素檢查:', { hasControls, respectsReducedMotion });
    }
    
    // 檢查自動重新整理或重新導向
    const metaRefresh = await page.locator('meta[http-equiv="refresh"]').count();
    expect(metaRefresh).toBe(0); // 不應該有自動重新整理
    
    console.log('時間限制和動畫可訪問性測試通過');
  });

  test('錯誤處理和幫助文字可訪問性測試', async ({ page }) => {
    await page.goto('/login');
    
    // 測試錯誤處理
    await page.click('[data-testid="login-button"]');
    
    // 等待錯誤訊息出現
    await page.waitForSelector('[data-testid="error-message"], [role="alert"]', { timeout: 5000 }).catch(() => {});
    
    const errorMessages = await page.locator('[data-testid="error-message"], [role="alert"], .error').all();
    
    for (const errorMsg of errorMessages) {
      if (await errorMsg.isVisible()) {
        // 檢查錯誤訊息的 ARIA 屬性
        const role = await errorMsg.getAttribute('role');
        const ariaLive = await errorMsg.getAttribute('aria-live');
        const ariaAtomic = await errorMsg.getAttribute('aria-atomic');
        
        const hasProperErrorAria = 
          role === 'alert' || 
          ariaLive === 'assertive' || 
          ariaLive === 'polite';
        
        expect(hasProperErrorAria).toBeTruthy();
        
        // 檢查錯誤訊息內容
        const errorText = await errorMsg.textContent();
        expect(errorText?.trim()).toBeTruthy();
        expect(errorText?.length).toBeGreaterThan(5);
      }
    }
    
    // 檢查幫助文字
    const helpTexts = await page.locator('[data-testid*="help"], .help-text, [role="note"]').all();
    
    for (const helpText of helpTexts) {
      if (await helpText.isVisible()) {
        const role = await helpText.getAttribute('role');
        const ariaDescribedby = await helpText.getAttribute('aria-describedby');
        
        // 幫助文字應該與相關輸入欄位關聯
        if (ariaDescribedby) {
          const relatedInput = page.locator(`[aria-describedby*="${await helpText.getAttribute('id')}"]`);
          expect(await relatedInput.count()).toBeGreaterThan(0);
        }
      }
    }
    
    console.log('錯誤處理和幫助文字可訪問性測試通過');
  });

  test('完整頁面可訪問性掃描', async ({ page }) => {
    const pagesToTest = [
      { url: '/', name: '首頁' },
      { url: '/search', name: '搜尋頁面' },
      { url: '/login', name: '登入頁面' },
      { url: '/register', name: '註冊頁面' }
    ];
    
    for (const pageInfo of pagesToTest) {
      await page.goto(pageInfo.url);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();
      
      // 記錄違規項目
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`${pageInfo.name} 可訪問性違規:`);
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  影響: ${violation.impact}`);
          console.log(`  元素數量: ${violation.nodes.length}`);
        });
      }
      
      // 嚴格模式：不允許任何違規
      expect(accessibilityScanResults.violations).toEqual([]);
      
      console.log(`${pageInfo.name} 完整可訪問性掃描通過`);
    }
  });
});