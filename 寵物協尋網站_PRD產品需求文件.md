# 呼嚕 (Hūlū) 寵物協尋網站 PRD 產品需求文件

## 高層次摘要

### 電梯簡報 (Elevator Pitch)
「呼嚕 (Hūlū)」是一個專為台灣地區設計的寵物協尋平台，透過地理位置定位、AI 圖像識別和社群協作功能，幫助失蹤寵物與主人快速重聚。我們秉持「守護安心頻率」的核心價值，目標是在寵物失蹤的黃金 72 小時內，最大化尋回成功率。

### 問題陳述 (Problem Statement)
每年台灣有數萬隻寵物走失，傳統的尋寵方式（張貼傳單、社群媒體發文）效率低下且覆蓋範圍有限。現有平台缺乏即時性、地理精準度和有效的配對機制，導致許多寵物無法及時找到回家的路。

### 目標受眾 (Target Audience)
- **主要用戶**：寵物主人（年齡 25-55 歲，居住在都市地區）
- **次要用戶**：愛心志工、動物救援組織、獸醫診所
- **潛在用戶**：寵物相關服務業者（寵物店、美容院等）

### 獨特賣點 (Unique Selling Point)
1. **AI 智能配對**：透過圖像識別技術自動比對失蹤與發現的寵物
2. **即時地理通知**：基於 GPS 的精準推播系統
3. **社群協作網絡**：建立在地化的寵物協尋社群
4. **多元通報管道**：整合 LINE Bot、網頁、APP 多平台

### 建構平台 (Platforms)
- **Phase 1**: 響應式網頁應用程式 (PWA)
- **Phase 2**: iOS/Android 原生 APP
- **Phase 3**: LINE Bot 整合

---

## MVP 功能規劃

### 核心功能 (Core Features)

#### 1. 寵物失蹤通報系統
**功能描述**：讓用戶快速上傳失蹤寵物資訊
**技術需求**：
- 圖片上傳與壓縮
- GPS 定位獲取
- 表單驗證與資料儲存

**使用者故事**：
- 身為寵物主人，我想要快速上傳我的寵物照片和失蹤地點，以便其他人能幫助我尋找
- 身為寵物主人，我想要設定搜尋範圍，以便在特定區域內發送通知

#### 2. 寵物發現回報系統
**功能描述**：讓用戶回報發現的流浪或疑似失蹤寵物
**技術需求**：
- 即時照片拍攝功能
- 地理位置記錄
- 快速配對演算法

**使用者故事**：
- 身為路人，我想要快速回報我看到的流浪寵物，以便幫助牠找到主人
- 身為志工，我想要上傳救援的寵物資訊，以便主人能找到牠們

#### 3. 智能配對與通知系統
**功能描述**：自動比對失蹤與發現的寵物，並發送通知
**技術需求**：
- AI 圖像識別 API
- 推播通知系統
- 相似度評分演算法

**使用者故事**：
- 身為寵物主人，我想要在有人發現疑似我的寵物時立即收到通知
- 身為發現者，我想要知道我回報的寵物是否有主人在尋找

#### 4. 地圖視覺化系統
**功能描述**：在地圖上顯示失蹤和發現寵物的位置
**技術需求**：
- Google Maps API 整合
- 地理圍欄功能
- 即時資料更新

**使用者故事**：
- 身為用戶，我想要在地圖上看到附近的失蹤寵物資訊
- 身為寵物主人，我想要看到我的寵物可能出現的區域

#### 5. 用戶註冊與個人檔案
**功能描述**：用戶帳號管理和個人資訊設定
**技術需求**：
- OAuth 社交登入
- 個人資料加密儲存
- 隱私設定管理

**使用者故事**：
- 身為用戶，我想要建立個人檔案來管理我的寵物資訊
- 身為用戶，我想要設定隱私權限來保護我的個人資訊

---

## 系統架構考量

### 技術堆疊

#### 前端技術
- **框架**: React 18 (或 Next.js 14)
- **語言**: TypeScript
- **樣式**: Tailwind CSS + Shadcn/ui
- **狀態管理**: Zustand 或 Redux Toolkit
- **地圖**: Google Maps JavaScript API
- **PWA**: Workbox (Service Worker)

