import {
  BasicUserService,
  RegisterUserData,
  LoginUserData,
  UpdateUserData,
} from "./basic";
import { PasswordService } from "./password";
import { VerificationService } from "./verification";
import {
  AdminUserService,
  AdminUpdateUserData,
  UserQueryOptions,
} from "./admin";
import { UserQueryService, UserListResult } from "./query";
import { IUser } from "../../models/User";
import { logger } from "../../utils/logger";

/**
 * 統一的用戶服務 - 整合所有用戶相關功能
 */
export class UserService {
  private basicService: BasicUserService;
  private passwordService: PasswordService;
  private verificationService: VerificationService;
  private adminService: AdminUserService;
  private queryService: UserQueryService;

  constructor() {
    this.basicService = new BasicUserService();
    this.passwordService = new PasswordService();
    this.verificationService = new VerificationService();
    this.adminService = new AdminUserService();
    this.queryService = new UserQueryService();
  }

  // ===== 基本用戶操作 =====

  /**
   * 用戶註冊
   */
  async register(userData: RegisterUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    const result = await this.basicService.register(userData);

    // 自動發送郵件驗證
    try {
      await this.verificationService.sendEmailVerification(
        result.user._id.toString(),
      );
    } catch (error) {
      logger.warn("註冊後發送驗證郵件失敗", { error, userId: result.user._id });
    }

    return result;
  }

  /**
   * 用戶登入
   */
  async login(loginData: LoginUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    return this.basicService.login(loginData);
  }

  /**
   * 根據 ID 獲取用戶
   */
  async getUserById(userId: string): Promise<IUser> {
    return this.basicService.getUserById(userId);
  }

  /**
   * 根據郵箱獲取用戶
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return this.basicService.getUserByEmail(email);
  }

  /**
   * 更新用戶資料
   */
  async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser> {
    return this.basicService.updateUser(userId, updateData);
  }

  /**
   * 停用用戶帳號
   */
  async deactivateUser(userId: string): Promise<void> {
    return this.basicService.deactivateUser(userId);
  }

  // ===== 密碼管理 =====

  /**
   * 變更密碼
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    return this.passwordService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  /**
   * 請求密碼重設
   */
  async requestPasswordReset(email: string): Promise<void> {
    return this.passwordService.requestPasswordReset(email);
  }

  /**
   * 重設密碼
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.passwordService.resetPassword(token, newPassword);
  }

  /**
   * 驗證密碼重設令牌
   */
  async validateResetToken(token: string): Promise<boolean> {
    return this.passwordService.validateResetToken(token);
  }

  // ===== 郵件驗證 =====

  /**
   * 發送郵件驗證
   */
  async sendEmailVerification(userId: string): Promise<void> {
    return this.verificationService.sendEmailVerification(userId);
  }

  /**
   * 驗證郵箱（通過用戶ID）
   */
  async verifyEmailByUserId(userId: string): Promise<void> {
    return this.verificationService.verifyEmailByUserId(userId);
  }

  /**
   * 驗證郵箱（通過令牌）
   */
  async verifyEmailByToken(token: string): Promise<void> {
    return this.verificationService.verifyEmailByToken(token);
  }

  /**
   * 重新發送驗證郵件
   */
  async resendEmailVerification(email: string): Promise<void> {
    return this.verificationService.resendEmailVerification(email);
  }

  /**
   * 驗證郵件驗證令牌
   */
  async validateVerificationToken(token: string): Promise<boolean> {
    return this.verificationService.validateVerificationToken(token);
  }

  /**
   * 獲取用戶驗證狀態
   */
  async getVerificationStatus(userId: string): Promise<{
    isEmailVerified: boolean;
    hasVerificationToken: boolean;
    tokenExpires?: Date;
  }> {
    return this.verificationService.getVerificationStatus(userId);
  }

  // ===== 用戶查詢和統計 =====

  /**
   * 獲取用戶列表（帶篩選和分頁）
   */
  async getUserList(options: UserQueryOptions = {}): Promise<UserListResult> {
    return this.queryService.getUserList(options);
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
    return this.queryService.searchUsers(searchTerm, options);
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
    return this.queryService.getUsersByRole(role, options);
  }

  /**
   * 獲取最近註冊的用戶
   */
  async getRecentUsers(limit: number = 10): Promise<IUser[]> {
    return this.queryService.getRecentUsers(limit);
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
    return this.queryService.getActiveUsers(options);
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
    return this.queryService.getUserStatistics();
  }

  /**
   * 檢查用戶是否存在
   */
  async userExists(
    identifier: string,
    type: "id" | "email" = "id",
  ): Promise<boolean> {
    return this.queryService.userExists(identifier, type);
  }

  // ===== 管理員功能 =====

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
    return this.adminService.getAdminUserList(options);
  }

  /**
   * 管理員獲取單個用戶詳情
   */
  async getAdminUserById(userId: string): Promise<IUser> {
    return this.adminService.getAdminUserById(userId);
  }

  /**
   * 管理員更新用戶資料
   */
  async adminUpdateUser(
    userId: string,
    updateData: AdminUpdateUserData,
    adminUser: IUser,
  ): Promise<IUser> {
    return this.adminService.adminUpdateUser(userId, updateData, adminUser);
  }

  /**
   * 管理員刪除用戶（軟刪除）
   */
  async adminDeleteUser(userId: string, adminUser: IUser): Promise<void> {
    return this.adminService.adminDeleteUser(userId, adminUser);
  }

  /**
   * 管理員重設用戶密碼
   */
  async adminResetUserPassword(
    userId: string,
    adminUser: IUser,
  ): Promise<string> {
    return this.adminService.adminResetUserPassword(userId, adminUser);
  }

  /**
   * 管理員批量操作用戶
   */
  async adminBatchUpdateUsers(
    userIds: string[],
    updateData: Partial<AdminUpdateUserData>,
    adminUser: IUser,
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    return this.adminService.adminBatchUpdateUsers(
      userIds,
      updateData,
      adminUser,
    );
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
    return this.adminService.getSystemStatistics();
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
    return this.adminService.adminSearchUsers(searchTerm, options);
  }

  // ===== 維護功能 =====

  /**
   * 清理過期令牌
   */
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    const [passwordTokens, verificationTokens, queryTokens] = await Promise.all(
      [
        this.passwordService.cleanupExpiredResetTokens(),
        this.verificationService.cleanupExpiredVerificationTokens(),
        this.queryService.cleanupExpiredTokens(),
      ],
    );

    const totalDeleted =
      passwordTokens.deletedCount +
      verificationTokens.deletedCount +
      queryTokens.deletedCount;

    logger.info("清理過期令牌完成", {
      passwordTokens: passwordTokens.deletedCount,
      verificationTokens: verificationTokens.deletedCount,
      queryTokens: queryTokens.deletedCount,
      total: totalDeleted,
    });

    return { deletedCount: totalDeleted };
  }
}

// 導出類型
export {
  RegisterUserData,
  LoginUserData,
  UpdateUserData,
  AdminUpdateUserData,
  UserQueryOptions,
  UserListResult,
};

// 導出默認實例
export const userService = new UserService();
