import { z } from "zod";

// 預簽名 URL schema
export const presignedUrlSchema = z.object({
  fileName: z.string().min(1, "文件名不能為空"),
  mimeType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|webp|gif)$/, "不支援的文件類型"),
  type: z.enum(["avatar", "pet"]).default("pet"),
});

// 搜尋歷史查詢參數 schema
export const searchHistoryQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

// 導出類型
export type PresignedUrlRequest = z.infer<typeof presignedUrlSchema>;
export type SearchHistoryQueryRequest = z.infer<
  typeof searchHistoryQuerySchema
>;
