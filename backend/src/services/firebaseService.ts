import admin from 'firebase-admin';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { NotificationType, NotificationPriority } from '../models/Notification';

/**
 * Firebase 推播通知介面
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  type?: NotificationType;
}

/**
 * Firebase 服務類別
 */
export class FirebaseService {
  private static app: admin.app.App | null = null;
  private static messaging: admin.messaging.Messaging | null = null;

  /**
   * 初始化 Firebase Admin SDK
   */
  static initialize(): void {
    try {
      if (this.app) {
        logger.info('Firebase Admin SDK 已經初始化');
        return;
      }

      // 檢查必要的環境變數
      if (!config.firebase.serviceAccountKey) {
        logger.warn('Firebase 服務帳號金鑰未設定，推播通知功能將被停用');
        return;
      }

      // 初始化 Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(config.firebase.serviceAccountKey),
        projectId: config.firebase.projectId,
      });

      this.messaging = admin.messaging(this.app);
      logger.info('Firebase Admin SDK 初始化成功');
    } catch (error) {
      logger.error('Firebase Admin SDK 初始化失敗', { error });
      throw error;
    }
  }

  /**
   * 檢查 Firebase 是否已初始化
   */
  private static ensureInitialized(): void {
    if (!this.messaging) {
      throw new Error('Firebase Admin SDK 尚未初始化');
    }
  }

  /**
   * 發送推播通知給單一裝置
   */
  static async sendToDevice(
    token: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      this.ensureInitialized();

      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          ...payload.data,
          type: payload.type || '',
          actionUrl: payload.actionUrl || '',
          priority: payload.priority || NotificationPriority.NORMAL,
        },
        android: {
          priority: this.getAndroidPriority(payload.priority),
          notification: {
            channelId: this.getChannelId(payload.type),
            priority: this.getAndroidNotificationPriority(payload.priority),
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            image: payload.imageUrl,
            requireInteraction: payload.priority === NotificationPriority.URGENT,
          },
          fcmOptions: {
            link: payload.actionUrl,
          },
        },
      };

      const response = await this.messaging!.send(message);
      logger.info('推播通知發送成功', {
        messageId: response,
        token: token.substring(0, 20) + '...',
        title: payload.title,
      });

      return true;
    } catch (error: any) {
      logger.error('推播通知發送失敗', {
        error: error.message,
        token: token.substring(0, 20) + '...',
        title: payload.title,
      });

      // 檢查是否為無效的 token
      if (error.code === 'messaging/registration-token-not-registered') {
        logger.info('裝置 token 已失效', { token: token.substring(0, 20) + '...' });
        // 這裡可以觸發清理無效 token 的邏輯
      }

      return false;
    }
  }

  /**
   * 發送推播通知給多個裝置
   */
  static async sendToMultipleDevices(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    try {
      this.ensureInitialized();

      if (tokens.length === 0) {
        return { successCount: 0, failureCount: 0, invalidTokens: [] };
      }

      // 批次發送（Firebase 限制每次最多 500 個 token）
      const batchSize = 500;
      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: {
            ...payload.data,
            type: payload.type || '',
            actionUrl: payload.actionUrl || '',
            priority: payload.priority || NotificationPriority.NORMAL,
          },
          android: {
            priority: this.getAndroidPriority(payload.priority),
            notification: {
              channelId: this.getChannelId(payload.type),
              priority: this.getAndroidNotificationPriority(payload.priority),
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
                sound: 'default',
                badge: 1,
              },
            },
          },
          webpush: {
            notification: {
              title: payload.title,
              body: payload.body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              image: payload.imageUrl,
              requireInteraction: payload.priority === NotificationPriority.URGENT,
            },
            fcmOptions: {
              link: payload.actionUrl,
            },
          },
        };

        const response = await this.messaging!.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;

        // 處理失敗的 token
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const token = batch[idx];
            if (token && resp.error.code === 'messaging/registration-token-not-registered') {
              invalidTokens.push(token);
            }
            if (token) {
              logger.warn('推播通知發送失敗', {
                token: token.substring(0, 20) + '...',
                error: resp.error.message,
              });
            }
          }
        });
      }

      logger.info('批次推播通知發送完成', {
        totalTokens: tokens.length,
        successCount,
        failureCount,
        invalidTokensCount: invalidTokens.length,
      });

      return { successCount, failureCount, invalidTokens };
    } catch (error) {
      logger.error('批次推播通知發送失敗', { error, tokenCount: tokens.length });
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }

  /**
   * 驗證裝置 token 是否有效
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      this.ensureInitialized();

      // 發送一個測試訊息來驗證 token
      const message: admin.messaging.Message = {
        token,
        data: {
          test: 'true',
        },
      };
      
      const options = {
        dryRun: true, // 不實際發送，只驗證
      };

      await this.messaging!.send(message, options.dryRun);
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      logger.error('Token 驗證失敗', { error: error.message, token: token.substring(0, 20) + '...' });
      return false;
    }
  }

  /**
   * 取得 Android 優先級
   */
  private static getAndroidPriority(priority?: NotificationPriority): 'normal' | 'high' {
    switch (priority) {
      case NotificationPriority.HIGH:
      case NotificationPriority.URGENT:
        return 'high';
      default:
        return 'normal';
    }
  }

  /**
   * 取得 Android 通知優先級
   */
  private static getAndroidNotificationPriority(
    priority?: NotificationPriority
  ): 'min' | 'low' | 'default' | 'high' | 'max' {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'low';
      case NotificationPriority.HIGH:
        return 'high';
      case NotificationPriority.URGENT:
        return 'max';
      default:
        return 'default';
    }
  }

  /**
   * 取得通知頻道 ID
   */
  private static getChannelId(type?: NotificationType): string {
    switch (type) {
      case NotificationType.PET_FOUND:
        return 'pet_found';
      case NotificationType.PET_MISSING:
        return 'pet_missing';
      case NotificationType.MATCH_FOUND:
        return 'match_found';
      case NotificationType.MESSAGE_RECEIVED:
        return 'messages';
      case NotificationType.SYSTEM_UPDATE:
        return 'system';
      case NotificationType.ACCOUNT_SECURITY:
        return 'security';
      default:
        return 'default';
    }
  }

  /**
   * 清理無效的裝置 token
   */
  static async cleanupInvalidTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = [];

    for (const token of tokens) {
      const isValid = await this.validateToken(token);
      if (isValid) {
        validTokens.push(token);
      }
    }

    return validTokens;
  }
}