import mongoose from "mongoose";
import { IUser } from "../../models/User";
import { UserRepository } from "../../repositories/UserRepository";
import { ValidationError } from "../../utils/errors";
import { logger } from "../../utils/logger";

// 介面定義
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

export interface UserListResult {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 用戶查詢服務 - 處理用戶查詢、分頁和統計功能
 */
export class UserQueryService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 獲取用戶列表（帶篩選和分頁）
   */
  async getUserList(options: UserQueryOptions = {}): Promise<UserListResult> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        isActive,
        isEmailVerified,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // 驗證分頁參數
      if (page < 1 || limit < 1 || limit > 100) {
        throw new ValidationError("無效的分頁參數");
      }

      // 構建查詢條件
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (isEmailVerified !== undefined) {
        query.isEmailVerified = isEmailVerified;
      }

      if (role) {
        query.role = role;
      }

      // 執行查詢
      const { users, total } = await this.userRepository.findWithPagination(
        query,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        },
      );

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("獲取用戶列表失敗", { error, options });
      throw error;
    }
  }

  /**
   * 搜索用戶
   */
  async searchUsers(
    searchTerm: string,
    options: {
      limit?: number;
      includeInactive?: boolean;
      role?: "user" | "admin";
    } = {},
  ): Promise<IUser[]> {
    try {
      const { limit = 10, includeInactive = false, role } = options;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ValidationError("搜索關鍵字至少需要2個字符");
      }

      const filter: any = {
        $or: [
          { name: { $regex: searchTerm.trim(), $options: "i" } },
          { email: { $regex: searchTerm.trim(), $options: "i" } },
        ],
      };

      if (!includeInactive) {
        filter.isActive = true;
      }

      if (role) {
        filter.role = role;
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
      logger.error("搜索用戶失敗", { error, searchTerm, options });
      throw error;
    }
  }

  /**
   * 根據角色獲取用戶列表
   */
  async getUsersByRole(
    role: "user" | "admin",
    options: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    } = {},
  ): Promise<UserListResult> {
    try {
      const { page = 1, limit = 20, isActive = true } = options;

      const filter: any = { role };
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      const { users, total } = await this.userRepository.findWithPagination(
        filter,
        {
          page,
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      );

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("根據角色獲取用戶列表失敗", { error, role, options });
      throw error;
    }
  }

  /**
   * 獲取最近註冊的用戶
   */
  async getRecentUsers(limit: number = 10): Promise<IUser[]> {
    try {
      if (limit < 1 || limit > 50) {
        throw new ValidationError("限制數量必須在1-50之間");
      }

      const selectFields =
        "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires";

      const users = await this.userRepository.findWithSelect(
        { isActive: true },
        selectFields,
        {
          limit,
          sort: { createdAt: -1 },
        },
      );

      return users;
    } catch (error) {
      logger.error("獲取最近註冊用戶失敗", { error, limit });
      throw error;
    }
  }

  /**
   * 獲取活躍用戶列表
   */
  async getActiveUsers(
    options: {
      page?: number;
      limit?: number;
      sortBy?: "lastLogin" | "createdAt";
    } = {},
  ): Promise<UserListResult> {
    try {
      const { page = 1, limit = 20, sortBy = "lastLogin" } = options;

      const filter = {
        isActive: true,
        isEmailVerified: true,
      };

      const { users, total } = await this.userRepository.findWithPagination(
        filter,
        {
          page,
          limit,
          sortBy,
          sortOrder: "desc",
        },
      );

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("獲取活躍用戶列表失敗", { error, options });
      throw error;
    }
  }

  /**
   * 獲取用戶統計信息
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    verified: number;
    admins: number;
    recent: number;
    byRole: { [key: string]: number };
    byStatus: {
      active: number;
      inactive: number;
      verified: number;
      unverified: number;
    };
  }> {
    try {
      const [basicStats, roleStats, statusStats] = await Promise.all([
        this.userRepository.getStatistics(),
        this.getUserRoleStatistics(),
        this.getUserStatusStatistics(),
      ]);

      return {
        ...basicStats,
        byRole: roleStats,
        byStatus: statusStats,
      };
    } catch (error) {
      logger.error("獲取用戶統計信息失敗", { error });
      throw error;
    }
  }

  /**
   * 獲取用戶角色統計
   */
  private async getUserRoleStatistics(): Promise<{ [key: string]: number }> {
    try {
      const pipeline = [
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ];

      const results = await this.userRepository.aggregate(pipeline);
      const roleStats: { [key: string]: number } = {};

      results.forEach((result: any) => {
        roleStats[result._id] = result.count;
      });

      return roleStats;
    } catch (error) {
      logger.error("獲取用戶角色統計失敗", { error });
      throw error;
    }
  }

  /**
   * 獲取用戶狀態統計
   */
  private async getUserStatusStatistics(): Promise<{
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
  }> {
    try {
      const [activeCount, verifiedCount, totalCount] = await Promise.all([
        this.userRepository.countDocuments({ isActive: true }),
        this.userRepository.countDocuments({ isEmailVerified: true }),
        this.userRepository.countDocuments({}),
      ]);

      return {
        active: activeCount,
        inactive: totalCount - activeCount,
        verified: verifiedCount,
        unverified: totalCount - verifiedCount,
      };
    } catch (error) {
      logger.error("獲取用戶狀態統計失敗", { error });
      throw error;
    }
  }

  /**
   * 檢查用戶是否存在
   */
  async userExists(
    identifier: string,
    type: "id" | "email" = "id",
  ): Promise<boolean> {
    try {
      let user: IUser | null = null;

      if (type === "id") {
        if (!mongoose.Types.ObjectId.isValid(identifier)) {
          return false;
        }
        user = await this.userRepository.findById(identifier);
      } else {
        user = await this.userRepository.findByEmail(identifier);
      }

      return !!user;
    } catch (error) {
      logger.error("檢查用戶是否存在失敗", { error, identifier, type });
      return false;
    }
  }

  /**
   * 清理過期令牌
   */
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    try {
      const result = await this.userRepository.cleanupExpiredTokens();

      logger.info("清理過期驗證令牌成功", {
        deletedCount: result.deletedCount,
      });
      return result;
    } catch (error) {
      logger.error("清理過期驗證令牌失敗", { error });
      throw error;
    }
  }
}
