import mongoose from "mongoose";
import { IUser } from "../../models/User";
import { UserRepository } from "../../repositories/UserRepository";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";

// 介面定義
export interface AdminUpdateUserData {
  name?: string;
  phone?: string;
  role?: "user" | "admin";
  isActive?: boolean;
}

export interface UserQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: "user" | "admin";
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * 管理員用戶服務 - 處理管理員相關的用戶管理功能
 */
export class AdminUserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 管理員獲取用戶列表（帶篩選和分頁）
   */
  async getAdminUserList(options: UserQueryOptions = {}): Promise<{
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        isActive,
        isEmailVerified,
      } = options;

      // 構建查詢條件
      const filter: any = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive;
      if (isEmailVerified !== undefined)
        filter.isEmailVerified = isEmailVerified;

      // 執行查詢
      const skip = (Number(page) - 1) * Number(limit);
      const selectFields =
        "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires";

      const [users, total] = await Promise.all([
        this.userRepository.findWithSelect(filter, selectFields, {
          sort: { createdAt: -1 },
          skip,
          limit: Number(limit),
        }),
        this.userRepository.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return {
        users,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      };
    } catch (error) {
      logger.error("管理員獲取用戶列表失敗", { error, options });
      throw error;
    }
  }

  /**
   * 管理員獲取單個用戶詳情
   */
  async getAdminUserById(userId: string): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      const selectFields =
        "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires";
      const user = await this.userRepository.findByIdWithSelect(
        userId,
        selectFields,
      );

      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      return user;
    } catch (error) {
      logger.error("管理員獲取用戶詳情失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 管理員更新用戶資料
   */
  async adminUpdateUser(
    userId: string,
    updateData: AdminUpdateUserData,
    adminUser: IUser,
  ): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      // 檢查目標用戶是否存在
      const targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        throw new NotFoundError("用戶不存在");
      }

      // 防止管理員修改自己的角色或狀態
      if (targetUser._id.toString() === adminUser._id.toString()) {
        if (
          updateData.role !== undefined ||
          updateData.isActive !== undefined
        ) {
          throw new ValidationError("不能修改自己的角色或帳號狀態");
        }
      }

      // 只有超級管理員可以設置管理員角色
      if (updateData.role === "admin" && adminUser.role !== "admin") {
        throw new ValidationError("只有超級管理員可以設置管理員角色");
      }

      // 更新用戶資料
      const updateFields: any = {};
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.role !== undefined) updateFields.role = updateData.role;
      if (updateData.isActive !== undefined)
        updateFields.isActive = updateData.isActive;

      const updatedUser = await this.userRepository.updateWithValidation(
        userId,
        updateFields,
      );

      if (!updatedUser) {
        throw new NotFoundError("更新失敗，用戶不存在");
      }

      logger.info("管理員更新用戶資料成功", {
        adminId: adminUser._id,
        targetUserId: userId,
        updateData: updateFields,
      });

      return updatedUser;
    } catch (error) {
      logger.error("管理員更新用戶資料失敗", { error, userId, updateData });
      throw error;
    }
  }

  /**
   * 管理員刪除用戶（軟刪除）
   */
  async adminDeleteUser(userId: string, adminUser: IUser): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      // 檢查目標用戶是否存在
      const targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        throw new NotFoundError("用戶不存在");
      }

      // 防止管理員刪除自己
      if (targetUser._id.toString() === adminUser._id.toString()) {
        throw new ValidationError("不能刪除自己的帳號");
      }

      // 只有超級管理員可以刪除管理員
      if (targetUser.role === "admin" && adminUser.role !== "admin") {
        throw new ValidationError("只有超級管理員可以刪除管理員帳號");
      }

      // 軟刪除：將用戶標記為非活躍
      await this.userRepository.softDelete(userId, targetUser.email);

      logger.info("管理員刪除用戶成功", {
        adminId: adminUser._id,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
      });
    } catch (error) {
      logger.error("管理員刪除用戶失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 管理員重設用戶密碼
   */
  async adminResetUserPassword(
    userId: string,
    adminUser: IUser,
  ): Promise<string> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      // 檢查目標用戶是否存在
      const targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        throw new NotFoundError("用戶不存在");
      }

      // 生成臨時密碼
      const tempPassword = Math.random().toString(36).slice(-8);

      // 更新用戶密碼
      await this.userRepository.updatePassword(userId, tempPassword);

      logger.info("管理員重設用戶密碼成功", {
        adminId: adminUser._id,
        targetUserId: userId,
      });

      return tempPassword;
    } catch (error) {
      logger.error("管理員重設用戶密碼失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 管理員批量操作用戶
   */
  async adminBatchUpdateUsers(
    userIds: string[],
    updateData: Partial<AdminUpdateUserData>,
    adminUser: IUser,
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    try {
      const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as string[],
      };

      for (const userId of userIds) {
        try {
          await this.adminUpdateUser(userId, updateData, adminUser);
          results.successCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push(`用戶 ${userId}: ${error.message}`);
        }
      }

      logger.info("管理員批量更新用戶完成", {
        adminId: adminUser._id,
        totalUsers: userIds.length,
        successCount: results.successCount,
        failedCount: results.failedCount,
      });

      return results;
    } catch (error) {
      logger.error("管理員批量更新用戶失敗", { error, userIds, updateData });
      throw error;
    }
  }

  /**
   * 獲取系統統計
   */
  async getSystemStatistics(): Promise<{
    users: {
      total: number;
      active: number;
      verified: number;
      admins: number;
      recent: number;
    };
  }> {
    try {
      const stats = await this.userRepository.getStatistics();

      return {
        users: stats,
      };
    } catch (error) {
      logger.error("獲取系統統計失敗", { error });
      throw error;
    }
  }

  /**
   * 管理員搜索用戶
   */
  async adminSearchUsers(
    searchTerm: string,
    options: {
      limit?: number;
      includeInactive?: boolean;
    } = {},
  ): Promise<IUser[]> {
    try {
      const { limit = 10, includeInactive = false } = options;

      const filter: any = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      };

      if (!includeInactive) {
        filter.isActive = true;
      }

      const selectFields =
        "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires";

      const users = await this.userRepository.findWithSelect(
        filter,
        selectFields,
        {
          limit,
          sort: { name: 1 },
        },
      );

      return users;
    } catch (error) {
      logger.error("管理員搜索用戶失敗", { error, searchTerm, options });
      throw error;
    }
  }
}
