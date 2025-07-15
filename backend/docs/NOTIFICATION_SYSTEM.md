# 通知系統文件

## 概述

呼嚕寵物協尋網站的通知系統提供多種通知方式，包括推播通知、電子郵件和即時通知。系統支援用戶自訂通知偏好，並提供完整的通知管理功能。

## 功能特色

### 通知類型
- **寵物被找到** - 當用戶發布的走失寵物被其他用戶標記為找到時
- **新走失寵物** - 當附近有新的走失寵物時（基於地理位置）
- **收到訊息** - 當用戶收到私人訊息時
- **寵物狀態更新** - 當寵物的狀態發生變化時
- **系統公告** - 重要的系統通知和公告
- **帳戶安全** - 登入、密碼變更等安全相關通知

### 通知渠道
- **推播通知** - 透過 Firebase Cloud Messaging (FCM) 發送
- **電子郵件** - 透過 SendGrid 發送
- **即時通知** - 透過 Socket.IO 即時推送

### 用戶偏好設定
- 每種通知類型可獨立設定接收渠道
- 全域推播和郵件開關
- 勿擾時段設定
- 通知頻率控制
- 多設備 Token 管理

## 系統架構

### 核心組件

1. **NotificationService** - 通知服務核心
   - 統一的通知發送介面
   - 批次發送功能
   - 排程任務管理
   - 通知狀態追蹤

2. **FirebaseService** - 推播通知服務
   - FCM 推播發送
   - 設備 Token 管理
   - 通知優先級設定

3. **SocketService** - 即時通知服務
   - WebSocket 連接管理
   - 即時通知推送
   - 用戶在線狀態追蹤

4. **EmailService** - 郵件通知服務
   - SendGrid 郵件發送
   - 郵件模板管理
   - 發送狀態追蹤

### 資料模型

1. **Notification** - 通知記錄
   ```typescript
   {
     userId: ObjectId,
     type: NotificationType,
     title: string,
     message: string,
     data: any,
     channels: NotificationChannel[],
     status: NotificationStatus,
     priority: NotificationPriority,
     scheduledAt?: Date,
     sentAt?: Date,
     readAt?: Date,
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **NotificationPreference** - 用戶通知偏好
   ```typescript
   {
     userId: ObjectId,
     preferences: {
       [NotificationType]: {
         push: boolean,
         email: boolean,
         inApp: boolean
       }
     },
     globalSettings: {
       pushEnabled: boolean,
       emailEnabled: boolean,
       quietHours: { start: string, end: string },
       frequency: 'immediate' | 'hourly' | 'daily'
     },
     deviceTokens: DeviceToken[]
   }
   ```

## 設定指南

### 環境變數設定

在 `.env` 文件中添加以下設定：

```env
# Firebase 設定 (推播通知)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/firebase-service-account-key.json

# SendGrid 設定 (郵件服務)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourpetfinder.com

# 通知系統設定
NOTIFICATION_CLEANUP_INTERVAL_HOURS=24
NOTIFICATION_RETENTION_DAYS=30
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY_MS=5000
```

### Firebase 設定

1. 在 [Firebase Console](https://console.firebase.google.com/) 創建專案
2. 啟用 Cloud Messaging
3. 生成服務帳戶金鑰
4. 下載 JSON 金鑰文件並設定路徑

### SendGrid 設定

1. 註冊 [SendGrid](https://sendgrid.com/) 帳戶
2. 創建 API 金鑰
3. 驗證發送者身份
4. 設定 API 金鑰和發送郵箱

### 資料庫初始化

執行初始化腳本來創建必要的索引：

```bash
npm run notifications:init
```

## API 使用指南

### 發送通知

```typescript
// 發送單一通知
POST /api/notifications/send
{
  "userId": "user_id",
  "type": "PET_FOUND",
  "title": "好消息！您的寵物被找到了",
  "message": "有人在附近發現了您的寵物",
  "data": { "petId": "pet_id" },
  "channels": ["push", "email", "inApp"]
}

// 批次發送通知
POST /api/notifications/batch
{
  "notifications": [
    {
      "userId": "user1",
      "type": "NEW_LOST_PET",
      "title": "附近有新的走失寵物",
      "message": "請幫忙留意"
    }
  ]
}
```

### 獲取通知列表

```typescript
GET /api/notifications?page=1&limit=20&status=unread&type=PET_FOUND
```

### 標記通知為已讀

```typescript
PATCH /api/notifications/:id/read
```

### 管理通知偏好

```typescript
// 獲取偏好設定
GET /api/notifications/preferences

