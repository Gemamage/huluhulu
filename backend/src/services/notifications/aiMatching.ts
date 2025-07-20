import { NotificationService } from "../notificationService";
import { MatchingService } from "../matchingService";
import { Pet, IPet } from "../../models/Pet";
import { User, IUser } from "../../models/User";
import {
  NotificationType,
  NotificationPriority,
} from "../../models/Notification";
import { logger } from "../../utils/logger";

export interface AIMatchingConfig {
  enabled: boolean;
  minSimilarity: number;
  checkInterval: number; // in minutes
  maxDistance: number; // in kilometers
}

export class AIMatchingService {
  private static config: AIMatchingConfig = {
    enabled: true,
    minSimilarity: 0.75,
    checkInterval: 30, // 30 minutes
    maxDistance: 50, // 50km
  };

  private static interval: NodeJS.Timeout | null = null;
  private static lastRun: Date | null = null;

  /**
   * 初始化 AI 配對服務
   */
  static initialize(config?: Partial<AIMatchingConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.start();
    logger.info("AI 配對服務已初始化", { config: this.config });
  }

  /**
   * 啟動 AI 配對任務
   */
  static start(): void {
    if (!this.config.enabled || this.interval) return;

    const intervalMs = this.config.checkInterval * 60 * 1000;

    this.interval = setInterval(async () => {
      try {
        await this.processAIMatching();
      } catch (error) {
        logger.error("AI 配對通知任務失敗", { error });
      }
    }, intervalMs);

    logger.info("AI 配對通知任務已啟動", {
      interval: this.config.checkInterval,
    });
  }

  /**
   * 停止 AI 配對任務
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info("AI 配對通知任務已停止");
    }
  }

  /**
   * 處理 AI 配對通知
   */
  private static async processAIMatching(): Promise<void> {
    try {
      this.lastRun = new Date();

      // 獲取最近 24 小時內新增的寵物
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentPets = await Pet.find({
        createdAt: { $gte: yesterday },
        status: { $in: ["lost", "found"] },
        "aiData.features": { $exists: true, $ne: null },
      }).populate("owner");

      for (const pet of recentPets) {
        try {
          await this.processSinglePetAIMatching(pet);
        } catch (error) {
          logger.error("處理寵物 AI 配對失敗", {
            petId: pet._id,
            error,
          });
        }
      }
    } catch (error) {
      logger.error("AI 配對處理失敗", { error });
    }
  }

  /**
   * 處理單個寵物的 AI 配對
   */
  static async processSinglePetAIMatching(pet: IPet): Promise<{
    matchesFound: number;
    notificationsSent: number;
  }> {
    try {
      const potentialMatches = await MatchingService.findPotentialMatches(
        pet._id.toString(),
        {
          minSimilarity: this.config.minSimilarity,
          maxDistance: this.config.maxDistance,
          maxDays: 1, // 只檢查最近一天
        },
      );

      if (potentialMatches.length > 0) {
        // 發送 AI 配對通知
        await this.sendAIMatchNotification(pet, potentialMatches);
        return {
          matchesFound: potentialMatches.length,
          notificationsSent: 1,
        };
      }

      return {
        matchesFound: 0,
        notificationsSent: 0,
      };
    } catch (error) {
      logger.error("處理寵物 AI 配對失敗", {
        petId: pet._id,
        error,
      });
      throw error;
    }
  }

  /**
   * 發送 AI 配對通知
   */
  private static async sendAIMatchNotification(
    pet: IPet,
    matches: any[],
  ): Promise<void> {
    const owner = (await User.findById(pet.userId)) as IUser;
    const bestMatch = matches[0];
    const similarity = Math.round(bestMatch.similarity * 100);

    await NotificationService.sendNotification({
      userId: owner._id.toString(),
      type: "AI_MATCH_SUGGESTION" as NotificationType,
      title: "🤖 AI 發現潛在配對",
      message: `AI 為您的${pet.status === "lost" ? "失蹤" : "拾獲"}寵物 ${pet.name} 找到了 ${matches.length} 個潛在配對，最高相似度 ${similarity}%`,
      data: {
        petId: pet._id.toString(),
        matchCount: matches.length,
        bestSimilarity: similarity,
        matches: matches.slice(0, 3).map((m) => ({
          petId: pet.status === "lost" ? m.foundPet._id : m.lostPet._id,
          similarity: Math.round(m.similarity * 100),
          distance: Math.round(m.distance || 0),
        })),
      },
      priority: NotificationPriority.HIGH,
    });
  }

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
    try {
      let pets: IPet[];

      if (petId) {
        const pet = await Pet.findOne({ _id: petId, owner: userId });
        if (!pet) {
          throw new Error("寵物不存在或無權限");
        }
        pets = [pet];
      } else {
        pets = await Pet.find({
          owner: userId,
          status: { $in: ["lost", "found"] },
        }).populate("owner");
      }

      let totalMatches = 0;
      let totalNotifications = 0;

      for (const pet of pets) {
        const result = await this.processSinglePetAIMatching(pet);
        totalMatches += result.matchesFound;
        totalNotifications += result.notificationsSent;
      }

      return {
        matchesFound: totalMatches,
        notificationsSent: totalNotifications,
        message: `已檢查 ${pets.length} 隻寵物，找到 ${totalMatches} 個潛在配對，發送 ${totalNotifications} 個通知`,
      };
    } catch (error) {
      logger.error("手動觸發 AI 配對失敗", { userId, petId, error });
      throw error;
    }
  }

  /**
   * 獲取配置
   */
  static getConfig(): AIMatchingConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  static updateConfig(newConfig: Partial<AIMatchingConfig>): AIMatchingConfig {
    this.config = { ...this.config, ...newConfig };

    // 如果啟用狀態改變，重新啟動或停止服務
    if (newConfig.enabled !== undefined) {
      this.stop();
      if (newConfig.enabled) {
        this.start();
      }
    }

    logger.info("AI 配對配置已更新", { config: this.config });
    return { ...this.config };
  }

  /**
   * 獲取最後運行時間
   */
  static getLastRun(): Date | null {
    return this.lastRun;
  }

  /**
   * 獲取運行狀態
   */
  static getStatus(): {
    enabled: boolean;
    running: boolean;
    lastRun: Date | null;
    config: AIMatchingConfig;
  } {
    return {
      enabled: this.config.enabled,
      running: this.interval !== null,
      lastRun: this.lastRun,
      config: { ...this.config },
    };
  }
}
