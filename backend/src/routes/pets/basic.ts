import { Router } from "express";
import { asyncHandler } from "../../middleware/error-handler";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../utils/errors";
import { logger } from "../../utils/logger";
import {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  petCacheKeyGenerator,
  conditionalCacheMiddleware,
} from "../../middleware/cacheMiddleware";
import { validateRequest, validateQuery } from "../../utils/validation";
import { petSchema, petUpdateSchema } from "../../schemas/pet";
import { petSearchSchema } from "../../schemas/search";
import { Pet, IPet } from "../../models/Pet";
import { SearchHistory } from "../../models/SearchHistory";
import { authenticate } from "../../middleware/auth";
import {
  requirePermission,
  Permission,
  requireActiveAccount,
  hasPermission,
} from "../../middleware/rbac";
import mongoose from "mongoose";

const router = Router();

/**
 * @route   GET /api/pets
 * @desc    取得寵物列表
 * @access  Public
 */
router.get(
  "/",
  validateQuery(petSearchSchema),
  conditionalCacheMiddleware({
    ttl: 3 * 60 * 1000, // 3分鐘快取
    keyGenerator: petCacheKeyGenerator,
    userCondition: (req) => !req.user, // 只對未登入用戶快取
  }),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 12,
      status,
      type,
      breed,
      location,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      radius = 10,
    } = req.validatedQuery;

    logger.info("獲取寵物列表請求", {
      page,
      limit,
      status,
      type,
      breed,
      location,
      search,
      sortBy,
      sortOrder,
    });

    // 建立查詢條件
    const query: any = {};

    // 狀態篩選
    if (status) {
      query.status = status;
    }

    // 寵物類型篩選
    if (type) {
      query.type = type;
    }

    // 品種篩選
    if (breed) {
      query.breed = new RegExp(breed, "i");
    }

    // 文字搜尋（名稱、描述、地點）
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { lastSeenLocation: new RegExp(search, "i") },
        { "contactInfo.name": new RegExp(search, "i") },
      ];
    }

    // 地點篩選
    if (location) {
      query.lastSeenLocation = new RegExp(location, "i");
    }

    // 計算分頁
    const skip = (page - 1) * limit;

    // 排序設定
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // 如果按緊急程度排序，優先顯示緊急案件
    if (sortBy === "createdAt") {
      sortOptions.isUrgent = -1;
    }

    // 執行查詢
    const [pets, totalItems] = await Promise.all([
      Pet.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .lean(),
      Pet.countDocuments(query),
    ]);

    // 記錄搜尋歷史（如果有搜尋條件且用戶已登入）
    if ((search || location || type || status || breed) && req.user?.id) {
      const searchQuery = search || location || "";
      const filters = {
        type,
        status,
        location,
        breed,
        radius,
      };

      // 異步記錄搜尋歷史，不影響主要回應
      SearchHistory.recordSearch(
        req.user.id,
        searchQuery,
        filters,
        totalItems,
      ).catch((error) => {
        logger.error("記錄搜尋歷史失敗:", error);
      });
    }

    // 計算分頁資訊
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          status: ["lost", "found", "reunited"],
          type: ["dog", "cat", "bird", "rabbit", "other"],
          size: ["small", "medium", "large"],
          gender: ["male", "female", "unknown"],
        },
      },
    });
  }),
);

/**
 * @route   GET /api/pets/:id
 * @desc    獲取特定寵物資訊
 * @access  Public
 */
router.get(
  "/:id",
  createCacheMiddleware({
    ttl: 10 * 60 * 1000, // 10分鐘快取
    keyGenerator: petCacheKeyGenerator,
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("請提供有效的寵物 ID");
    }

    logger.info("獲取寵物詳細資訊請求", { petId: id });

    // 查找寵物並增加瀏覽次數
    const pet = await Pet.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    )
      .populate("userId", "name email")
      .lean();

    if (!pet) {
      throw new NotFoundError("找不到指定的寵物資訊");
    }

    res.json({
      success: true,
      data: {
        pet,
      },
    });
  }),
);

/**
 * @route   POST /api/pets
 * @desc    新增寵物協尋案例
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  requireActiveAccount,
  validateRequest(petSchema),
  createCacheInvalidationMiddleware({
    patterns: ["pets:*"], // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
    const validatedData = req.validatedData;
    const userId = req.user!.id;

    logger.info("新增寵物協尋案例請求", {
      userId,
      name: validatedData.name,
      type: validatedData.type,
      status: validatedData.status,
      lastSeenLocation: validatedData.lastSeenLocation,
    });

    // 建立寵物資料
    const petData = {
      ...validatedData,
      userId: new mongoose.Types.ObjectId(userId),
      viewCount: 0,
      shareCount: 0,
    };

    // 儲存到資料庫
    const pet = new Pet(petData);
    await pet.save();

    // 填充用戶資訊
    await pet.populate("userId", "name email");

    res.status(201).json({
      success: true,
      message: "寵物協尋案例新增成功",
      data: {
        pet: pet.toJSON(),
      },
    });
  }),
);

/**
 * @route   PUT /api/pets/:id
 * @desc    更新寵物協尋案例
 * @access  Private
 */
router.put(
  "/:id",
  authenticate,
  requireActiveAccount,
  validateRequest(petSchema),
  createCacheInvalidationMiddleware({
    patterns: ["pets:*"], // 清除所有寵物相關快取
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.validatedData;
    const userId = req.user!.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("請提供有效的寵物 ID");
    }

    logger.info("更新寵物資訊請求", { petId: id, userId, updateData });

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
      throw new ForbiddenError("您沒有權限修改此寵物資訊");
    }

    // 更新寵物資訊
    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("userId", "name email");

    res.json({
      success: true,
      message: "寵物資訊更新成功",
      data: {
        pet: updatedPet,
      },
    });
  }),
);

/**
 * @route   DELETE /api/pets/:id
 * @desc    刪除寵物協尋案例
 * @access  Private
 */
router.delete(
  "/:id",
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

    logger.info("刪除寵物協尋案例請求", { petId: id, userId });

    // 查找寵物並檢查權限
    const pet = await Pet.findById(id);
    if (!pet) {
      throw new NotFoundError("找不到指定的寵物資訊");
    }

    // 檢查是否為寵物擁有者或管理員
    if (
      pet.userId.toString() !== userId &&
      !hasPermission(req.user!, Permission.PET_DELETE)
    ) {
      throw new ForbiddenError("您沒有權限刪除此寵物資訊");
    }

    // 執行刪除（硬刪除）
    await Pet.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "寵物協尋案例已刪除",
    });
  }),
);

export default router;
