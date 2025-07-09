/**
 * 共用型別定義
 * 這個檔案包含前端和後端都會使用到的型別定義
 */

// ===== 基礎型別 =====

/**
 * API 回應格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * 分頁資訊
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 分頁回應
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

/**
 * 查詢參數
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// ===== 使用者相關型別 =====

/**
 * 使用者角色
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * 使用者狀態
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * 使用者基本資訊
 */
export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * 使用者個人資料
 */
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: {
    city?: string;
    district?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    line?: string;
  };
}

/**
 * 使用者偏好設定
 */
export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  language: 'zh-TW' | 'en';
  theme: 'light' | 'dark' | 'auto';
}

// ===== 寵物相關型別 =====

/**
 * 寵物類型
 */
export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  FISH = 'fish',
  REPTILE = 'reptile',
  OTHER = 'other',
}

/**
 * 寵物性別
 */
export enum PetGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

/**
 * 寵物大小
 */
export enum PetSize {
  TINY = 'tiny',     // 極小型 (<3kg)
  SMALL = 'small',   // 小型 (3-10kg)
  MEDIUM = 'medium', // 中型 (10-25kg)
  LARGE = 'large',   // 大型 (25-45kg)
  GIANT = 'giant',   // 巨型 (>45kg)
}

/**
 * 協尋狀態
 */
export enum PostStatus {
  ACTIVE = 'active',     // 進行中
  FOUND = 'found',       // 已找到
  CLOSED = 'closed',     // 已關閉
  EXPIRED = 'expired',   // 已過期
}

/**
 * 協尋類型
 */
export enum PostType {
  LOST = 'lost',         // 走失協尋
  FOUND = 'found',       // 拾獲通報
  ADOPTION = 'adoption', // 送養資訊
}

/**
 * 寵物資訊
 */
export interface Pet {
  _id: string;
  name: string;
  type: PetType;
  breed?: string;
  gender: PetGender;
  age?: number; // 月齡
  size: PetSize;
  color: string[];
  description: string;
  characteristics: string[];
  images: string[];
  microchip?: string;
  collar?: {
    hasCollar: boolean;
    color?: string;
    description?: string;
  };
  owner: string; // User ID
  createdAt: string;
  updatedAt: string;
}

/**
 * 協尋貼文
 */
export interface Post {
  _id: string;
  type: PostType;
  status: PostStatus;
  title: string;
  description: string;
  pet: Pet;
  location: {
    address: string;
    city: string;
    district: string;
    coordinates: [number, number]; // [longitude, latitude]
    radius?: number; // 搜尋半徑 (公尺)
  };
  contactInfo: {
    name: string;
    phone?: string;
    email?: string;
    preferredContact: 'phone' | 'email' | 'both';
  };
  reward?: {
    amount: number;
    description?: string;
  };
  lastSeenAt?: string; // 最後目擊時間
  foundAt?: string;    // 找到時間
  author: string; // User ID
  views: number;
  likes: number;
  shares: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 留言相關型別 =====

/**
 * 留言
 */
export interface Comment {
  _id: string;
  post: string; // Post ID
  author: string; // User ID
  content: string;
  images?: string[];
  location?: {
    address?: string;
    coordinates?: [number, number];
  };
  isClue: boolean; // 是否為線索
  isVerified: boolean; // 是否已驗證
  likes: number;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ===== 通知相關型別 =====

/**
 * 通知類型
 */
export enum NotificationType {
  NEW_COMMENT = 'new_comment',
  NEW_CLUE = 'new_clue',
  POST_LIKED = 'post_liked',
  POST_SHARED = 'post_shared',
  PET_FOUND = 'pet_found',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

/**
 * 通知
 */
export interface Notification {
  _id: string;
  recipient: string; // User ID
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ===== 表單相關型別 =====

/**
 * 登入表單
 */
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 註冊表單
 */
export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  agreeToTerms: boolean;
}

/**
 * 重設密碼表單
 */
export interface ResetPasswordForm {
  email: string;
}

/**
 * 新密碼表單
 */
export interface NewPasswordForm {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * 協尋貼文表單
 */
export interface PostForm {
  type: PostType;
  title: string;
  description: string;
  petInfo: {
    name: string;
    type: PetType;
    breed?: string;
    gender: PetGender;
    age?: number;
    size: PetSize;
    color: string[];
    characteristics: string[];
    microchip?: string;
    collar?: {
      hasCollar: boolean;
      color?: string;
      description?: string;
    };
  };
  location: {
    address: string;
    city: string;
    district: string;
    coordinates?: [number, number];
  };
  contactInfo: {
    name: string;
    phone?: string;
    email?: string;
    preferredContact: 'phone' | 'email' | 'both';
  };
  reward?: {
    amount: number;
    description?: string;
  };
  lastSeenAt?: string;
  images: File[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// ===== 搜尋相關型別 =====

/**
 * 搜尋篩選條件
 */
export interface SearchFilters {
  type?: PostType[];
  petType?: PetType[];
  gender?: PetGender[];
  size?: PetSize[];
  city?: string;
  district?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  hasReward?: boolean;
  status?: PostStatus[];
}

/**
 * 搜尋結果
 */
export interface SearchResult {
  posts: Post[];
  total: number;
  filters: {
    cities: string[];
    districts: string[];
    petTypes: PetType[];
  };
}