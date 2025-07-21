import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./environment";
import { logger } from "../utils/logger";

let mongoServer: MongoMemoryServer | null = null;

/**
 * 連接到 MongoDB 資料庫（開發環境使用內存資料庫）
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // 設置 Mongoose 選項
    mongoose.set("strictQuery", true);

    let uri: string;

    // 如果是開發環境且沒有配置 MongoDB URI，使用內存資料庫
    if (
      config.env === "development" &&
      config.database.uri.includes("localhost:27017")
    ) {
      logger.info("啟動 MongoDB Memory Server...");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "pet-finder-dev",
        },
      });
      uri = mongoServer.getUri();
      logger.info("MongoDB Memory Server 已啟動");
    } else {
      uri = config.database.uri;
    }

    // 連接資料庫
    await mongoose.connect(uri, {
      ...config.database.options,
      dbName: getDatabaseName(),
    });

    logger.info(`MongoDB 連接成功: ${getDatabaseName()}`);

    // 監聽連接事件
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB 連接錯誤:", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB 連接中斷");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB 重新連接成功");
    });
  } catch (error) {
    logger.error("MongoDB 連接失敗:", error);
    throw error;
  }
};

/**
 * 斷開資料庫連接
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();

    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
      logger.info("MongoDB Memory Server 已停止");
    }

    logger.info("MongoDB 連接已關閉");
  } catch (error) {
    logger.error("關閉 MongoDB 連接時發生錯誤:", error);
    throw error;
  }
};

/**
 * 清空資料庫（僅用於測試環境）
 */
export const clearDatabase = async (): Promise<void> => {
  if (config.env !== "test") {
    throw new Error("清空資料庫操作僅允許在測試環境中執行");
  }

  try {
    if (!mongoose.connection.db) {
      throw new Error("資料庫連接未建立");
    }

    const collections = await mongoose.connection.db.collections();

    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );

    logger.info("測試資料庫已清空");
  } catch (error) {
    logger.error("清空資料庫時發生錯誤:", error);
    throw error;
  }
};

/**
 * 檢查資料庫連接狀態
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * 獲取資料庫名稱
 */
function getDatabaseName(): string {
  const baseDbName = "pet-finder";

  switch (config.env) {
    case "test":
      return `${baseDbName}-test`;
    case "development":
      return `${baseDbName}-dev`;
    case "production":
      return baseDbName;
    default:
      return `${baseDbName}-dev`;
  }
}

/**
 * 資料庫健康檢查
 */
export const checkDatabaseHealth = async (): Promise<{
  status: "healthy" | "unhealthy";
  details: {
    connected: boolean;
    readyState: number;
    host?: string;
    name?: string;
    usingMemoryServer?: boolean;
  };
}> => {
  try {
    const isConnected = isDatabaseConnected();

    return {
      status: isConnected ? "healthy" : "unhealthy",
      details: {
        connected: isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        usingMemoryServer: mongoServer !== null,
      },
    };
  } catch (error) {
    logger.error("資料庫健康檢查失敗:", error);

    return {
      status: "unhealthy",
      details: {
        connected: false,
        readyState: mongoose.connection.readyState,
        usingMemoryServer: mongoServer !== null,
      },
    };
  }
};

// 導出 mongoose 實例
export { mongoose };
