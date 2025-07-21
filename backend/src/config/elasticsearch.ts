import { Client } from "@elastic/elasticsearch";
import { logger } from "../utils/logger";

// Elasticsearch 配置介面
export interface ElasticsearchConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  tls?: {
    ca?: string;
    cert?: string;
    key?: string;
    rejectUnauthorized?: boolean;
  };
  requestTimeout?: number;
  pingTimeout?: number;
  sniffOnStart?: boolean;
  sniffInterval?: number;
  maxRetries?: number;
  resurrectStrategy?: string;
}

// 從環境變數獲取 Elasticsearch 配置
export const getElasticsearchConfig = (): ElasticsearchConfig => {
  const config: ElasticsearchConfig = {
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    requestTimeout: parseInt(
      process.env.ELASTICSEARCH_REQUEST_TIMEOUT || "30000",
    ),
    pingTimeout: parseInt(process.env.ELASTICSEARCH_PING_TIMEOUT || "3000"),
    sniffOnStart: process.env.ELASTICSEARCH_SNIFF_ON_START === "true",
    sniffInterval: parseInt(
      process.env.ELASTICSEARCH_SNIFF_INTERVAL || "300000",
    ),
    maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || "3"),
    resurrectStrategy: process.env.ELASTICSEARCH_RESURRECT_STRATEGY || "ping",
  };

  // 如果有認證資訊
  if (
    process.env.ELASTICSEARCH_USERNAME &&
    process.env.ELASTICSEARCH_PASSWORD
  ) {
    config.auth = {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    };
  }

  // TLS 配置
  if (process.env.ELASTICSEARCH_TLS_ENABLED === "true") {
    config.tls = {
      rejectUnauthorized:
        process.env.ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED !== "false",
    };

    if (process.env.ELASTICSEARCH_TLS_CA) {
      config.tls.ca = process.env.ELASTICSEARCH_TLS_CA;
    }
    if (process.env.ELASTICSEARCH_TLS_CERT) {
      config.tls.cert = process.env.ELASTICSEARCH_TLS_CERT;
    }
    if (process.env.ELASTICSEARCH_TLS_KEY) {
      config.tls.key = process.env.ELASTICSEARCH_TLS_KEY;
    }
  }

  return config;
};

// 中文分析器設定
export const chineseAnalyzerSettings = {
  analysis: {
    analyzer: {
      chinese_analyzer: {
        type: "custom",
        tokenizer: "ik_max_word",
        filter: ["lowercase", "stop_filter", "synonym_filter"],
      },
      chinese_search_analyzer: {
        type: "custom",
        tokenizer: "ik_smart",
        filter: ["lowercase", "stop_filter", "synonym_filter"],
      },
    },
    tokenizer: {
      ik_max_word: {
        type: "ik_max_word",
      },
      ik_smart: {
        type: "ik_smart",
      },
    },
    filter: {
      stop_filter: {
        type: "stop",
        stopwords: [
          "的",
          "了",
          "在",
          "是",
          "我",
          "有",
          "和",
          "就",
          "不",
          "人",
          "都",
          "一",
          "一個",
          "上",
          "也",
          "很",
          "到",
          "說",
          "要",
          "去",
          "你",
          "會",
          "著",
          "沒有",
          "看",
          "好",
          "自己",
          "這",
          "那",
          "他",
          "她",
          "它",
        ],
      },
      synonym_filter: {
        type: "synonym",
        synonyms: [
          "狗,犬,汪星人",
          "貓,喵,貓咪,喵星人",
          "走失,失蹤,不見,遺失",
          "尋找,找,協尋",
          "黃金獵犬,金毛,黃金",
          "拉布拉多,拉拉",
          "柴犬,柴柴",
          "博美,波美拉尼亞",
          "吉娃娃,奇娃娃",
          "哈士奇,西伯利亞雪橇犬",
          "邊境牧羊犬,邊牧",
          "德國牧羊犬,德牧",
          "比熊,比熊犬",
          "泰迪,貴賓犬",
          "馬爾濟斯,瑪爾濟斯",
          "約克夏,約克夏梗",
          "法國鬥牛犬,法鬥",
          "英國鬥牛犬,英鬥",
          "米克斯,混種,雜種",
          "波斯貓,波斯",
          "英國短毛貓,英短",
          "美國短毛貓,美短",
          "俄羅斯藍貓,俄藍",
          "暹羅貓,暹羅",
          "布偶貓,布偶",
          "緬因貓,緬因",
          "蘇格蘭摺耳貓,摺耳貓",
          "挪威森林貓,挪威",
          "孟加拉貓,豹貓",
          "阿比西尼亞貓,阿比",
          "土耳其安哥拉貓,安哥拉",
          "小,幼,年輕",
          "大,成年,老",
          "黑色,黑,烏黑",
          "白色,白,雪白",
          "棕色,咖啡色,褐色",
          "黃色,金色,淡黃",
          "灰色,銀色,銀灰",
          "橘色,橙色,橘紅",
          "台北,台北市",
          "新北,新北市",
          "桃園,桃園市",
          "台中,台中市",
          "台南,台南市",
          "高雄,高雄市",
          "基隆,基隆市",
          "新竹,新竹市,新竹縣",
          "苗栗,苗栗縣",
          "彰化,彰化縣",
          "南投,南投縣",
          "雲林,雲林縣",
          "嘉義,嘉義市,嘉義縣",
          "屏東,屏東縣",
          "宜蘭,宜蘭縣",
          "花蓮,花蓮縣",
          "台東,台東縣",
          "澎湖,澎湖縣",
          "金門,金門縣",
          "連江,馬祖",
        ],
      },
    },
  },
};

