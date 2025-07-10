import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator } from '../../utils/test-helpers';
import { TEST_USERS, TEST_PETS } from '../../fixtures/test-data';

test.describe('寵物發布功能', () => {
  let helpers: TestHelpers;
  let dataGenerator: TestDataGenerator;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    dataGenerator = new TestDataGenerator();
    
    // 登入用戶
    await helpers.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
  });

  test('成功發布走失寵物', async ({ page }) => {
    const lostPet = { ...TEST_PETS.lostDog };
    
    // 點擊發布寵物按鈕
    await page.click('[data-testid="post-pet-button"]');
    
    // 選擇寵物狀態
    await page.click('[data-testid="status-lost"]');
    
    // 填寫基本資訊
    await page.fill('[data-testid="pet-name-input"]', lostPet.name);
    await page.selectOption('[data-testid="pet-type-select"]', lostPet.type);
    await page.fill('[data-testid="pet-breed-input"]', lostPet.breed);
    await page.fill('[data-testid="pet-age-input"]', lostPet.age);
    await page.selectOption('[data-testid="pet-gender-select"]', lostPet.gender);
    await page.fill('[data-testid="pet-color-input"]', lostPet.color);
    await page.selectOption('[data-testid="pet-size-select"]', lostPet.size);
    
    // 填寫描述
    await page.fill('[data-testid="pet-description-textarea"]', lostPet.description);
    
    // 填寫最後見到的地點
    await page.selectOption('[data-testid="last-seen-city-select"]', lostPet.lastSeenLocation.city);
    await page.selectOption('[data-testid="last-seen-district-select"]', lostPet.lastSeenLocation.district);
    await page.fill('[data-testid="last-seen-street-input"]', lostPet.lastSeenLocation.street);
    await page.fill('[data-testid="last-seen-description-input"]', lostPet.lastSeenLocation.description);
    
    // 填寫最後見到的日期
    await page.fill('[data-testid="last-seen-date-input"]', lostPet.lastSeenDate);
    
    // 填寫聯絡資訊
    await page.fill('[data-testid="contact-name-input"]', lostPet.contactInfo.name);
    await page.fill('[data-testid="contact-phone-input"]', lostPet.contactInfo.phone);
    await page.fill('[data-testid="contact-email-input"]', lostPet.contactInfo.email);
    
    // 填寫懸賞金額
    await page.fill('[data-testid="reward-input"]', lostPet.reward.toString());
    
    // 提交表單
    await page.click('[data-testid="submit-pet-post"]');
    
    // 等待 API 回應
    await helpers.waitForApiResponse('/api/pets');
    
    // 驗證成功訊息
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('寵物資訊發布成功');
    
    // 驗證重定向到寵物詳情頁面
    expect(page.url()).toContain('/pets/');
  });

  test('成功發布找到寵物', async ({ page }) => {
    const foundPet = { ...TEST_PETS.foundCat };
    
    await page.click('[data-testid="post-pet-button"]');
    
    // 選擇寵物狀態
    await page.click('[data-testid="status-found"]');
    
    // 填寫基本資訊
    await page.fill('[data-testid="pet-name-input"]', foundPet.name);
    await page.selectOption('[data-testid="pet-type-select"]', foundPet.type);
    await page.fill('[data-testid="pet-breed-input"]', foundPet.breed);
    await page.fill('[data-testid="pet-age-input"]', foundPet.age);
    await page.selectOption('[data-testid="pet-gender-select"]', foundPet.gender);
    await page.fill('[data-testid="pet-color-input"]', foundPet.color);
    await page.selectOption('[data-testid="pet-size-select"]', foundPet.size);
    
    // 填寫描述
    await page.fill('[data-testid="pet-description-textarea"]', foundPet.description);
    
    // 填寫找到的地點
    await page.selectOption('[data-testid="found-city-select"]', foundPet.foundLocation.city);
    await page.selectOption('[data-testid="found-district-select"]', foundPet.foundLocation.district);
    await page.fill('[data-testid="found-street-input"]', foundPet.foundLocation.street);
    await page.fill('[data-testid="found-description-input"]', foundPet.foundLocation.description);
    
    // 填寫找到的日期
    await page.fill('[data-testid="found-date-input"]', foundPet.foundDate);
    
    // 填寫聯絡資訊
    await page.fill('[data-testid="contact-name-input"]', foundPet.contactInfo.name);
    await page.fill('[data-testid="contact-phone-input"]', foundPet.contactInfo.phone);
    await page.fill('[data-testid="contact-email-input"]', foundPet.contactInfo.email);
    
    // 提交表單
    await page.click('[data-testid="submit-pet-post"]');
    
    await helpers.waitForApiResponse('/api/pets');
    
    // 驗證成功訊息
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    expect(page.url()).toContain('/pets/');
  });

  test('圖片上傳功能', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    await page.click('[data-testid="status-lost"]');
    
    // 模擬圖片上傳
    const fileInput = page.locator('[data-testid="pet-images-input"]');
    
    // 創建測試圖片文件
    await helpers.uploadTestImage(fileInput, 'test-pet-image.jpg');
    
    // 驗證圖片預覽
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // 驗證可以上傳多張圖片
    await helpers.uploadTestImage(fileInput, 'test-pet-image-2.jpg');
    
    const imagePreviews = page.locator('[data-testid="image-preview"]');
    expect(await imagePreviews.count()).toBe(2);
    
    // 測試刪除圖片
    await page.click('[data-testid="delete-image-0"]');
    expect(await imagePreviews.count()).toBe(1);
  });

  test('表單驗證 - 必填欄位', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    
    // 嘗試提交空白表單
    await page.click('[data-testid="submit-pet-post"]');
    
    // 驗證必填欄位錯誤
    await expect(page.locator('[data-testid="status-error"]')).toContainText('請選擇寵物狀態');
    await expect(page.locator('[data-testid="pet-name-error"]')).toContainText('請輸入寵物名稱');
    await expect(page.locator('[data-testid="pet-type-error"]')).toContainText('請選擇寵物類型');
    await expect(page.locator('[data-testid="contact-phone-error"]')).toContainText('請輸入聯絡電話');
  });

  test('日期驗證', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    await page.click('[data-testid="status-lost"]');
    
    // 測試未來日期
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    await page.fill('[data-testid="last-seen-date-input"]', futureDateString);
    await page.blur('[data-testid="last-seen-date-input"]');
    
    await expect(page.locator('[data-testid="last-seen-date-error"]')).toContainText('日期不能是未來');
    
    // 測試有效日期
    const validDate = new Date();
    validDate.setDate(validDate.getDate() - 1);
    const validDateString = validDate.toISOString().split('T')[0];
    
    await page.fill('[data-testid="last-seen-date-input"]', validDateString);
    await page.blur('[data-testid="last-seen-date-input"]');
    
    await expect(page.locator('[data-testid="last-seen-date-error"]')).not.toBeVisible();
  });

  test('地點選擇聯動', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    await page.click('[data-testid="status-lost"]');
    
    // 選擇城市
    await page.selectOption('[data-testid="last-seen-city-select"]', '台北市');
    
    // 等待區域選項載入
    await page.waitForSelector('[data-testid="last-seen-district-select"] option:not([value=""])');
    
    // 驗證區域選項已載入
    const districtOptions = await page.locator('[data-testid="last-seen-district-select"] option').count();
    expect(districtOptions).toBeGreaterThan(1);
    
    // 選擇不同城市，驗證區域選項重置
    await page.selectOption('[data-testid="last-seen-city-select"]', '新北市');
    
    // 等待新的區域選項載入
    await page.waitForSelector('[data-testid="last-seen-district-select"] option:not([value=""])');
    
    const newDistrictOptions = await page.locator('[data-testid="last-seen-district-select"] option').count();
    expect(newDistrictOptions).toBeGreaterThan(1);
  });

  test('懸賞金額驗證', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    await page.click('[data-testid="status-lost"]');
    
    // 測試負數
    await page.fill('[data-testid="reward-input"]', '-100');
    await page.blur('[data-testid="reward-input"]');
    
    await expect(page.locator('[data-testid="reward-error"]')).toContainText('懸賞金額不能為負數');
    
    // 測試非數字
    await page.fill('[data-testid="reward-input"]', 'abc');
    await page.blur('[data-testid="reward-input"]');
    
    await expect(page.locator('[data-testid="reward-error"]')).toContainText('請輸入有效的金額');
    
    // 測試有效金額
    await page.fill('[data-testid="reward-input"]', '5000');
    await page.blur('[data-testid="reward-input"]');
    
    await expect(page.locator('[data-testid="reward-error"]')).not.toBeVisible();
  });

  test('草稿儲存功能', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    
    // 填寫部分表單
    await page.click('[data-testid="status-lost"]');
    await page.fill('[data-testid="pet-name-input"]', '測試寵物');
    await page.selectOption('[data-testid="pet-type-select"]', 'dog');
    
    // 點擊儲存草稿
    await page.click('[data-testid="save-draft-button"]');
    
    // 驗證草稿儲存成功
    await expect(page.locator('[data-testid="draft-saved-message"]')).toBeVisible();
    
    // 離開頁面後重新進入
    await page.goto('/dashboard');
    await page.click('[data-testid="post-pet-button"]');
    
    // 驗證草稿是否恢復
    await expect(page.locator('[data-testid="pet-name-input"]')).toHaveValue('測試寵物');
    await expect(page.locator('[data-testid="pet-type-select"]')).toHaveValue('dog');
  });

  test('表單步驟導航', async ({ page }) => {
    await page.click('[data-testid="post-pet-button"]');
    
    // 驗證步驟指示器
    await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
    
    // 填寫第一步並前進
    await page.click('[data-testid="status-lost"]');
    await page.fill('[data-testid="pet-name-input"]', '測試寵物');
    await page.click('[data-testid="next-step-button"]');
    
    // 驗證第二步
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);
    
    // 測試返回上一步
    await page.click('[data-testid="prev-step-button"]');
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
  });

  test('載入狀態和按鈕禁用', async ({ page }) => {
    const testPet = dataGenerator.generatePet('lost');
    
    await page.click('[data-testid="post-pet-button"]');
    
    // 填寫完整表單
    await helpers.fillPetForm(testPet);
    
    // 提交表單
    await page.click('[data-testid="submit-pet-post"]');
    
    // 驗證載入狀態
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-pet-post"]')).toBeDisabled();
    
    // 等待提交完成
    await helpers.waitForApiResponse('/api/pets');
    
    // 驗證載入狀態消失
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('響應式設計 - 手機版', async ({ page }) => {
    // 設置手機視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.click('[data-testid="post-pet-button"]');
    
    // 驗證手機版佈局
    await expect(page.locator('[data-testid="mobile-form-container"]')).toBeVisible();
    
    // 驗證表單欄位在手機版下的顯示
    await expect(page.locator('[data-testid="pet-name-input"]')).toBeVisible();
    
    // 測試手機版的圖片上傳
    const fileInput = page.locator('[data-testid="pet-images-input"]');
    await expect(fileInput).toBeVisible();
  });
});