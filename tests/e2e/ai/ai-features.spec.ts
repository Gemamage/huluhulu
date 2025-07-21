import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { TEST_USERS, AI_TEST_DATA } from '../../fixtures/test-data';

test.describe('AI 功能測試', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(TEST_USERS.regular.email, TEST_USERS.regular.password);
  });

  test('AI 寵物品種識別', async ({ page }) => {
    // 進入 AI 識別頁面
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="breed-identification"]');
    
    // 上傳寵物圖片
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestImage(fileInput, 'test-dog-image.jpg');
    
    // 點擊開始識別
    await page.click('[data-testid="start-identification"]');
    
    // 等待 AI 分析完成
    await helpers.waitForApiResponse('/api/ai/breed-identification');
    
    // 驗證識別結果
    await expect(page.locator('[data-testid="identification-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="breed-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    
    // 驗證信心度分數格式
    const confidenceText = await page.locator('[data-testid="confidence-score"]').textContent();
    expect(confidenceText).toMatch(/\d+%/);
    
    // 驗證品種特徵描述
    await expect(page.locator('[data-testid="breed-characteristics"]')).toBeVisible();
  });

  test('AI 寵物特徵分析', async ({ page }) => {
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="feature-analysis"]');
    
    // 上傳寵物圖片
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestImage(fileInput, 'test-cat-image.jpg');
    
    // 開始特徵分析
    await page.click('[data-testid="start-analysis"]');
    
    await helpers.waitForApiResponse('/api/ai/feature-analysis');
    
    // 驗證分析結果
    await expect(page.locator('[data-testid="feature-results"]')).toBeVisible();
    
    // 驗證各種特徵檢測
    await expect(page.locator('[data-testid="color-detection"]')).toBeVisible();
    await expect(page.locator('[data-testid="size-estimation"]')).toBeVisible();
    await expect(page.locator('[data-testid="age-estimation"]')).toBeVisible();
    await expect(page.locator('[data-testid="gender-detection"]')).toBeVisible();
    
    // 驗證特徵標籤
    const featureTags = page.locator('[data-testid="feature-tag"]');
    expect(await featureTags.count()).toBeGreaterThan(0);
  });

  test('智能搜尋建議', async ({ page }) => {
    // 進入搜尋頁面
    await page.goto('/search');
    
    // 輸入自然語言查詢
    const naturalQuery = AI_TEST_DATA.searchQueries.natural[0];
    await page.fill('[data-testid="search-input"]', naturalQuery);
    
    // 等待 AI 搜尋建議
    await helpers.waitForApiResponse('/api/ai/search-suggestions');
    
    // 驗證智能建議
    await expect(page.locator('[data-testid="ai-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggested-filters"]')).toBeVisible();
    
    // 點擊應用建議
    await page.click('[data-testid="apply-suggestions"]');
    
    // 驗證篩選條件自動填入
    await expect(page.locator('[data-testid="pet-type-filter"]')).not.toHaveValue('');
    await expect(page.locator('[data-testid="location-filter"]')).not.toHaveValue('');
  });

  test('相似寵物推薦', async ({ page }) => {
    // 進入寵物詳情頁面
    await page.goto('/pets/1'); // 假設存在 ID 為 1 的寵物
    
    // 等待頁面載入
    await expect(page.locator('[data-testid="pet-details"]')).toBeVisible();
    
    // 點擊尋找相似寵物
    await page.click('[data-testid="find-similar-pets"]');
    
    // 等待 AI 推薦
    await helpers.waitForApiResponse('/api/ai/similar-pets');
    
    // 驗證相似寵物推薦
    await expect(page.locator('[data-testid="similar-pets-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="similar-pet-card"]')).toHaveCount.greaterThan(0);
    
    // 驗證相似度分數
    const similarityScores = page.locator('[data-testid="similarity-score"]');
    const scoreCount = await similarityScores.count();
    
    for (let i = 0; i < scoreCount; i++) {
      const scoreText = await similarityScores.nth(i).textContent();
      expect(scoreText).toMatch(/\d+%/);
    }
  });

  test('AI 聊天助手', async ({ page }) => {
    // 點擊 AI 助手按鈕
    await page.click('[data-testid="ai-chat-button"]');
    
    // 驗證聊天視窗開啟
    await expect(page.locator('[data-testid="ai-chat-modal"]')).toBeVisible();
    
    // 發送問題
    const question = '我的狗狗走失了，應該怎麼辦？';
    await page.fill('[data-testid="chat-input"]', question);
    await page.click('[data-testid="send-message"]');
    
    // 等待 AI 回應
    await helpers.waitForApiResponse('/api/ai/chat');
    
    // 驗證 AI 回應
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    
    // 驗證回應內容包含有用建議
    const responseText = await page.locator('[data-testid="ai-response"]').textContent();
    expect(responseText).toContain('建議');
    
    // 測試後續對話
    await page.fill('[data-testid="chat-input"]', '謝謝，還有其他建議嗎？');
    await page.click('[data-testid="send-message"]');
    
    await helpers.waitForApiResponse('/api/ai/chat');
    
    // 驗證對話歷史
    const messages = page.locator('[data-testid="chat-message"]');
    expect(await messages.count()).toBeGreaterThanOrEqual(4); // 2 用戶訊息 + 2 AI 回應
  });

  test('圖片品質檢測', async ({ page }) => {
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="image-quality-check"]');
    
    // 上傳低品質圖片
    const fileInput = page.locator('[data-testid="image-upload"]');
    await helpers.uploadTestImage(fileInput, 'low-quality-image.jpg');
    
    await page.click('[data-testid="check-quality"]');
    await helpers.waitForApiResponse('/api/ai/image-quality');
    
    // 驗證品質檢測結果
    await expect(page.locator('[data-testid="quality-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
    
    // 驗證改善建議
    await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
    
    // 測試高品質圖片
    await helpers.uploadTestImage(fileInput, 'high-quality-image.jpg');
    await page.click('[data-testid="check-quality"]');
    await helpers.waitForApiResponse('/api/ai/image-quality');
    
    // 驗證高品質圖片的結果
    const qualityScore = await page.locator('[data-testid="quality-score"]').textContent();
    const score = parseInt(qualityScore?.match(/\d+/)?.[0] || '0');
    expect(score).toBeGreaterThan(70); // 假設高品質圖片分數應該 > 70
  });

  test('自動標籤生成', async ({ page }) => {
    // 進入發布寵物頁面
    await page.click('[data-testid="post-pet-button"]');
    
    // 上傳寵物圖片
    const fileInput = page.locator('[data-testid="pet-images-input"]');
    await helpers.uploadTestImage(fileInput, 'test-pet-image.jpg');
    
    // 點擊自動生成標籤
    await page.click('[data-testid="auto-generate-tags"]');
    
    await helpers.waitForApiResponse('/api/ai/generate-tags');
    
    // 驗證自動生成的標籤
    await expect(page.locator('[data-testid="generated-tags"]')).toBeVisible();
    
    const tags = page.locator('[data-testid="tag-item"]');
    expect(await tags.count()).toBeGreaterThan(0);
    
    // 測試標籤選擇
    await tags.first().click();
    
    // 驗證標籤被添加到表單
    await expect(page.locator('[data-testid="selected-tags"]')).toContainText(await tags.first().textContent() || '');
  });

  test('智能匹配推薦', async ({ page }) => {
    // 進入我的寵物頁面
    await page.goto('/my-pets');
    
    // 選擇一個走失的寵物
    await page.click('[data-testid="lost-pet-card"]');
    
    // 點擊智能匹配
    await page.click('[data-testid="smart-matching"]');
    
    await helpers.waitForApiResponse('/api/ai/smart-matching');
    
    // 驗證匹配結果
    await expect(page.locator('[data-testid="matching-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="potential-match"]')).toHaveCount.greaterThan(0);
    
    // 驗證匹配分數
    const matchScores = page.locator('[data-testid="match-score"]');
    const scoreCount = await matchScores.count();
    
    for (let i = 0; i < scoreCount; i++) {
      const scoreText = await matchScores.nth(i).textContent();
      expect(scoreText).toMatch(/\d+%/);
    }
    
    // 測試聯絡功能
    await page.click('[data-testid="contact-owner"]');
    await expect(page.locator('[data-testid="contact-modal"]')).toBeVisible();
  });

  test('AI 功能載入狀態', async ({ page }) => {
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="breed-identification"]');
    
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestImage(fileInput, 'test-image.jpg');
    
    // 點擊開始分析
    await page.click('[data-testid="start-identification"]');
    
    // 驗證載入狀態
    await expect(page.locator('[data-testid="ai-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-identification"]')).toBeDisabled();
    
    // 等待處理完成
    await helpers.waitForApiResponse('/api/ai/breed-identification');
    
    // 驗證載入狀態消失
    await expect(page.locator('[data-testid="ai-processing"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="start-identification"]')).toBeEnabled();
  });

  test('AI 功能錯誤處理', async ({ page }) => {
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="breed-identification"]');
    
    // 上傳無效圖片格式
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestFile(fileInput, 'invalid-file.txt');
    
    await page.click('[data-testid="start-identification"]');
    
    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('不支援的檔案格式');
    
    // 測試網路錯誤處理
    // 模擬網路中斷
    await page.route('/api/ai/**', route => route.abort());
    
    await helpers.uploadTestImage(fileInput, 'test-image.jpg');
    await page.click('[data-testid="start-identification"]');
    
    // 驗證網路錯誤訊息
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('AI 功能使用限制', async ({ page }) => {
    // 測試免費用戶的使用限制
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="breed-identification"]');
    
    // 檢查使用次數顯示
    await expect(page.locator('[data-testid="usage-counter"]')).toBeVisible();
    
    const usageText = await page.locator('[data-testid="usage-counter"]').textContent();
    expect(usageText).toMatch(/\d+\/\d+/);
    
    // 如果達到使用限制，驗證升級提示
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestImage(fileInput, 'test-image.jpg');
    await page.click('[data-testid="start-identification"]');
    
    // 檢查是否顯示升級提示（如果達到限制）
    const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
    if (await upgradePrompt.count() > 0) {
      await expect(upgradePrompt).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();
    }
  });

  test('AI 結果分享功能', async ({ page }) => {
    await page.click('[data-testid="ai-features-menu"]');
    await page.click('[data-testid="breed-identification"]');
    
    const fileInput = page.locator('[data-testid="pet-image-upload"]');
    await helpers.uploadTestImage(fileInput, 'test-dog-image.jpg');
    
    await page.click('[data-testid="start-identification"]');
    await helpers.waitForApiResponse('/api/ai/breed-identification');
    
    // 點擊分享結果
    await page.click('[data-testid="share-results"]');
    
    // 驗證分享選項
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-social"]')).toBeVisible();
    await expect(page.locator('[data-testid="copy-results"]')).toBeVisible();
    
    // 測試複製結果
    await page.click('[data-testid="copy-results"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  });
});