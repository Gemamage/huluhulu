import { NotificationService } from './notificationService';
import { MatchingService } from './matchingService';
import { Pet, IPet } from '../models/Pet';
import { User, IUser } from '../models/User';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface GeofenceArea {
  center: [number, number]; // [longitude, latitude]
  radius: number; // in kilometers
  userId: string;
  petId: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SmartNotificationConfig {
  aiMatching: {
    enabled: boolean;
    minSimilarity: number;
    checkInterval: number; // in minutes
    maxDistance: number; // in kilometers
  };
  geofence: {
    enabled: boolean;
    defaultRadius: number; // in kilometers
    checkInterval: number; // in minutes
  };
  reminders: {
    enabled: boolean;
    intervals: number[]; // days after pet lost/found
    maxReminders: number;
  };
}

const DEFAULT_CONFIG: SmartNotificationConfig = {
  aiMatching: {
    enabled: true,
    minSimilarity: 0.75,
    checkInterval: 30, // 30 minutes
    maxDistance: 50 // 50km
  },
  geofence: {
    enabled: true,
    defaultRadius: 10, // 10km
    checkInterval: 15 // 15 minutes
  },
  reminders: {
    enabled: true,
    intervals: [1, 3, 7, 14, 30], // 1天, 3天, 1週, 2週, 1個月
    maxReminders: 5
  }
};

export class SmartNotificationService {
  private static config: SmartNotificationConfig = DEFAULT_CONFIG;
  private static geofenceAreas: Map<string, GeofenceArea> = new Map();
  private static aiMatchingInterval: NodeJS.Timeout | null = null;
  private static geofenceInterval: NodeJS.Timeout | null = null;
  private static reminderInterval: NodeJS.Timeout | null = null;
  private static lastAIMatchingRun: Date | null = null;

  /**
   * 初始化智能通知服務
   */
  static async initialize(config?: Partial<SmartNotificationConfig>): Promise<void> {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // 載入現有的地理圍欄
    await this.loadGeofenceAreas();

    // 啟動各種智能通知任務
    this.startAIMatchingTask();
    this.startGeofenceTask();
    this.startReminderTask();

    logger.info('智能通知服務已初始化', { config: this.config });
  }

  /**
   * 停止智能通知服務
   */
  static stop(): void {
    if (this.aiMatchingInterval) {
      clearInterval(this.aiMatchingInterval);
      this.aiMatchingInterval = null;
    }

    if (this.geofenceInterval) {
      clearInterval(this.geofenceInterval);
      this.geofenceInterval = null;
    }

    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }

    logger.info('智能通知服務已停止');
  }

  /**
   * 啟動 AI 配對通知任務
   */
  private static startAIMatchingTask(): void {
    if (!this.config.aiMatching.enabled) return;

    const intervalMs = this.config.aiMatching.checkInterval * 60 * 1000;
    
    this.aiMatchingInterval = setInterval(async () => {
      try {
        await this.processAIMatching();
      } catch (error) {
        logger.error('AI 配對通知任務失敗', { error });
      }
    }, intervalMs);

    logger.info('AI 配對通知任務已啟動', { 
      interval: this.config.aiMatching.checkInterval 
    });
  }

  /**
   * 處理 AI 配對通知
   */
  private static async processAIMatching(): Promise<void> {
    try {
      this.lastAIMatchingRun = new Date();
      
      // 獲取最近 24 小時內新增的寵物
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentPets = await Pet.find({
        createdAt: { $gte: yesterday },
        status: { $in: ['lost', 'found'] },
        'aiData.features': { $exists: true, $ne: null }
      }).populate('owner');

      for (const pet of recentPets) {
        try {
          await this.processSinglePetAIMatching(pet);
        } catch (error) {
          logger.error('處理寵物 AI 配對失敗', { 
            petId: pet._id, 
            error 
          });
        }
      }
    } catch (error) {
      logger.error('AI 配對處理失敗', { error });
    }
  }

  /**
   * 處理單個寵物的 AI 配對
   */
  private static async processSinglePetAIMatching(pet: IPet): Promise<{
    matchesFound: number;
    notificationsSent: number;
  }> {
    try {
      const potentialMatches = await MatchingService.findPotentialMatches(
        pet._id.toString(),
        {
          minSimilarity: this.config.aiMatching.minSimilarity,
          maxDistance: this.config.aiMatching.maxDistance,
          maxDays: 1 // 只檢查最近一天
        }
      );

      if (potentialMatches.length > 0) {
        // 發送 AI 配對通知
        await this.sendAIMatchNotification(pet, potentialMatches);
        return {
          matchesFound: potentialMatches.length,
          notificationsSent: 1
        };
      }

      return {
        matchesFound: 0,
        notificationsSent: 0
      };
    } catch (error) {
      logger.error('處理寵物 AI 配對失敗', { 
        petId: pet._id, 
        error 
      });
      throw error;
    }
  }

  /**
   * 發送 AI 配對通知
   */
  private static async sendAIMatchNotification(
    pet: IPet,
    matches: any[]
  ): Promise<void> {
    const owner = await User.findById(pet.userId) as IUser;
    const bestMatch = matches[0];
    const similarity = Math.round(bestMatch.similarity * 100);

    await NotificationService.sendNotification({
      userId: owner._id.toString(),
      type: 'AI_MATCH_SUGGESTION' as NotificationType,
      title: '🤖 AI 發現潛在配對',
      message: `AI 為您的${pet.status === 'lost' ? '失蹤' : '拾獲'}寵物 ${pet.name} 找到了 ${matches.length} 個潛在配對，最高相似度 ${similarity}%`,
      data: {
        petId: pet._id.toString(),
        matchCount: matches.length,
        bestSimilarity: similarity,
        matches: matches.slice(0, 3).map(m => ({
          petId: pet.status === 'lost' ? m.foundPet._id : m.lostPet._id,
          similarity: Math.round(m.similarity * 100),
          distance: Math.round(m.distance || 0)
        }))
      },
      priority: NotificationPriority.HIGH
    });
  }

  /**
   * 啟動地理圍欄通知任務
   */
  private static startGeofenceTask(): void {
    if (!this.config.geofence.enabled) return;

    const intervalMs = this.config.geofence.checkInterval * 60 * 1000;
    
    this.geofenceInterval = setInterval(async () => {
      try {
        await this.processGeofenceNotifications();
      } catch (error) {
        logger.error('地理圍欄通知任務失敗', { error });
      }
    }, intervalMs);

    logger.info('地理圍欄通知任務已啟動', { 
      interval: this.config.geofence.checkInterval 
    });
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
          logger.error('檢查地理圍欄失敗', { 
            areaId, 
            error 
          });
        }
      }
    } catch (error) {
      logger.error('地理圍欄處理失敗', { error });
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
    if (targetPet.status === 'reunited') {
      area.isActive = false;
      return;
    }

    // 查找圍欄內的相關寵物
    const targetStatus = targetPet.status === 'lost' ? 'found' : 'lost';
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小時內

    const nearbyPets = await Pet.find({
      _id: { $ne: area.petId },
      status: targetStatus,
      createdAt: { $gte: recentThreshold },
      location: {
        $geoWithin: {
          $centerSphere: [
            area.center,
            area.radius / 6371 // 轉換為弧度
          ]
        }
      }
    }).populate('owner');

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
    nearbyPets: IPet[]
  ): Promise<void> {
    const distances = nearbyPets.map(pet => {
      const distance = MatchingService.calculateDistance(
        area.center,
        // 暫時跳過地理坐標檢查，因為 Pet 模型中沒有 location.coordinates 字段
        // TODO: 添加地理坐標字段到 Pet 模型
        [0, 0] // 暫時使用默認坐標
      );
      return { pet, distance };
    }).sort((a, b) => a.distance - b.distance);

    const closestPet = distances[0];

    if (closestPet) {
      await NotificationService.sendNotification({
        userId: area.userId,
        type: 'GEOFENCE_ALERT' as NotificationType,
        title: '📍 地理圍欄警報',
        message: `在您設定的 ${area.radius}km 範圍內發現了 ${nearbyPets.length} 隻${targetPet.status === 'lost' ? '拾獲' : '失蹤'}的寵物，最近距離 ${Math.round(closestPet.distance * 100) / 100}km`,
        data: {
          petId: targetPet._id.toString(),
          geofenceId: area.petId,
          nearbyCount: nearbyPets.length,
          closestDistance: Math.round(closestPet.distance * 100) / 100,
          nearbyPets: distances.slice(0, 3).map(d => ({
            petId: d.pet._id.toString(),
            name: d.pet.name,
            distance: Math.round(d.distance * 100) / 100
          }))
        },
        priority: NotificationPriority.HIGH
      });
    }
  }

  /**
   * 啟動定期提醒任務
   */
  private static startReminderTask(): void {
    if (!this.config.reminders.enabled) return;

    // 每小時檢查一次提醒
    this.reminderInterval = setInterval(async () => {
      try {
        await this.processReminders();
      } catch (error) {
        logger.error('定期提醒任務失敗', { error });
      }
    }, 60 * 60 * 1000); // 1小時

    logger.info('定期提醒任務已啟動');
  }

  /**
   * 處理定期提醒
   */
  private static async processReminders(): Promise<void> {
    try {
      const now = new Date();
      
      for (const days of this.config.reminders.intervals) {
        const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        // 查找在目標日期創建且仍未找到的寵物
        const pets = await Pet.find({
          status: { $in: ['lost', 'found'] },
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }).populate('owner');

        for (const pet of pets) {
          try {
            // 檢查是否已發送過此提醒
            const existingReminder = await Notification.findOne({
              userId: pet.userId,
              type: 'REMINDER',
              'data.petId': pet._id.toString(),
              'data.reminderDay': days
            });

            if (!existingReminder) {
              await this.sendReminderNotification(pet, days);
            }
          } catch (error) {
            logger.error('發送提醒通知失敗', { 
              petId: pet._id, 
              days, 
              error 
            });
          }
        }
      }
    } catch (error) {
      logger.error('處理定期提醒失敗', { error });
    }
  }

  /**
   * 發送提醒通知
   */
  private static async sendReminderNotification(
    pet: IPet,
    days: number
  ): Promise<void> {
    const owner = await User.findById(pet.userId) as IUser;
    const isLost = pet.status === 'lost';
    
    let title: string;
    let message: string;
    
    if (days === 1) {
      title = isLost ? '🔍 持續尋找中' : '📢 持續協尋中';
      message = `您的${isLost ? '失蹤' : '拾獲'}寵物 ${pet.name} 已經${days}天了，建議您更新資訊或擴大搜尋範圍。`;
    } else if (days <= 7) {
      title = isLost ? '💪 不要放棄' : '🤝 繼續協助';
      message = `${pet.name} 已經${isLost ? '失蹤' : '等待認領'}${days}天了，我們建議您分享到更多社群平台。`;
    } else {
      title = isLost ? '🌟 保持希望' : '❤️ 感謝您的愛心';
      message = `${pet.name} 已經${days}天了，雖然時間較長，但仍有很多成功案例。建議聯繫當地動物收容所。`;
    }

    await NotificationService.sendNotification({
      userId: owner._id.toString(),
      type: 'REMINDER' as NotificationType,
      title,
      message,
      data: {
        petId: pet._id.toString(),
        reminderDay: days,
        suggestions: this.getReminderSuggestions(pet, days)
      },
      priority: days <= 3 ? NotificationPriority.HIGH : NotificationPriority.NORMAL
    });
  }

  /**
   * 獲取提醒建議
   */
  private static getReminderSuggestions(pet: IPet, days: number): string[] {
    const suggestions: string[] = [];
    const isLost = pet.status === 'lost';

    if (days === 1) {
      suggestions.push(
        isLost ? '在附近張貼尋寵啟事' : '聯繫當地動物收容所',
        '分享到社群媒體',
        '通知鄰居和朋友'
      );
    } else if (days <= 7) {
      suggestions.push(
        '擴大搜尋範圍',
        '聯繫獸醫診所',
        '在寵物相關論壇發布',
        '考慮提供獎勵'
      );
    } else {
      suggestions.push(
        '聯繫動物收容所和救援組織',
        '在更多平台發布資訊',
        '考慮專業尋寵服務',
        '保持資訊更新'
      );
    }

    return suggestions;
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
      radius: radius || this.config.geofence.defaultRadius,
      userId,
      petId,
      name: name || `${petId} 的地理圍欄`,
      isActive: true,
      createdAt: new Date()
    };

    this.geofenceAreas.set(petId, geofenceArea);
    
    // 保存到資料庫（可選）
    await this.saveGeofenceArea(geofenceArea);

    logger.info('地理圍欄已創建', { 
      userId, 
      petId, 
      center, 
      radius: geofenceArea.radius 
    });

    return geofenceArea;
  }

  /**
   * 移除地理圍欄
   */
  static async removeGeofence(userId: string, geofenceId: string): Promise<boolean> {
    const geofence = this.geofenceAreas.get(geofenceId);
    
    if (!geofence || geofence.userId !== userId) {
      throw new Error('地理圍欄不存在或無權限');
    }
    
    const removed = this.geofenceAreas.delete(geofenceId);
    
    if (removed) {
      // 從資料庫移除（可選）
      await this.deleteGeofenceArea(geofenceId);
      logger.info('地理圍欄已移除', { userId, geofenceId });
    }

    return removed;
  }

  /**
   * 載入地理圍欄區域
   */
  private static async loadGeofenceAreas(): Promise<void> {
    // 這裡可以從資料庫載入已保存的地理圍欄
    // 暫時使用記憶體存儲
    logger.info('地理圍欄區域已載入');
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
   * 獲取智能通知統計
   */
  static async getSmartNotificationStats(): Promise<{
    aiMatching: { enabled: boolean; lastRun?: Date; matchesFound: number };
    geofence: { enabled: boolean; activeAreas: number };
    reminders: { enabled: boolean; sentToday: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const remindersSentToday = await Notification.countDocuments({
      type: 'REMINDER',
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    return {
      aiMatching: {
        enabled: this.config.aiMatching.enabled,
        matchesFound: 0 // 可以從統計中獲取
      },
      geofence: {
        enabled: this.config.geofence.enabled,
        activeAreas: Array.from(this.geofenceAreas.values())
          .filter(area => area.isActive).length
      },
      reminders: {
        enabled: this.config.reminders.enabled,
        sentToday: remindersSentToday
      }
    };
  }



  /**
   * 獲取用戶配置
   */
  static async getConfig(userId: string): Promise<SmartNotificationConfig> {
    // 這裡可以從資料庫獲取用戶特定配置
    // 暫時返回全域配置
    return { ...this.config };
  }

  /**
   * 更新用戶配置
   */
  static async updateConfig(userId: string, newConfig: Partial<SmartNotificationConfig>): Promise<SmartNotificationConfig> {
    // 這裡可以保存用戶特定配置到資料庫
    // 暫時更新全域配置
    this.config = { ...this.config, ...newConfig };
    logger.info('智能通知配置已更新', { userId, config: this.config });
    return { ...this.config };
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
   * 手動觸發 AI 配對檢查
   */
  static async triggerAIMatching(userId: string, petId?: string): Promise<{
    matchesFound: number;
    notificationsSent: number;
    message: string;
  }> {
    try {
      let pets: IPet[];
      
      if (petId) {
        const pet = await Pet.findOne({ _id: petId, owner: userId });
        if (!pet) {
          throw new Error('寵物不存在或無權限');
        }
        pets = [pet];
      } else {
        pets = await Pet.find({ 
          owner: userId, 
          status: { $in: ['lost', 'found'] } 
        }).populate('owner');
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
        message: `已檢查 ${pets.length} 隻寵物，找到 ${totalMatches} 個潛在配對，發送 ${totalNotifications} 個通知`
      };
    } catch (error) {
      logger.error('手動觸發 AI 配對失敗', { userId, petId, error });
      throw error;
    }
  }

  /**
   * 獲取智能通知統計（用戶特定）
   */
  static async getSmartNotificationStatistics(options: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    aiMatching: { enabled: boolean; matchesFound: number; lastRun?: Date };
    geofencing: { enabled: boolean; activeAreas: number };
    reminders: { enabled: boolean; sentCount: number };
    totalNotifications: number;
  }> {
    const { userId, startDate, endDate } = options;
    
    // 設定日期範圍
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 預設 30 天前
    const end = endDate || new Date();

    // 統計通知數量
    const notificationStats = await Notification.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = notificationStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // 統計用戶的地理圍欄
    const userGeofences = await this.getUserGeofences(userId);

    return {
      aiMatching: {
        enabled: this.config.aiMatching.enabled,
        matchesFound: stats['AI_MATCH'] || 0,
        lastRun: this.lastAIMatchingRun || undefined
      },
      geofencing: {
        enabled: this.config.geofence.enabled,
        activeAreas: userGeofences.length
      },
      reminders: {
        enabled: this.config.reminders.enabled,
        sentCount: stats['REMINDER'] || 0
      },
      totalNotifications: Object.values(stats).reduce((sum: number, count: unknown) => sum + (count as number), 0)
    };
  }
}