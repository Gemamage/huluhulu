import { defineConfig, devices } from '@playwright/test';

/**
 * 視覺回歸測試專用配置
 * 針對視覺比較進行優化的 Playwright 配置
 */
export default defineConfig({
  testDir: './tests/visual',
  
  // 視覺測試的超時設定
  timeout: 60000,
  expect: {
    // 視覺比較的超時時間
    timeout: 10000,
    // 全域視覺比較閾值
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
      // 動畫處理
      animations: 'disabled',
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },

  // 測試執行設定
  fullyParallel: false, // 視覺測試建議序列執行以避免資源競爭
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // CI 環境多重試一次
  workers: process.env.CI ? 2 : 1, // 限制並行數量

  // 報告器設定
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['junit', { outputFile: 'test-results/visual-junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // 全域設定
  use: {
    // 基礎 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 視覺測試專用設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 截圖設定
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // 影片錄製（僅失敗時）
    video: 'retain-on-failure',
    
    // 追蹤設定
    trace: 'retain-on-failure',
    
    // 禁用動畫以確保視覺一致性
    reducedMotion: 'reduce',
    
    // 字體設定（確保跨平台一致性）
    fontFamily: 'Arial, sans-serif',
    
    // 忽略 HTTPS 錯誤
    ignoreHTTPSErrors: true,
    
    // 等待策略
    waitForTimeout: 5000,
  },

  // 瀏覽器專案設定
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        deviceScaleFactor: 1, // 固定縮放比例
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        deviceScaleFactor: 1, // 固定縮放比例
      },
    },
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro'],
        deviceScaleFactor: 1, // 固定縮放比例
      },
    },
  ],

  // 輸出目錄
  outputDir: 'test-results/visual-artifacts',
  
  // 視覺比較截圖存放目錄
  snapshotDir: 'tests/visual/screenshots',
  
  // 更新截圖的設定
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',

  // 本地開發服務器設定
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        // 禁用動畫和過渡效果
        DISABLE_ANIMATIONS: 'true',
        // 使用固定的測試數據
        USE_TEST_DATA: 'true',
      },
    },
    {
      command: 'npm run server:test',
      port: 5000,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        PORT: '5000',
      },
    },
  ],

  // 全域設置和拆卸
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});