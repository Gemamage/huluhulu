import { NotificationService } from "../notificationService";
import { Pet, IPet } from "../../models/Pet";
import { User, IUser } from "../../models/User";
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from "../../models/Notification";
import { logger } from "../../utils/logger";

export interface ReminderConfig {
  enabled: boolean;
  intervals: number[]; // days after pet lost/found
  maxReminders: number;
}

export class ReminderService {
  private static config: ReminderConfig = {
    enabled: true,
    intervals: [1, 3, 7, 14, 30], // 1天, 3天, 1週, 2週, 1個月
    maxReminders: 5,
  };

  private static interval: NodeJS.Timeout | null = null;

  /**
   * 初始化提醒服務
   */
  static initialize(config?: Partial<ReminderConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.start();
    logger.info("提醒服務已初始化", { config: this.config });
  }

  /**
   * 啟動提醒任務
   */
  static start(): void {
    if (!this.config.enabled || this.interval) return;

    // 每小時檢查一次提醒
    this.interval = setInterval(
      async () => {
        try {
          await this.processReminders();
        } catch (error) {
          logger.error("定期提醒任務失敗", { error });
        }
      },
      60 * 60 * 1000,
    ); // 1小時

    logger.info("定期提醒任務已啟動");
  }

  /**
   * 停止提醒任務
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info("定期提醒任務已停止");
    }
  }

  /**
   * 處理定期提醒
   */
  private static async processReminders(): Promise<void> {
    try {
      const now = new Date();

      for (const days of this.config.intervals) {
        const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        );
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        // 查找在目標日期創建且仍未找到的寵物
        const pets = await Pet.find({
          status: { $in: ["lost", "found"] },
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        }).populate("owner");

        for (const pet of pets) {
          try {
            // 檢查是否已發送過此提醒
            const existingReminder = await Notification.findOne({
              userId: pet.userId,
              type: "REMINDER",
              "data.petId": pet._id.toString(),
              "data.reminderDay": days,
            });

            if (!existingReminder) {
              await this.sendReminderNotification(pet, days);
            }
          } catch (error) {
            logger.error("發送提醒通知失敗", {
              petId: pet._id,
              days,
              error,
            });
          }
        }
      }
    } catch (error) {
      logger.error("處理定期提醒失敗", { error });
    }
  }

  /**
   * 發送提醒通知
   */
  private static async sendReminderNotification(
    pet: IPet,
    days: number,
  ): Promise<void> {
    const owner = (await User.findById(pet.userId)) as IUser;
    const isLost = pet.status === "lost";

    let title: string;
    let message: string;

    if (days === 1) {
      title = isLost ? "🔍 持續尋找中" : "📢 持續協尋中";
      message = `您的${isLost ? "失蹤" : "拾獲"}寵物 ${pet.name} 已經${days}天了，建議您更新資訊或擴大搜尋範圍。`;
    } else if (days <= 7) {
      title = isLost ? "💪 不要放棄" : "🤝 繼續協助";
      message = `${pet.name} 已經${isLost ? "失蹤" : "等待認領"}${days}天了，我們建議您分享到更多社群平台。`;
    } else {
      title = isLost ? "🌟 保持希望" : "❤️ 感謝您的愛心";
      message = `${pet.name} 已經${days}天了，雖然時間較長，但仍有很多成功案例。建議聯繫當地動物收容所。`;
    }

    await NotificationService.sendNotification({
      userId: owner._id.toString(),
      type: "REMINDER" as NotificationType,
      title,
      message,
      data: {
        petId: pet._id.toString(),
        reminderDay: days,
        suggestions: this.getReminderSuggestions(pet, days),
      },
      priority:
        days <= 3 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
    });
  }

  /**
   * 獲取提醒建議
   */
  private static getReminderSuggestions(pet: IPet, days: number): string[] {
    const suggestions: string[] = [];
    const isLost = pet.status === "lost";

    if (days === 1) {
      suggestions.push(
        isLost ? "在附近張貼尋寵啟事" : "聯繫當地動物收容所",
        "分享到社群媒體",
        "通知鄰居和朋友",
      );
    } else if (days <= 7) {
      suggestions.push(
        "擴大搜尋範圍",
        "聯繫獸醫診所",
        "在寵物相關論壇發布",
        "考慮提供獎勵",
      );
    } else {
      suggestions.push(
        "聯繫動物收容所和救援組織",
        "在更多平台發布資訊",
        "考慮專業尋寵服務",
        "保持資訊更新",
      );
    }

    return suggestions;
  }

  /**
   * 手動發送提醒
   */
  static async sendManualReminder(
    userId: string,
    petId: string,
    customMessage?: string,
  ): Promise<void> {
    const pet = await Pet.findOne({ _id: petId, owner: userId });
    if (!pet) {
      throw new Error("寵物不存在或無權限");
    }

    const owner = (await User.findById(userId)) as IUser;
    const daysSinceCreated = Math.floor(
      (Date.now() - pet.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );

    await NotificationService.sendNotification({
      userId: owner._id.toString(),
      type: "REMINDER" as NotificationType,
      title: "📝 手動提醒",
      message:
        customMessage ||
        `關於您的${pet.status === "lost" ? "失蹤" : "拾獲"}寵物 ${pet.name} 的提醒`,
      data: {
        petId: pet._id.toString(),
        reminderDay: daysSinceCreated,
        isManual: true,
        suggestions: this.getReminderSuggestions(pet, daysSinceCreated),
      },
      priority: NotificationPriority.NORMAL,
    });

    logger.info("手動提醒已發送", { userId, petId });
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
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 預設 30 天前
    const end = endDate || new Date();

    const reminders = await Notification.find({
      userId,
      type: "REMINDER",
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    const remindersByDay: Record<number, number> = {};
    let lastReminderDate: Date | undefined;

    for (const reminder of reminders) {
      const day = reminder.data?.reminderDay as number;
      if (day !== undefined) {
        remindersByDay[day] = (remindersByDay[day] || 0) + 1;
      }

      if (!lastReminderDate || reminder.createdAt > lastReminderDate) {
        lastReminderDate = reminder.createdAt;
      }
    }

    return {
      totalReminders: reminders.length,
      remindersByDay,
      lastReminderDate,
    };
  }

  /**
   * 獲取配置
   */
  static getConfig(): ReminderConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  static updateConfig(newConfig: Partial<ReminderConfig>): ReminderConfig {
    this.config = { ...this.config, ...newConfig };

    // 如果啟用狀態改變，重新啟動或停止服務
    if (newConfig.enabled !== undefined) {
      this.stop();
      if (newConfig.enabled) {
        this.start();
      }
    }

    logger.info("提醒配置已更新", { config: this.config });
    return { ...this.config };
  }

  /**
   * 獲取統計信息
   */
  static async getStats(): Promise<{
    enabled: boolean;
    running: boolean;
    sentToday: number;
    config: ReminderConfig;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const sentToday = await Notification.countDocuments({
      type: "REMINDER",
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    return {
      enabled: this.config.enabled,
      running: this.interval !== null,
      sentToday,
      config: { ...this.config },
    };
  }
}
