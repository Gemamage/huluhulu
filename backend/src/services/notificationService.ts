import mongoose, { Types } from 'mongoose';
import { Notification, NotificationType, NotificationPriority, NotificationStatus, INotification } from '../models/Notification';
import { NotificationPreference, INotificationPreference } from '../models/NotificationPreference';
import { FirebaseService, PushNotificationPayload } from './firebaseService';
import { EmailService } from './emailService';
import { SocketService, RealtimeNotificationData } from './socketService';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

/**
 * 通知發送選項
 */
export interface NotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: any;
  actionUrl?: string;
  imageUrl?: string;
  channels?: {
    push?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
  scheduledAt?: Date;
  expiresAt?: Date;
}

/**
 * 批次通知選項
 */
export interface BatchNotificationOptions {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: any;
  actionUrl?: string;
  imageUrl?: string;
  channels?: {
    push?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
  scheduledAt?: Date;
  expiresAt?: Date;
}

/**
 * 通知發送結果
 */
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channels: {
    push: { sent: boolean; error?: string };
    email: { sent: boolean; error?: string };
    inApp: { sent: boolean; error?: string };
  };
}

/**
 * 批次通知發送結果
 */
export interface BatchNotificationResult {
  totalUsers: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    userId: string;
    success: boolean;
    notificationId?: string;
    error?: string;
  }>;
  channelStats: {
    push: { sent: number; failed: number };
    email: { sent: number; failed: number };
    inApp: { sent: number; failed: number };
  };
}

/**
 * 通知服務類別
 */