// 索引模板設定
export const indexTemplateSettings = {
  index_patterns: ["pets*", "search_analytics*"],
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    refresh_interval: "1s",
    max_result_window: 10000,
    ...chineseAnalyzerSettings,
  },
  mappings: {
    dynamic_templates: [
      {
        strings_as_keywords: {
          match_mapping_type: "string",
          match: "*_id",
          mapping: {
            type: "keyword",
          },
        },
      },
      {
        strings_as_text: {
          match_mapping_type: "string",
          mapping: {
            type: "text",
            analyzer: "chinese_analyzer",
            search_analyzer: "chinese_search_analyzer",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
          },
        },
      },
    ],
  },
};

// 健康檢查配置
export const healthCheckConfig = {
  timeout: 5000,
  interval: 30000,
  retries: 3,
  retryDelay: 1000,
};

// 效能監控配置
export const performanceConfig = {
  slowQueryThreshold: 1000, // 毫秒
  enableQueryLogging: process.env.NODE_ENV === "development",
  enableMetrics: true,
  metricsInterval: 60000, // 1分鐘
};

// 建立 Elasticsearch 客戶端
export const createElasticsearchClient = (): Client => {
  const config = getElasticsearchConfig();

  const client = new Client(config);

  // 錯誤處理
  client.on("response", (err, result) => {
    if (err) {
      logger.error("Elasticsearch 回應錯誤:", err);
    }
  });

  client.on("request", (err, result) => {
    if (performanceConfig.enableQueryLogging) {
      logger.debug("Elasticsearch 請求:", {
        method: result?.meta?.request?.params?.method,
        path: result?.meta?.request?.params?.path,
        body: result?.body,
      });
    }
  });

  client.on("sniff", (err, result) => {
    if (err) {
      logger.warn("Elasticsearch 節點嗅探失敗:", err);
    } else {
      logger.info("Elasticsearch 節點嗅探成功");
    }
  });

  client.on("resurrect", (err, result) => {
    if (err) {
      logger.warn("Elasticsearch 節點復活失敗:", err);
    } else {
      logger.info("Elasticsearch 節點復活成功");
    }
  });

  return client;
};

// 驗證 Elasticsearch 連接
export const validateElasticsearchConnection = async (
  client: Client,
): Promise<boolean> => {
  try {
    const response = await client.ping({
      requestTimeout: healthCheckConfig.timeout,
    });

    if (response.statusCode === 200) {
      logger.info("Elasticsearch 連接驗證成功");
      return true;
    } else {
      logger.error("Elasticsearch 連接驗證失敗:", response);
      return false;
    }
  } catch (error) {
    logger.error("Elasticsearch 連接驗證錯誤:", error);
    return false;
  }
};

// 獲取 Elasticsearch 叢集資訊
export const getClusterInfo = async (client: Client) => {
  try {
    const [health, info, stats] = await Promise.all([
      client.cluster.health(),
      client.info(),
      client.cluster.stats(),
    ]);

    return {
      health,
      info,
      stats,
    };
  } catch (error) {
    logger.error("獲取 Elasticsearch 叢集資訊失敗:", error);
    throw error;
  }
};

export default {
  getElasticsearchConfig,
  chineseAnalyzerSettings,
  indexTemplateSettings,
  healthCheckConfig,
  performanceConfig,
  createElasticsearchClient,
  validateElasticsearchConnection,
  getClusterInfo,
};
