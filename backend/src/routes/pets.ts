import { Router } from "express";
import basicRoutes from "./pets/basic";
import imageRoutes from "./pets/images";
import sharingRoutes from "./pets/sharing";
import userRoutes from "./pets/user";
import favoriteRoutes from "./pets/favorites";
import searchRoutes from "./pets/search";

const router = Router();

// 基本 CRUD 操作
router.use("/", basicRoutes);

// 圖片上傳功能
router.use("/", imageRoutes);

// 分享功能
router.use("/", sharingRoutes);

// 用戶相關功能
router.use("/", userRoutes);

// 收藏功能
router.use("/", favoriteRoutes);

// 搜尋功能
router.use("/", searchRoutes);

export default router;
