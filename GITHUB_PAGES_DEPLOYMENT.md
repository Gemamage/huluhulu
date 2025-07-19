# GitHub Pages 部署指南

## 概述

你的寵物協尋網站已經配置好可以部署到 GitHub Pages。由於你的 Next.js 配置已經設定為 `output: 'export'`，這意味著網站會生成靜態文件，非常適合 GitHub Pages 託管。

## 部署步驟

### 1. 創建 GitHub 倉庫

1. 登入 [GitHub](https://github.com)
2. 點擊右上角的 "+" 按鈕，選擇 "New repository"
3. 輸入倉庫名稱（建議使用 `huluhulu`）
4. 設定為 Public（GitHub Pages 免費版需要公開倉庫）
5. 不要初始化 README、.gitignore 或 license（因為你的專案已經有這些文件）
6. 點擊 "Create repository"

### 2. 連接本地倉庫到 GitHub

在專案根目錄執行以下命令：

```bash
# 添加 GitHub 遠端倉庫（請替換為你的 GitHub 用戶名和倉庫名）
git remote add origin https://github.com/YOUR_USERNAME/huluhulu.git

# 推送代碼到 GitHub
git add .
git commit -m "Initial commit for GitHub Pages deployment"
git push -u origin main
```

### 3. 啟用 GitHub Pages

1. 在 GitHub 倉庫頁面，點擊 "Settings" 標籤
2. 在左側選單中找到 "Pages"
3. 在 "Source" 部分，選擇 "GitHub Actions"
4. 系統會自動檢測到你的 `.github/workflows/deploy.yml` 文件

### 4. 配置倉庫名稱

在 `frontend/next.config.js` 文件中，確保 `repoName` 變數設定為你的實際倉庫名稱：

```javascript
const repoName = 'your-actual-repo-name' // 替換為你的倉庫名稱
```

### 5. 觸發部署

推送代碼到 main 分支後，GitHub Actions 會自動開始部署流程：

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push origin main
```

## 部署後的網址

部署成功後，你的網站將可以通過以下網址訪問：

```
https://YOUR_USERNAME.github.io/REPO_NAME/
```

例如：`https://johndoe.github.io/huluhulu/`

## 重要注意事項

### 1. 靜態網站限制

由於 GitHub Pages 只支援靜態網站，以下功能將無法使用：

- **後端 API 功能**：所有需要伺服器端處理的功能（如用戶註冊、登入、寵物資料上傳等）
- **資料庫操作**：MongoDB 相關功能
- **即時通訊**：Socket.io 功能
- **檔案上傳**：圖片上傳功能

### 2. 建議的解決方案

為了讓網站完整運行，你可以考慮：

1. **前端展示版本**：在 GitHub Pages 部署純前端展示版本，展示 UI 設計和靜態功能
2. **完整版本部署**：使用其他平台部署完整版本：
   - **Vercel**：最適合 Next.js 應用，支援 API 路由
   - **Netlify**：支援靜態網站和 Serverless 函數
   - **Railway** 或 **Render**：支援全端應用部署

### 3. 環境變數

GitHub Pages 不支援私密環境變數，所以：
- 移除所有敏感的 API 金鑰
- 只保留公開的配置
- 考慮使用模擬資料展示功能

## 自動部署流程

每次推送到 main 分支時，GitHub Actions 會自動：

1. 安裝 Node.js 18
2. 安裝前端依賴
3. 構建靜態網站
4. 部署到 GitHub Pages

## 故障排除

### 部署失敗

1. 檢查 GitHub Actions 日誌
2. 確保 `package.json` 中的腳本正確
3. 檢查 `next.config.js` 配置

### 頁面無法載入

1. 檢查 `basePath` 和 `assetPrefix` 配置
2. 確保 `.nojekyll` 文件存在
3. 檢查瀏覽器控制台的錯誤訊息

### 圖片或資源無法載入

1. 確保所有資源路徑使用相對路徑
2. 檢查 `next/image` 組件的配置
3. 考慮使用外部 CDN 託管圖片

## 下一步建議

1. **測試部署**：先部署一個簡化版本測試流程
2. **準備展示資料**：創建一些模擬寵物資料用於展示
3. **優化 SEO**：添加適當的 meta 標籤和 sitemap
4. **考慮完整部署**：評估是否需要在其他平台部署完整功能版本

---

**提醒**：記得在推送代碼前先測試本地構建是否成功：

```bash
cd frontend
npm run build:github
```