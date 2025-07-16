import mongoose from 'mongoose';
import { config } from '../config/environment';
import { connectDatabase } from '../config/database';
import { elasticsearchService } from '../services/elasticsearchService';
import { petSearchService } from '../services/petSearchService';
import { Pet, IPet } from '../models/Pet';
import { logger } from '../utils/logger';

/**
 * 同步寵物數據到 Elasticsearch 的腳本
 * 用於初始化或重新索引所有寵物數據
 */
class PetSyncScript {
  private batchSize = 100;
  private totalProcessed = 0;
  private totalErrors = 0;

  /**
   * 執行同步作業
   */
  public async run(): Promise<void> {
    try {
      logger.info('開始同步寵物數據到 Elasticsearch...');
      
      // 連接資料庫
      await connectDatabase();
      logger.info('資料庫連接成功');

      // 連接 Elasticsearch
      const elasticsearchConnected = await elasticsearchService.connect();
      if (!elasticsearchConnected) {
        throw new Error('Elasticsearch 連接失敗');
      }
      logger.info('Elasticsearch 連接成功');

      // 初始化索引
      await this.initializeIndices();

      // 獲取寵物總數
      const totalPets = await Pet.countDocuments();
      logger.info(`找到 ${totalPets} 筆寵物數據需要同步`);

      if (totalPets === 0) {
        logger.info('沒有寵物數據需要同步');
        return;
      }

      // 分批處理寵物數據
      await this.processPetsInBatches(totalPets);

      // 顯示同步結果
      this.showSyncResults(totalPets);

    } catch (error) {
      logger.error('同步過程中發生錯誤:', error);
      throw error;
    } finally {
      // 關閉連接
      await this.cleanup();
    }
  }

  /**
   * 初始化 Elasticsearch 索引
   */
  private async initializeIndices(): Promise<void> {
    try {
      logger.info('初始化 Elasticsearch 索引...');
      
      // 初始化寵物索引
      const petIndexCreated = await petSearchService.initializePetIndex();
      if (petIndexCreated) {
        logger.info('寵物索引初始化成功');
      } else {
        logger.warn('寵物索引初始化失敗');
      }

      // 初始化搜尋分析索引
      const analyticsIndexCreated = await petSearchService.initializeSearchAnalyticsIndex();
      if (analyticsIndexCreated) {
        logger.info('搜尋分析索引初始化成功');
      } else {
        logger.warn('搜尋分析索引初始化失敗');
      }

    } catch (error) {
      logger.error('索引初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 分批處理寵物數據
   */
  private async processPetsInBatches(totalPets: number): Promise<void> {
    const totalBatches = Math.ceil(totalPets / this.batchSize);
    logger.info(`將分 ${totalBatches} 批次處理，每批 ${this.batchSize} 筆`);

    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * this.batchSize;
      const progress = Math.round(((batch + 1) / totalBatches) * 100);
      
      logger.info(`處理第 ${batch + 1}/${totalBatches} 批次 (${progress}%)...`);

      try {
        // 獲取當前批次的寵物數據
        const pets = await Pet.find({})
          .skip(skip)
          .limit(this.batchSize)
          .lean<IPet[]>();

        if (pets.length === 0) {
          logger.warn(`第 ${batch + 1} 批次沒有數據`);
          continue;
        }

        // 批量索引到 Elasticsearch
        const success = await petSearchService.bulkIndexPets(pets);
        
        if (success) {
          this.totalProcessed += pets.length;
          logger.info(`第 ${batch + 1} 批次成功處理 ${pets.length} 筆數據`);
        } else {
          this.totalErrors += pets.length;
          logger.error(`第 ${batch + 1} 批次處理失敗`);
          
          // 嘗試逐一處理失敗的批次
          await this.processIndividually(pets, batch + 1);
        }

        // 短暫延遲，避免對 Elasticsearch 造成過大壓力
        await this.delay(100);

      } catch (error) {
        logger.error(`處理第 ${batch + 1} 批次時發生錯誤:`, error);
        this.totalErrors += this.batchSize;
      }
    }
  }

  /**
   * 逐一處理失敗的寵物數據
   */
  private async processIndividually(pets: IPet[], batchNumber: number): Promise<void> {
    logger.info(`逐一重試第 ${batchNumber} 批次的 ${pets.length} 筆數據...`);
    
    for (let i = 0; i < pets.length; i++) {
      try {
        const success = await petSearchService.indexPet(pets[i]);
        if (success) {
          this.totalProcessed++;
          this.totalErrors--; // 減少錯誤計數
        } else {
          logger.error(`寵物 ${pets[i]._id} 索引失敗`);
        }
      } catch (error) {
        logger.error(`處理寵物 ${pets[i]._id} 時發生錯誤:`, error);
      }
    }
  }

  /**
   * 顯示同步結果
   */
  private showSyncResults(totalPets: number): void {
    const successRate = Math.round((this.totalProcessed / totalPets) * 100);
    
    logger.info('='.repeat(50));
    logger.info('同步結果摘要:');
    logger.info(`總數據量: ${totalPets}`);
    logger.info(`成功處理: ${this.totalProcessed}`);
    logger.info(`處理失敗: ${this.totalErrors}`);
    logger.info(`成功率: ${successRate}%`);
    logger.info('='.repeat(50));

    if (this.totalErrors > 0) {
      logger.warn(`有 ${this.totalErrors} 筆數據處理失敗，請檢查日誌`);
    } else {
      logger.info('所有數據同步成功！');
    }
  }

  /**
   * 清理資源
   */
  private async cleanup(): Promise<void> {
    try {
      await elasticsearchService.close();
      await mongoose.connection.close();
      logger.info('資源清理完成');
    } catch (error) {
      logger.error('清理資源時發生錯誤:', error);
    }
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 驗證同步結果
   */
  public async validateSync(): Promise<void> {
    try {
      logger.info('驗證同步結果...');
      
      // 連接服務
      await connectDatabase();
      const elasticsearchConnected = await elasticsearchService.connect();
      
      if (!elasticsearchConnected) {
        throw new Error('Elasticsearch 連接失敗');
      }

      // 獲取 MongoDB 中的寵物數量
      const mongoCount = await Pet.countDocuments();
      
      // 獲取 Elasticsearch 中的寵物數量
      const client = elasticsearchService.getClient();
      if (!client) {
        throw new Error('Elasticsearch 客戶端未初始化');
      }
      
      const esResponse = await client.count({
        index: 'pets'
      });
      const esCount = esResponse.body.count;

      logger.info(`MongoDB 寵物數量: ${mongoCount}`);
      logger.info(`Elasticsearch 寵物數量: ${esCount}`);
      
      if (mongoCount === esCount) {
        logger.info('✅ 數據同步驗證成功！');
      } else {
        logger.warn(`⚠️  數據不一致：MongoDB(${mongoCount}) vs Elasticsearch(${esCount})`);
      }

    } catch (error) {
      logger.error('驗證同步結果時發生錯誤:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// 腳本執行邏輯
const runScript = async () => {
  const syncScript = new PetSyncScript();
  
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'sync':
        await syncScript.run();
        break;
      case 'validate':
        await syncScript.validateSync();
        break;
      default:
        logger.info('使用方法:');
        logger.info('  npm run sync-pets sync     - 同步所有寵物數據到 Elasticsearch');
        logger.info('  npm run sync-pets validate - 驗證同步結果');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('腳本執行失敗:', error);
    process.exit(1);
  }
};

// 如果直接執行此腳本
if (require.main === module) {
  runScript();
}

export { PetSyncScript };