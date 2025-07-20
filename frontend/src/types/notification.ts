// 通知類型定義
export enum NotificationType {
  MATCH_FOUND = 'MATCH_FOUND',
  PET_STATUS_UPDATE = 'PET_STATUS_UPDATE',
  GEOFENCE_ALERT = 'GEOFENCE_ALERT',
  REMINDER = 'REMINDER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MESSAGE = 'MESSAGE',
  COMMENT = 'COMMENT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED'
}

// 通知數據接口
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  userId: string;
  data?: any;
  timestamp: Date;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: Date;
}

// 即時通知數據接口
export interface RealtimeNotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: any;
  timestamp: Date;
  actionUrl?: string;
  imageUrl?: string;
}

// 通知偏好設定接口
export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  doNotDisturb: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: {
    pet_match: boolean;
    pet_found: boolean;
    pet_lost: boolean;
    geofence: boolean;
    reminder: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm 格式
    endTime: string;   // HH:mm 格式
  };
  frequency: {
    digest: boolean;
    immediate: boolean;
  };
}

// FCM Token 接口
export interface FCMToken {
  token: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  createdAt: Date;
  lastUsed: Date;
}

// Socket 事件類型
export enum SocketEvents {
  // 連接相關
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // 通知相關
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_DELIVERED = 'notification_delivered',
  
  // 寵物相關
  PET_STATUS_UPDATE = 'pet:status_update',
  PET_MATCH_FOUND = 'pet:match_found',
  
  // 系統相關
  SYSTEM_ANNOUNCEMENT = 'system:announcement'
}

// 通知統計接口
export interface NotificationStats {
  totalCount: number;
  readCount: number;
  unreadCount: number;
  todayCount: number;
  typeStats: Record<string, number>;
  byPriority: Record<NotificationPriority, number>;
}

// API 響應接口
export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: NotificationData | NotificationData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 通知查詢參數
export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
}