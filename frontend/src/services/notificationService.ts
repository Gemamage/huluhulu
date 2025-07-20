// 通知服務 - 整合 Socket.IO 和 Firebase FCM
import {
  NotificationData,
  NotificationPreferences,
  NotificationQuery,
  NotificationResponse,
  NotificationStats,
  FCMToken,
  RealtimeNotificationData,
} from '../types/notification';
import { authService } from './authService';
import { socketService } from './socketService';
import {
  getFCMToken,
  requestNotificationPermission,
  onForegroundMessage,
  showLocalNotification,
} from '../lib/firebase';

class NotificationService {
  private baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  private fcmToken: string | null = null;
  private isInitialized = false;

  /**
   * 初始化通知服務
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 確保只在客戶端執行
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // 請求通知權限
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // 獲取 FCM Token
      this.fcmToken = await getFCMToken();
      if (this.fcmToken) {
        await this.registerFCMToken(this.fcmToken);
      }

      // 設置前景消息監聽
      onForegroundMessage(payload => {
        this.handleForegroundMessage(payload);
      });

      // 初始化 Socket 連接
      await socketService.connect();

      // 設置 Socket 事件監聽
      this.setupSocketListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * 設置 Socket 事件監聽器
   */
  private setupSocketListeners(): void {
    // 監聽通知事件
    socketService.on(
      'notification',
      (notification: RealtimeNotificationData) => {
        this.handleRealtimeNotification(notification);
      }
    );

    // 監聽配對通知
    socketService.on('matchFound', (notification: RealtimeNotificationData) => {
      this.showNotificationToUser(notification.title, {
        body: notification.message,
        icon: notification.imageUrl || '/icons/icon-192x192.png',
        tag: `match-${notification.id}`,
        data: notification.data,
      });
    });

    // 監聽地理圍欄警報
    socketService.on(
      'geofenceAlert',
      (notification: RealtimeNotificationData) => {
        this.showNotificationToUser(notification.title, {
          body: notification.message,
          icon: '/icons/location-alert.png',
          tag: `geofence-${notification.id}`,
          data: notification.data,
        });
      }
    );
  }

  /**
   * 處理前景消息
   */
  private handleForegroundMessage(payload: any): void {
    console.log('Foreground FCM message:', payload);

    const { notification, data } = payload;
    if (notification) {
      this.showNotificationToUser(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        image: notification.image,
        data: data,
      });
    }
  }

  /**
   * 處理即時通知
   */
  private handleRealtimeNotification(
    notification: RealtimeNotificationData
  ): void {
    console.log('Realtime notification received:', notification);

    // 顯示瀏覽器通知
    this.showNotificationToUser(notification.title, {
      body: notification.message,
      icon: notification.imageUrl || '/icons/icon-192x192.png',
      tag: notification.id,
      data: notification.data,
    });

    // 觸發自定義事件供組件監聽（僅在客戶端）
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('realtimeNotification', {
          detail: notification,
        })
      );
    }
  }

  /**
   * 顯示通知給用戶
   */
  private showNotificationToUser(
    title: string,
    options: NotificationOptions
  ): void {
    showLocalNotification(title, {
      ...options,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: '查看',
        },
        {
          action: 'dismiss',
          title: '忽略',
        },
      ],
    });
  }

  /**
   * 註冊 FCM Token 到後端
   */
  private async registerFCMToken(token: string): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        console.warn('No auth token available for FCM registration');
        return;
      }

      // 確保只在客戶端執行（因為使用了 navigator API）
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        console.warn('Cannot register FCM token on server side');
        return;
      }

      const response = await fetch(`${this.baseUrl}/notifications/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register FCM token');
      }

      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  /**
   * 獲取通知列表
   */
  public async getNotifications(
    query: NotificationQuery = {}
  ): Promise<NotificationResponse> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/notifications?${params}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * 標記通知為已讀
   */
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${this.baseUrl}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // 同時通知 Socket 服務
      socketService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * 批量標記通知為已讀
   */
  public async markAllAsRead(): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${this.baseUrl}/notifications/mark-all-read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * 獲取通知統計
   */
  public async getStats(): Promise<NotificationStats> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}/notifications/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * 獲取通知偏好設定
   */
  public async getPreferences(): Promise<NotificationPreferences> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${this.baseUrl}/notifications/preferences`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * 更新通知偏好設定
   */
  public async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${this.baseUrl}/notifications/preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * 清理服務
   */
  public cleanup(): void {
    socketService.disconnect();
    this.isInitialized = false;
    this.fcmToken = null;
  }

  /**
   * 獲取初始化狀態
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * 獲取 FCM Token
   */
  public getFCMToken(): string | null {
    return this.fcmToken;
  }
}

// 創建單例實例
export const notificationService = new NotificationService();
export default notificationService;
