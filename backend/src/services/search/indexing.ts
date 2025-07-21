import { elasticsearchService } from "../elasticsearchService";
import { logger } from "../../utils/logger";
import { IPet } from "../../models/Pet";

/**
 * 索引管理服務
 * 負責處理 Elasticsearch 索引的初始化、文檔的增刪改查等基本操作
 */
export class IndexingService {
  private readonly PET_INDEX = "pets";
  private readonly SEARCH_ANALYTICS_INDEX = "search_analytics";

  /**
   * 初始化寵物搜尋索引
   */
  public async initializePetIndex(): Promise<boolean> {
    const mapping = {
      properties: {
        name: {
          type: "text",
          analyzer: "chinese_analyzer",
          fields: {
            keyword: { type: "keyword" },
            suggest: {
              type: "completion",
              analyzer: "simple",
            },
          },
        },
        type: { type: "keyword" },
        breed: {
          type: "text",
          analyzer: "chinese_analyzer",
          fields: {
            keyword: { type: "keyword" },
            suggest: {
              type: "completion",
              analyzer: "simple",
            },
          },
        },
        gender: { type: "keyword" },
        age: { type: "integer" },
        color: {
          type: "text",
          analyzer: "chinese_analyzer",
          fields: {
            keyword: { type: "keyword" },
          },
        },
        size: { type: "keyword" },
        status: { type: "keyword" },
        description: {
          type: "text",
          analyzer: "chinese_analyzer",
        },
        lastSeenLocation: {
          type: "text",
          analyzer: "chinese_analyzer",
          fields: {
            keyword: { type: "keyword" },
            suggest: {
              type: "completion",
              analyzer: "simple",
            },
          },
        },
        location: {
          type: "geo_point",
        },
        lastSeenDate: { type: "date" },
        contactInfo: {
          properties: {
            name: {
              type: "text",
              analyzer: "chinese_analyzer",
            },
            phone: { type: "keyword" },
            email: { type: "keyword" },
          },
        },
        images: { type: "keyword" },
        reward: { type: "integer" },
        isUrgent: { type: "boolean" },
        microchipId: { type: "keyword" },
        vaccinations: { type: "keyword" },
        medicalConditions: { type: "keyword" },
        specialMarks: {
          type: "text",
          analyzer: "chinese_analyzer",
        },
        personality: { type: "keyword" },
        viewCount: { type: "integer" },
        shareCount: { type: "integer" },
        userId: { type: "keyword" },
        aiTags: { type: "keyword" },
        aiBreedPrediction: { type: "keyword" },
        aiConfidence: { type: "float" },
        createdAt: { type: "date" },
        updatedAt: { type: "date" },
      },
    };

    return await elasticsearchService.createIndex(this.PET_INDEX, mapping);
  }

  /**
   * 初始化搜尋分析索引
   */
  public async initializeSearchAnalyticsIndex(): Promise<boolean> {
    const mapping = {
      properties: {
        query: {
          type: "text",
          analyzer: "chinese_analyzer",
          fields: {
            keyword: { type: "keyword" },
          },
        },
        filters: {
          properties: {
            type: { type: "keyword" },
            status: { type: "keyword" },
            location: { type: "keyword" },
            breed: { type: "keyword" },
            size: { type: "keyword" },
            gender: { type: "keyword" },
          },
        },
        userId: { type: "keyword" },
        resultCount: { type: "integer" },
        timestamp: { type: "date" },
        sessionId: { type: "keyword" },
        userAgent: { type: "text" },
        ipAddress: { type: "ip" },
      },
    };

    return await elasticsearchService.createIndex(
      this.SEARCH_ANALYTICS_INDEX,
      mapping,
    );
  }

