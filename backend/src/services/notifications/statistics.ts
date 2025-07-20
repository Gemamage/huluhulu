import { Notification } from "../../models/Notification";
import { logger } from "../../utils/logger";
import mongoose from "mongoose";
import { AIMatchingService } from "./aiMatching";
import { GeofenceService } from "./geofence";
import { ReminderService } from "./reminders";

export interface SmartNotificationStats {
  aiMatching: {
    enabled: boolean;
    running: boolean;
    lastRun?: Date;
    matchesFound: number;
  };
  geofence: {
    enabled: boolean;
    running: boolean;
    activeAreas: number;
    totalAreas: number;
  };
  reminders: {
    enabled: boolean;
    running: boolean;
    sentToday: number;
  };
  totalNotifications: number;
}

export interface UserNotificationStats {
  aiMatching: {
    enabled: boolean;
    matchesFound: number;
    lastRun?: Date;
  };
  geofencing: {
    enabled: boolean;
    activeAreas: number;
  };
  reminders: {
    enabled: boolean;
    sentCount: number;
  };
  totalNotifications: number;
}

export class NotificationStatisticsService {
  /**
   * 獲取智能通知統計
   */
  static async getSmartNotificationStats(): Promise<SmartNotificationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // 獲取今日通知總數
    const totalNotifications = await Notification.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // 獲取各服務狀態
    const aiMatchingStatus = AIMatchingService.getStatus();
    const geofenceStats = GeofenceService.getStats();
    const reminderStats = await ReminderService.getStats();

    return {
      aiMatching: {
        enabled: aiMatchingStatus.enabled,
        running: aiMatchingStatus.running,
        lastRun: aiMatchingStatus.lastRun || undefined,
        matchesFound: 0, // 可以從統計中獲取
      },
      geofence: {
        enabled: geofenceStats.enabled,
        running: geofenceStats.running,
        activeAreas: geofenceStats.activeAreas,
        totalAreas: geofenceStats.totalAreas,
      },
      reminders: {
        enabled: reminderStats.enabled,
        running: reminderStats.running,
        sentToday: reminderStats.sentToday,
      },
      totalNotifications,
    };
  }

  /**
   * 獲取智能通知統計（用戶特定）
   */
  static async getSmartNotificationStatistics(options: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UserNotificationStats> {
    const { userId, startDate, endDate } = options;

    // 設定日期範圍
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 預設 30 天前
    const end = endDate || new Date();

    // 統計通知數量
    const notificationStats = await Notification.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = notificationStats.reduce(
      (acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 統計用戶的地理圍欄
    const userGeofences = await GeofenceService.getUserGeofences(userId);

    // 獲取 AI 配對狀態
    const aiMatchingStatus = AIMatchingService.getStatus();
    const geofenceStats = GeofenceService.getStats();
    const reminderStats = await ReminderService.getStats();

    return {
      aiMatching: {
        enabled: aiMatchingStatus.enabled,
        matchesFound: stats["AI_MATCH_SUGGESTION"] || 0,
        lastRun: aiMatchingStatus.lastRun || undefined,
      },
      geofencing: {
        enabled: geofenceStats.enabled,
        activeAreas: userGeofences.length,
      },
      reminders: {
        enabled: reminderStats.enabled,
        sentCount: stats["REMINDER"] || 0,
      },
      totalNotifications: Object.values(stats).reduce(
        (sum: number, count: unknown) => sum + (count as number),
        0,
      ),
    };
  }

  /**
   * 獲取通知類型統計
   */
  static async getNotificationTypeStats(options: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<string, number>> {
    const { userId, startDate, endDate } = options;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const matchConditions: any = {
      createdAt: { $gte: start, $lte: end },
    };

    if (userId) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats.reduce(
      (acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * 獲取通知趨勢統計
   */
  static async getNotificationTrends(options: {
    userId?: string;
    days?: number;
  }): Promise<{
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
  }> {
    const { userId, days = 30 } = options;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const matchConditions: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (userId) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    // 每日統計
    const dailyStats = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // 每週統計
    const weeklyStats = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    return {
      daily: dailyStats.map((stat) => ({
        date: `${stat._id.year}-${String(stat._id.month).padStart(2, "0")}-${String(stat._id.day).padStart(2, "0")}`,
        count: stat.count,
      })),
      weekly: weeklyStats.map((stat) => ({
        week: `${stat._id.year}-W${String(stat._id.week).padStart(2, "0")}`,
        count: stat.count,
      })),
    };
  }

  /**
   * 獲取通知效果統計
   */
  static async getNotificationEffectivenessStats(options: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalSent: number;
    totalRead: number;
    totalClicked: number;
    readRate: number;
    clickRate: number;
    typeEffectiveness: Record<
      string,
      {
        sent: number;
        read: number;
        clicked: number;
        readRate: number;
        clickRate: number;
      }
    >;
  }> {
    const { userId, startDate, endDate } = options;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const matchConditions: any = {
      createdAt: { $gte: start, $lte: end },
    };

    if (userId) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$type",
          totalSent: { $sum: 1 },
          totalRead: { $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } },
          totalClicked: {
            $sum: { $cond: [{ $ne: ["$clickedAt", null] }, 1, 0] },
          },
        },
      },
    ]);

    let totalSent = 0;
    let totalRead = 0;
    let totalClicked = 0;
    const typeEffectiveness: Record<string, any> = {};

    for (const stat of stats) {
      totalSent += stat.totalSent;
      totalRead += stat.totalRead;
      totalClicked += stat.totalClicked;

      typeEffectiveness[stat._id] = {
        sent: stat.totalSent,
        read: stat.totalRead,
        clicked: stat.totalClicked,
        readRate:
          stat.totalSent > 0 ? (stat.totalRead / stat.totalSent) * 100 : 0,
        clickRate:
          stat.totalSent > 0 ? (stat.totalClicked / stat.totalSent) * 100 : 0,
      };
    }

    return {
      totalSent,
      totalRead,
      totalClicked,
      readRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      typeEffectiveness,
    };
  }

  /**
   * 清理過期統計數據
   */
  static async cleanupOldStats(daysToKeep: number = 90): Promise<{
    deletedCount: number;
  }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true, // 只刪除已讀的舊通知
    });

    logger.info("清理過期統計數據完成", {
      deletedCount: result.deletedCount,
      cutoffDate,
      daysToKeep,
    });

    return {
      deletedCount: result.deletedCount || 0,
    };
  }
}
