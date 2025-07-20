# Netlify 建置問題修復指南

## 問題診斷

根據 Netlify 建置失敗的診斷報告，主要問題包括：

1. **Node.js 版本不匹配**：期望版本 9，但實際使用 18.20.8
2. **npm 版本不匹配**：期望版本 9，但實際使用 10.8.2
3. **自訂建置路徑**：需要確認 `frontend` 路徑正確
4. **缺少建置快取配置**

## 修復措施

### 1. 更新 Netlify 配置 (`netlify.toml`)

```toml
[build]
  base = "frontend"
  command = "npm ci && npm run build:netlify"
  publish = "out"

[build.environment]
  NODE_VERSION = "18.20.8"
  NPM_VERSION = "10"
  NETLIFY_NEXT_PLUGIN_SKIP = "false"
  NEXT_TELEMETRY_DISABLED = "1"
```

### 2. 配置 Next.js 靜態導出 (`frontend/next.config.js`)

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // ... 其他配置
};
```

### 3. 添加 Node.js 版本檔案 (`.nvmrc`)

```
18.20.8
```

### 4. 優化建置腳本 (`frontend/package.json`)

```json
{
  "scripts": {
    "build:netlify": "npm run type-check && next build",
    "clean": "rm -rf .next out"
  }
}
```

### 5. 環境變數設定

在 Netlify 控制台中設定以下環境變數：

#### 必要變數
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

#### API 相關（根據需要設定）
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com/api`

#### 第三方服務（根據需要設定）
- `NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key`

## 部署步驟

1. **推送代碼**：所有修改已推送到 GitHub
2. **觸發重新部署**：在 Netlify 控制台點擊 "Deploy site"
3. **監控建置**：查看建置日誌確認問題已解決
4. **設定環境變數**：在 Netlify 控制台的 Site settings > Environment variables 中添加必要變數

## 預期結果

- ✅ Node.js 版本匹配（18.20.8）
- ✅ npm 版本匹配（10.x）
- ✅ 建置路徑正確（frontend）
- ✅ 靜態導出成功
- ✅ 建置快取啟用

## 故障排除

如果仍有問題，請檢查：

1. **環境變數**：確保所有必要的環境變數都已在 Netlify 控制台中設定
2. **依賴版本**：檢查 `package.json` 中的依賴版本是否相容
3. **建置日誌**：查看詳細的建置錯誤信息
4. **靜態資源**：確認所有靜態資源路徑正確

## 聯絡支援

如果問題持續存在，請提供：
- Netlify 建置日誌
- `package.json` 內容
- 環境變數列表（隱藏敏感信息）