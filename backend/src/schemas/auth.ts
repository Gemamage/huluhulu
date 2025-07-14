import { z } from 'zod';

// 基礎驗證規則
export const emailSchema = z.string().email('請提供有效的電子郵件地址');
export const passwordSchema = z.string().min(6, '密碼長度至少需要 6 個字符');
export const phoneSchema = z.string().regex(/^[+]?[0-9\s\-()]+$/, '請提供有效的電話號碼').optional();
export const nameSchema = z.string().trim().min(1, '姓名為必填項目').max(50, '姓名長度不能超過 50 個字符');

// 用戶註冊驗證架構
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
});

// 用戶登入驗證架構
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密碼為必填項目'),
});

// 用戶更新驗證架構
export const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url('請提供有效的圖片 URL').optional(),
}).partial();

// 密碼重設驗證架構
export const passwordResetSchema = z.object({
  token: z.string().min(1, '請提供重設令牌'),
  newPassword: passwordSchema,
});

// 忘記密碼驗證架構
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// 電子郵件驗證參數架構
export const verifyEmailParamsSchema = z.object({
  token: z.string().min(1, '驗證令牌為必填項目'),
});

// 重新發送驗證郵件架構
export const resendVerificationEmailSchema = z.object({
  email: emailSchema,
});

// 類型導出
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type VerifyEmailParams = z.infer<typeof verifyEmailParamsSchema>;
export type ResendVerificationEmailData = z.infer<typeof resendVerificationEmailSchema>;