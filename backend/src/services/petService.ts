// 後端寵物服務 - 提供基本的寵物 CRUD 操作（含快取優化）
import { Pet, IPet } from '../models/Pet';
import { User, IUser } from '../models/User';
import { CloudinaryService } from './cloudinaryService';
import { aiService } from './aiService';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// 創建寵物的資料介面
export interface CreatePetData {
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  age?: number;
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  description?: string;
  status: 'lost' | 'found' | 'adopted';
  location?: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  images?: string[];
}

// 更新寵物的資料介面
export interface UpdatePetData {
  name?: string;
  breed?: string;
  age?: number;
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  description?: string;
  status?: 'lost' | 'found' | 'adopted';
  location?: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  contact?: {
    phone?: string;
    email?: string;
  };
}

export class PetService {
  /**
   * 清除相關快取
   */
  private static clearRelatedCache(ownerId: string, petId?: string): void {
    try {
      // 清除特定寵物快取
      if (petId) {
        cacheService.delete(`pet:${petId}`);
      }
      
      // 清除用戶寵物列表快取
      cacheService.delete(`pets:owner:${ownerId}`);
      
      // 清除所有寵物列表快取（使用模式匹配）
      cacheService.deletePattern('^pets:all:');
      
      logger.debug(`已清除相關快取: ownerId=${ownerId}, petId=${petId || 'none'}`);
    } catch (error) {
      logger.warn('清除快取時發生錯誤:', error);
    }
  }

