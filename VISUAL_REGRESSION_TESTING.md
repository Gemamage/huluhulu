# 視覺回歸測試指南

## 概述

視覺回歸測試是一種自動化測試技術，用於檢測應用程式 UI 的意外視覺變化。本專案使用 Playwright 的內建視覺比較功能來實現視覺回歸測試。

## 功能特點

- ✅ **跨瀏覽器支援**：支援 Chromium、Firefox、WebKit
- ✅ **響應式測試**：支援桌面、平板、手機等不同視窗大小
- ✅ **主題測試**：支援淺色、深色、高對比度主題
- ✅ **互動狀態測試**：支援懸停、焦點、載入等狀態
- ✅ **動態內容處理**：自動遮罩時間戳記等動態內容
- ✅ **錯誤狀態測試**：支援 404、網路錯誤等錯誤狀態
- ✅ **可訪問性整合**：結合可訪問性檢查

## 安裝和設定

### 1. 安裝依賴

```bash
# 安裝 Playwright（如果尚未安裝）
npm install -D @playwright/test

# 安裝瀏覽器
npx playwright install
```

### 2. 目錄結構

```
tests/
├── visual/
│   ├── visual-regression.spec.ts    # 主要測試檔案
│   ├── visual-helpers.ts            # 輔助工具
│   ├── visual.config.ts             # 視覺測試配置
│   └── screenshots/                 # 基準截圖存放目錄
│       ├── chromium-desktop/
│       ├── firefox-desktop/
│       ├── webkit-desktop/
│       ├── mobile-chrome/
│       ├── mobile-safari/
│       └── tablet-ipad/
└── ...
```

## 使用方法

### 基本命令

```bash
# 執行視覺回歸測試
npm run test:visual

# 更新基準截圖
npm run test:visual:update

# 以有頭模式執行（可看到瀏覽器）
npm run test:visual:headed

# 除錯模式
npm run test:visual:debug

# CI 環境執行
npm run test:visual:ci
```

### 測試覆蓋範圍

#### 1. 頁面級別測試
- 首頁完整截圖
- 登入/註冊頁面
- 寵物搜尋頁面
- 寵物詳情頁面
- 404 錯誤頁面

#### 2. 組件級別測試
- 導航欄
- 搜尋區域
- 寵物卡片
- 表單組件
- 按鈕狀態

#### 3. 響應式測試
- 手機版 (375x667)
- 平板版 (768x1024)
- 桌面版 (1280x720)
- 寬螢幕 (1920x1080)

#### 4. 主題測試
- 淺色主題
- 深色主題
- 高對比度模式

#### 5. 互動狀態測試
- 按鈕懸停狀態
- 表單焦點狀態
- 載入狀態
- 錯誤狀態

## 配置選項

### 視覺比較參數

```typescript
// 在測試中使用
await expect(page).toHaveScreenshot('screenshot-name.png', {
  threshold: 0.2,        // 允許的差異閾值 (0-1)
  maxDiffPixels: 100,    // 允許的最大差異像素數
  fullPage: true,        // 是否截取整頁
  mask: [dynamicElements], // 需要遮罩的動態元素
  clip: { x: 0, y: 0, width: 800, height: 600 } // 截圖區域
});
```

### 環境變數

```bash
# 更新所有截圖
UPDATE_SNAPSHOTS=true npm run test:visual

# 禁用動畫
DISABLE_ANIMATIONS=true npm run test:visual

# 使用測試數據
USE_TEST_DATA=true npm run test:visual
```

## 最佳實踐

### 1. 截圖命名規範

```
{page/component}-{state}-{viewport}.png

範例：
- homepage-full.png
- login-form-errors.png
- navbar-mobile.png
- button-hover-state.png
```

### 2. 處理動態內容

```typescript
// 遮罩動態元素
const dynamicElements = [
  page.locator('.timestamp'),
  page.locator('.view-count'),
  page.locator('[data-testid="dynamic-time"]')
];

await expect(page).toHaveScreenshot('page.png', {
  mask: dynamicElements
});
```

### 3. 等待頁面穩定

