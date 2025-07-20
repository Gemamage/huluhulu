import { NotificationService } from "../notificationService";
import { MatchingService } from "../matchingService";
import { Pet, IPet } from "../../models/Pet";
import { User } from "../../models/User";
import {
  NotificationType,
  NotificationPriority,
} from "../../models/Notification";
import { logger } from "../../utils/logger";

export interface GeofenceArea {
  center: [number, number]; // [longitude, latitude]
  radius: number; // in kilometers
  userId: string;
  petId: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface GeofenceConfig {
  enabled: boolean;
  defaultRadius: number; // in kilometers
  checkInterval: number; // in minutes
}

export class GeofenceService {
  private static config: GeofenceConfig = {
    enabled: true,
    defaultRadius: 10, // 10km
    checkInterval: 15, // 15 minutes
  };

  private static geofenceAreas: Map<string, GeofenceArea> = new Map();
  private static interval: NodeJS.Timeout | null = null;

  /**
   * 初始化地理圍欄服務
   */
  static async initialize(config?: Partial<GeofenceConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 載入現有的地理圍欄
    await this.loadGeofenceAreas();

    this.start();
    logger.info("地理圍欄服務已初始化", { config: this.config });
  }

  /**
   * 啟動地理圍欄任務
   */
  static start(): void {
    if (!this.config.enabled || this.interval) return;

    const intervalMs = this.config.checkInterval * 60 * 1000;

    this.interval = setInterval(async () => {
      try {
        await this.processGeofenceNotifications();
      } catch (error) {
        logger.error("地理圍欄通知任務失敗", { error });
      }
    }, intervalMs);

    logger.info("地理圍欄通知任務已啟動", {
      interval: this.config.checkInterval,
    });
  }

  /**
   * 停止地理圍欄任務
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info("地理圍欄通知任務已停止");
    }
  }

  /**
   * 處理地理圍欄通知
   */
  private static async processGeofenceNotifications(): Promise<void> {
    try {
      // 檢查每個活躍的地理圍欄
      for (const [areaId, area] of this.geofenceAreas) {
        if (!area.isActive) continue;

        try {
          await this.checkGeofenceArea(area);
        } catch (error) {
          logger.error("檢查地理圍欄失敗", {
            areaId,
            error,
          });
        }
      }
    } catch (error) {
      logger.error("地理圍欄處理失敗", { error });
    }
  }

  /**
   * 檢查地理圍欄區域
   */
  private static async checkGeofenceArea(area: GeofenceArea): Promise<void> {
    const targetPet = await Pet.findById(area.petId);
    if (!targetPet) {
      // 寵物不存在，移除地理圍欄
      this.geofenceAreas.delete(area.petId);
      return;
    }

    // 如果寵物已找到，停用地理圍欄
    if (targetPet.status === "reunited") {
      area.isActive = false;
      return;
    }

    // 查找圍欄內的相關寵物
    const targetStatus = targetPet.status === "lost" ? "found" : "lost";
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小時內

    const nearbyPets = await Pet.find({
      _id: { $ne: area.petId },
      status: targetStatus,
      createdAt: { $gte: recentThreshold },
      location: {
        $geoWithin: {
          $centerSphere: [
            area.center,
            area.radius / 6371, // 轉換為弧度
          ],
        },
      },
    }).populate("owner");

    if (nearbyPets.length > 0) {
      await this.sendGeofenceNotification(area, targetPet, nearbyPets);
    }
  }

