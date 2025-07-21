import { AIMatchingService, AIMatchingConfig } from "./aiMatching";
import { GeofenceService, GeofenceConfig, GeofenceArea } from "./geofence";
import { ReminderService, ReminderConfig } from "./reminders";
import {
  NotificationStatisticsService,
  SmartNotificationStats,
  UserNotificationStats,
} from "./statistics";
import { logger } from "../../utils/logger";

export interface SmartNotificationConfig {
  aiMatching: AIMatchingConfig;
  geofence: GeofenceConfig;
  reminders: ReminderConfig;
}

const DEFAULT_CONFIG: SmartNotificationConfig = {
  aiMatching: {
    enabled: true,
    minSimilarity: 0.75,
    checkInterval: 30, // 30 minutes
    maxDistance: 50, // 50km
  },
  geofence: {
    enabled: true,
    defaultRadius: 10, // 10km
    checkInterval: 15, // 15 minutes
  },
  reminders: {
    enabled: true,
    intervals: [1, 3, 7, 14, 30], // 1天, 3天, 1週, 2週, 1個月
    maxReminders: 5,
  },
};

export class SmartNotificationService {
  private static config: SmartNotificationConfig = DEFAULT_CONFIG;
  private static initialized = false;

  /**
   * 初始化智能通知服務
   */
  static async initialize(
    config?: Partial<SmartNotificationConfig>,
  ): Promise<void> {
    if (this.initialized) {
      logger.warn("智能通知服務已經初始化");
      return;
    }

    if (config) {
      this.config = {
        aiMatching: { ...DEFAULT_CONFIG.aiMatching, ...config.aiMatching },
        geofence: { ...DEFAULT_CONFIG.geofence, ...config.geofence },
        reminders: { ...DEFAULT_CONFIG.reminders, ...config.reminders },
      };
    }

    // 初始化各個服務
    AIMatchingService.initialize(this.config.aiMatching);
    await GeofenceService.initialize(this.config.geofence);
    ReminderService.initialize(this.config.reminders);

    this.initialized = true;
    logger.info("智能通知服務已初始化", { config: this.config });
  }

  /**
   * 停止智能通知服務
   */
  static stop(): void {
    AIMatchingService.stop();
    GeofenceService.stop();
    ReminderService.stop();

    this.initialized = false;
    logger.info("智能通知服務已停止");
  }

  /**
   * 重啟智能通知服務
   */
  static async restart(
    config?: Partial<SmartNotificationConfig>,
  ): Promise<void> {
    this.stop();
    await this.initialize(config);
  }

  // ==================== AI 配對相關方法 ====================

  /**
   * 手動觸發 AI 配對檢查
   */
  static async triggerAIMatching(
    userId: string,
    petId?: string,
  ): Promise<{
    matchesFound: number;
    notificationsSent: number;
    message: string;
  }> {
    return AIMatchingService.triggerAIMatching(userId, petId);
  }

  // ==================== 地理圍欄相關方法 ====================

  /**
   * 創建地理圍欄
   */
  static async createGeofence(data: {
    userId: string;
    petId: string;
    latitude: number;
    longitude: number;
    radius?: number;
    name?: string;
  }): Promise<GeofenceArea> {
    return GeofenceService.createGeofence(data);
  }

  /**
   * 移除地理圍欄
   */
  static async removeGeofence(
    userId: string,
    geofenceId: string,
  ): Promise<boolean> {
    return GeofenceService.removeGeofence(userId, geofenceId);
  }

  /**
   * 獲取用戶的地理圍欄列表
   */
  static async getUserGeofences(userId: string): Promise<GeofenceArea[]> {
    return GeofenceService.getUserGeofences(userId);
  }

  // ==================== 提醒相關方法 ====================

  /**
   * 手動發送提醒
   */
  static async sendManualReminder(
    userId: string,
    petId: string,
    customMessage?: string,
  ): Promise<void> {
    return ReminderService.sendManualReminder(userId, petId, customMessage);
  }

