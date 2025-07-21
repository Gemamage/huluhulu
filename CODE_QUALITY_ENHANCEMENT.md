# 代碼品質與可維護性提升建議

## 🚨 緊急問題：代碼文件過長

### 超過 600 行的文件需要立即重構：

**前端文件：**
- `lost-pet-form.tsx`: 608 行 ⚠️

**後端文件：**
- `notificationService.ts`: 607 行 ⚠️
- `petSearchService.ts`: 631 行 ⚠️
- `reportService.ts`: 610 行 ⚠️
- `userService.ts`: 631 行 ⚠️
- `smartNotificationService.ts`: 666 行 ⚠️

## 📋 代碼重構計劃

### 1. 前端組件重構

#### `lost-pet-form.tsx` 重構建議：

**問題分析：**
- 單一組件承擔過多責任
- 表單邏輯、驗證邏輯、UI 渲染混合在一起
- 代碼可讀性和維護性差

**重構方案：**

```
📁 components/pets/lost-pet-form/
├── index.tsx                    # 主組件 (150-200 行)
├── hooks/
│   ├── useLostPetForm.ts       # 表單狀態管理 (100-150 行)
│   └── useLostPetValidation.ts # 驗證邏輯 (80-120 行)
├── components/
│   ├── BasicInfoSection.tsx    # 基本資訊區塊 (100-150 行)
│   ├── AppearanceSection.tsx   # 外觀特徵區塊 (100-150 行)
│   ├── LocationSection.tsx     # 位置資訊區塊 (80-120 行)
│   ├── ContactSection.tsx      # 聯絡資訊區塊 (80-120 行)
│   └── AdditionalSection.tsx   # 其他資訊區塊 (100-150 行)
├── constants/
│   └── formOptions.ts          # 表單選項常數 (50-80 行)
└── types/
    └── index.ts                # 類型定義 (50-80 行)
```

### 2. 後端服務重構

#### `smartNotificationService.ts` (666 行) 重構建議：

**重構方案：**

```
📁 services/notifications/
├── smartNotificationService.ts     # 主服務 (150-200 行)
├── strategies/
│   ├── LocationBasedStrategy.ts    # 位置匹配策略 (100-150 行)
│   ├── TimeBasedStrategy.ts        # 時間匹配策略 (100-150 行)
│   ├── FeatureBasedStrategy.ts     # 特徵匹配策略 (100-150 行)
│   └── PriorityStrategy.ts         # 優先級策略 (80-120 行)
├── processors/
│   ├── NotificationProcessor.ts    # 通知處理器 (100-150 行)
│   └── MatchProcessor.ts           # 匹配處理器 (100-150 行)
└── utils/
    ├── notificationUtils.ts        # 工具函數 (80-120 行)
    └── matchingUtils.ts            # 匹配工具 (80-120 行)
```

#### `userService.ts` (631 行) 重構建議：

**重構方案：**

```
📁 services/user/
├── userService.ts                  # 主服務 (150-200 行)
├── auth/
│   ├── authService.ts              # 認證服務 (150-200 行)
│   └── tokenService.ts             # Token 管理 (100-150 行)
├── profile/
│   ├── profileService.ts           # 個人資料服務 (150-200 行)
│   └── preferencesService.ts       # 偏好設定服務 (100-150 行)
└── validation/
    ├── userValidation.ts           # 用戶驗證 (100-150 行)
    └── passwordValidation.ts       # 密碼驗證 (80-120 行)
```

## 🏗️ 架構改進建議

### 1. 採用設計模式

#### Strategy Pattern (策略模式)
```typescript
// 用於通知策略
interface NotificationStrategy {
  execute(context: NotificationContext): Promise<NotificationResult>;
}

class LocationBasedStrategy implements NotificationStrategy {
  async execute(context: NotificationContext): Promise<NotificationResult> {
    // 位置匹配邏輯
  }
}
```

#### Factory Pattern (工廠模式)
```typescript
// 用於創建不同類型的服務
class ServiceFactory {
  static createNotificationService(type: string): NotificationService {
    switch (type) {
      case 'email': return new EmailNotificationService();
      case 'sms': return new SMSNotificationService();
      case 'push': return new PushNotificationService();
      default: throw new Error('Unknown service type');
    }
  }
}
```

#### Repository Pattern (倉庫模式)
```typescript
// 統一數據訪問層
interface PetRepository {
  findById(id: string): Promise<Pet | null>;
  findByFilters(filters: PetFilters): Promise<Pet[]>;
  create(pet: CreatePetDto): Promise<Pet>;
  update(id: string, updates: UpdatePetDto): Promise<Pet>;
  delete(id: string): Promise<void>;
}
```

### 2. 自定義 Hooks 優化

