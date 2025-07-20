import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { config } from "./environment";

// Swagger 定義
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "呼嚕寵物協尋網站 API",
    version: "1.0.0",
    description: "專為寵物走失協尋而設計的全端網站應用程式 API 文件",
    contact: {
      name: "程式小白",
      email: "developer@pet-finder.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "開發環境",
    },
    {
      url: "https://api.pet-finder.com",
      description: "生產環境",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT 認證令牌",
      },
    },
    schemas: {
      User: {
        type: "object",
        required: ["email", "name"],
        properties: {
          id: {
            type: "string",
            description: "用戶唯一識別碼",
            example: "507f1f77bcf86cd799439011",
          },
          email: {
            type: "string",
            format: "email",
            description: "用戶電子郵件",
            example: "user@example.com",
          },
          name: {
            type: "string",
            description: "用戶姓名",
            example: "王小明",
          },
          phone: {
            type: "string",
            description: "用戶電話",
            example: "+886912345678",
          },
          avatar: {
            type: "string",
            format: "uri",
            description: "用戶頭像 URL",
            example: "https://example.com/avatars/user.jpg",
          },
          bio: {
            type: "string",
            description: "用戶簡介",
            example: "愛護動物的熱心人士",
          },
          location: {
            type: "string",
            description: "用戶所在地",
            example: "台北市",
          },
          isVerified: {
            type: "boolean",
            description: "是否已驗證電子郵件",
            example: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "建立時間",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "更新時間",
          },
        },
      },
      Pet: {
        type: "object",
        required: ["name", "type", "status", "lastSeenLocation", "contactInfo"],
        properties: {
          id: {
            type: "string",
            description: "寵物唯一識別碼",
            example: "507f1f77bcf86cd799439012",
          },
          name: {
            type: "string",
            description: "寵物名稱",
            example: "小白",
          },
          type: {
            type: "string",
            enum: ["dog", "cat", "bird", "rabbit", "other"],
            description: "寵物類型",
            example: "dog",
          },
          breed: {
            type: "string",
            description: "寵物品種",
            example: "柴犬",
          },
          gender: {
            type: "string",
            enum: ["male", "female", "unknown"],
            description: "寵物性別",
            example: "male",
          },
          age: {
            type: "integer",
            description: "寵物年齡（歲）",
            example: 2,
          },
          color: {
            type: "string",
            description: "寵物顏色",
            example: "白色",
          },
          size: {
            type: "string",
            enum: ["small", "medium", "large"],
            description: "寵物體型",
            example: "medium",
          },
          status: {
            type: "string",
            enum: ["lost", "found", "reunited"],
            description: "寵物狀態",
            example: "lost",
          },
          description: {
            type: "string",
            description: "寵物描述",
            example: "非常親人的柴犬，會回應名字",
          },
          lastSeenLocation: {
            type: "string",
            description: "最後出現地點",
            example: "台北市大安區復興南路",
          },
          lastSeenDate: {
            type: "string",
            format: "date-time",
            description: "最後出現時間",
          },
          contactInfo: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "聯絡人姓名",
                example: "王小明",
              },
              phone: {
                type: "string",
                description: "聯絡電話",
                example: "+886912345678",
              },
              email: {
                type: "string",
                format: "email",
                description: "聯絡電子郵件",
                example: "wang@example.com",
              },
            },
          },
          images: {
            type: "array",
            items: {
              type: "string",
              format: "uri",
            },
            description: "寵物照片 URLs",
            example: ["https://example.com/images/pet1.jpg"],
          },
          reward: {
            type: "number",
            description: "懸賞金額",
            example: 5000,
          },
          isUrgent: {
            type: "boolean",
            description: "是否緊急",
            example: true,
          },
          microchipId: {
            type: "string",
            description: "晶片編號",
            example: "MC123456789",
          },
          vaccinations: {
            type: "array",
            items: {
              type: "string",
            },
            description: "疫苗接種記錄",
            example: ["狂犬病", "八合一"],
          },
          medicalConditions: {
            type: "array",
            items: {
              type: "string",
            },
            description: "醫療狀況",
            example: [],
          },
          specialMarks: {
            type: "string",
            description: "特殊標記",
            example: "額頭有白色愛心形斑紋",
          },
          personality: {
            type: "array",
            items: {
              type: "string",
            },
            description: "性格特徵",
            example: ["親人", "活潑", "聰明"],
          },
          viewCount: {
            type: "integer",
            description: "瀏覽次數",
            example: 156,
          },
          shareCount: {
            type: "integer",
            description: "分享次數",
            example: 23,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "建立時間",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "更新時間",
          },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "請求是否成功",
            example: true,
          },
          message: {
            type: "string",
            description: "回應訊息",
            example: "操作成功",
          },
          data: {
            type: "object",
            description: "回應資料",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "請求是否成功",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "錯誤訊息",
                example: "請求資料驗證失敗",
              },
              statusCode: {
                type: "integer",
                description: "HTTP 狀態碼",
                example: 400,
              },
              timestamp: {
                type: "string",
                format: "date-time",
                description: "錯誤發生時間",
              },
              path: {
                type: "string",
                description: "請求路徑",
                example: "/api/auth/login",
              },
              method: {
                type: "string",
                description: "HTTP 方法",
                example: "POST",
              },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          currentPage: {
            type: "integer",
            description: "當前頁數",
            example: 1,
          },
          totalPages: {
            type: "integer",
            description: "總頁數",
            example: 10,
          },
          totalItems: {
            type: "integer",
            description: "總項目數",
            example: 100,
          },
          itemsPerPage: {
            type: "integer",
            description: "每頁項目數",
            example: 10,
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "用戶認證相關 API",
    },
    {
      name: "Users",
      description: "用戶管理相關 API",
    },
    {
      name: "Pets",
      description: "寵物協尋相關 API",
    },
    {
      name: "Upload",
      description: "檔案上傳相關 API",
    },
  ],
};

// Swagger 選項
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    "./src/routes/*.ts", // 路由檔案路徑
    "./src/models/*.ts", // 模型檔案路徑
  ],
};

// 生成 Swagger 規格
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI 選項
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: "呼嚕寵物協尋網站 API 文件",
};

/**
 * 設定 Swagger 文件
 */
export const swaggerSetup = (app: Express): void => {
  // API 文件路由
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  // JSON 格式的 API 規格
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export { swaggerSpec };
export default swaggerSetup;