  /**
   * 發送地理圍欄通知
   */
  private static async sendGeofenceNotification(
    area: GeofenceArea,
    targetPet: IPet,
    nearbyPets: IPet[],
  ): Promise<void> {
    const distances = nearbyPets
      .map((pet) => {
        const distance = MatchingService.calculateDistance(
          area.center,
          // 暫時跳過地理坐標檢查，因為 Pet 模型中沒有 location.coordinates 字段
          // TODO: 添加地理坐標字段到 Pet 模型
          [0, 0], // 暫時使用默認坐標
        );
        return { pet, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const closestPet = distances[0];

    if (closestPet) {
      await NotificationService.sendNotification({
        userId: area.userId,
        type: "GEOFENCE_ALERT" as NotificationType,
        title: "📍 地理圍欄警報",
        message: `在您設定的 ${area.radius}km 範圍內發現了 ${nearbyPets.length} 隻${targetPet.status === "lost" ? "拾獲" : "失蹤"}的寵物，最近距離 ${Math.round(closestPet.distance * 100) / 100}km`,
        data: {
          petId: targetPet._id.toString(),
          geofenceId: area.petId,
          nearbyCount: nearbyPets.length,
          closestDistance: Math.round(closestPet.distance * 100) / 100,
          nearbyPets: distances.slice(0, 3).map((d) => ({
            petId: d.pet._id.toString(),
            name: d.pet.name,
            distance: Math.round(d.distance * 100) / 100,
          })),
        },
        priority: NotificationPriority.HIGH,
      });
    }
  }

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
    const { userId, petId, latitude, longitude, radius, name } = data;
    const center: [number, number] = [longitude, latitude];

    const geofenceArea: GeofenceArea = {
      center,
      radius: radius || this.config.defaultRadius,
      userId,
      petId,
      name: name || `${petId} 的地理圍欄`,
      isActive: true,
      createdAt: new Date(),
    };

    this.geofenceAreas.set(petId, geofenceArea);

    // 保存到資料庫（可選）
    await this.saveGeofenceArea(geofenceArea);

    logger.info("地理圍欄已創建", {
      userId,
      petId,
      center,
      radius: geofenceArea.radius,
    });

    return geofenceArea;
  }

  /**
   * 移除地理圍欄
   */
  static async removeGeofence(
    userId: string,
    geofenceId: string,
  ): Promise<boolean> {
    const geofence = this.geofenceAreas.get(geofenceId);

    if (!geofence || geofence.userId !== userId) {
      throw new Error("地理圍欄不存在或無權限");
    }

    const removed = this.geofenceAreas.delete(geofenceId);

    if (removed) {
      // 從資料庫移除（可選）
      await this.deleteGeofenceArea(geofenceId);
      logger.info("地理圍欄已移除", { userId, geofenceId });
    }

    return removed;
  }

  /**
   * 獲取用戶的地理圍欄列表
   */
  static async getUserGeofences(userId: string): Promise<GeofenceArea[]> {
    const userGeofences: GeofenceArea[] = [];

    for (const [petId, geofence] of this.geofenceAreas.entries()) {
      if (geofence.userId === userId && geofence.isActive) {
        userGeofences.push(geofence);
      }
    }

    return userGeofences;
  }

  /**
   * 載入地理圍欄區域
   */
  private static async loadGeofenceAreas(): Promise<void> {
    // 這裡可以從資料庫載入已保存的地理圍欄
    // 暫時使用記憶體存儲
    logger.info("地理圍欄區域已載入");
  }

  /**
   * 保存地理圍欄區域
   */
  private static async saveGeofenceArea(area: GeofenceArea): Promise<void> {
    // 這裡可以保存到資料庫
    // 暫時跳過
  }

  /**
   * 刪除地理圍欄區域
   */
  private static async deleteGeofenceArea(petId: string): Promise<void> {
    // 這裡可以從資料庫刪除
    // 暫時跳過
  }

  /**
   * 獲取配置
   */
  static getConfig(): GeofenceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  static updateConfig(newConfig: Partial<GeofenceConfig>): GeofenceConfig {
    this.config = { ...this.config, ...newConfig };

    // 如果啟用狀態改變，重新啟動或停止服務
    if (newConfig.enabled !== undefined) {
      this.stop();
      if (newConfig.enabled) {
        this.start();
      }
    }

    logger.info("地理圍欄配置已更新", { config: this.config });
    return { ...this.config };
  }

  /**
   * 獲取統計信息
   */
  static getStats(): {
    enabled: boolean;
    running: boolean;
    totalAreas: number;
    activeAreas: number;
    config: GeofenceConfig;
  } {
    const activeAreas = Array.from(this.geofenceAreas.values()).filter(
      (area) => area.isActive,
    ).length;

    return {
      enabled: this.config.enabled,
      running: this.interval !== null,
      totalAreas: this.geofenceAreas.size,
      activeAreas,
      config: { ...this.config },
    };
  }
}
