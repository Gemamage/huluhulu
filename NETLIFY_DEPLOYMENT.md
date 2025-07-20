# Netlify 部署指南

## 為什麼選擇 Netlify？

Netlify 是部署你的寵物協尋網站的絕佳選擇，因為它支援：

✅ **Next.js API 路由**：後端功能完全支援
✅ **環境變數**：安全存儲 API 金鑰和資料庫連接
✅ **Serverless 函數**：自動處理後端邏輯
✅ **自動部署**：Git 推送後自動更新
✅ **免費額度**：個人專案完全免費
✅ **自定義域名**：可以使用自己的網域

## 部署前準備

### 1. 修改 Next.js 配置

首先需要修改 `frontend/next.config.js`，移除 GitHub Pages 的配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'example.com'],
    unoptimized: false, // Netlify 支援圖片優化
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 移除 output: 'export' - Netlify 支援 SSR
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // 移除 basePath 和 assetPrefix
}

module.exports = nextConfig
```

### 2. 創建 Netlify 配置文件

在專案根目錄創建 `netlify.toml`：

```toml
[build]
  # 指定前端建置目錄
  base = "frontend"
  # 建置命令
  command = "npm run build"
  # 輸出目錄
  publish = ".next"

[build.environment]
  # Node.js 版本
  NODE_VERSION = "18"
  # NPM 版本
  NPM_VERSION = "9"

# API 路由重定向規則
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# SPA 路由支援
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 安全標頭
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 部署步驟

### 步驟 1：準備 Git 倉庫

```bash
# 如果還沒初始化 Git
git init
git add .
git commit -m "準備 Netlify 部署"

# 推送到 GitHub（建議先創建 GitHub 倉庫）
git remote add origin https://github.com/YOUR_USERNAME/huluhulu.git
git push -u origin main
```

### 步驟 2：註冊並連接 Netlify

1. 前往 [Netlify](https://www.netlify.com/)
2. 點擊 "Sign up" 註冊帳號（建議使用 GitHub 登入）
3. 登入後點擊 "Add new site" → "Import an existing project"
4. 選擇 "Deploy with GitHub"
5. 授權 Netlify 存取你的 GitHub 帳號
6. 選擇你的 `huluhulu` 倉庫

### 步驟 3：配置建置設定

在 Netlify 的部署設定頁面：

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/.next`
- **Functions directory**: `netlify/functions` (如果有的話)

### 步驟 4：設定環境變數

在 Netlify 控制台：

1. 進入你的網站設定
2. 點擊 "Environment variables"
3. 添加以下環境變數：

```
MONGODB_URI=你的MongoDB連接字串
JWT_SECRET=你的JWT密鑰
GOOGLE_CLIENT_ID=你的Google OAuth客戶端ID
GOOGLE_CLIENT_SECRET=你的Google OAuth客戶端密鑰
NEXT_PUBLIC_API_URL=https://你的網站名稱.netlify.app
```

### 步驟 5：觸發部署

點擊 "Deploy site" 按鈕，Netlify 會自動：

1. 從 GitHub 拉取代碼
2. 安裝依賴
3. 執行建置命令
4. 部署到 CDN

## 部署後設定

### 1. 自定義域名（可選）

1. 在 Netlify 控制台點擊 "Domain settings"
2. 點擊 "Add custom domain"
3. 輸入你的域名
4. 按照指示設定 DNS 記錄

### 2. HTTPS 設定

Netlify 會自動為你的網站啟用 HTTPS，包括自定義域名。

### 3. 表單處理（如果需要）

如果你的網站有聯絡表單，可以使用 Netlify Forms：

```html
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <!-- 你的表單欄位 -->
</form>
```

## 自動部署

設定完成後，每次推送代碼到 GitHub 的 main 分支，Netlify 會自動：

1. 檢測到代碼變更
2. 觸發新的建置
3. 部署更新的網站
4. 發送部署通知（可選）

## 監控和除錯

### 1. 建置日誌

在 Netlify 控制台可以查看詳細的建置日誌，幫助除錯建置問題。

### 2. 函數日誌

API 路由的執行日誌可以在 "Functions" 標籤中查看。

### 3. 分析數據

Netlify 提供網站流量和效能分析。

## 成本考量

Netlify 免費方案包括：

- ✅ 100GB 頻寬/月
- ✅ 300 分鐘建置時間/月
- ✅ 125,000 Serverless 函數調用/月
- ✅ 100 個表單提交/月

對於個人專案來說完全足夠！

## 故障排除

### 建置失敗

1. 檢查建置日誌中的錯誤訊息
2. 確保 `package.json` 中的腳本正確
3. 檢查 Node.js 版本相容性

### API 路由無法運作

1. 確保 `netlify.toml` 中的重定向規則正確
2. 檢查環境變數是否正確設定
3. 查看函數執行日誌

### 圖片無法載入

1. 檢查圖片路徑是否正確
2. 確保圖片檔案已提交到 Git
3. 檢查 Next.js Image 組件配置

## 下一步建議

1. **測試完整功能**：部署後測試所有功能是否正常
2. **設定監控**：使用 Netlify Analytics 監控網站效能
3. **優化效能**：根據 Lighthouse 報告優化網站
4. **備份策略**：定期備份重要資料

---

**重要提醒**：記得在修改配置後提交到 Git：

```bash
git add .
git commit -m "配置 Netlify 部署"
git push origin main
```

部署完成後，你的網站將可以通過 `https://你的網站名稱.netlify.app` 訪問！