  /**
   * 創建新寵物
   */
  static async createPet(ownerId: string, petData: CreatePetData): Promise<IPet> {
    try {
      // 驗證擁有者是否存在
      const owner = await User.findById(ownerId);
      if (!owner) {
        throw new Error('擁有者不存在');
      }

      // 處理圖片上傳
      const processedImages = [];
      if (petData.images && petData.images.length > 0) {
        for (const imageUrl of petData.images) {
          try {
            const uploadResult = await CloudinaryService.uploadImage(imageUrl, {
              folder: 'pets',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }
              ]
            });
            processedImages.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              width: uploadResult.width,
              height: uploadResult.height
            });
          } catch (error) {
            logger.error('圖片上傳失敗:', error);
          }
        }
      }

      // 創建寵物文檔
      const pet = new Pet({
        ...petData,
        owner: ownerId,
        images: processedImages,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // AI 圖片分析（如果有圖片）
      if (processedImages.length > 0) {
        try {
          const aiAnalysis = await aiService.analyzeImage(processedImages[0].url);
          pet.aiData = {
            breed: aiAnalysis.breed,
            confidence: aiAnalysis.confidence,
            features: aiAnalysis.features
          };
        } catch (error) {
          logger.warn('AI 圖片分析失敗:', error);
          // 不影響寵物創建流程
        }
      }

      const savedPet = await pet.save();
      await savedPet.populate('owner', 'username email');
      
      // 清除相關快取
      this.clearRelatedCache(ownerId);
      
      logger.info(`寵物創建成功: ${savedPet._id}`);
      return savedPet;
    } catch (error) {
      logger.error('創建寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 根據 ID 獲取寵物（含快取）
   */
  static async getPetById(petId: string): Promise<IPet | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(petId)) {
        throw new Error('無效的寵物 ID');
      }

      const cacheKey = `pet:${petId}`;
      
      return await cacheService.withCache(
        cacheKey,
        async () => {
          const pet = await Pet.findById(petId)
            .populate('owner', 'username email avatar')
            .exec();
          return pet;
        },
        10 * 60 * 1000 // 10分鐘快取
      );
    } catch (error) {
      logger.error('獲取寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 更新寵物資訊
   */
  static async updatePet(
    petId: string, 
    ownerId: string, 
    updateData: UpdatePetData
  ): Promise<IPet | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(petId)) {
        throw new Error('無效的寵物 ID');
      }

      // 檢查寵物是否存在且屬於該用戶
      const pet = await Pet.findOne({ _id: petId, owner: ownerId });
      if (!pet) {
        throw new Error('寵物不存在或您沒有權限修改');
      }

      // 更新寵物資訊
      const updatedPet = await Pet.findByIdAndUpdate(
        petId,
        { 
          ...updateData, 
          updatedAt: new Date() 
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email avatar');

      // 清除相關快取
      this.clearRelatedCache(ownerId, petId);
      
      logger.info(`寵物更新成功: ${petId}`);
      return updatedPet;
    } catch (error) {
      logger.error('更新寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除寵物
   */
  static async deletePet(petId: string, ownerId: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(petId)) {
        throw new Error('無效的寵物 ID');
      }

      // 檢查寵物是否存在且屬於該用戶
      const pet = await Pet.findOne({ _id: petId, owner: ownerId });
      if (!pet) {
        throw new Error('寵物不存在或您沒有權限刪除');
      }

      // 刪除 Cloudinary 上的圖片
      if (pet.images && pet.images.length > 0) {
        for (const image of pet.images) {
          try {
            if (image.publicId) {
              await CloudinaryService.deleteImage(image.publicId);
            }
          } catch (error) {
            logger.warn('刪除圖片失敗:', error);
          }
        }
      }

      // 刪除寵物文檔
      await Pet.findByIdAndDelete(petId);
      
      // 清除相關快取
      this.clearRelatedCache(ownerId, petId);
      
      logger.info(`寵物刪除成功: ${petId}`);
      return true;
    } catch (error) {
      logger.error('刪除寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶的所有寵物（含快取）
   */
  static async getPetsByOwner(ownerId: string): Promise<IPet[]> {
    try {
      const cacheKey = `pets:owner:${ownerId}`;
      
      return await cacheService.withCache(
        cacheKey,
        async () => {
          const pets = await Pet.find({ owner: ownerId })
            .populate('owner', 'username email avatar')
            .sort({ createdAt: -1 })
            .exec();
          return pets;
        },
        5 * 60 * 1000 // 5分鐘快取
      );
    } catch (error) {
      logger.error('獲取用戶寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有寵物（分頁，含快取）
   */
  static async getAllPets(
    page: number = 1, 
    limit: number = 10,
    filters?: {
      type?: string;
      status?: string;
      location?: string;
    }
  ): Promise<{ pets: IPet[]; total: number; page: number; totalPages: number }> {
    try {
      // 生成快取鍵，包含所有查詢參數
      const filterStr = filters ? JSON.stringify(filters) : 'none';
      const cacheKey = `pets:all:page:${page}:limit:${limit}:filters:${filterStr}`;
      
      return await cacheService.withCache(
        cacheKey,
        async () => {
          const query: any = {};
          
          if (filters?.type) {
            query.type = filters.type;
          }
          if (filters?.status) {
            query.status = filters.status;
          }
          if (filters?.location) {
            query['location.city'] = new RegExp(filters.location, 'i');
          }

          const skip = (page - 1) * limit;
          
          const [pets, total] = await Promise.all([
            Pet.find(query)
              .populate('owner', 'username email avatar')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .exec(),
            Pet.countDocuments(query)
          ]);

          const totalPages = Math.ceil(total / limit);

          return {
            pets,
            total,
            page,
            totalPages
          };
        },
        3 * 60 * 1000 // 3分鐘快取（較短，因為列表更新頻繁）
      );
    } catch (error) {
      logger.error('獲取所有寵物失敗:', error);
      throw error;
    }
  }

  /**
   * 增加寵物瀏覽次數
   */
  static async incrementViewCount(petId: string): Promise<void> {
    try {
      await Pet.findByIdAndUpdate(
        petId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
      
      // 清除該寵物的快取，讓下次查詢獲取最新數據
      cacheService.delete(`pet:${petId}`);
    } catch (error) {
      logger.error('增加瀏覽次數失敗:', error);
    }
  }

  /**
   * 增加寵物分享次數
   */
  static async incrementShareCount(petId: string): Promise<void> {
    try {
      await Pet.findByIdAndUpdate(
        petId,
        { $inc: { shareCount: 1 } },
        { new: true }
      );
      
      // 清除該寵物的快取，讓下次查詢獲取最新數據
      cacheService.delete(`pet:${petId}`);
    } catch (error) {
      logger.error('增加分享次數失敗:', error);
    }
  }
}

console.log('✅ PetService 已載入');