#### 後端技術
- **框架**: Node.js + Express.js
- **語言**: TypeScript
- **資料庫**: AWS DocumentDB 或 MongoDB Atlas
- **ODM**: Mongoose（物件文件映射）
- **檔案儲存**: AWS S3 或 Google Cloud Storage
- **認證**: JWT + Passport.js
- **API**: RESTful API

#### AI 與第三方服務
- **圖像識別**: Google Vision AI / AWS Rekognition
- **推播通知**: Firebase Cloud Messaging
- **簡訊服務**: Twilio
- **地理服務**: Google Maps Platform

#### 基礎設施
- **部署**: Vercel (前端) + AWS EC2 (後端)
- **監控**: Sentry + Google Analytics
- **CDN**: CloudFront
- **SSL**: Let's Encrypt

### 系統架構圖
```
[用戶端 PWA] ←→ [API Gateway] ←→ [應用伺服器]
                                      ↓
[推播服務] ←→ [AI 識別服務] ←→ [資料庫]
                                      ↓
[檔案儲存] ←→ [地圖服務] ←→ [第三方 API]
```

---

## 資料架構設計 (NoSQL - MongoDB)

### 核心資料集合 (Collections)

#### Users 用戶集合
```json
{
  "_id": "ObjectId",
  "email": "string (unique, required)",
  "name": "string (required)",
  "phone": "string (optional)",
  "avatar_url": "string (optional)",
  "location": {
    "lat": "number (decimal)",
    "lng": "number (decimal)"
  },
  "notification_radius": "number (default: 5000)", // 通知範圍(公尺)
  "is_verified": "boolean (default: false)",
  "auth_providers": ["string"], // Google, Facebook, LINE 等
  "preferences": {
    "language": "string (default: 'zh-TW')",
    "notifications": {
      "email": "boolean (default: true)",
      "push": "boolean (default: true)",
      "sms": "boolean (default: false)"
    }
  },
  "created_at": "Date",
  "updated_at": "Date"
}
```

#### Pets 寵物集合
```json
{
  "_id": "ObjectId",
  "owner_id": "ObjectId (ref: users)",
  "name": "string (required)",
  "species": "string (required)", // 犬/貓/兔/鳥/其他
  "breed": "string (optional)",
  "color": "string (optional)",
  "size": "string", // 小型/中型/大型
  "age_years": "number (optional)",
  "gender": "string", // 公/母/未知
  "description": "string (optional)",
  "microchip_id": "string (optional)",
  "photos": ["string"], // 照片 URL 陣列
  "characteristics": {
    "distinctive_marks": ["string"], // 特殊標記
    "personality": ["string"], // 個性特徵
    "medical_conditions": ["string"] // 醫療狀況
  },
  "status": {
    "is_missing": "boolean (default: false)",
    "missing_since": "Date (optional)",
    "last_seen": {
      "lat": "number (decimal)",
      "lng": "number (decimal)",
      "address": "string",
      "timestamp": "Date"
    },
    "reward_amount": "number (default: 0)"
  },
  "created_at": "Date",
  "updated_at": "Date"
}
```

#### Sightings 目擊回報集合
```json
{
  "_id": "ObjectId",
  "reporter_id": "ObjectId (ref: users)",
  "pet_id": "ObjectId (ref: pets, optional)", // 如果已配對
  "photos": ["string"], // 照片 URL 陣列 (required)
  "location": {
    "lat": "number (decimal, required)",
    "lng": "number (decimal, required)",
    "address": "string (optional)",
    "accuracy": "number" // GPS 精確度
  },
  "description": "string (optional)",
  "sighting_time": "Date (required)",
  "animal_details": {
    "species": "string",
    "estimated_size": "string",
    "color": "string",
    "condition": "string", // 健康狀況
    "behavior": "string" // 行為描述
  },
  "contact_info": {
    "method": "string", // phone/email/app
    "value": "string",
    "is_public": "boolean (default: false)"
  },
  "status": "string (default: 'active')", // active/matched/resolved/expired
  "confidence_score": "number (optional)", // AI 配對信心分數 (0-1)
  "ai_analysis": {
    "detected_features": ["string"],
    "similarity_scores": [{
      "pet_id": "ObjectId",
      "score": "number"
    }]
  },
  "created_at": "Date",
  "updated_at": "Date"
}
```

