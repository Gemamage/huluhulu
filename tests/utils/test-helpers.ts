import { Page, expect } from '@playwright/test';

/**
 * 測試輔助函數集合
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 用戶登入
   */
  async login(email: string = 'test@example.com', password: string = 'Test123!') {
    await this.page.goto('/auth/login');
    
    // 填寫登入表單
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    
    // 點擊登入按鈕
    await this.page.click('[data-testid="login-button"]');
    
    // 等待登入成功，檢查是否跳轉到首頁或顯示用戶信息
    await expect(this.page).toHaveURL(/\/(dashboard|profile|pets)/);
    
    // 等待用戶狀態加載完成
    await this.page.waitForTimeout(1000);
  }

  /**
   * 用戶登出
   */
  async logout() {
    // 點擊用戶菜單
    await this.page.click('[data-testid="user-menu"]');
    
    // 點擊登出按鈕
    await this.page.click('[data-testid="logout-button"]');
    
    // 確認已登出
    await expect(this.page).toHaveURL('/auth/login');
  }

  /**
   * 註冊新用戶
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) {
    await this.page.goto('/auth/register');
    
    // 填寫註冊表單
    await this.page.fill('[data-testid="name-input"]', userData.name);
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.fill('[data-testid="phone-input"]', userData.phone);
    
    // 點擊註冊按鈕
    await this.page.click('[data-testid="register-button"]');
    
    // 等待註冊成功
    await expect(this.page).toHaveURL(/\/(dashboard|profile)/);
  }

  /**
   * 創建寵物
   */
  async createPet(petData: {
    name: string;
    type: string;
    breed?: string;
    age?: string;
    description?: string;
    status: 'lost' | 'found';
    location?: string;
  }) {
    await this.page.goto('/pets/create');
    
    // 填寫寵物基本信息
    await this.page.fill('[data-testid="pet-name-input"]', petData.name);
    await this.page.selectOption('[data-testid="pet-type-select"]', petData.type);
    
    if (petData.breed) {
      await this.page.fill('[data-testid="pet-breed-input"]', petData.breed);
    }
    
    if (petData.age) {
      await this.page.fill('[data-testid="pet-age-input"]', petData.age);
    }
    
    if (petData.description) {
      await this.page.fill('[data-testid="pet-description-textarea"]', petData.description);
    }
    
    // 選擇狀態
    await this.page.click(`[data-testid="status-${petData.status}"]`);
    
    if (petData.location) {
      await this.page.fill('[data-testid="pet-location-input"]', petData.location);
    }
    
    // 提交表單
    await this.page.click('[data-testid="submit-pet-button"]');
    
    // 等待創建成功
    await expect(this.page).toHaveURL(/\/pets\/\w+/);
  }

  /**
   * 搜尋寵物
   */
  async searchPets(searchTerm: string, filters?: {
    type?: string;
    status?: string;
    location?: string;
  }) {
    await this.page.goto('/pets/search');
    
    // 輸入搜尋關鍵字
    await this.page.fill('[data-testid="search-input"]', searchTerm);
    
    // 應用篩選器
    if (filters?.type) {
      await this.page.selectOption('[data-testid="type-filter"]', filters.type);
    }
    
    if (filters?.status) {
      await this.page.selectOption('[data-testid="status-filter"]', filters.status);
    }
    
    if (filters?.location) {
      await this.page.fill('[data-testid="location-filter"]', filters.location);
    }
    
    // 執行搜尋
    await this.page.click('[data-testid="search-button"]');
    
    // 等待搜尋結果加載
    await this.page.waitForSelector('[data-testid="search-results"]');
  }

  /**
   * 等待元素出現
   */
  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * 等待元素消失
   */
  async waitForElementToDisappear(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { state: 'detached', timeout });
  }

  /**
   * 檢查元素是否可見
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * 截圖
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * 等待 API 請求完成
   */
  async waitForApiRequest(urlPattern: string | RegExp, timeout: number = 10000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * 模擬文件上傳
   */
  async uploadFile(inputSelector: string, filePath: string) {
    await this.page.setInputFiles(inputSelector, filePath);
  }

  /**
   * 檢查頁面可訪問性
   */
  async checkAccessibility() {
    // 這裡可以集成 axe-core 進行可訪問性檢查
    // 暫時使用基本的鍵盤導航檢查
    
    // 檢查是否可以使用 Tab 鍵導航
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    
    return focusedElement !== 'BODY'; // 如果焦點不在 body 上，說明有可聚焦元素
  }

  /**
   * 清理測試數據
   */
  async cleanup() {
    // 清理本地存儲
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 清理 cookies
    await this.page.context().clearCookies();
  }
}

/**
 * 生成隨機測試數據
 */
export class TestDataGenerator {
  static randomEmail(): string {
    const timestamp = Date.now();
    return `test${timestamp}@example.com`;
  }

  static randomName(): string {
    const names = ['小明', '小華', '小美', '小強', '小芳'];
    return names[Math.floor(Math.random() * names.length)];
  }

  static randomPetName(): string {
    const petNames = ['小白', '小黑', '咪咪', '汪汪', '球球', '毛毛'];
    return petNames[Math.floor(Math.random() * petNames.length)];
  }

  static randomPhone(): string {
    return `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
  }

  static randomLocation(): string {
    const locations = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
    return locations[Math.floor(Math.random() * locations.length)];
  }
}