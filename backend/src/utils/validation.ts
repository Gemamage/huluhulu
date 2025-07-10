import { z } from 'zod';

// 基礎驗證規則
export const emailSchema = z.string().email('請提供有效的電子郵件地址');
export const passwordSchema = z.string().min(6, '密碼長度至少需要 6 個字符');
export const phoneSchema = z.string().regex(/^[+]?[0-9\s\-()]+$/, '請提供有效的電話號碼').optional();
export const nameSchema = z.string().trim().min(1, '姓名為必填項目').max(50, '姓名長度不能超過 50 個字符');

// 用戶相關驗證架構
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密碼為必填項目'),
});

export const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url('請提供有效的圖片 URL').optional(),
}).partial();

export const passwordResetSchema = z.object({
  token: z.string().min(1, '請提供重設令牌'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// 寵物相關驗證架構
export const petSchema = z.object({
  name: z.string().trim().min(1, '寵物名稱為必填項目').max(50, '寵物名稱不能超過 50 個字符'),
  type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other'], {
    errorMap: () => ({ message: '請選擇有效的寵物類型' }),
  }),
  breed: z.string().trim().max(50, '品種名稱不能超過 50 個字符').optional(),
  gender: z.enum(['male', 'female', 'unknown'], {
    errorMap: () => ({ message: '請選擇有效的性別' }),
  }),
  age: z.number().int().min(0, '年齡不能為負數').max(50, '年齡不能超過 50 歲').optional(),
  color: z.string().trim().max(100, '顏色描述不能超過 100 個字符').optional(),
  size: z.enum(['small', 'medium', 'large'], {
    errorMap: () => ({ message: '請選擇有效的體型' }),
  }),
  status: z.enum(['lost', 'found', 'reunited'], {
    errorMap: () => ({ message: '請選擇有效的狀態' }),
  }),
  description: z.string().trim().min(1, '描述為必填項目').max(1000, '描述不能超過 1000 個字符'),
  lastSeenLocation: z.string().trim().min(1, '最後出現地點為必填項目').max(200, '地點描述不能超過 200 個字符'),
  lastSeenDate: z.string().datetime('請提供有效的日期時間格式'),
  contactInfo: z.object({
    name: nameSchema,
    phone: z.string().regex(/^[+]?[0-9\s\-()]+$/, '請提供有效的電話號碼'),
    email: emailSchema,
  }),
  images: z.array(z.string()).max(5, '最多只能上傳 5 張圖片').default([]),
  reward: z.number().min(0, '獎勵金額不能為負數').optional(),
  isUrgent: z.boolean().default(false),
  microchipId: z.string().trim().max(50, '晶片 ID 不能超過 50 個字符').optional(),
  vaccinations: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  specialMarks: z.string().trim().max(500, '特殊標記描述不能超過 500 個字符').optional(),
  personality: z.array(z.string()).optional(),
});

export const petUpdateSchema = petSchema.partial().omit({ status: true });

// 搜尋相關驗證架構
export const petSearchSchema = z.object({
  type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).optional(),
  status: z.enum(['lost', 'found', 'reunited']).optional(),
  location: z.string().trim().optional(),
  radius: z.string().transform(val => val ? Number(val) : undefined).pipe(z.number().min(1).max(100, '搜尋半徑不能超過 100 公里')).optional(),
  page: z.string().transform(val => val ? Number(val) : 1).pipe(z.number().int().min(1, '頁碼必須大於 0')).default('1'),
  limit: z.string().transform(val => val ? Number(val) : 10).pipe(z.number().int().min(1).max(50, '每頁數量不能超過 50')).default('10'),
  sortBy: z.enum(['createdAt', 'lastSeenDate', 'reward']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
  breed: z.string().trim().optional(),
});

// 隱私設定驗證架構
export const privacySettingsSchema = z.object({
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(true),
  allowDirectContact: z.boolean().default(true),
  showFullName: z.boolean().default(false),
  profileVisibility: z.enum(['public', 'registered', 'private']).default('registered'),
  emailNotifications: z.object({
    newMatches: z.boolean().default(true),
    messages: z.boolean().default(true),
    updates: z.boolean().default(false),
    marketing: z.boolean().default(false),
  }).default({}),
  smsNotifications: z.object({
    urgentAlerts: z.boolean().default(true),
    matches: z.boolean().default(false),
  }).default({}),
});

// 驗證中介軟體輔助函數
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: '輸入資料驗證失敗',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// 查詢參數驗證中介軟體
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.validatedQuery = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: '查詢參數驗證失敗',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// 類型導出
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type PetData = z.infer<typeof petSchema>;
export type PetUpdateData = z.infer<typeof petUpdateSchema>;
export type PetSearchQuery = z.infer<typeof petSearchSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;