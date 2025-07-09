# 呼嚕寵物協尋網站 - 開發指南

## 📋 目錄

- [快速開始](#快速開始)
- [開發環境設置](#開發環境設置)
- [專案結構](#專案結構)
- [開發工作流程](#開發工作流程)
- [程式碼規範](#程式碼規範)
- [測試指南](#測試指南)
- [部署指南](#部署指南)
- [常見問題](#常見問題)
- [貢獻指南](#貢獻指南)

## 🚀 快速開始

### 系統需求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Docker**: >= 20.0.0
- **Docker Compose**: >= 2.0.0
- **Git**: >= 2.30.0

### 一鍵啟動

```bash
# 克隆專案
git clone <repository-url>
cd pet-finder-app

# 啟動開發環境
./scripts/dev-setup.sh
```

### 手動設置

```bash
# 1. 複製環境變數檔案
cp .env.example backend/.env
cp .env.example frontend/.env.local

# 2. 安裝依賴
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. 啟動資料庫
docker-compose up -d mongodb redis

# 4. 啟動後端服務
cd backend && npm run dev &

# 5. 啟動前端服務
cd frontend && npm run dev &
```

## 🛠️ 開發環境設置

### 環境變數設置

#### 後端環境變數 (`backend/.env`)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pet-finder-dev
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### 前端環境變數 (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### IDE 設置

#### VS Code 推薦擴充功能

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker"
  ]
}
```

#### VS Code 設定 (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 📁 專案結構

```
pet-finder-app/
├── frontend/                 # Next.js 前端應用
│   ├── src/
│   │   ├── app/             # App Router 頁面
│   │   ├── components/      # React 組件
│   │   ├── hooks/           # 自定義 Hooks
│   │   ├── lib/             # 工具函數
│   │   ├── store/           # Zustand 狀態管理
│   │   └── types/           # TypeScript 型別定義
│   ├── public/              # 靜態資源
│   └── package.json
├── backend/                  # Node.js 後端 API
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 資料模型
│   │   ├── routes/          # 路由定義
│   │   ├── middleware/      # 中介軟體
│   │   ├── services/        # 業務邏輯
│   │   ├── utils/           # 工具函數
│   │   └── types/           # TypeScript 型別定義
│   └── package.json
├── shared/                   # 共用型別和工具
│   └── types/
├── scripts/                  # 開發腳本
├── .github/                  # GitHub Actions
└── docker-compose.yml        # Docker 設定
```

## 🔄 開發工作流程

### Git 工作流程

1. **建立功能分支**
   ```bash
   git checkout -b feature/協尋貼文功能
   ```

2. **開發功能**
   - 遵循程式碼規範
   - 撰寫測試
   - 提交有意義的 commit 訊息

3. **提交變更**
   ```bash
   git add .
   git commit -m "feat: 新增協尋貼文建立功能"
   ```

4. **推送並建立 PR**
   ```bash
   git push origin feature/協尋貼文功能
   ```

### Commit 訊息規範

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**類型 (type):**
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置或輔助工具變動

**範例:**
```
feat(auth): 新增使用者註冊功能

- 實作註冊表單驗證
- 新增郵件驗證機制
- 整合 JWT 認證

Closes #123
```

## 📝 程式碼規範

### TypeScript 規範

- 使用嚴格模式 (`strict: true`)
- 明確定義型別，避免使用 `any`
- 使用 Interface 定義物件結構
- 使用 Enum 定義常數

```typescript
// ✅ 好的範例
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// ❌ 避免的範例
const user: any = { /* ... */ };
```

### React 組件規範

- 使用函數式組件和 Hooks
- 組件名稱使用 PascalCase
- Props 使用 Interface 定義
- 使用 TypeScript 泛型提高重用性

```typescript
// ✅ 好的範例
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size, 
  onClick, 
  children 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### CSS/Tailwind 規範

- 優先使用 Tailwind CSS 類別
- 自定義樣式放在 `globals.css`
- 使用語意化的類別名稱
- 響應式設計優先

```tsx
// ✅ 好的範例
<div className="
  flex flex-col gap-4 
  p-6 
  bg-white rounded-lg shadow-md
  md:flex-row md:gap-6
  dark:bg-gray-800
">
  {/* 內容 */}
</div>
```

### API 設計規範

- 使用 RESTful API 設計
- 統一的回應格式
- 適當的 HTTP 狀態碼
- API 版本控制

```typescript
// ✅ 統一的 API 回應格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ✅ RESTful 路由設計
// GET    /api/v1/posts          - 取得協尋貼文列表
// GET    /api/v1/posts/:id      - 取得特定協尋貼文
// POST   /api/v1/posts          - 建立協尋貼文
// PUT    /api/v1/posts/:id      - 更新協尋貼文
// DELETE /api/v1/posts/:id      - 刪除協尋貼文
```

## 🧪 測試指南

### 測試策略

- **單元測試**: 測試個別函數和組件
- **整合測試**: 測試 API 端點和資料庫互動
- **E2E 測試**: 測試完整的使用者流程

### 前端測試

```bash
# 執行所有測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 監視模式
npm run test:watch
```

### 後端測試

```bash
# 執行單元測試
npm run test

# 執行整合測試
npm run test:e2e

# 執行所有測試
npm run test:all
```

### 測試範例

```typescript
// 前端組件測試
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// 後端 API 測試
import request from 'supertest';
import app from '../app';

describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const postData = {
      title: '尋找走失的貓咪',
      description: '昨天在公園走失',
      petType: 'cat'
    };

    const response = await request(app)
      .post('/api/posts')
      .send(postData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(postData.title);
  });
});
```

## 🚀 部署指南

### 開發環境部署

```bash
# 使用 Docker Compose
docker-compose up -d
```

### 生產環境部署

1. **前端部署 (Vercel)**
   ```bash
   # 連接 Vercel
   npx vercel
   
   # 設定環境變數
   vercel env add NEXT_PUBLIC_API_URL
   ```

2. **後端部署 (AWS/Railway)**
   ```bash
   # 建置 Docker 映像
   docker build -t pet-finder-backend ./backend
   
   # 推送到容器註冊表
   docker push your-registry/pet-finder-backend
   ```

### CI/CD Pipeline

GitHub Actions 會自動執行：
- 程式碼品質檢查
- 測試執行
- 安全性掃描
- 自動部署

## ❓ 常見問題

### Q: 如何重設開發環境？

```bash
# 停止所有服務
./scripts/dev-stop.sh --clean-cache

# 清理 Docker 容器
docker-compose down -v

# 重新啟動
./scripts/dev-setup.sh
```

### Q: 如何新增新的 API 端點？

1. 在 `backend/src/routes/` 新增路由
2. 在 `backend/src/controllers/` 新增控制器
3. 在 `backend/src/models/` 新增資料模型（如需要）
4. 撰寫測試
5. 更新 API 文件

### Q: 如何新增新的前端頁面？

1. 在 `frontend/src/app/` 新增頁面檔案
2. 建立必要的組件
3. 新增路由（如需要）
4. 撰寫測試
5. 更新導航選單

### Q: 資料庫連接問題？

```bash
# 檢查 MongoDB 容器狀態
docker ps | grep mongodb

# 查看容器日誌
docker logs pet-finder-mongodb

# 重啟資料庫容器
docker-compose restart mongodb
```

## 🤝 貢獻指南

### 開發流程

1. Fork 專案
2. 建立功能分支
3. 開發功能並撰寫測試
4. 確保所有測試通過
5. 提交 Pull Request

### Pull Request 檢查清單

- [ ] 程式碼遵循專案規範
- [ ] 所有測試通過
- [ ] 新功能有對應的測試
- [ ] 文件已更新
- [ ] Commit 訊息符合規範
- [ ] 沒有合併衝突

### 程式碼審查標準

- 功能正確性
- 程式碼可讀性
- 效能考量
- 安全性檢查
- 測試覆蓋率

## 📚 相關資源

- [Next.js 文件](https://nextjs.org/docs)
- [Express.js 文件](https://expressjs.com/)
- [MongoDB 文件](https://docs.mongodb.com/)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [TypeScript 文件](https://www.typescriptlang.org/docs/)

## 📞 聯絡資訊

如有任何問題或建議，請：
- 建立 Issue
- 發送 Pull Request
- 聯絡專案維護者

---

**Happy Coding! 🐾**