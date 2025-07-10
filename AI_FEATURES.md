# AI 功能說明文件

## 概述

本專案整合了多項 AI 功能，用於提升寵物協尋的效率和準確性。主要包括圖像處理優化、寵物品種識別、圖像相似度比對和智能搜尋建議等功能。

## 功能列表

### 1. 圖像處理優化

#### 功能描述
- 自動壓縮圖像以減少存儲空間
- 智能裁剪和調整圖像尺寸
- 優化圖像質量以提升 AI 分析準確性

#### API 端點
```
POST /api/upload/process-with-ai
```

#### 使用方式
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('type', 'pet');

const response = await fetch('/api/upload/process-with-ai', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 2. Google Vision AI 整合

#### 功能描述
- 使用 Google Vision AI 進行圖像內容分析
- 識別圖像中的物體、動物和特徵
- 提取顏色信息和視覺特徵

#### API 端點
```
POST /api/ai/analyze
```

#### 請求參數
```json
{
  "imageUrl": "https://example.com/pet-image.jpg"
}
```

#### 回應格式
```json
{
  "success": true,
  "data": {
    "confidence": 0.95,
    "labels": ["狗", "柴犬", "寵物"],
    "colors": ["棕色", "白色"],
    "features": ["毛茸茸", "中型犬", "豎耳"]
  }
}
```

### 3. 寵物品種識別

#### 功能描述
- 自動識別寵物品種
- 提供識別信心度評分
- 支援多種寵物類型（狗、貓、鳥類等）

#### API 端點
```
POST /api/ai/breed-detection
```

#### 使用範例
```javascript
const response = await fetch('/api/ai/breed-detection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/dog.jpg'
  })
});
```

### 4. 圖像相似度比對

#### 功能描述
- 基於圖像特徵進行相似度計算
- 找出視覺上相似的寵物
- 支援批量比對和排序

#### API 端點
```
POST /api/ai/similarity-search
```

#### 請求參數
```json
{
  "imageUrl": "https://example.com/lost-pet.jpg",
  "limit": 10,
  "threshold": 0.7
}
```

### 5. AI 搜尋建議

#### 功能描述
- 基於寵物特徵生成搜尋關鍵字
- 智能推薦相關搜尋詞
- 提升搜尋匹配準確性

#### API 端點
```
GET /api/ai/suggestions/:petId
```

## 設定說明

### 環境變數配置

在 `.env` 文件中添加以下配置：

```env
# Google Vision AI 設定
GOOGLE_VISION_PROJECT_ID=your-google-cloud-project-id
GOOGLE_VISION_KEY_PATH=path/to/your/service-account-key.json
```

### Google Cloud 設定步驟

1. **建立 Google Cloud 專案**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 建立新專案或選擇現有專案

2. **啟用 Vision API**
   - 在 API 庫中搜尋 "Vision API"
   - 點擊啟用

3. **建立服務帳戶**
   - 前往 IAM & Admin > Service Accounts
   - 建立新的服務帳戶
   - 下載 JSON 金鑰文件

4. **設定權限**
   - 為服務帳戶分配 "Cloud Vision API User" 角色

### 依賴套件安裝

```bash
npm install @google-cloud/vision sharp jimp
```

## 資料庫結構更新

### Pet 模型新增字段

```typescript
interface IPet {
  // 現有字段...
  
  // AI 相關字段
  aiFeatures?: IImageFeatures[];
  aiBreedPrediction?: string;
  aiConfidence?: number;
  aiTags?: string[];
}

interface IImageFeatures {
  imageUrl: string;
  features: number[]; // 特徵向量
  analysis?: IAIAnalysis;
  processedAt: Date;
}

interface IAIAnalysis {
  confidence: number;
  labels: string[];
  detectedBreed?: string;
  colors: string[];
  features: string[];
}
```

## 使用注意事項

### 1. API 配額限制
- Google Vision API 有每日免費配額限制
- 超出配額後會產生費用
- 建議實施快取機制以減少 API 調用

### 2. 圖像格式支援
- 支援格式：JPEG, PNG, WebP, GIF
- 建議圖像大小：最大 5MB
- 最佳解析度：1200x1200 像素

### 3. 效能考量
- AI 分析可能需要數秒時間
- 建議使用非同步處理
- 考慮實施佇列系統處理大量請求

### 4. 錯誤處理
- 所有 AI 功能都有備用方案
- 當 AI 服務不可用時，系統仍可正常運作
- 錯誤信息會記錄在日誌中

## 測試

### 單元測試
```bash
npm test -- --grep "AI Service"
```

### 整合測試
```bash
npm run test:integration
```

## 監控和日誌

### 日誌記錄
- AI 分析請求和結果會記錄在應用日誌中
- 包含處理時間和信心度信息
- 錯誤和異常會詳細記錄

### 效能監控
- 監控 AI API 回應時間
- 追蹤成功率和錯誤率
- 監控 API 配額使用情況

## 未來擴展

### 計劃中的功能
1. **情感分析**：分析寵物表情和情緒狀態
2. **行為識別**：識別寵物行為模式
3. **健康狀態評估**：基於外觀評估寵物健康狀況
4. **多語言支援**：支援多種語言的標籤和描述

### 技術改進
1. **模型優化**：訓練專門的寵物識別模型
2. **邊緣計算**：在客戶端進行部分 AI 處理
3. **實時分析**：支援即時圖像分析
4. **批量處理**：優化大量圖像的處理效率

## 支援和維護

如有問題或建議，請聯繫開發團隊或在專案 GitHub 頁面提交 Issue。