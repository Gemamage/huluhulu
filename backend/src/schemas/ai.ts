import { z } from "zod";

// AI 圖像優化 schema
export const imageOptimizeSchema = z.object({
  maxWidth: z.number().min(100).max(2000).optional(),
  maxHeight: z.number().min(100).max(2000).optional(),
  quality: z.number().min(10).max(100).optional(),
  format: z.enum(["jpeg", "png", "webp"]).optional(),
});

// AI 圖像裁剪 schema
export const imageCropSchema = z.object({
  x: z.coerce.number().min(0),
  y: z.coerce.number().min(0),
  width: z.coerce.number().min(1),
  height: z.coerce.number().min(1),
});

// AI 相似度搜尋 schema
export const similaritySearchSchema = z.object({
  petId: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(50).default(10),
});

// 導出類型
export type ImageOptimizeRequest = z.infer<typeof imageOptimizeSchema>;
export type ImageCropRequest = z.infer<typeof imageCropSchema>;
export type SimilaritySearchRequest = z.infer<typeof similaritySearchSchema>;
