import { z } from 'zod';

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

// AI 搜尋驗證架構
export const aiSearchSchema = z.object({
  description: z.string().trim().min(1, '描述為必填項目').max(500, '描述不能超過 500 個字符'),
  location: z.string().trim().optional(),
  type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).optional(),
  status: z.enum(['lost', 'found']).optional(),
});

// 搜尋歷史驗證架構
export const searchHistorySchema = z.object({
  query: z.string().trim().min(1, '搜尋查詢為必填項目').max(200, '搜尋查詢不能超過 200 個字符'),
  filters: z.object({
    type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).optional(),
    status: z.enum(['lost', 'found', 'reunited']).optional(),
    location: z.string().trim().optional(),
    radius: z.number().min(1).max(100).optional(),
  }).optional(),
  resultCount: z.number().int().min(0).optional(),
});

// 類型導出
export type PetSearchQuery = z.infer<typeof petSearchSchema>;
export type AiSearchQuery = z.infer<typeof aiSearchSchema>;
export type SearchHistoryData = z.infer<typeof searchHistorySchema>;