import { z } from "zod";
import { emailSchema, nameSchema } from "./auth";

// 寵物相關驗證架構
export const petSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "寵物名稱為必填項目")
    .max(50, "寵物名稱不能超過 50 個字符"),
  type: z.enum(["dog", "cat", "bird", "rabbit", "other"], {
    errorMap: () => ({ message: "請選擇有效的寵物類型" }),
  }),
  breed: z.string().trim().max(50, "品種名稱不能超過 50 個字符").optional(),
  gender: z.enum(["male", "female", "unknown"], {
    errorMap: () => ({ message: "請選擇有效的性別" }),
  }),
  age: z
    .number()
    .int()
    .min(0, "年齡不能為負數")
    .max(50, "年齡不能超過 50 歲")
    .optional(),
  color: z.string().trim().max(100, "顏色描述不能超過 100 個字符").optional(),
  size: z.enum(["small", "medium", "large"], {
    errorMap: () => ({ message: "請選擇有效的體型" }),
  }),
  status: z.enum(["lost", "found", "reunited"], {
    errorMap: () => ({ message: "請選擇有效的狀態" }),
  }),
  description: z
    .string()
    .trim()
    .min(1, "描述為必填項目")
    .max(1000, "描述不能超過 1000 個字符"),
  lastSeenLocation: z
    .string()
    .trim()
    .min(1, "最後出現地點為必填項目")
    .max(200, "地點描述不能超過 200 個字符"),
  lastSeenDate: z.string().datetime("請提供有效的日期時間格式"),
  contactInfo: z.object({
    name: nameSchema,
    phone: z.string().regex(/^[+]?[0-9\s\-()]+$/, "請提供有效的電話號碼"),
    email: emailSchema,
  }),
  images: z.array(z.string()).max(5, "最多只能上傳 5 張圖片").default([]),
  reward: z.number().min(0, "獎勵金額不能為負數").optional(),
  isUrgent: z.boolean().default(false),
  microchipId: z
    .string()
    .trim()
    .max(50, "晶片 ID 不能超過 50 個字符")
    .optional(),
  vaccinations: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  specialMarks: z
    .string()
    .trim()
    .max(500, "特殊標記描述不能超過 500 個字符")
    .optional(),
  personality: z.array(z.string()).optional(),
});

// 寵物更新驗證架構
export const petUpdateSchema = petSchema.partial().omit({ status: true });

// 寵物 ID 參數驗證架構
export const petIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "請提供有效的寵物 ID"),
});

// 類型導出
export type PetData = z.infer<typeof petSchema>;
export type PetUpdateData = z.infer<typeof petUpdateSchema>;
export type PetIdParams = z.infer<typeof petIdParamsSchema>;
