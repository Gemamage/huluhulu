import { Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../utils/errors";
import { logger } from "../../utils/logger";
import { createCacheInvalidationMiddleware } from "../../middleware/cacheMiddleware";
import { Pet } from "../../models/Pet";
import { authenticate } from "../../middleware/auth";
import {
  requireActiveAccount,
  hasPermission,
  Permission,
} from "../../middleware/rbac";
import mongoose from "mongoose";

const router = Router();

/**
 * @route   POST /api/pets/:id/images
 * @desc    上傳寵物圖片
 * @access  Private
 */
router.post(
  "/:id/images",
  authenticate,
  requireActiveAccount,
  createCacheInvalidationMiddleware({
    patterns: ["pets:*"], // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("請提供有效的寵物 ID");
    }

    logger.info("上傳寵物圖片請求", { petId: id, userId });

    // 查找寵物並檢查權限
    const pet = await Pet.findById(id);
    if (!pet) {
      throw new NotFoundError("找不到指定的寵物資訊");
    }

    // 檢查是否為寵物擁有者或管理員
    if (
      pet.userId.toString() !== userId &&
      !hasPermission(req.user!, Permission.PET_WRITE)
    ) {
      throw new ForbiddenError("您沒有權限上傳此寵物的圖片");
    }

    // TODO: 實作圖片上傳邏輯
    // 1. 驗證圖片格式和大小
    // 2. 上傳到雲端儲存服務（如 AWS S3、Cloudinary 等）
    // 3. 更新寵物資料中的圖片 URL
    // 4. 可能需要生成縮圖

    res.json({
      success: true,
      message: "圖片上傳功能尚未實作",
      data: {
        petId: id,
        // imageUrls: [] // 上傳成功後的圖片 URL 陣列
      },
    });
  }),
);

/**
 * @route   DELETE /api/pets/:id/images/:imageId
 * @desc    刪除寵物圖片
 * @access  Private
 */
router.delete(
  "/:id/images/:imageId",
  authenticate,
  requireActiveAccount,
  createCacheInvalidationMiddleware({
    patterns: ["pets:*"], // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const userId = req.user!.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("請提供有效的寵物 ID");
    }

    logger.info("刪除寵物圖片請求", { petId: id, imageId, userId });

    // 查找寵物並檢查權限
    const pet = await Pet.findById(id);
    if (!pet) {
      throw new NotFoundError("找不到指定的寵物資訊");
    }

    // 檢查是否為寵物擁有者或管理員
    if (
      pet.userId.toString() !== userId &&
      !hasPermission(req.user!, Permission.PET_WRITE)
    ) {
      throw new ForbiddenError("您沒有權限刪除此寵物的圖片");
    }

    // TODO: 實作圖片刪除邏輯
    // 1. 從雲端儲存服務刪除圖片
    // 2. 從寵物資料中移除圖片 URL

    res.json({
      success: true,
      message: "圖片刪除功能尚未實作",
      data: {
        petId: id,
        imageId,
      },
    });
  }),
);

export default router;