  /**
   * 獲取用戶的提醒統計
   */
  static async getUserReminderStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalReminders: number;
    remindersByDay: Record<number, number>;
    lastReminderDate?: Date;
  }> {
    return ReminderService.getUserReminderStats(userId, startDate, endDate);
  }

  // ==================== 配置管理方法 ====================

  /**
   * 獲取用戶配置
   */
  static async getConfig(userId?: string): Promise<SmartNotificationConfig> {
    // 這裡可以從資料庫獲取用戶特定配置
    // 暫時返回全域配置
    return { ...this.config };
  }

  /**
   * 更新用戶配置
   */
  static async updateConfig(
    userId: string,
    newConfig: Partial<SmartNotificationConfig>,
  ): Promise<SmartNotificationConfig> {
    // 這裡可以保存用戶特定配置到資料庫
    // 暫時更新全域配置
    if (newConfig.aiMatching) {
      AIMatchingService.updateConfig(newConfig.aiMatching);
      this.config.aiMatching = {
        ...this.config.aiMatching,
        ...newConfig.aiMatching,
      };
    }

    if (newConfig.geofence) {
      GeofenceService.updateConfig(newConfig.geofence);
      this.config.geofence = { ...this.config.geofence, ...newConfig.geofence };
    }

    if (newConfig.reminders) {
      ReminderService.updateConfig(newConfig.reminders);
      this.config.reminders = {
        ...this.config.reminders,
        ...newConfig.reminders,
      };
    }

    logger.info("智能通知配置已更新", { userId, config: this.config });
    return { ...this.config };
  }

  // ==================== 統計相關方法 ====================

  /**
   * 獲取智能通知統計
   */
  static async getSmartNotificationStats(): Promise<SmartNotificationStats> {
    return NotificationStatisticsService.getSmartNotificationStats();
  }

  /**
   * 獲取智能通知統計（用戶特定）
   */
  static async getSmartNotificationStatistics(options: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UserNotificationStats> {
    return NotificationStatisticsService.getSmartNotificationStatistics(
      options,
    );
  }

  /**
   * 獲取通知類型統計
   */
  static async getNotificationTypeStats(options: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<string, number>> {
    return NotificationStatisticsService.getNotificationTypeStats(options);
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
    return NotificationStatisticsService.getNotificationTrends(options);
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
    return NotificationStatisticsService.getNotificationEffectivenessStats(
      options,
    );
  }

  /**
   * 清理過期統計數據
   */
  static async cleanupOldStats(daysToKeep: number = 90): Promise<{
    deletedCount: number;
  }> {
    return NotificationStatisticsService.cleanupOldStats(daysToKeep);
  }

  // ==================== 服務狀態方法 ====================

  /**
   * 獲取服務狀態
   */
  static getServiceStatus(): {
    initialized: boolean;
    aiMatching: {
      enabled: boolean;
      running: boolean;
      lastRun: Date | null;
    };
    geofence: {
      enabled: boolean;
      running: boolean;
      totalAreas: number;
      activeAreas: number;
    };
    reminders: {
      enabled: boolean;
      running: boolean;
    };
  } {
    const aiMatchingStatus = AIMatchingService.getStatus();
    const geofenceStats = GeofenceService.getStats();

    return {
      initialized: this.initialized,
      aiMatching: {
        enabled: aiMatchingStatus.enabled,
        running: aiMatchingStatus.running,
        lastRun: aiMatchingStatus.lastRun,
      },
      geofence: {
        enabled: geofenceStats.enabled,
        running: geofenceStats.running,
        totalAreas: geofenceStats.totalAreas,
        activeAreas: geofenceStats.activeAreas,
      },
      reminders: {
        enabled: this.config.reminders.enabled,
        running: true, // ReminderService 沒有提供運行狀態，假設總是運行
      },
    };
  }

  /**
   * 健康檢查
   */
  static async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    services: {
      aiMatching: "ok" | "error";
      geofence: "ok" | "error";
      reminders: "ok" | "error";
    };
    message?: string;
  }> {
    const services = {
      aiMatching: "ok" as "ok" | "error",
      geofence: "ok" as "ok" | "error",
      reminders: "ok" as "ok" | "error",
    };

    let healthyCount = 0;

    // 檢查 AI 配對服務
    try {
      const aiStatus = AIMatchingService.getStatus();
      if (aiStatus.enabled && !aiStatus.running) {
        services.aiMatching = "error";
      } else {
        healthyCount++;
      }
    } catch (error) {
      services.aiMatching = "error";
    }

    // 檢查地理圍欄服務
    try {
      const geofenceStats = GeofenceService.getStats();
      if (geofenceStats.enabled && !geofenceStats.running) {
        services.geofence = "error";
      } else {
        healthyCount++;
      }
    } catch (error) {
      services.geofence = "error";
    }

    // 檢查提醒服務
    try {
      const reminderStats = await ReminderService.getStats();
      if (reminderStats.enabled && !reminderStats.running) {
        services.reminders = "error";
      } else {
        healthyCount++;
      }
    } catch (error) {
      services.reminders = "error";
    }

    let status: "healthy" | "degraded" | "unhealthy";
    let message: string | undefined;

    if (healthyCount === 3) {
      status = "healthy";
    } else if (healthyCount >= 1) {
      status = "degraded";
      message = `${3 - healthyCount} 個服務出現問題`;
    } else {
      status = "unhealthy";
      message = "所有服務都出現問題";
    }

    return {
      status,
      services,
      message,
    };
  }
}

// 導出所有相關類型和服務
export {
  AIMatchingService,
  GeofenceService,
  ReminderService,
  NotificationStatisticsService,
  AIMatchingConfig,
  GeofenceConfig,
  GeofenceArea,
  ReminderConfig,
  SmartNotificationStats,
  UserNotificationStats,
};

// 創建默認實例
export const smartNotificationService = SmartNotificationService;