// 更新偏好設定
PUT /api/notifications/preferences
{
  "preferences": {
    "PET_FOUND": {
      "push": true,
      "email": true,
      "inApp": true
    }
  },
  "globalSettings": {
    "pushEnabled": true,
    "emailEnabled": true,
    "quietHours": {
      "start": "22:00",
      "end": "08:00"
    }
  }
}
```

### 設備 Token 管理

```typescript
// 添加設備 Token
POST /api/notifications/device-token
{
  "token": "fcm_device_token",
  "platform": "android"
}

// 移除設備 Token
DELETE /api/notifications/device-token/:token
```

## Socket.IO 事件

### 客戶端監聽事件

```typescript
// 接收即時通知
socket.on('notification', (notification) => {
  console.log('收到通知:', notification);
});

// 寵物狀態更新
socket.on('pet:status_update', (data) => {
  console.log('寵物狀態更新:', data);
});

// 系統公告
socket.on('system:announcement', (announcement) => {
  console.log('系統公告:', announcement);
});
```

### 客戶端發送事件

```typescript
// 標記通知為已讀
socket.emit('notification:read', { notificationId: 'id' });

// 確認通知送達
socket.emit('notification:delivered', { notificationId: 'id' });
```

## 維護和監控

### 定期清理

系統會自動執行以下清理任務：

1. **過期通知清理** - 清理超過保留期限的已讀通知
2. **無效 Token 清理** - 移除失效的設備 Token
3. **連接清理** - 清理非活躍的 Socket 連接

手動執行清理：

```bash
# 清理過期通知
npm run notifications:cleanup

# 清理無效設備 Token
npm run notifications:cleanup-tokens
```

### 監控指標

系統提供以下監控端點：

```typescript
// 獲取通知統計
GET /api/notifications/stats
{
  "totalNotifications": 1000,
  "unreadCount": 50,
  "byType": {
    "PET_FOUND": 200,
    "NEW_LOST_PET": 300
  },
  "byStatus": {
    "sent": 800,
    "pending": 100,
    "failed": 50
  }
}
```

### 錯誤處理

系統包含完整的錯誤處理機制：

1. **重試機制** - 失敗的通知會自動重試
2. **降級策略** - 當某個渠道失敗時，會嘗試其他渠道
3. **錯誤日誌** - 詳細記錄所有錯誤信息
4. **狀態追蹤** - 追蹤每個通知的發送狀態

## 最佳實踐

### 性能優化

1. **批次發送** - 使用批次 API 發送大量通知
2. **索引優化** - 確保資料庫索引正確設定
3. **連接池** - 合理設定資料庫連接池大小
4. **快取策略** - 快取用戶偏好設定

### 安全考量

1. **權限驗證** - 確保用戶只能管理自己的通知
2. **速率限制** - 防止通知濫發
3. **資料驗證** - 嚴格驗證輸入資料
4. **敏感資料** - 避免在通知中包含敏感信息

### 用戶體驗

1. **個人化設定** - 提供豐富的偏好設定選項
2. **即時反饋** - 提供通知狀態的即時反饋
3. **優雅降級** - 當某些功能不可用時提供替代方案
4. **清晰分類** - 合理分類不同類型的通知

## 故障排除

### 常見問題

1. **推播通知無法發送**
   - 檢查 Firebase 設定
   - 驗證設備 Token 有效性
   - 確認 FCM 服務狀態

2. **郵件通知失敗**
   - 檢查 SendGrid API 金鑰
   - 驗證發送者郵箱
   - 檢查郵件模板格式

3. **即時通知不工作**
   - 檢查 Socket.IO 連接
   - 驗證 JWT Token
   - 確認客戶端事件監聽

### 日誌分析

系統會記錄詳細的操作日誌，包括：

- 通知發送記錄
- 錯誤和異常信息
- 性能指標
- 用戶操作記錄

查看日誌：

```bash
# 查看通知相關日誌
grep "notification" logs/app.log

# 查看錯誤日誌
grep "ERROR" logs/app.log | grep "notification"
```

## 版本更新

### v1.0.0 (當前版本)
- 基礎通知系統
- 多渠道支援
- 用戶偏好管理
- 即時通知功能

### 未來規劃
- 通知模板系統
- A/B 測試支援
- 更多第三方服務整合
- 高級分析功能