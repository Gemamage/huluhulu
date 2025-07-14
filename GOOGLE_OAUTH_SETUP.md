# Google OAuth 設定指南

## 概述

要使用 Google OAuth 登入功能，你需要從 Google Cloud Console 取得真實的 Client ID 和 Client Secret。目前 `.env` 文件中使用的是測試用的假值，無法進行實際的 Google 登入。

## 1. 前往 Google Cloud Console

### 步驟 1：訪問 Google Cloud Console
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用你的 Google 帳戶登入
3. 選擇現有專案或建立新專案

### 步驟 2：建立新專案（如果需要）
1. 點擊頂部的專案選擇器
2. 點擊「新增專案」
3. 輸入專案名稱（例如："Pet Finder App"）
4. 點擊「建立」

## 2. 啟用 Google+ API

### 步驟 1：前往 API 程式庫
1. 在左側選單中，點擊「API 和服務」→「程式庫」
2. 搜尋「Google+ API」或「People API"
3. 點擊進入並點擊「啟用」

### 步驟 2：啟用其他必要的 API
同樣方式啟用以下 API：
- Google+ API
- People API
- Gmail API（如果需要存取用戶 email）

## 3. 設定 OAuth 同意畫面

### 步驟 1：配置 OAuth 同意畫面
1. 在左側選單中，點擊「API 和服務」→「OAuth 同意畫面」
2. 選擇「外部」用戶類型（除非你有 Google Workspace）
3. 點擊「建立」

### 步驟 2：填寫應用程式資訊
**必填欄位：**
- 應用程式名稱：`寵物協尋網站` 或 `Pet Finder App`
- 用戶支援電子郵件：你的 email
- 開發人員聯絡資訊：你的 email

**選填欄位：**
- 應用程式標誌：可以上傳你的網站 logo
- 應用程式首頁：`http://localhost:3000`（開發環境）
- 應用程式隱私權政策：可以暫時留空
- 應用程式服務條款：可以暫時留空

### 步驟 3：設定範圍（Scopes）
1. 點擊「新增或移除範圍」
2. 選擇以下範圍：
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. 點擊「更新」

### 步驟 4：新增測試使用者（開發階段）
1. 在「測試使用者」部分
2. 點擊「新增使用者」
3. 輸入你的 email 地址
4. 點擊「儲存並繼續」

## 4. 建立 OAuth 2.0 憑證

### 步驟 1：建立憑證
1. 在左側選單中，點擊「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」

### 步驟 2：設定應用程式類型
1. 選擇「網路應用程式」
2. 輸入名稱：`Pet Finder Web Client`

### 步驟 3：設定重新導向 URI
**已授權的 JavaScript 來源：**
```
http://localhost:3000
http://localhost:3001
```

**已授權的重新導向 URI：**
```
http://localhost:3001/api/oauth/google/callback
```

### 步驟 4：建立並取得憑證
1. 點擊「建立」
2. 會顯示一個彈出視窗，包含：
   - **用戶端 ID**（Client ID）
   - **用戶端密鑰**（Client Secret）
3. **重要：立即複製並儲存這些值！**

## 5. 更新 .env 檔案

### 將真實憑證加入 .env
打開 `backend/.env` 檔案，更新以下內容：

```env
# Google OAuth 配置
GOOGLE_CLIENT_ID=你的真實Client_ID
GOOGLE_CLIENT_SECRET=你的真實Client_Secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

**範例：**
```env
# Google OAuth 配置
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

## 6. 測試 Google OAuth

### 步驟 1：重新啟動服務器
```bash
cd backend
npm run dev
```

### 步驟 2：測試登入流程
1. 前往 `http://localhost:3000`
2. 點擊「使用 Google 登入」按鈕
3. 應該會重新導向到 Google 登入頁面
4. 登入後會回到你的應用程式

## 7. 生產環境設定

### 當你準備部署到生產環境時：

1. **更新 OAuth 同意畫面**
   - 將應用程式狀態從「測試」改為「生產」
   - 更新應用程式首頁為實際網域

2. **更新重新導向 URI**
   - 新增生產環境的網域
   - 例如：`https://yourapp.com/api/oauth/google/callback`

3. **更新環境變數**
   - 在生產環境的 `.env` 中使用相同的憑證
   - 更新 `GOOGLE_CALLBACK_URL` 為生產網域

## 8. 安全性注意事項

1. **絕對不要**將 Client Secret 提交到版本控制系統
2. 在生產環境中使用環境變數或安全的配置管理
3. 定期檢查和輪換憑證
4. 監控 OAuth 使用量
5. 只請求必要的權限範圍

## 9. 故障排除

### 常見錯誤

**錯誤：「redirect_uri_mismatch」**
- 檢查 Google Cloud Console 中的重新導向 URI 設定
- 確保 URL 完全匹配（包括 http/https 和端口）

**錯誤：「invalid_client」**
- 檢查 Client ID 和 Client Secret 是否正確
- 確認憑證沒有被停用

**錯誤：「access_denied」**
- 檢查 OAuth 同意畫面設定
- 確認用戶在測試用戶列表中（開發階段）

---

完成這些設定後，你的 Google OAuth 登入功能就可以正常運作了！