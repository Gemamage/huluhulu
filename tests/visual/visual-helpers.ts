import { Page, Locator, expect } from '@playwright/test';

/**
 * 視覺回歸測試輔助工具類
 * 提供視覺測試專用的輔助方法
 */
export class VisualHelpers {
  constructor(private page: Page) {}

  /**
   * 等待頁面完全載入（包括圖片和字體）
   */
  async waitForPageFullyLoaded(): Promise<void> {
    // 等待網路閒置
    await this.page.waitForLoadState('networkidle');
    
    // 等待所有圖片載入完成
    await this.page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete && img.naturalHeight !== 0);
    });
    
    // 等待字體載入完成
    await this.page.waitForFunction(() => {
      return document.fonts.ready;
    });
    
    // 等待 CSS 動畫完成
    await this.page.waitForTimeout(500);
  }

  /**
   * 禁用頁面動畫和過渡效果
   */
  async disableAnimations(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        .loading-spinner,
        .skeleton-loader {
          animation: none !important;
        }
      `
    });
  }

  /**
   * 隱藏動態內容元素
   */
  async hideDynamicContent(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        .timestamp,
        .time-ago,
        .view-count,
        .online-indicator,
        [data-testid="dynamic-time"],
        [data-testid="view-count"],
        [data-testid="online-status"] {
          visibility: hidden !important;
        }
      `
    });
  }

  /**
   * 設置固定的測試數據
   */
  async setFixedTestData(): Promise<void> {
    await this.page.evaluate(() => {
      // 固定當前時間
      const fixedDate = new Date('2024-01-01T12:00:00Z');
      Date.now = () => fixedDate.getTime();
      
      // 覆蓋 Math.random 以獲得一致的隨機數
      let seed = 12345;
      Math.random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
    });
  }

  /**
   * 等待特定元素穩定（停止變化）
   */
  async waitForElementStable(selector: string, timeout: number = 5000): Promise<void> {
    const element = this.page.locator(selector);
    let previousContent = '';
    let stableCount = 0;
    const requiredStableChecks = 3;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const currentContent = await element.textContent() || '';
        
        if (currentContent === previousContent) {
          stableCount++;
          if (stableCount >= requiredStableChecks) {
            return;
          }
        } else {
          stableCount = 0;
          previousContent = currentContent;
        }
        
        await this.page.waitForTimeout(100);
      } catch (error) {
        // 元素可能還未出現，繼續等待
        await this.page.waitForTimeout(100);
      }
    }
    
    throw new Error(`Element ${selector} did not stabilize within ${timeout}ms`);
  }

  /**
   * 捕獲元素截圖並進行比較
   */
  async compareElementScreenshot(
    selector: string, 
    screenshotName: string, 
    options: {
      threshold?: number;
      maxDiffPixels?: number;
      mask?: Locator[];
      fullPage?: boolean;
    } = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    const defaultOptions = {
      threshold: 0.2,
      maxDiffPixels: 100,
      ...options
    };
    
    await expect(element).toHaveScreenshot(screenshotName, defaultOptions);
  }

  /**
   * 捕獲整頁截圖並進行比較
   */
  async comparePageScreenshot(
    screenshotName: string,
    options: {
      threshold?: number;
      maxDiffPixels?: number;
      mask?: Locator[];
      clip?: { x: number; y: number; width: number; height: number };
    } = {}
  ): Promise<void> {
    const defaultOptions = {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 100,
      ...options
    };
    
    await expect(this.page).toHaveScreenshot(screenshotName, defaultOptions);
  }

  /**
   * 模擬不同的視窗大小
   */
  async setViewportSize(preset: 'mobile' | 'tablet' | 'desktop' | 'wide'): Promise<void> {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 },
      wide: { width: 1920, height: 1080 }
    };
    
    await this.page.setViewportSize(viewports[preset]);
  }

  /**
   * 模擬不同的主題
   */
  async switchTheme(theme: 'light' | 'dark' | 'high-contrast'): Promise<void> {
    const themeClasses = {
      light: 'theme-light',
      dark: 'theme-dark',
      'high-contrast': 'theme-high-contrast'
    };
    
    await this.page.evaluate((themeClass) => {
      document.body.className = document.body.className
        .replace(/theme-\w+/g, '')
        .trim();
      document.body.classList.add(themeClass);
    }, themeClasses[theme]);
    
    // 等待主題切換完成
    await this.page.waitForTimeout(300);
  }

  /**
   * 模擬載入狀態
   */
  async simulateLoadingState(duration: number = 2000): Promise<void> {
    await this.page.evaluate((duration) => {
      // 添加載入指示器
      const loader = document.createElement('div');
      loader.className = 'visual-test-loader';
      loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        z-index: 9999;
      `;
      document.body.appendChild(loader);
      
      setTimeout(() => {
        loader.remove();
      }, duration);
    }, duration);
  }

  /**
   * 獲取動態內容的遮罩選擇器
   */
  getDynamicContentMasks(): Locator[] {
    return [
      this.page.locator('.timestamp'),
      this.page.locator('.time-ago'),
      this.page.locator('.view-count'),
      this.page.locator('.online-indicator'),
      this.page.locator('[data-testid="dynamic-time"]'),
      this.page.locator('[data-testid="view-count"]'),
      this.page.locator('[data-testid="online-status"]'),
      this.page.locator('.loading-spinner'),
      this.page.locator('.skeleton-loader')
    ];
  }

  /**
   * 準備視覺測試環境
   */
  async prepareForVisualTest(): Promise<void> {
    await this.disableAnimations();
    await this.setFixedTestData();
    await this.waitForPageFullyLoaded();
  }

  /**
   * 捕獲互動狀態截圖
   */
  async captureInteractionState(
    selector: string,
    interaction: 'hover' | 'focus' | 'active',
    screenshotName: string
  ): Promise<void> {
    const element = this.page.locator(selector);
    
    switch (interaction) {
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'active':
        await element.click({ noWaitAfter: true });
        break;
    }
    
    await this.page.waitForTimeout(200); // 等待狀態變化
    await expect(element).toHaveScreenshot(screenshotName, {
      threshold: 0.1
    });
  }

  /**
   * 比較文字內容快照
   */
  async compareTextSnapshot(selector: string, snapshotName: string): Promise<void> {
    const element = this.page.locator(selector);
    const textContent = await element.textContent();
    expect(textContent).toMatchSnapshot(snapshotName);
  }

  /**
   * 檢查視覺無障礙性
   */
  async checkVisualAccessibility(): Promise<void> {
    // 檢查顏色對比度
    await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // 這裡可以添加顏色對比度檢查邏輯
        // 實際實現需要顏色對比度計算函數
      });
    });
  }

  /**
   * 生成視覺測試報告
   */
  async generateVisualReport(testName: string, results: any): Promise<void> {
    const reportData = {
      testName,
      timestamp: new Date().toISOString(),
      viewport: await this.page.viewportSize(),
      userAgent: await this.page.evaluate(() => navigator.userAgent),
      results
    };
    
    // 這裡可以將報告數據寫入文件或發送到報告服務
    console.log('Visual Test Report:', JSON.stringify(reportData, null, 2));
  }
}

/**
 * 視覺測試配置選項
 */
export interface VisualTestOptions {
  threshold?: number;
  maxDiffPixels?: number;
  fullPage?: boolean;
  mask?: string[];
  clip?: { x: number; y: number; width: number; height: number };
  disableAnimations?: boolean;
  waitForStable?: boolean;
}

/**
 * 視覺測試預設配置
 */
export const VisualTestDefaults: VisualTestOptions = {
  threshold: 0.2,
  maxDiffPixels: 100,
  fullPage: false,
  disableAnimations: true,
  waitForStable: true
};