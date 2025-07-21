import { Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { createCacheInvalidationMiddleware } from "../../middleware/cacheMiddleware";
import { Pet } from "../../models/Pet";
import mongoose from "mongoose";

const router = Router();

/**
 * @route   POST /api/pets/:id/share
 * @desc    分享寵物協尋案例
 * @access  Public
 */
router.post(
  "/:id/share",
  createCacheInvalidationMiddleware({
    patterns: ["pets:*"], // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("請提供有效的寵物 ID");
    }

    logger.info("分享寵物協尋案例請求", { petId: id });

    // 查找寵物並增加分享次數
    const pet = await Pet.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true },
    ).lean();

    if (!pet) {
      throw new NotFoundError("找不到指定的寵物資訊");
    }

    // 生成分享 URL
    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/pets/${id}`;

    // 生成分享文字
    const shareText = `幫忙協尋 ${pet.name}！${pet.type === "lost" ? "走失" : "發現"}於 ${pet.lastSeenLocation}。詳情請見：${shareUrl}`;

    res.json({
      success: true,
      message: "分享連結已生成",
      data: {
        shareUrl,
        shareText,
        shareCount: pet.shareCount + 1,
        socialMedia: {
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
          line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        },
      },
    });
  }),
);

export default router;
