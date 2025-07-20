import { Client } from "@elastic/elasticsearch";
import { logger } from "../utils/logger";
import {
  createElasticsearchClient,
  validateElasticsearchConnection,
  getClusterInfo,
  chineseAnalyzerSettings,
  indexTemplateSettings,
  healthCheckConfig,
  performanceConfig,
  ElasticsearchConfig,
} from "../config/elasticsearch";

// 搜尋結果介面
export interface SearchResult {
  id: string;
  score: number;
  source: any;
  highlights?: any;
}

// 搜尋回應介面
export interface SearchResponse {
  hits: SearchResult[];
  total: number;
  maxScore: number;
  took: number;
}

// 聚合結果介面
export interface AggregationResult {
  [key: string]: any;
}

// 效能監控介面
export interface PerformanceMetrics {
  totalQueries: number;
  averageResponseTime: number;
  slowQueries: number;
  errorRate: number;
  lastUpdated: Date;
}

class ElasticsearchService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metrics: PerformanceMetrics = {
    totalQueries: 0,
    averageResponseTime: 0,
    slowQueries: 0,
    errorRate: 0,
    lastUpdated: new Date(),
  };

  /**
   * 初始化 Elasticsearch 連接
   */
  public async connect(): Promise<boolean> {
    try {
      this.client = createElasticsearchClient();

      // 驗證連接
      const isValid = await validateElasticsearchConnection(this.client);
      if (isValid) {
        this.isConnected = true;

        // 設置索引模板
        await this.setupIndexTemplate();

        // 啟動健康檢查
        this.startHealthCheck();

        // 獲取叢集資訊
        const clusterInfo = await getClusterInfo(this.client);
        logger.info("Elasticsearch 叢集資訊:", {
          clusterName: clusterInfo.info.cluster_name,
          version: clusterInfo.info.version.number,
          status: clusterInfo.health.status,
        });

        return true;
      } else {
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      logger.error("Elasticsearch 連接錯誤:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 設置索引模板
   */
  private async setupIndexTemplate(): Promise<void> {
    try {
      if (!this.client) throw new Error("Elasticsearch 客戶端未初始化");

      await this.client.indices.putIndexTemplate({
        name: "pet_finder_template",
        body: indexTemplateSettings,
      });

      logger.info("索引模板設置成功");
    } catch (error) {
      logger.error("設置索引模板失敗:", error);
    }
  }

  /**
   * 啟動健康檢查
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.client) {
          const isHealthy = await validateElasticsearchConnection(this.client);
          if (!isHealthy && this.isConnected) {
            logger.warn("Elasticsearch 連接中斷，嘗試重新連接...");
            this.isConnected = false;
            await this.connect();
          }
        }
      } catch (error) {
        logger.error("健康檢查失敗:", error);
      }
    }, healthCheckConfig.interval);
  }

  /**
   * 記錄查詢效能
   */
  private recordQueryPerformance(
    responseTime: number,
    isError: boolean = false,
  ): void {
    if (!performanceConfig.enableMetrics) return;

    this.metrics.totalQueries++;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalQueries - 1) +
        responseTime) /
      this.metrics.totalQueries;

    if (responseTime > performanceConfig.slowQueryThreshold) {
      this.metrics.slowQueries++;
    }

    if (isError) {
      this.metrics.errorRate =
        (this.metrics.errorRate * (this.metrics.totalQueries - 1) + 1) /
        this.metrics.totalQueries;
    }

    this.metrics.lastUpdated = new Date();
  }

  /**
   * 檢查連接狀態
   */
  public async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const isValid = await validateElasticsearchConnection(this.client);
      this.isConnected = isValid;
      return isValid;
    } catch (error) {
      this.isConnected = false;
      logger.error("Elasticsearch 連接檢查失敗:", error);
      return false;
    }
  }

  /**
   * 獲取客戶端實例
   */
  public getClient(): Client | null {
    return this.client;
  }

  /**
   * 檢查是否已連接
   */
  public isElasticsearchConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 獲取效能指標
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 創建索引
   */
  public async createIndex(indexName: string, mapping: any): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!this.client) throw new Error("Elasticsearch 客戶端未初始化");

      const exists = await this.client.indices.exists({ index: indexName });

      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            mappings: mapping,
            settings: {
              ...chineseAnalyzerSettings,
              number_of_shards: 1,
              number_of_replicas: 0,
            },
          },
        });
        logger.info(`索引 ${indexName} 創建成功`);
      } else {
        logger.info(`索引 ${indexName} 已存在`);
      }

      this.recordQueryPerformance(Date.now() - startTime);
      return true;
    } catch (error) {
      this.recordQueryPerformance(Date.now() - startTime, true);
      logger.error(`創建索引 ${indexName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 刪除索引
   */
  public async deleteIndex(indexName: string): Promise<boolean> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });

      if (exists) {
        await this.client.indices.delete({ index: indexName });
        logger.info(`索引 ${indexName} 刪除成功`);
      }
      return true;
    } catch (error) {
      logger.error(`刪除索引 ${indexName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 索引文檔
   */
  public async indexDocument(
    indexName: string,
    id: string,
    document: any,
  ): Promise<boolean> {
    try {
      await this.client.index({
        index: indexName,
        id: id,
        body: document,
        refresh: "wait_for",
      });
      logger.debug(`文檔 ${id} 索引到 ${indexName} 成功`);
      return true;
    } catch (error) {
      logger.error(`索引文檔 ${id} 到 ${indexName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 批量索引文檔
   */
  public async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; document: any }>,
  ): Promise<boolean> {
    try {
      const body = documents.flatMap(({ id, document }) => [
        { index: { _index: indexName, _id: id } },
        document,
      ]);

      const response = await this.client.bulk({
        body,
        refresh: "wait_for",
      });

      if (response.errors) {
        logger.error("批量索引部分失敗:", response.items);
        return false;
      }

      logger.info(`批量索引 ${documents.length} 個文檔到 ${indexName} 成功`);
      return true;
    } catch (error) {
      logger.error(`批量索引到 ${indexName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 刪除文檔
   */
  public async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      await this.client.delete({
        index: indexName,
        id: id,
        refresh: "wait_for",
      });
      logger.debug(`文檔 ${id} 從 ${indexName} 刪除成功`);
      return true;
    } catch (error) {
      logger.error(`從 ${indexName} 刪除文檔 ${id} 失敗:`, error);
      return false;
    }
  }

  /**
   * 更新文檔
   */
  public async updateDocument(
    indexName: string,
    id: string,
    document: any,
  ): Promise<boolean> {
    try {
      await this.client.update({
        index: indexName,
        id: id,
        body: {
          doc: document,
        },
        refresh: "wait_for",
      });
      logger.debug(`文檔 ${id} 在 ${indexName} 更新成功`);
      return true;
    } catch (error) {
      logger.error(`更新 ${indexName} 中的文檔 ${id} 失敗:`, error);
      return false;
    }
  }

  /**
   * 關閉連接
   */
  public async close(): Promise<void> {
    try {
      // 清除健康檢查定時器
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      this.isConnected = false;
      logger.info("Elasticsearch 連接已關閉");
    } catch (error) {
      logger.error("關閉 Elasticsearch 連接失敗:", error);
    }
  }
}

// 導出單例實例
export const elasticsearchService = new ElasticsearchService();
export default elasticsearchService;