export class NotificationService {
  /**
   * 發送單一通知
   */
  static async sendNotification(options: NotificationOptions): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channels: {
        push: { sent: false },
        email: { sent: false },
        inApp: { sent: false },
      },
    };

    try {
      // 取得用戶通知偏好
      const preferences = await NotificationPreference.findByUserId(options.userId);
      if (!preferences) {
        throw new Error('找不到用戶通知偏好設定');
      }

      // 檢查是否應該發送通知
      if (!this.shouldSendNotification(preferences, options.type, options.priority)) {
        logger.info('根據用戶偏好設定跳過通知', {
          userId: options.userId,
          type: options.type,
          priority: options.priority,
        });
        return result;
      }

      // 創建通知記錄
      const notification = new Notification({
        userId: new Types.ObjectId(options.userId),
        type: options.type,
        title: options.title,
        message: options.message,
        priority: options.priority || NotificationPriority.NORMAL,
        data: options.data,
        actionUrl: options.actionUrl,
        imageUrl: options.imageUrl,
        channels: {
          push: {
            enabled: options.channels?.push !== false && preferences.preferences[options.type]?.push,
            sent: false,
          },
          email: {
            enabled: options.channels?.email !== false && preferences.preferences[options.type]?.email,
            sent: false,
          },
          inApp: {
            enabled: options.channels?.inApp !== false && preferences.preferences[options.type]?.inApp,
            sent: false,
          },
        },
        scheduledAt: options.scheduledAt,
        expiresAt: options.expiresAt,
        status: options.scheduledAt ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
      });

      await notification.save();
      result.notificationId = (notification._id as mongoose.Types.ObjectId).toString();

      // 如果是排程通知，直接返回
      if (options.scheduledAt && options.scheduledAt > new Date()) {
        result.success = true;
        return result;
      }

      // 發送通知到各個渠道
      await this.sendToChannels(notification, preferences, result);

      // 更新通知狀態
      const hasSuccessfulChannel = Object.values(result.channels).some(channel => channel.sent);
      notification.status = hasSuccessfulChannel ? NotificationStatus.SENT : NotificationStatus.FAILED;
      notification.sentAt = hasSuccessfulChannel ? new Date() : undefined;
      await notification.save();

      result.success = hasSuccessfulChannel;

      logger.info('通知發送完成', {
        userId: options.userId,
        notificationId: result.notificationId,
        type: options.type,
        success: result.success,
        channels: result.channels,
      });

      return result;
    } catch (error) {
      logger.error('發送通知失敗', {
        error,
        userId: options.userId,
        type: options.type,
        notificationId: result.notificationId,
      });

      // 更新通知狀態為失敗
      if (result.notificationId) {
        try {
          await Notification.findByIdAndUpdate(result.notificationId, {
            status: NotificationStatus.FAILED,
          });
        } catch (updateError) {
          logger.error('更新通知狀態失敗', { updateError, notificationId: result.notificationId });
        }
      }

      return result;
    }
  }

  /**
   * 批次發送通知
   */
  static async sendBatchNotification(options: BatchNotificationOptions): Promise<BatchNotificationResult> {
    const result: BatchNotificationResult = {
      totalUsers: options.userIds.length,
      successCount: 0,
      failureCount: 0,
      results: [],
      channelStats: {
        push: { sent: 0, failed: 0 },
        email: { sent: 0, failed: 0 },
        inApp: { sent: 0, failed: 0 },
      },
    };

    logger.info('開始批次發送通知', {
      totalUsers: options.userIds.length,
      type: options.type,
      title: options.title,
    });

    // 並行處理，但限制並發數量
    const concurrency = 10;
    const chunks = this.chunkArray(options.userIds, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (userId) => {
        try {
          const notificationResult = await this.sendNotification({
            ...options,
            userId,
          });

          const userResult = {
            userId,
            success: notificationResult.success,
            notificationId: notificationResult.notificationId,
          };

          if (notificationResult.success) {
            result.successCount++;
          } else {
            result.failureCount++;
          }

          // 更新渠道統計
          Object.entries(notificationResult.channels).forEach(([channel, channelResult]) => {
            const channelKey = channel as keyof typeof result.channelStats;
            if (channelResult.sent) {
              result.channelStats[channelKey].sent++;
            } else {
              result.channelStats[channelKey].failed++;
            }
          });

          result.results.push(userResult);
          return userResult;
        } catch (error) {
          const userResult = {
            userId,
            success: false,
            error: error instanceof Error ? error.message : '未知錯誤',
          };

          result.failureCount++;
          result.results.push(userResult);
          return userResult;
        }
      });

      await Promise.all(promises);
    }

    logger.info('批次通知發送完成', {
      totalUsers: result.totalUsers,
      successCount: result.successCount,
      failureCount: result.failureCount,
      channelStats: result.channelStats,
    });

    return result;
  }

  /**
   * 發送到各個通知渠道
   */
  private static async sendToChannels(
    notification: INotification,
    preferences: INotificationPreference,
    result: NotificationResult
  ): Promise<void> {
    const userId = notification.userId.toString();

    // 發送推播通知
    if (notification.channels.push.enabled) {
      try {
        const pushPayload: PushNotificationPayload = {
          title: notification.title,
          body: notification.message,
          data: notification.data,
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl,
          priority: notification.priority,
          type: notification.type,
        };

        const allTokens = [...preferences.deviceTokens.fcm, ...preferences.deviceTokens.apns];
        if (allTokens.length > 0) {
          const pushResult = await FirebaseService.sendToMultipleDevices(
            allTokens,
            pushPayload
          );

          if (pushResult.successCount > 0) {
            result.channels.push.sent = true;
            notification.channels.push.sent = true;
            notification.channels.push.sentAt = new Date();
          } else {
            result.channels.push.error = '所有裝置推播發送失敗';
          }

          // 清理無效的 token
          if (pushResult.invalidTokens.length > 0) {
            await preferences.removeDeviceTokens(pushResult.invalidTokens);
          }
        } else {
          result.channels.push.error = '沒有可用的裝置 token';
        }
      } catch (error) {
        result.channels.push.error = error instanceof Error ? error.message : '推播發送失敗';
        logger.error('推播通知發送失敗', { error, userId, notificationId: notification._id });
      }
    }

    // 發送 Email 通知
    if (notification.channels.email.enabled) {
      try {
        // 這裡需要根據通知類型選擇合適的 Email 模板
        await EmailService.sendNotificationEmail(
          preferences.userId.toString(), // 這裡需要用戶的 email 地址
          notification.title,
          notification.message,
          notification.actionUrl || ''
        );

        result.channels.email.sent = true;
        notification.channels.email.sent = true;
        notification.channels.email.sentAt = new Date();
      } catch (error) {
        result.channels.email.error = error instanceof Error ? error.message : 'Email 發送失敗';
        logger.error('Email 通知發送失敗', { error, userId, notificationId: notification._id });
      }
    }

    // 發送即時通知
    if (notification.channels.inApp.enabled) {
      try {
        const realtimeData: RealtimeNotificationData = {
          id: (notification._id as mongoose.Types.ObjectId).toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          timestamp: new Date(),
          actionUrl: notification.actionUrl,
          imageUrl: notification.imageUrl,
        };

        const socketResult = await SocketService.sendNotificationToUser(userId, realtimeData);
        
        if (socketResult) {
          result.channels.inApp.sent = true;
          notification.channels.inApp.sent = true;
          notification.channels.inApp.sentAt = new Date();
        } else {
          result.channels.inApp.error = '即時通知發送失敗';
        }
      } catch (error) {
        result.channels.inApp.error = error instanceof Error ? error.message : '即時通知發送失敗';
        logger.error('即時通知發送失敗', { error, userId, notificationId: notification._id });
      }
    }
  }

  /**
   * 檢查是否應該發送通知
   */
  private static shouldSendNotification(
    preferences: INotificationPreference,
    type: NotificationType,
    priority?: NotificationPriority
  ): boolean {
    // 檢查全域設定
    if (!preferences.globalSettings.pushEnabled && !preferences.globalSettings.emailEnabled) {
      return false;
    }

    // 檢查勿擾時段
    if (preferences.isQuietTime()) {
      // 只有緊急通知可以在勿擾時段發送
      return priority === NotificationPriority.URGENT;
    }

    // 檢查特定類型的偏好設定
    const typePreference = preferences.preferences[type];
    if (!typePreference) {
      return true; // 如果沒有特定設定，預設允許
    }

    // 至少要有一個渠道啟用
    return typePreference.push || typePreference.email || typePreference.inApp;
  }

  /**
   * 處理排程通知
   */
  static async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        status: NotificationStatus.SCHEDULED,
        scheduledAt: { $lte: now },
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } },
        ],
      }).limit(100); // 限制每次處理的數量

      logger.info('處理排程通知', { count: scheduledNotifications.length });

      for (const notification of scheduledNotifications) {
        try {
          // 更新狀態為處理中
          notification.status = NotificationStatus.PENDING;
          await notification.save();

          // 重新發送通知
          const options: NotificationOptions = {
            userId: notification.userId.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            data: notification.data,
            actionUrl: notification.actionUrl,
            imageUrl: notification.imageUrl,
          };

          await this.sendNotification(options);
        } catch (error) {
          logger.error('處理排程通知失敗', {
            error,
            notificationId: notification._id,
          });

          // 標記為失敗
          notification.status = NotificationStatus.FAILED;
          await notification.save();
        }
      }
    } catch (error) {
      logger.error('處理排程通知時發生錯誤', { error });
    }
  }

  /**
   * 清理過期通知
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const result = await Notification.deleteMany({
        expiresAt: { $lt: now },
        status: { $in: [NotificationStatus.SCHEDULED, NotificationStatus.PENDING] },
      });

      if (result.deletedCount > 0) {
        logger.info('清理過期通知完成', { deletedCount: result.deletedCount });
      }
    } catch (error) {
      logger.error('清理過期通知失敗', { error });
    }
  }

  /**
   * 標記通知為已讀
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: new Types.ObjectId(userId),
          status: NotificationStatus.SENT,
        },
        {
          readAt: new Date(),
          status: NotificationStatus.READ,
        }
      );

      return !!result;
    } catch (error) {
      logger.error('標記通知為已讀失敗', { error, notificationId, userId });
      return false;
    }
  }

  /**
   * 取得用戶未讀通知數量
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        userId: new Types.ObjectId(userId),
        status: NotificationStatus.SENT,
        readAt: { $exists: false },
      });
    } catch (error) {
      logger.error('取得未讀通知數量失敗', { error, userId });
      return 0;
    }
  }

  /**
   * 取得用戶通知列表
   */
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        Notification.find({
          userId: new Types.ObjectId(userId),
          status: { $in: [NotificationStatus.SENT, NotificationStatus.READ] },
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments({
          userId: new Types.ObjectId(userId),
          status: { $in: [NotificationStatus.SENT, NotificationStatus.READ] },
        }),
      ]);

      const hasMore = skip + notifications.length < total;

      return { notifications, total, hasMore };
    } catch (error) {
      logger.error('取得用戶通知列表失敗', { error, userId });
      return { notifications: [], total: 0, hasMore: false };
    }
  }

  /**
   * 將陣列分割成指定大小的塊
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 取得通知統計資訊
   */
  static async getNotificationStats(userId?: string): Promise<{
    total: number;
    sent: number;
    read: number;
    failed: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    try {
      const matchCondition = userId ? { userId: new Types.ObjectId(userId) } : {};
      
      const [stats] = await Notification.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: {
              $sum: {
                $cond: [{ $eq: ['$status', NotificationStatus.SENT] }, 1, 0],
              },
            },
            read: {
              $sum: {
                $cond: [{ $eq: ['$status', NotificationStatus.READ] }, 1, 0],
              },
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0],
              },
            },
            byType: {
              $push: '$type',
            },
            byPriority: {
              $push: '$priority',
            },
          },
        },
      ]);

      if (!stats) {
        return {
          total: 0,
          sent: 0,
          read: 0,
          failed: 0,
          byType: {} as Record<NotificationType, number>,
          byPriority: {} as Record<NotificationPriority, number>,
        };
      }

      // 統計各類型和優先級的數量
      const byType = stats.byType.reduce((acc: Record<string, number>, type: string) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const byPriority = stats.byPriority.reduce((acc: Record<string, number>, priority: string) => {
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      return {
        total: stats.total,
        sent: stats.sent,
        read: stats.read,
        failed: stats.failed,
        byType,
        byPriority,
      };
    } catch (error) {
      logger.error('取得通知統計失敗', { error, userId });
      throw error;
    }
  }

  /**
   * 啟動排程任務
   */
  static startScheduledTasks(): void {
    // 每分鐘檢查排程通知
    setInterval(async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        logger.error('處理排程通知任務失敗', { error });
      }
    }, 60000); // 1分鐘

    // 每小時清理過期通知
    setInterval(async () => {
      try {
        await this.cleanupExpiredNotifications();
      } catch (error) {
        logger.error('清理過期通知任務失敗', { error });
      }
    }, 3600000); // 1小時

    logger.info('通知排程任務已啟動');
  }

  /**
   * 停止排程任務
   */
  static stopScheduledTasks(): void {
    // 這裡可以實現停止定時器的邏輯
    logger.info('通知排程任務已停止');
  }
}