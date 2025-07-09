# 多階段建置 Dockerfile for Node.js Backend

# 基礎映像
FROM node:18-alpine AS base

# 安裝必要的系統套件
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴套件
RUN npm ci --only=production && npm cache clean --force

# 開發階段
FROM base AS development

# 安裝開發依賴
RUN npm ci && npm cache clean --force

# 複製原始碼
COPY . .

# 建立上傳目錄
RUN mkdir -p uploads && chown -R node:node uploads

# 切換到非 root 使用者
USER node

# 暴露連接埠
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 啟動開發伺服器
CMD ["dumb-init", "npm", "run", "dev"]

# 建置階段
FROM base AS build

# 安裝所有依賴（包含開發依賴）
RUN npm ci && npm cache clean --force

# 複製原始碼
COPY . .

# 建置應用程式
RUN npm run build

# 生產階段
FROM base AS production

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3001

# 從建置階段複製建置結果
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# 建立必要的目錄
RUN mkdir -p uploads logs && \
    chown -R node:node uploads logs

# 切換到非 root 使用者
USER node

# 暴露連接埠
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 啟動生產伺服器
CMD ["dumb-init", "node", "dist/server.js"]

# 測試階段
FROM development AS test

# 複製測試檔案
COPY --chown=node:node . .

# 執行測試
CMD ["npm", "test"]