  /**
   * 將寵物資料轉換為索引文檔格式
   */
  private petToDocument(pet: IPet): any {
    return {
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      gender: pet.gender,
      age: pet.age,
      color: pet.color,
      size: pet.size,
      status: pet.status,
      description: pet.description,
      lastSeenLocation: pet.lastSeenLocation,
      lastSeenDate: pet.lastSeenDate,
      contactInfo: pet.contactInfo,
      images: pet.images,
      reward: pet.reward,
      isUrgent: pet.isUrgent,
      microchipId: pet.microchipId,
      vaccinations: pet.vaccinations,
      medicalConditions: pet.medicalConditions,
      specialMarks: pet.specialMarks,
      personality: pet.personality,
      viewCount: pet.viewCount,
      shareCount: pet.shareCount,
      userId: pet.userId.toString(),
      aiTags: pet.aiTags,
      aiBreedPrediction: pet.aiBreedPrediction,
      aiConfidence: pet.aiConfidence,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
    };
  }

  /**
   * 索引寵物文檔
   */
  public async indexPet(pet: IPet): Promise<boolean> {
    const document = this.petToDocument(pet);
    return await elasticsearchService.indexDocument(
      this.PET_INDEX,
      pet._id.toString(),
      document,
    );
  }

  /**
   * 批量索引寵物文檔
   */
  public async bulkIndexPets(pets: IPet[]): Promise<boolean> {
    const documents = pets.map((pet) => ({
      id: pet._id.toString(),
      document: this.petToDocument(pet),
    }));

    return await elasticsearchService.bulkIndex(this.PET_INDEX, documents);
  }

  /**
   * 刪除寵物文檔
   */
  public async deletePet(petId: string): Promise<boolean> {
    return await elasticsearchService.deleteDocument(this.PET_INDEX, petId);
  }

  /**
   * 更新寵物文檔
   */
  public async updatePet(pet: IPet): Promise<boolean> {
    const document = {
      ...this.petToDocument(pet),
      updatedAt: new Date(),
    };

    return await elasticsearchService.updateDocument(
      this.PET_INDEX,
      pet._id.toString(),
      document,
    );
  }

  /**
   * 檢查索引是否存在
   */
  public async indexExists(indexName: string): Promise<boolean> {
    try {
      const exists = await elasticsearchService.getClient().indices.exists({
        index: indexName,
      });
      return exists;
    } catch (error) {
      logger.error(`檢查索引 ${indexName} 是否存在失敗:`, error);
      return false;
    }
  }

  /**
   * 刪除索引
   */
  public async deleteIndex(indexName: string): Promise<boolean> {
    try {
      await elasticsearchService.getClient().indices.delete({
        index: indexName,
      });
      logger.info(`索引 ${indexName} 已刪除`);
      return true;
    } catch (error) {
      logger.error(`刪除索引 ${indexName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 重建索引
   */
  public async rebuildPetIndex(): Promise<boolean> {
    try {
      // 刪除現有索引
      if (await this.indexExists(this.PET_INDEX)) {
        await this.deleteIndex(this.PET_INDEX);
      }

      // 重新創建索引
      const result = await this.initializePetIndex();

      if (result) {
        logger.info("寵物索引重建成功");
      } else {
        logger.error("寵物索引重建失敗");
      }

      return result;
    } catch (error) {
      logger.error("重建寵物索引失敗:", error);
      return false;
    }
  }

  /**
   * 獲取索引統計信息
   */
  public async getIndexStats(indexName: string): Promise<any> {
    try {
      const response = await elasticsearchService.getClient().indices.stats({
        index: indexName,
      });
      return response;
    } catch (error) {
      logger.error(`獲取索引 ${indexName} 統計信息失敗:`, error);
      return null;
    }
  }

  /**
   * 獲取寵物索引名稱
   */
  public getPetIndexName(): string {
    return this.PET_INDEX;
  }

  /**
   * 獲取搜尋分析索引名稱
   */
  public getSearchAnalyticsIndexName(): string {
    return this.SEARCH_ANALYTICS_INDEX;
  }
}

// 導出單例實例
export const indexingService = new IndexingService();
