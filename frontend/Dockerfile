# 多階段建置 Dockerfile for Next.js Frontend

# 基礎映像
FROM node:18-alpine AS base

# 安裝必要的系統套件
RUN apk add --no-cache \
    libc6-compat \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 依賴安裝階段
FROM base AS deps

# 安裝依賴套件
RUN npm ci && npm cache clean --force

# 開發階段
FROM base AS development

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules

# 複製原始碼
COPY . .

# 切換到非 root 使用者
USER node

# 暴露連接埠
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# 啟動開發伺服器
CMD ["dumb-init", "npm", "run", "dev"]

# 建置階段
FROM base AS builder

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules

# 複製原始碼
COPY . .

# 設定建置環境變數
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 建置應用程式
RUN npm run build

# 生產階段
FROM base AS production

# 設定環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 複製公共檔案
COPY --from=builder /app/public ./public

# 複製建置結果
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換到非 root 使用者
USER nextjs

# 暴露連接埠
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# 啟動生產伺服器
CMD ["dumb-init", "node", "server.js"]

# 測試階段
FROM development AS test

# 複製測試檔案
COPY --chown=node:node . .

# 執行測試
CMD ["npm", "test"]

# Storybook 階段
FROM development AS storybook

# 暴露 Storybook 連接埠
EXPOSE 6006

# 啟動 Storybook
CMD ["dumb-init", "npm", "run", "storybook"]