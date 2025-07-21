# Google Cloud Vision API 設定指南

## 1. 建立 Google Cloud 專案

### 步驟 1：前往 Google Cloud Console
1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 登入您的 Google 帳戶
3. 點擊「建立專案」或選擇現有專案

### 步驟 2：啟用 Vision API
1. 在左側選單中，點擊「API 和服務」→「程式庫」
2. 搜尋「Cloud Vision API」
3. 點擊「啟用」

## 2. 建立服務帳戶

### 步驟 1：建立服務帳戶
1. 前往「IAM 和管理」→「服務帳戶」
2. 點擊「建立服務帳戶」
3. 輸入服務帳戶名稱（例如：pet-finder-vision）
4. 輸入描述：「寵物協尋網站 Vision API 服務帳戶」
5. 點擊「建立並繼續」

### 步驟 2：設定權限
1. 在「將此服務帳戶的存取權授予專案」部分
2. 選擇角色：「Cloud Vision API 服務代理程式」
3. 點擊「繼續」
4. 點擊「完成」

### 步驟 3：建立金鑰
1. 在服務帳戶列表中，點擊剛建立的服務帳戶
2. 點擊「金鑰」標籤
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 點擊「建立」
6. 金鑰檔案會自動下載到您的電腦

## 3. 設定環境變數

### 步驟 1：放置金鑰檔案
1. 將下載的 JSON 金鑰檔案重新命名為 `google-vision-key.json`
2. 將檔案放置在專案根目錄的 `backend/config/` 資料夾中
3. **重要**：確保此檔案不會被提交到 Git（已在 .gitignore 中設定）

### 步驟 2：更新 .env 檔案
在 `backend/.env` 檔案中新增以下設定：

```env
# Google Vision AI 設定
GOOGLE_VISION_PROJECT_ID=your-project-id
GOOGLE_VISION_KEY_PATH=./config/google-vision-key.json
```

**注意**：
- `your-project-id` 請替換為您的 Google Cloud 專案 ID
- 專案 ID 可以在 Google Cloud Console 的專案選擇器中找到

## 4. 測試設定

### 建立測試腳本
您可以使用以下命令測試 Vision API 是否正確設定：

```bash
cd backend
npm run test:vision
```

### 手動測試
或者使用我們提供的測試端點：

```bash
# 啟動開發伺服器
npm run dev

# 在另一個終端機中測試
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/pet-image.jpg"}'
```

## 5. 安全性注意事項

1. **絕對不要**將 JSON 金鑰檔案提交到版本控制系統
2. 定期輪換服務帳戶金鑰
3. 只授予必要的最小權限
4. 監控 API 使用量，避免超出免費額度

## 6. 免費額度

Google Cloud Vision API 提供每月免費額度：
- 前 1,000 個單位免費
- 超出後按使用量計費
- 建議設定預算警示

## 7. 故障排除

### 常見錯誤

**錯誤：「找不到憑證」**
- 檢查 `GOOGLE_VISION_KEY_PATH` 路徑是否正確
- 確認 JSON 金鑰檔案存在且可讀取

**錯誤：「API 未啟用」**
- 確認已在 Google Cloud Console 中啟用 Vision API
- 檢查專案 ID 是否正確

**錯誤：「權限不足」**
- 確認服務帳戶具有 Vision API 權限
- 檢查金鑰是否為最新版本

### 取得協助
如果遇到問題，請檢查：
1. Google Cloud Console 中的錯誤日誌
2. 應用程式的錯誤日誌
3. 網路連線是否正常

---

設定完成後，您就可以開始使用 AI 圖像分析功能了！