#### Matches 配對集合
```json
{
  "_id": "ObjectId",
  "pet_id": "ObjectId (ref: pets)",
  "sighting_id": "ObjectId (ref: sightings)",
  "confidence_score": "number (required)", // 0-1 之間
  "match_type": "string", // ai_auto/user_manual/admin_verified
  "status": "string (default: 'pending')", // pending/confirmed/rejected/expired
  "feedback": {
    "owner_response": {
      "status": "string", // confirmed/rejected/need_more_info
      "message": "string (optional)",
      "timestamp": "Date"
    },
    "reporter_response": {
      "status": "string",
      "message": "string (optional)",
      "timestamp": "Date"
    }
  },
  "verification": {
    "admin_verified": "boolean (default: false)",
    "verification_notes": "string (optional)",
    "verified_by": "ObjectId (ref: users, optional)",
    "verified_at": "Date (optional)"
  },
  "created_at": "Date",
  "updated_at": "Date"
}
```

#### Notifications 通知集合
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "type": "string (required)", // match_found/sighting_nearby/status_update/system_announcement
  "title": "string (required)",
  "message": "string (required)",
  "data": {
    "pet_id": "ObjectId (optional)",
    "sighting_id": "ObjectId (optional)",
    "match_id": "ObjectId (optional)",
    "action_url": "string (optional)",
    "image_url": "string (optional)"
  },
  "delivery": {
    "channels": ["string"], // app/email/sms/push
    "sent_at": "Date (optional)",
    "delivery_status": "string" // pending/sent/delivered/failed
  },
  "user_interaction": {
    "is_read": "boolean (default: false)",
    "read_at": "Date (optional)",
    "clicked": "boolean (default: false)",
    "clicked_at": "Date (optional)"
  },
  "priority": "string (default: 'normal')", // low/normal/high/urgent
  "expires_at": "Date (optional)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

---

## API 端點規格

