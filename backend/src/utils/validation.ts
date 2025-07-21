import { z } from "zod";
import { ErrorFactory } from "./errors";

// 重新導出 schemas（為了向後兼容）
export type * from "../schemas";

// 驗證中介軟體輔助函數
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = ErrorFactory.fromZodError(error);
        return next(validationError);
      }
      next(error);
    }
  };
};

// 查詢參數驗證中介軟體
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.validatedQuery = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = ErrorFactory.fromZodError(error);
        validationError.message = "查詢參數驗證失敗";
        return next(validationError);
      }
      next(error);
    }
  };
};

// 路徑參數驗證中介軟體
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.validatedParams = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = ErrorFactory.fromZodError(error);
        validationError.message = "路徑參數驗證失敗";
        return next(validationError);
      }
      next(error);
    }
  };
};

// 檔案驗證中介軟體
export const validateFile = (
  options: {
    required?: boolean;
    maxSize?: number; // bytes
    allowedTypes?: string[];
    fieldName?: string;
  } = {},
) => {
  return (req: any, res: any, next: any) => {
    const {
      required = false,
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ["image/jpeg", "image/png", "image/gif"],
      fieldName = "file",
    } = options;

    const file = req.file || req.files?.[fieldName];

    if (required && !file) {
      const error = ErrorFactory.createValidationError(
        "檔案為必填項目",
        fieldName,
        undefined,
        "required",
      );
      return next(error);
    }

    if (file) {
      // 檢查檔案大小
      if (file.size > maxSize) {
        const error = ErrorFactory.createValidationError(
          `檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`,
          fieldName,
          file.size,
          "maxSize",
        );
        return next(error);
      }

      // 檢查檔案類型
      if (!allowedTypes.includes(file.mimetype)) {
        const error = ErrorFactory.createValidationError(
          `不支援的檔案類型，僅支援: ${allowedTypes.join(", ")}`,
          fieldName,
          file.mimetype,
          "fileType",
        );
        return next(error);
      }
    }

    next();
  };
};