#### 創建可重用的 Hooks
```typescript
// hooks/useFormValidation.ts
export function useFormValidation<T>(validationSchema: ValidationSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: T) => {
    // 驗證邏輯
  }, [validationSchema]);
  
  return { errors, validate, clearErrors };
}

// hooks/useApiMutation.ts
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async (variables: TVariables) => {
    // 異步操作邏輯
  }, [mutationFn]);
  
  return { mutate, isLoading, error };
}
```

### 3. 類型安全改進

#### 嚴格的 TypeScript 配置
```json
// tsconfig.json 建議配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 使用 Branded Types
```typescript
// 防止類型混淆
type UserId = string & { readonly brand: unique symbol };
type PetId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}
```

## 🧪 測試覆蓋率提升

### 1. 單元測試目標
- **目標覆蓋率：85%+**
- **關鍵服務：90%+**
- **工具函數：95%+**

### 2. 測試策略

#### 組件測試
```typescript
// __tests__/components/LostPetForm.test.tsx
describe('LostPetForm', () => {
  it('should validate required fields', () => {
    // 測試必填欄位驗證
  });
  
  it('should submit form with valid data', () => {
    // 測試表單提交
  });
  
  it('should handle image upload', () => {
    // 測試圖片上傳
  });
});
```

#### 服務測試
```typescript
// __tests__/services/notificationService.test.ts
describe('NotificationService', () => {
  beforeEach(() => {
    // 設置測試環境
  });
  
  it('should send notification successfully', async () => {
    // 測試通知發送
  });
  
  it('should handle notification failures', async () => {
    // 測試錯誤處理
  });
});
```

## 🚀 性能優化建議

### 1. 前端優化

#### React 優化
```typescript
// 使用 React.memo 防止不必要的重渲染
const PetCard = React.memo(({ pet }: { pet: Pet }) => {
  return (
    <div>{/* 組件內容 */}</div>
  );
});

// 使用 useMemo 緩存計算結果
const filteredPets = useMemo(() => {
  return pets.filter(pet => pet.status === 'lost');
}, [pets]);

// 使用 useCallback 緩存函數
const handleSubmit = useCallback((data: FormData) => {
  // 提交邏輯
}, []);
```

#### 圖片優化
```typescript
// 使用 Next.js Image 組件
import Image from 'next/image';

<Image
  src={pet.imageUrl}
  alt={pet.name}
  width={300}
  height={200}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  priority={index < 3} // 前三張圖片優先載入
/>
```

### 2. 後端優化

#### 數據庫查詢優化
```typescript
// 使用索引和聚合查詢
const pets = await Pet.aggregate([
  { $match: { status: 'lost' } },
  { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'owner' } },
  { $project: { name: 1, type: 1, 'owner.name': 1 } },
  { $limit: 20 }
]);

// 使用緩存
const cacheKey = `pets:${filters.type}:${filters.location}`;
let pets = await cacheService.get(cacheKey);
if (!pets) {
  pets = await petService.findByFilters(filters);
  await cacheService.set(cacheKey, pets, 300); // 5分鐘緩存
}
```

## 🔒 安全性改進

### 1. 輸入驗證
```typescript
// 使用 Joi 或 Zod 進行嚴格驗證
import { z } from 'zod';

const PetSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  description: z.string().max(1000),
  images: z.array(z.string().url()).max(5)
});
```

### 2. API 安全
```typescript
// 實施速率限制
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100 // 限制每個IP 100次請求
}));

// 輸入清理
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
```

## 📊 監控和日誌

### 1. 錯誤追蹤
```typescript
// 使用結構化日誌
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. 性能監控
```typescript
// API 響應時間監控
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration
    });
  });
  next();
});
```

## 📅 實施時程建議

### 第一週：緊急重構
- [ ] 重構 `lost-pet-form.tsx`
- [ ] 重構 `smartNotificationService.ts`
- [ ] 建立基本的測試框架

### 第二週：服務層重構
- [ ] 重構 `userService.ts`
- [ ] 重構 `petSearchService.ts`
- [ ] 重構 `reportService.ts`
- [ ] 實施 Repository Pattern

### 第三週：優化和測試
- [ ] 實施性能優化
- [ ] 增加測試覆蓋率到 80%+
- [ ] 實施監控和日誌

### 第四週：安全性和文檔
- [ ] 安全性審查和改進
- [ ] 完善 API 文檔
- [ ] 代碼審查和最終優化

## 🎯 成功指標

- ✅ 所有文件都在 600 行以內
- ✅ 測試覆蓋率達到 85%+
- ✅ API 響應時間 < 200ms (95th percentile)
- ✅ 零安全漏洞
- ✅ 代碼重複率 < 5%
- ✅ 技術債務評分 A 級

---

**注意：** 這是一個漸進式的改進計劃。建議按優先級逐步實施，確保每個階段都有充分的測試和驗證。記得在每次重大重構後進行 Git 版本提交！