### 認證相關 API
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/me` - 獲取當前用戶資訊

### 寵物管理 API
- `GET /api/pets` - 獲取寵物列表
- `POST /api/pets` - 新增寵物
- `PUT /api/pets/:id` - 更新寵物資訊
- `DELETE /api/pets/:id` - 刪除寵物
- `POST /api/pets/:id/missing` - 標記寵物失蹤
- `POST /api/pets/:id/found` - 標記寵物找到

### 目擊回報 API
- `GET /api/sightings` - 獲取目擊回報列表
- `POST /api/sightings` - 新增目擊回報
- `GET /api/sightings/nearby` - 獲取附近目擊回報
- `PUT /api/sightings/:id` - 更新目擊回報

### 配對系統 API
- `GET /api/matches/:petId` - 獲取寵物配對結果
- `POST /api/matches/:id/confirm` - 確認配對
- `POST /api/matches/:id/reject` - 拒絕配對

### 地圖與搜尋 API
- `GET /api/map/pets` - 獲取地圖上的寵物位置
- `GET /api/search/pets` - 搜尋寵物
- `POST /api/search/image` - 圖像搜尋

### 通知系統 API
- `GET /api/notifications` - 獲取通知列表
- `PUT /api/notifications/:id/read` - 標記通知已讀
- `POST /api/notifications/subscribe` - 訂閱推播通知

---

## 安全與隱私考量

### 資料安全
- **加密傳輸**: 全站 HTTPS/TLS 1.3
- **資料加密**: 敏感資料使用 AES-256 加密
- **API 安全**: JWT Token + Rate Limiting
- **檔案安全**: S3 預簽名 URL，限時存取

### 隱私保護
- **個資保護**: 符合個資法規範
- **位置隱私**: 模糊化精確位置（誤差 100-500 公尺）
- **照片保護**: 自動移除 EXIF 資料
- **匿名選項**: 允許匿名回報目擊

### 內容審核
- **圖片審核**: AI 自動檢測不當內容
- **文字過濾**: 敏感詞彙過濾
- **舉報機制**: 用戶舉報不當內容
- **人工審核**: 爭議內容人工複審

---

## 設計系統規範

### 色彩系統
- **主色調**: #FF8C69 (柔和暖橘色 - 溫暖、希望與行動力)
- **次要色**: #FFB347 (淺橘色 - 溫馨、友善)
- **成功色**: #10B981 (綠色 - 希望、成功)
- **警示色**: #EF4444 (紅色 - 緊急、警告)
- **中性色**: #6B7280 (灰色 - 文字、背景)

### 字體系統
- **中文字體**: "Noto Sans TC", "Microsoft JhengHei"
- **英文字體**: "Inter", "Helvetica Neue", sans-serif
- **字體大小**: 12px, 14px, 16px, 18px, 24px, 32px

### 組件設計
- **按鈕**: 圓角 8px，陰影效果
- **卡片**: 圓角 12px，邊框 1px
- **輸入框**: 圓角 6px，focus 狀態藍色邊框
- **圖片**: 圓角 8px，懶加載

### 響應式設計
- **手機**: 320px - 768px
- **平板**: 768px - 1024px
- **桌面**: 1024px+

---

## 非功能性需求

### 效能需求
- **頁面載入時間**: < 3 秒
- **API 回應時間**: < 500ms
- **圖片載入**: 漸進式載入，< 2 秒
- **離線功能**: PWA 快取關鍵頁面

### 可用性需求
- **系統可用性**: 99.9% uptime
- **錯誤處理**: 友善的錯誤訊息
- **無障礙**: 符合 WCAG 2.1 AA 標準
- **多語言**: 繁體中文、英文

### 擴展性需求
- **用戶容量**: 支援 10 萬註冊用戶
- **並發處理**: 1000 同時在線用戶
- **資料儲存**: 100GB 圖片儲存
- **API 限制**: 每用戶每分鐘 100 次請求

---

## 基礎設施與部署策略

### 開發環境
- **版本控制**: Git + GitHub
- **CI/CD**: GitHub Actions
- **測試**: Jest + Cypress
- **程式碼品質**: ESLint + Prettier
- **測試覆蓋率**: 關鍵核心功能要求 100% 測試覆蓋率，整體專案的程式碼測試覆蓋率目標為 > 80%

### 生產環境
- **前端部署**: Vercel
- **後端部署**: AWS EC2 + Load Balancer
- **資料庫**: AWS DocumentDB 或 MongoDB Atlas
- **檔案儲存**: AWS S3 + CloudFront
- **監控**: AWS CloudWatch + Sentry

### 備份策略
- **資料庫備份**: 每日自動備份
- **檔案備份**: S3 跨區域複製
- **災難復原**: RTO < 4 小時，RPO < 1 小時

---

## 貨幣化策略

### MVP 階段 (完全免費)
- 所有核心功能完全免費使用
- 無限寵物登記
- 失蹤通報與目擊回報
- 地圖搜尋功能
- 社群互動功能
- 目標：建立信任與社群基礎

### 未來收入規劃
#### B2B 合作
- 動物醫院「官方推薦」標章
- 寵物用品店「加值店家」認證

#### 增值服務 (Freemium)
- 協尋案件「強力曝光」服務
- 首頁置頂推廣
- 擴大推播範圍

#### 社群支持
- 小額捐款機制
- 公開透明財報
- 理念認同者自願支持

---

## 詳細規劃補充

### 1. 商業模式細節 (Business Model Details)

#### 收入來源策略
**初期階段**：零收入模式，專注於社會價值創造
- 所有功能完全免費提供
- 建立用戶信任與社群基礎
- 累積平台使用數據與成功案例

**未來收入規劃**（按優先順序）：
1. **B2B 合作夥伴**
   - 動物醫院：提供「官方推薦」標章服務
   - 寵物用品店：「加值店家」認證與推廣
   - 建立雙贏的合作生態系統

2. **增值服務 (Freemium 模式)**
   - 協尋案件「強力曝光」服務
   - 首頁置頂推廣功能
   - 擴大推播通知範圍
   - 飼主刊登協尋免費，付費購買加值服務

3. **社群贊助機制**
   - 開放小額捐款功能
   - 公開透明的財務報告
   - 讓認同理念的使用者自願支持平台營運

#### 合作夥伴策略
- **動物醫院**：提供專業醫療諮詢與緊急救護資訊
- **動保團體**：分享救援經驗與在地支援網絡
- **寵物相關業者**：建立服務推薦與認證機制

#### 廣告政策
**堅持無廣告原則**：為維護平台專業性與用戶信賴感，初期完全不考慮置入任何第三方廣告。

### 2. 目標市場 (Target Market)

#### 地理範圍
- **第一階段**：100% 專注於台灣市場
- **深耕策略**：先把台灣在地的協尋網絡做深、做透
- **區域重點**：優先覆蓋六都及人口密集區域

#### 國際化願景
**長期規劃**：在台灣模式成功驗證後，考慮拓展至：
- 香港、澳門
- 馬來西亞、新加坡
- 其他華人寵物社群活躍的地區

#### 目標用戶特徵
**核心用戶群**：所有熱愛動物的人
- **寵物飼主**：飼養犬、貓、兔、龜等各類寵物的主人
- **愛心民眾**：關心動物福利的熱心市民
- **學生志工**：參與動保活動的年輕族群
- **專業人士**：獸醫、動保工作者、寵物業者

### 3. 技術偏好 (Tech Preferences)

#### 核心技術堆疊
**前端技術**：
- React 18 或 Next.js 14
- TypeScript（提升代碼品質）
- Tailwind CSS（快速 UI 開發）

**後端技術**：
- Node.js + Express.js
- TypeScript（前後端統一語言）
- AWS DocumentDB 或 MongoDB Atlas + Mongoose ODM

**技術選擇理由**：
- 前後端都使用 JavaScript/TypeScript，開發團隊更靈活
- MongoDB 彈性結構適合存放多樣化的協尋案件資料
- 豐富的生態系統與社群支援

#### 雲端服務策略
**首選方案**：
- **AWS**：成熟穩定，服務完整
- **Google Cloud Platform (GCP)**：若使用 Firebase 則優先選擇
- **決策依據**：根據最終資料庫選擇與團隊熟悉度決定

#### 第三方整合
- Google Maps API（地圖服務）
- Firebase（推播通知）
- AI 圖像識別服務
- 社群媒體登入 API

### 4. 功能優先級 (Function Priority)

#### MVP 必要功能 (Must-Have)
**Phase 1 核心功能**：
1. **使用者註冊與管理系統**
   - 社群媒體快速登入
   - 個人資料管理
   - 隱私設定控制

2. **拾獲通報流程**
   - 照片上傳功能
   - 動物特徵標籤選擇
   - GPS 地點自動定位
   - 聯絡方式設定

3. **走失協尋流程**
   - 寵物資訊刊登
   - 協尋案件列表
   - 篩選與搜尋功能
   - 案件狀態管理

4. **案件詳情頁與留言系統**
   - 詳細資訊展示
   - 留言互動功能
   - 聯絡方式保護
   - 案件更新通知

#### 後續版本規劃 (V1.1 - V2.0)
**Phase 2 擴展功能**：
- 動物醫院列表與地圖整合
- 寵物照護小百科
- 用戶貢獻徽章系統
- App 推播即時通知
- AI 智能配對系統
- 多語言支援

### 5. 設計偏好 (Design Preferences)

#### 視覺風格定位
**核心理念**：「專業的溫暖 (Professional Warmth)」
- 既具備專業可信度
- 又充滿溫暖人性關懷
- 在緊急時刻給予安心感

#### 設計參考案例
**功能參考**：Petfinder 的完整性與易用性
**視覺參考**：日本插畫家 Kanahei (卡娜赫拉) 的溫暖療癒風格
**整合目標**：專業功能 + 溫馨視覺 = 獨特品牌體驗

#### 品牌人格化
**「呼嚕」的角色設定**：
- 一位值得信賴的摯友
- 擁有專業知識與溫暖同理心
- 在最慌亂時給予可靠指引
- 提供最安心的陪伴支持

#### 設計原則
- **溫暖色調**：以暖橘色為主調
- **友善介面**：直觀易懂的操作流程
- **情感設計**：考慮用戶焦急情緒的 UI/UX
- **無障礙設計**：確保所有用戶都能輕鬆使用

### 6. 營運考量 (Operational Considerations)

#### 客服系統規劃
**初期客服管道**：
- Email 客服信箱
- Facebook/Instagram 私訊
- 常見問題 FAQ 頁面
- 社群平台即時回應

**未來擴展**：
- 線上客服聊天機器人
- 電話客服熱線
- 視訊諮詢服務

#### 內容管理系統
**後台管理功能需求**：
- 「寵物照護小百科」文章管理
- 用戶回報內容處理
- 協尋案件狀態監控
- 數據分析與報表生成
- 合作夥伴資訊管理

#### 社群審核標準
**明確禁止行為**：
- 寵物買賣交易
- 騷擾或不當言論
- 虛假資訊發布
- 商業廣告濫發

**審核機制**：
- 關鍵字自動過濾
- 用戶檢舉回報系統
- 營運人員人工審核
- 違規處理流程標準化

### 7. 法律合規 (Legal Compliance)

#### 個資保護法規遵循
**台灣《個人資料保護法》完全遵守**：
- 明確告知個資蒐集目的
- 用戶同意條款透明化
- 個資使用範圍限制
- 用戶資料刪除權保障

#### 隱私保護機制
**用戶隱私控制**：
- 聯絡方式公開程度自主選擇
- 地理位置精確度可調整
- 個人資料顯示範圍設定
- 匿名發布選項提供

#### 政府合作規劃
**長期合作目標**：
- 各縣市動保處數據分享
- 公部門走失動物資料介接
- 動保政策宣導合作

**初期策略**：
- 以民間力量為主導
- 建立成功案例與信譽
- 逐步建立官方合作關係

### 8. 預算與時程 (Budget & Timeline)

#### 開發成本估算
**主要費用項目**：
- 雲端主機與資料庫服務
- 第三方 API 使用費用
- AI 開發平台訂閱
- 網域與 SSL 憑證
- 設計工具與開發軟體

**成本控制策略**：
- 善用各服務商免費額度
- 初期成本預估極低
- 隨用戶增長彈性擴展

#### 開發時程規劃
**6 個月完整開發週期**：

**第 1 個月**：設計階段
- UI/UX 設計定稿
- 品牌視覺系統建立
- 原型設計與用戶測試

**第 2-4 個月**：開發階段
- MVP 核心功能開發
- 前後端 API 整合
- 資料庫架構建置
- 第三方服務整合

**第 5 個月**：測試階段
- 內部功能測試
- 用戶體驗優化
- 效能調校與安全檢測
- Bug 修復與改進

**第 6 個月**：上線階段
- 正式發布上線
- 用戶回饋收集
- 數據監控與分析
- 持續優化改進

#### 團隊配置
**AI 輔助開發模式**：
- **產品經理**：您（需求規劃與決策）
- **設計師**：您 + AI 設計工具
- **前端開發**：您 + AI 編程助手
- **後端開發**：您 + AI 編程助手
- **測試工程師**：您 + 自動化測試工具

**AI 工具最大化利用**：
- 程式碼生成與優化
- 設計素材創建
- 測試案例生成
- 文件撰寫輔助
- 問題診斷與解決

---

## 專案里程碑

### Phase 1: MVP 基礎版 (Month 1-6)
- ✅ 完成 PRD 產品需求文件
- 🎯 UI/UX 設計系統建立
- 🎯 核心功能開發完成
- 🎯 測試與優化
- 🎯 正式上線發布

### Phase 2: 功能擴展版 (Month 7-12)
- 🔄 用戶回饋收集與分析
- 🔄 AI 智能配對系統
- 🔄 動物醫院地圖整合
- 🔄 推播通知系統
- 🔄 社群功能強化

### Phase 3: 商業化版 (Month 13-18)
- 💰 B2B 合作夥伴開發
- 💰 增值服務功能上線
- 💰 數據分析與優化
- 💰 營收模式驗證
- 💰 規模化營運準備

---

## 成功指標 (KPIs)

### 用戶成長指標
- 註冊用戶數
- 月活躍用戶數 (MAU)
- 用戶留存率
- 推薦分享率

### 功能使用指標
- 協尋案件發布數
- 拾獲通報數量
- 成功配對案例
- 平均回應時間

### 社會影響指標
- 寵物成功尋回率
- 社群互助案例
- 媒體報導與認知度
- 合作夥伴數量

這份完整的 PRD 文件現在已經包含了所有必要的規劃細節，為「呼嚕」寵物協尋平台的開發提供了清晰的藍圖和執行指南。