```typescript
// 使用輔助工具
const helpers = new VisualHelpers(page);
await helpers.prepareForVisualTest();

// 或手動等待
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => document.fonts.ready);
```

### 4. 跨瀏覽器一致性

```typescript
// 禁用動畫確保一致性
await helpers.disableAnimations();

// 設置固定字體
await page.addStyleTag({
  content: '* { font-family: Arial, sans-serif !important; }'
});
```

## 故障排除

### 常見問題

#### 1. 截圖差異過大

**原因**：動畫、字體載入、動態內容

**解決方案**：
```typescript
// 增加閾值
await expect(page).toHaveScreenshot('test.png', {
  threshold: 0.3,
  maxDiffPixels: 200
});

// 遮罩動態內容
const masks = helpers.getDynamicContentMasks();
await expect(page).toHaveScreenshot('test.png', { mask: masks });
```

#### 2. 字體渲染不一致

**解決方案**：
```typescript
// 等待字體載入
await page.waitForFunction(() => document.fonts.ready);

// 使用系統字體
await page.addStyleTag({
  content: '* { font-family: system-ui, Arial, sans-serif !important; }'
});
```

#### 3. 圖片載入問題

**解決方案**：
```typescript
// 等待所有圖片載入
await page.waitForFunction(() => {
  const images = Array.from(document.querySelectorAll('img'));
  return images.every(img => img.complete && img.naturalHeight !== 0);
});
```

### 除錯技巧

#### 1. 檢視差異報告

測試失敗時，Playwright 會生成差異報告：

```
test-results/
├── visual-report/
│   └── index.html          # HTML 報告
├── visual-artifacts/
│   ├── actual.png          # 實際截圖
│   ├── expected.png        # 預期截圖
│   └── diff.png           # 差異圖
└── visual-results.json     # JSON 結果
```

#### 2. 使用除錯模式

```bash
# 逐步執行測試
npm run test:visual:debug

# 在特定測試上暫停
test.only('specific test', async ({ page }) => {
  await page.pause(); // 暫停執行
  // ... 測試代碼
});
```

#### 3. 生成測試報告

```bash
# 執行測試並生成報告
npm run test:visual

# 開啟 HTML 報告
npx playwright show-report test-results/visual-report
```

## CI/CD 整合

### GitHub Actions 範例

```yaml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run visual tests
        run: npm run test:visual:ci
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: test-results/
```

## 維護指南

### 1. 定期更新基準截圖

```bash
# 當 UI 有意圖性變更時
npm run test:visual:update
```

### 2. 清理舊截圖

```bash
# 刪除不再使用的截圖
find tests/visual/screenshots -name "*.png" -mtime +30 -delete
```

### 3. 監控測試性能

```bash
# 檢查測試執行時間
npm run test:visual -- --reporter=json > visual-results.json
```

## 進階功能

### 1. 自定義比較器

```typescript
// 實現自定義圖片比較邏輯
const customCompare = (actual: Buffer, expected: Buffer) => {
  // 自定義比較邏輯
  return { pass: true, message: 'Images match' };
};
```

### 2. 動態截圖生成

```typescript
// 根據數據動態生成截圖
for (const viewport of ['mobile', 'tablet', 'desktop']) {
  await helpers.setViewportSize(viewport);
  await expect(page).toHaveScreenshot(`homepage-${viewport}.png`);
}
```

### 3. 批量截圖更新

```typescript
// 批量更新特定模式的截圖
const updatePattern = process.env.UPDATE_PATTERN;
if (updatePattern && screenshotName.includes(updatePattern)) {
  // 更新匹配模式的截圖
}
```

## 相關資源

- [Playwright 視覺比較文檔](https://playwright.dev/docs/test-screenshots)
- [視覺回歸測試最佳實踐](https://playwright.dev/docs/best-practices)
- [Playwright 配置參考](https://playwright.dev/docs/test-configuration)

## 支援和貢獻

如有問題或建議，請：

1. 查看 [故障排除](#故障排除) 部分
2. 搜尋現有的 [Issues](https://github.com/your-repo/issues)
3. 創建新的 Issue 或 Pull Request

---

**注意**：視覺回歸測試對環境敏感，建議在 CI 環境中使用 Docker 容器以確保一致性。