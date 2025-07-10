import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator } from '../../utils/test-helpers';
import { TEST_USERS, VALIDATION_TEST_DATA } from '../../fixtures/test-data';

test.describe('用戶註冊功能', () => {
  let helpers: TestHelpers;
  let dataGenerator: TestDataGenerator;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    dataGenerator = new TestDataGenerator();
    await page.goto('/');
  });

  test('成功註冊新用戶', async ({ page }) => {
    const newUser = dataGenerator.generateUser();
    
    // 點擊註冊按鈕
    await page.click('[data-testid="register-button"]');
    
    // 填寫註冊表單
    await page.fill('[data-testid="name-input"]', newUser.name);
    await page.fill('[data-testid="email-input"]', newUser.email);
    await page.fill('[data-testid="password-input"]', newUser.password);
    await page.fill('[data-testid="confirm-password-input"]', newUser.password);
    await page.fill('[data-testid="phone-input"]', newUser.phone);
    
    // 填寫地址信息
    await page.selectOption('[data-testid="city-select"]', newUser.address.city);
    await page.selectOption('[data-testid="district-select"]', newUser.address.district);
    await page.fill('[data-testid="street-input"]', newUser.address.street);
    
    // 同意服務條款
    await page.check('[data-testid="terms-checkbox"]');
    
    // 提交表單
    await page.click('[data-testid="submit-register"]');
    
    // 等待註冊成功
    await helpers.waitForApiResponse('/api/auth/register');
    
    // 驗證註冊成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('註冊成功');
    
    // 驗證重定向到登入頁面或儀表板
    expect(page.url()).toMatch(/(login|dashboard)/);
  });

  test('註冊失敗 - 電子郵件已存在', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 使用已存在的電子郵件
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
    await page.fill('[data-testid="password-input"]', 'NewPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');
    await page.fill('[data-testid="phone-input"]', '0912345679');
    
    await page.selectOption('[data-testid="city-select"]', '台北市');
    await page.selectOption('[data-testid="district-select"]', '信義區');
    await page.fill('[data-testid="street-input"]', '信義路五段8號');
    
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-register"]');
    
    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('電子郵件已被使用');
  });

  test('表單驗證 - 必填欄位', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 嘗試提交空白表單
    await page.click('[data-testid="submit-register"]');
    
    // 驗證必填欄位錯誤
    await expect(page.locator('[data-testid="name-error"]')).toContainText('請輸入姓名');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('請輸入電子郵件');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('請輸入密碼');
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('請輸入電話號碼');
    await expect(page.locator('[data-testid="terms-error"]')).toContainText('請同意服務條款');
  });

  test('密碼驗證規則', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 測試弱密碼
    for (const invalidPassword of VALIDATION_TEST_DATA.invalidPasswords) {
      await page.fill('[data-testid="password-input"]', invalidPassword);
      await page.blur('[data-testid="password-input"]');
      
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    }
    
    // 測試有效密碼
    await page.fill('[data-testid="password-input"]', VALIDATION_TEST_DATA.validPasswords[0]);
    await page.blur('[data-testid="password-input"]');
    
    await expect(page.locator('[data-testid="password-error"]')).not.toBeVisible();
  });

  test('密碼確認驗證', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    const password = 'Test123!';
    
    await page.fill('[data-testid="password-input"]', password);
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
    await page.blur('[data-testid="confirm-password-input"]');
    
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('密碼不一致');
    
    // 修正密碼確認
    await page.fill('[data-testid="confirm-password-input"]', password);
    await page.blur('[data-testid="confirm-password-input"]');
    
    await expect(page.locator('[data-testid="confirm-password-error"]')).not.toBeVisible();
  });

  test('電子郵件格式驗證', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 測試無效電子郵件
    for (const invalidEmail of VALIDATION_TEST_DATA.invalidEmails) {
      await page.fill('[data-testid="email-input"]', invalidEmail);
      await page.blur('[data-testid="email-input"]');
      
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    }
    
    // 測試有效電子郵件
    await page.fill('[data-testid="email-input"]', VALIDATION_TEST_DATA.validEmails[0]);
    await page.blur('[data-testid="email-input"]');
    
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
  });

  test('電話號碼格式驗證', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 測試無效電話號碼
    for (const invalidPhone of VALIDATION_TEST_DATA.invalidPhones) {
      await page.fill('[data-testid="phone-input"]', invalidPhone);
      await page.blur('[data-testid="phone-input"]');
      
      await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
    }
    
    // 測試有效電話號碼
    await page.fill('[data-testid="phone-input"]', VALIDATION_TEST_DATA.validPhones[0]);
    await page.blur('[data-testid="phone-input"]');
    
    await expect(page.locator('[data-testid="phone-error"]')).not.toBeVisible();
  });

  test('地址選擇功能', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 選擇城市
    await page.selectOption('[data-testid="city-select"]', '台北市');
    
    // 等待區域選項載入
    await page.waitForSelector('[data-testid="district-select"] option:not([value=""])');
    
    // 驗證區域選項已載入
    const districtOptions = await page.locator('[data-testid="district-select"] option').count();
    expect(districtOptions).toBeGreaterThan(1);
    
    // 選擇區域
    await page.selectOption('[data-testid="district-select"]', '信義區');
    
    // 驗證選擇成功
    await expect(page.locator('[data-testid="district-select"]')).toHaveValue('信義區');
  });

  test('密碼強度指示器', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    
    // 弱密碼
    await passwordInput.fill('123');
    await expect(strengthIndicator).toContainText('弱');
    await expect(strengthIndicator).toHaveClass(/weak/);
    
    // 中等密碼
    await passwordInput.fill('Test123');
    await expect(strengthIndicator).toContainText('中等');
    await expect(strengthIndicator).toHaveClass(/medium/);
    
    // 強密碼
    await passwordInput.fill('Test123!');
    await expect(strengthIndicator).toContainText('強');
    await expect(strengthIndicator).toHaveClass(/strong/);
  });

  test('服務條款連結', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 檢查服務條款連結
    const termsLink = page.locator('[data-testid="terms-link"]');
    await expect(termsLink).toBeVisible();
    
    // 點擊服務條款連結（應該在新視窗開啟）
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      termsLink.click()
    ]);
    
    // 驗證新頁面 URL
    expect(newPage.url()).toContain('/terms');
    await newPage.close();
  });

  test('載入狀態和按鈕禁用', async ({ page }) => {
    const newUser = dataGenerator.generateUser();
    
    await page.click('[data-testid="register-button"]');
    
    // 填寫完整表單
    await helpers.fillRegistrationForm(newUser);
    
    // 提交表單
    await page.click('[data-testid="submit-register"]');
    
    // 驗證載入狀態
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-register"]')).toBeDisabled();
    
    // 等待註冊完成
    await helpers.waitForApiResponse('/api/auth/register');
    
    // 驗證載入狀態消失
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('鍵盤導航', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 使用 Tab 鍵導航所有表單欄位
    const formFields = [
      '[data-testid="name-input"]',
      '[data-testid="email-input"]',
      '[data-testid="password-input"]',
      '[data-testid="confirm-password-input"]',
      '[data-testid="phone-input"]',
      '[data-testid="city-select"]',
      '[data-testid="district-select"]',
      '[data-testid="street-input"]',
      '[data-testid="terms-checkbox"]',
      '[data-testid="submit-register"]'
    ];
    
    for (const field of formFields) {
      await page.keyboard.press('Tab');
      await expect(page.locator(field)).toBeFocused();
    }
  });

  test('表單自動儲存（如果實現）', async ({ page }) => {
    await page.click('[data-testid="register-button"]');
    
    // 填寫部分表單
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    
    // 重新載入頁面
    await page.reload();
    await page.click('[data-testid="register-button"]');
    
    // 檢查是否保留了輸入的資料（如果有實現自動儲存功能）
    // 這取決於具體的實現方式
  });
});