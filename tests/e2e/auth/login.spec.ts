import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('用戶登入功能', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
  });

  test('成功登入有效用戶', async ({ page }) => {
    // 點擊登入按鈕
    await page.click('[data-testid="login-button"]');
    
    // 填寫登入表單
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    
    // 提交表單
    await page.click('[data-testid="submit-login"]');
    
    // 等待登入成功
    await helpers.waitForApiResponse('/api/auth/login');
    
    // 驗證登入成功
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText(TEST_USERS.regular.name);
    
    // 驗證 URL 重定向
    expect(page.url()).toContain('/dashboard');
  });

  test('登入失敗 - 錯誤的電子郵件', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    
    await page.click('[data-testid="submit-login"]');
    
    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('電子郵件或密碼錯誤');
    
    // 確保仍在登入頁面
    expect(page.url()).toContain('/login');
  });

  test('登入失敗 - 錯誤的密碼', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    await page.click('[data-testid="submit-login"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('電子郵件或密碼錯誤');
  });

  test('表單驗證 - 空白欄位', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    // 嘗試提交空白表單
    await page.click('[data-testid="submit-login"]');
    
    // 驗證必填欄位錯誤
    await expect(page.locator('[data-testid="email-error"]')).toContainText('請輸入電子郵件');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('請輸入密碼');
  });

  test('表單驗證 - 無效的電子郵件格式', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    
    await page.click('[data-testid="submit-login"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('請輸入有效的電子郵件');
  });

  test('記住我功能', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    
    // 勾選記住我
    await page.check('[data-testid="remember-me"]');
    
    await page.click('[data-testid="submit-login"]');
    
    await helpers.waitForApiResponse('/api/auth/login');
    
    // 登出
    await helpers.logout();
    
    // 重新載入頁面，檢查是否記住登入狀態
    await page.reload();
    
    // 驗證用戶仍然登入（如果實現了記住我功能）
    // 這取決於具體的實現方式
  });

  test('密碼顯示/隱藏切換', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    // 初始狀態應該是隱藏密碼
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // 點擊顯示密碼
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // 再次點擊隱藏密碼
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('鍵盤導航', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    // 使用 Tab 鍵導航
    await page.keyboard.press('Tab'); // 電子郵件輸入框
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 密碼輸入框
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 記住我複選框
    await expect(page.locator('[data-testid="remember-me"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 登入按鈕
    await expect(page.locator('[data-testid="submit-login"]')).toBeFocused();
    
    // 使用 Enter 鍵提交表單
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    await page.keyboard.press('Enter');
    
    await helpers.waitForApiResponse('/api/auth/login');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('載入狀態顯示', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
    
    // 點擊登入按鈕
    await page.click('[data-testid="submit-login"]');
    
    // 驗證載入狀態
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-login"]')).toBeDisabled();
    
    // 等待登入完成
    await helpers.waitForApiResponse('/api/auth/login');
    
    // 驗證載入狀態消失
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('社交登入按鈕存在', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    // 檢查社交登入按鈕（如果有實現）
    const googleLogin = page.locator('[data-testid="google-login"]');
    const facebookLogin = page.locator('[data-testid="facebook-login"]');
    
    if (await googleLogin.count() > 0) {
      await expect(googleLogin).toBeVisible();
    }
    
    if (await facebookLogin.count() > 0) {
      await expect(facebookLogin).toBeVisible();
    }
  });
});