import { IUser } from "../models/User";
import { UserRepository } from "../repositories/userRepository";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from "../utils/errors";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

// 用戶註冊資料介面
export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// 用戶登入資料介面
export interface LoginUserData {
  email: string;
  password: string;
}

// 用戶更新資料介面
export interface UpdateUserData {
  name?: string;
  phone?: string;
  avatar?: string;
}

// 管理員更新用戶資料介面
export interface AdminUpdateUserData {
  name?: string;
  phone?: string;
  role?: "user" | "moderator" | "admin";
  isActive?: boolean;
}

// 用戶查詢選項介面
export interface UserQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  role?: "user" | "moderator" | "admin";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * 用戶服務類別
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  /**
   * 用戶註冊
   */
  async registerUser(userData: RegisterUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      // 檢查電子郵件是否已存在
      const existingUser = await this.userRepository.findByEmail(
        userData.email.toLowerCase(),
      );
      if (existingUser) {
        throw new ValidationError("此電子郵件已被註冊");
      }

      // 建立新用戶資料
      const newUserData = {
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name.trim(),
        phone: userData.phone?.trim(),
      };

      // 建立新用戶
      const user = await this.userRepository.create(newUserData);

      // 生成電子郵件驗證令牌
      user.generateEmailVerificationToken();

      // 儲存用戶
      await user.save();

      // 生成認證令牌
      const authToken = user.generateAuthToken();

      logger.info("用戶註冊成功", {
        userId: user._id,
        email: user.email,
        name: user.name,
      });

      // TODO: 發送電子郵件驗證郵件
      // await emailService.sendVerificationEmail(user.email, verificationToken);

      return {
        user,
        token: authToken,
      };
    } catch (error) {
      logger.error("用戶註冊失敗", {
        error,
        userData: { email: userData.email, name: userData.name },
      });
      throw error;
    }
  }

  /**
   * 用戶登入
   */
  async loginUser(loginData: LoginUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      // 查找用戶（包含密碼）
      const user = await this.userRepository.findByEmail(
        loginData.email.toLowerCase(),
      );

      if (!user) {
        throw new AuthenticationError("電子郵件或密碼錯誤");
      }

      // 檢查用戶是否啟用
      if (!user.isActive) {
        throw new AuthenticationError("用戶帳號已被停用");
      }

      // 驗證密碼
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        throw new AuthenticationError("電子郵件或密碼錯誤");
      }

      // 更新最後登入時間
      user.lastLoginAt = new Date();
      await user.save();

      // 生成認證令牌
      const token = user.generateAuthToken();

      logger.info("用戶登入成功", {
        userId: user._id,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error("用戶登入失敗", { error, email: loginData.email });
      throw error;
    }
  }

  /**
   * 根據 ID 獲取用戶
   */
  async getUserById(userId: string): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      return user;
    } catch (error) {
      logger.error("獲取用戶失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 根據電子郵件獲取用戶
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findByEmail(email.toLowerCase());
      return user;
    } catch (error) {
      logger.error("根據電子郵件獲取用戶失敗", { error, email });
      throw error;
    }
  }

  /**
   * 更新用戶資料
   */
  async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      // 更新用戶資料
      if (updateData.name !== undefined) {
        user.name = updateData.name.trim();
      }
      if (updateData.phone !== undefined) {
        user.phone = updateData.phone?.trim();
      }
      if (updateData.avatar !== undefined) {
        user.avatar = updateData.avatar;
      }

      await user.save();

      logger.info("用戶資料更新成功", {
        userId: user._id,
        updatedFields: Object.keys(updateData),
      });

      return user;
    } catch (error) {
      logger.error("更新用戶資料失敗", { error, userId, updateData });
      throw error;
    }
  }

  /**
   * 更改用戶密碼
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      // 驗證當前密碼
      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError("當前密碼錯誤");
      }

      // 設定新密碼
      user.password = newPassword;
      await user.save();

      logger.info("用戶密碼更改成功", { userId: user._id });
    } catch (error) {
      logger.error("更改用戶密碼失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 重設密碼
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 查找具有有效重設令牌的用戶
      const user =
        await this.userRepository.findByPasswordResetTokenWithExpiry(token);

      if (!user) {
        throw new ValidationError("密碼重設令牌無效或已過期");
      }

      // 設定新密碼並清除重設令牌
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await user.save();

      logger.info("密碼重設成功", { userId: user._id });
    } catch (error) {
      logger.error("密碼重設失敗", { error });
      throw error;
    }
  }

  /**
   * 驗證電子郵件
   */
  async verifyEmail(userId: string, token: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      if (user.isEmailVerified) {
        throw new ValidationError("電子郵件已經驗證過了");
      }

      if (
        !user.emailVerificationToken ||
        user.emailVerificationToken !== token
      ) {
        throw new ValidationError("驗證令牌無效或已過期");
      }

      // 更新用戶驗證狀態
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      logger.info("電子郵件驗證成功", { userId });
    } catch (error) {
      logger.error("電子郵件驗證失敗", { error, userId, token });
      throw error;
    }
  }

  /**
   * 通過令牌驗證電子郵件
   */
  async verifyEmailByToken(token: string): Promise<void> {
    try {
      const user =
        await this.userRepository.findByEmailVerificationToken(token);
      if (!user) {
        throw new ValidationError("驗證令牌無效或已過期");
      }

      if (user.isEmailVerified) {
        throw new ValidationError("電子郵件已經驗證過了");
      }

      // 更新用戶驗證狀態
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      logger.info("電子郵件驗證成功", { userId: user._id });
    } catch (error) {
      logger.error("電子郵件驗證失敗", { error, token });
      throw error;
    }
  }

  /**
   * 停用用戶
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError("無效的用戶 ID");
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("用戶不存在");
      }

      await this.userRepository.deactivate(userId);

      logger.info("用戶已停用", { userId: user._id });
    } catch (error) {
      logger.error("停用用戶失敗", { error, userId });
      throw error;
    }
  }

  /**
   * 獲取用戶列表（分頁）
   */
  async getUsers(options: UserQueryOptions = {}): Promise<{
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        isEmailVerified,
        role,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // 建立查詢條件
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

  // ===== 管理員功能方法 =====

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
   * 清理過期驗證令牌
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
