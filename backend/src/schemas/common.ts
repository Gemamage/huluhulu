import { z } from "zod";

// 通用 ID 驗證架構
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "請提供有效的 ID");

// 分頁驗證架構
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => (val ? Number(val) : 1))
    .pipe(z.number().int().min(1, "頁碼必須大於 0"))
    .default("1"),
  limit: z
    .string()
    .transform((val) => (val ? Number(val) : 10))
    .pipe(z.number().int().min(1).max(100, "每頁數量不能超過 100"))
    .default("10"),
});

// 排序驗證架構
export const sortSchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 隱私設定驗證架構
export const privacySettingsSchema = z.object({
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(true),
  allowDirectContact: z.boolean().default(true),
  showFullName: z.boolean().default(false),
  profileVisibility: z
    .enum(["public", "registered", "private"])
    .default("registered"),
  emailNotifications: z
    .object({
      newMatches: z.boolean().default(true),
      messages: z.boolean().default(true),
      updates: z.boolean().default(false),
      marketing: z.boolean().default(false),
    })
    .default({}),
  smsNotifications: z
    .object({
      urgentAlerts: z.boolean().default(true),
      matches: z.boolean().default(false),
    })
    .default({}),
});

// 檔案上傳驗證架構
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional(),
  buffer: z.instanceof(Buffer).optional(),
});

// 聯絡資訊驗證架構
export const contactInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "姓名為必填項目")
    .max(50, "姓名長度不能超過 50 個字符"),
  phone: z.string().regex(/^[+]?[0-9\s\-()]+$/, "請提供有效的電話號碼"),
  email: z.string().email("請提供有效的電子郵件地址"),
  preferredContactMethod: z.enum(["email", "phone", "both"]).default("both"),
});

// 地理位置驗證架構
export const locationSchema = z.object({
  address: z
    .string()
    .trim()
    .min(1, "地址為必填項目")
    .max(200, "地址不能超過 200 個字符"),
  city: z
    .string()
    .trim()
    .min(1, "城市為必填項目")
    .max(50, "城市名稱不能超過 50 個字符"),
  state: z.string().trim().max(50, "州/省名稱不能超過 50 個字符").optional(),
  country: z
    .string()
    .trim()
    .min(1, "國家為必填項目")
    .max(50, "國家名稱不能超過 50 個字符"),
  zipCode: z.string().trim().max(20, "郵遞區號不能超過 20 個字符").optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90, "緯度必須在 -90 到 90 之間"),
      longitude: z.number().min(-180).max(180, "經度必須在 -180 到 180 之間"),
    })
    .optional(),
});

// 類型導出
export type MongoId = z.infer<typeof mongoIdSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type SortQuery = z.infer<typeof sortSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type Location = z.infer<typeof locationSchema>;
