import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';

/**
 * 初始化通知系統
 * 創建必要的索引和預設設定
 */
export const initNotificationSystem = async (): Promise<void> => {
  try {
    logger.info('開始初始化通知系統...');

    // 創建通知集合的索引
    await Notification.collection.createIndexes([
      // 用戶 ID 索引
      { key: { userId: 1 } },
      // 狀態索引
      { key: { status: 1 } },
      // 類型索引
      { key: { type: 1 } },
      // 創建時間索引（用於清理過期通知）
      { key: { createdAt: 1 }, expireAfterSeconds: config.notification.retentionDays * 24 * 60 * 60 },
      // 複合索引：用戶 + 狀態
      { key: { userId: 1, status: 1 } },
      // 複合索引：用戶 + 類型
      { key: { userId: 1, type: 1 } },
      // 複合索引：用戶 + 創建時間（用於分頁）
      { key: { userId: 1, createdAt: -1 } }
    ]);

    logger.info('通知集合索引創建完成');

    // 創建通知偏好集合的索引
    await NotificationPreference.collection.createIndexes([
      // 用戶 ID 唯一索引
      { key: { userId: 1 }, unique: true },
      // 設備 Token 索引
      { key: { 'deviceTokens.token': 1 } },
      // 複合索引：用戶 + 設備平台
      { key: { userId: 1, 'deviceTokens.platform': 1 } }
    ]);

    logger.info('通知偏好集合索引創建完成');

    // 檢查是否有孤立的通知偏好記錄（沒有對應用戶的記錄）
    const orphanedPreferences = await NotificationPreference.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          user: { $size: 0 }
        }
      }
    ]);

    if (orphanedPreferences.length > 0) {
      logger.warn(`發現 ${orphanedPreferences.length} 個孤立的通知偏好記錄`);
      
      // 可選：清理孤立記錄
      // await NotificationPreference.deleteMany({
      //   _id: { $in: orphanedPreferences.map(p => p._id) }
      // });
      // logger.info('已清理孤立的通知偏好記錄');
    }

    // 統計現有資料
    const notificationCount = await Notification.countDocuments();
    const preferenceCount = await NotificationPreference.countDocuments();
    
    logger.info(`通知系統初始化完成`);
    logger.info(`- 現有通知數量: ${notificationCount}`);
    logger.info(`- 現有偏好設定數量: ${preferenceCount}`);
    
  } catch (error) {
    logger.error('通知系統初始化失敗:', error);
    throw error;
  }
};

/**
 * 清理過期通知
 */
export const cleanupExpiredNotifications = async (): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.notification.retentionDays);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['read', 'dismissed'] }
    });

    logger.info(`清理了 ${result.deletedCount} 個過期通知`);
  } catch (error) {
    logger.error('清理過期通知失敗:', error);
    throw error;
  }
};

/**
 * 清理無效的設備 Token
 */
export const cleanupInvalidDeviceTokens = async (): Promise<void> => {
  try {
    // 移除超過 90 天未使用的設備 Token
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await NotificationPreference.updateMany(
      {},
      {
        $pull: {
          deviceTokens: {
            lastUsed: { $lt: cutoffDate }
          }
        }
      }
    );

    logger.info(`清理了過期的設備 Token，影響 ${result.modifiedCount} 個偏好設定`);
  } catch (error) {
    logger.error('清理無效設備 Token 失敗:', error);
    throw error;
  }
};

// 如果直接執行此腳本
if (require.main === module) {
  const runInit = async () => {
    try {
      // 連接資料庫
      await mongoose.connect(config.database.uri);
      logger.info('資料庫連接成功');

      // 執行初始化
      await initNotificationSystem();
      await cleanupExpiredNotifications();
      await cleanupInvalidDeviceTokens();

      logger.info('通知系統初始化腳本執行完成');
    } catch (error) {
      logger.error('初始化腳本執行失敗:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  };

  runInit();
}