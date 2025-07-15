import mongoose from 'mongoose';
import { Pet, IPet } from '../models/Pet';
import { Match, IMatch } from '../models/Match';
import { User, IUser } from '../models/User';
import { NotificationType } from '../models/Notification';
import { AIService } from './aiService';
import { EmailService } from './emailService';
import { NotificationService } from './notificationService';

export interface PotentialMatch {
  lostPet?: IPet;
  foundPet?: IPet;
  similarity: number;
  confidence: 'low' | 'medium' | 'high';
  distance?: number;
}

export interface MatchOptions {
  minSimilarity?: number;
  maxDistance?: number; // in kilometers
  maxDays?: number;
}

export interface CreateMatchData {
  lostPetId: string;
  foundPetId: string;
  similarity: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface GetMatchesOptions {
  status?: 'pending' | 'confirmed' | 'rejected';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'similarity';
  sortOrder?: 'asc' | 'desc';
}

export interface GetMatchesResult {
  matches: IMatch[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface AutoMatchingResult {
  matchesCreated: number;
  petsProcessed: number;
  errors: string[];
}

export interface MatchStatistics {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  averageSimilarity: number;
}

export interface StatisticsOptions {
  startDate?: Date;
  endDate?: Date;
}

export class MatchingService {
  /**
   * 尋找潛在配對
   */
  static async findPotentialMatches(
    petId: string,
    options: MatchOptions = {}
  ): Promise<PotentialMatch[]> {
    const {
      minSimilarity = 0.7,
      maxDistance = 50, // 50km default
      maxDays = 30
    } = options;

    const pet = await Pet.findById(petId);
    if (!pet || !pet.aiFeatures || pet.aiFeatures.length === 0) {
      return [];
    }

    const isLostPet = pet.status === 'lost';
    const targetStatus = isLostPet ? 'found' : 'lost';

    // 計算日期範圍
    const dateThreshold = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);

    // 查找候選寵物
    const candidates = await Pet.find({
      _id: { $ne: petId },
      status: targetStatus,
      userId: { $ne: pet.userId },
      createdAt: { $gte: dateThreshold },
      'aiFeatures': { $exists: true, $ne: [] }
    });

    const potentialMatches: PotentialMatch[] = [];

    for (const candidate of candidates) {
      try {
        // 計算相似度 - 使用第一個圖像特徵
        const petFeatures = pet.aiFeatures[0]?.features;
        const candidateFeatures = candidate.aiFeatures?.[0]?.features;
        
        if (!petFeatures || !candidateFeatures) continue;
        
        const similarity = AIService.calculateSimilarity(
          petFeatures,
          candidateFeatures
        );

        if (similarity < minSimilarity) continue;

        // 暫時跳過距離計算，因為 Pet 模型中沒有坐標字段
        // TODO: 添加地理坐標字段到 Pet 模型
        const distance = 0; // 暫時設為 0

        // 檢查是否已存在配對
        const existingMatch = await Match.findOne({
          $or: [
            { lostPet: isLostPet ? petId : candidate._id, foundPet: isLostPet ? candidate._id : petId },
            { lostPet: isLostPet ? candidate._id : petId, foundPet: isLostPet ? petId : candidate._id }
          ]
        });

        if (existingMatch) continue;

        const confidence = MatchingService.calculateConfidence(similarity);

        const match: PotentialMatch = {
          similarity,
          confidence,
          distance
        };

        if (isLostPet) {
          match.lostPet = pet;
          match.foundPet = candidate;
        } else {
          match.lostPet = candidate;
          match.foundPet = pet;
        }

        potentialMatches.push(match);
      } catch (error) {
        console.error(`Error calculating similarity for pets ${petId} and ${candidate._id}:`, error);
      }
    }

    // 按相似度排序
    return potentialMatches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 創建配對
   */
  static async createMatch(data: CreateMatchData): Promise<IMatch> {
    const { lostPetId, foundPetId, similarity, confidence, notes } = data;

    // 驗證寵物存在
    const lostPet = await Pet.findById(lostPetId);
    const foundPet = await Pet.findById(foundPetId);

    if (!lostPet || !foundPet) {
      throw new Error('寵物不存在');
    }

    // 驗證寵物狀態
    if (lostPet.status !== 'lost' || foundPet.status !== 'found') {
      throw new Error('無效的寵物狀態');
    }

    // 檢查是否已存在配對
    const existingMatch = await Match.findOne({
      lostPet: lostPetId,
      foundPet: foundPetId
    });

    if (existingMatch) {
      throw new Error('配對已存在');
    }

    // 創建配對
    const match = new Match({
      lostPet: lostPetId,
      foundPet: foundPetId,
      similarity,
      confidence,
      notes
    });

    await match.save();

    // 發送通知郵件
    try {
      const populatedMatch = await Match.findById(match._id)
        .populate('lostPet')
        .populate('foundPet');

      if (populatedMatch) {
        // TODO: 實現 EmailService.sendPetMatchNotification 方法
        // 發送給失主
        // await EmailService.sendPetMatchNotification(
        //   (await User.findById(lostPet.userId) as IUser).email,
        //   {
        //     lostPet: populatedMatch.lostPet as IPet,
        //     foundPet: populatedMatch.foundPet as IPet,
        //     similarity,
        //     confidence
        //   }
        // );

        // 發送給拾獲者
        // await EmailService.sendPetMatchNotification(
        //   (await User.findById(foundPet.userId) as IUser).email,
        //   {
        //     lostPet: populatedMatch.lostPet as IPet,
        //     foundPet: populatedMatch.foundPet as IPet,
        //     similarity,
        //     confidence
        //   }
        // );

        // 發送應用內通知
        await NotificationService.sendNotification({
          userId: lostPet.userId.toString(),
          type: NotificationType.MATCH_FOUND,
          title: '找到可能的配對！',
          message: `您的寵物 ${lostPet.name} 可能找到了，相似度: ${Math.round(similarity * 100)}%`,
          data: {
            matchId: (match._id as mongoose.Types.ObjectId).toString(),
            petId: lostPet._id.toString()
          }
        });

        await NotificationService.sendNotification({
          userId: foundPet.userId.toString(),
          type: NotificationType.MATCH_FOUND,
          title: '找到可能的配對！',
          message: `您拾獲的寵物 ${foundPet.name} 可能找到主人了，相似度: ${Math.round(similarity * 100)}%`,
          data: {
            matchId: (match._id as mongoose.Types.ObjectId).toString(),
            petId: foundPet._id.toString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to send match notifications:', error);
      // 不拋出錯誤，配對創建成功但通知失敗
    }

    return match;
  }

  /**
   * 根據 ID 獲取配對
   */
  static async getMatchById(matchId: string): Promise<IMatch | null> {
    return await Match.findById(matchId)
      .populate('lostPet')
      .populate('foundPet')
      .populate('confirmedBy');
  }

  /**
   * 更新配對狀態
   */
  static async updateMatchStatus(
    matchId: string,
    userId: string,
    status: 'confirmed' | 'rejected',
    notes?: string
  ): Promise<IMatch | null> {
    const match = await Match.findById(matchId)
      .populate('lostPet')
      .populate('foundPet');

    if (!match) {
      throw new Error('配對不存在');
    }

    if (match.status !== 'pending') {
      throw new Error('配對已經處理過了');
    }

    // 檢查權限：只有失主或拾獲者可以更新狀態
    const lostPet = match.lostPet as IPet;
    const foundPet = match.foundPet as IPet;
    
    if (
      lostPet.userId.toString() !== userId &&
      foundPet.userId.toString() !== userId
    ) {
      throw new Error('無權限');
    }

    // 更新狀態
    match.status = status;
    match.confirmedBy = new mongoose.Types.ObjectId(userId);
    
    if (status === 'confirmed') {
      match.confirmedAt = new Date();
    } else {
      match.rejectedAt = new Date();
    }

    if (notes) {
      match.notes = notes;
    }

    await match.save();

    // 發送狀態更新通知
    try {
      const otherUserId = lostPet.userId.toString() === userId
      ? foundPet.userId.toString()
      : lostPet.userId.toString();

      const message = status === 'confirmed' 
        ? '配對已被確認！' 
        : '配對已被拒絕。';

      await NotificationService.sendNotification({
        userId: otherUserId,
        type: NotificationType.MATCH_FOUND,
        title: '配對狀態更新',
        message,
        data: {
          matchId: (match._id as mongoose.Types.ObjectId).toString(),
          status
        }
      });
    } catch (error) {
      console.error('Failed to send match status update notification:', error);
    }

    return match;
  }

  /**
   * 獲取用戶的配對列表
   */
  static async getUserMatches(
    userId: string,
    options: GetMatchesOptions = {}
  ): Promise<GetMatchesResult> {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // 構建查詢條件
    const query: any = {
      $or: [
        { 'lostPet.userId': userId },
      { 'foundPet.userId': userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    // 構建排序
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 執行查詢
    const [matches, total] = await Promise.all([
      Match.find(query)
        .populate({
          path: 'lostPet',
          populate: { path: 'owner' }
        })
        .populate({
          path: 'foundPet',
          populate: { path: 'owner' }
        })
        .populate('confirmedBy')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Match.countDocuments(query)
    ]);

    return {
      matches,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  /**
   * 運行自動配對
   */
  static async runAutomaticMatching(
    options: MatchOptions = {}
  ): Promise<AutoMatchingResult> {
    const { maxDays = 7 } = options;
    const errors: string[] = [];
    let matchesCreated = 0;
    let petsProcessed = 0;

    try {
      // 獲取最近的失蹤寵物
      const dateThreshold = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
      
      const recentLostPets = await Pet.find({
        status: 'lost',
        createdAt: { $gte: dateThreshold },
        'aiData.features': { $exists: true, $ne: null }
      });

      for (const lostPet of recentLostPets) {
        try {
          petsProcessed++;
          
          const potentialMatches = await MatchingService.findPotentialMatches(
            lostPet._id.toString(),
            { minSimilarity: 0.8, ...options }
          );

          // 只創建最佳配對
          if (potentialMatches.length > 0) {
            const bestMatch = potentialMatches[0];
            
            if (bestMatch) {
              await MatchingService.createMatch({
                lostPetId: lostPet._id.toString(),
                foundPetId: (bestMatch.foundPet as IPet)._id.toString(),
                similarity: bestMatch.similarity,
                confidence: bestMatch.confidence
              });
            }
            
            matchesCreated++;
          }
        } catch (error) {
          const errorMsg = `Error processing pet ${lostPet._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error in automatic matching: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }

    return {
      matchesCreated,
      petsProcessed,
      errors
    };
  }

  /**
   * 獲取配對統計
   */
  static async getMatchStatistics(
    options: StatisticsOptions = {}
  ): Promise<MatchStatistics> {
    const { startDate, endDate } = options;
    
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [stats] = await Match.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          averageSimilarity: { $avg: '$similarity' }
        }
      }
    ]);

    return stats || {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      averageSimilarity: 0
    };
  }

  /**
   * 計算信心等級
   */
  static calculateConfidence(similarity: number): 'low' | 'medium' | 'high' {
    if (similarity >= 0.85) return 'high';
    if (similarity >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * 計算兩點間距離（公里）
   */
  static calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const R = 6371; // 地球半徑（公里）
    const dLat = MatchingService.toRadians(lat2 - lat1);
    const dLon = MatchingService.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(MatchingService.toRadians(lat1)) * Math.cos(MatchingService.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}