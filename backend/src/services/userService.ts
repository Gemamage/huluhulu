import { User, IUser } from '../models/User';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

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

// 用戶查詢選項介面
export interface UserQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  role?: 'user' | 'admin';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 用戶服務類別
 */
export class UserService {
  /**
   * 用戶註冊
   */
  static async registerUser(userData: RegisterUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      // 檢查電子郵件是否已存在
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new ValidationError('此電子郵件已被註冊');
      }
      
      // 建立新用戶
      const user = new User({
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name.trim(),
        phone: userData.phone?.trim(),
      });
      
      // 生成電子郵件驗證令牌
      user.generateEmailVerificationToken();
      
      // 儲存用戶
      await user.save();
      
      // 生成認證令牌
      const authToken = user.generateAuthToken();
      
      logger.info('用戶註冊成功', {
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
      logger.error('用戶註冊失敗', { error, userData: { email: userData.email, name: userData.name } });
      throw error;
    }
  }
  
  /**
   * 用戶登入
   */
  static async loginUser(loginData: LoginUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      // 查找用戶（包含密碼）
      const user = await User.findOne({ email: loginData.email.toLowerCase() })
        .select('+password');
      
      if (!user) {
        throw new AuthenticationError('電子郵件或密碼錯誤');
      }
      
      // 檢查用戶是否啟用
      if (!user.isActive) {
        throw new AuthenticationError('用戶帳號已被停用');
      }
      
      // 驗證密碼
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('電子郵件或密碼錯誤');
      }
      
      // 更新最後登入時間
      user.lastLoginAt = new Date();
      await user.save();
      
      // 生成認證令牌
      const token = user.generateAuthToken();
      
      logger.info('用戶登入成功', {
        userId: user._id,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      });
      
      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('用戶登入失敗', { error, email: loginData.email });
      throw error;
    }
  }
  
  /**
   * 根據 ID 獲取用戶
   */
  static async getUserById(userId: string): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }
      
      return user;
    } catch (error) {
      logger.error('獲取用戶失敗', { error, userId });
      throw error;
    }
  }
  
  /**
   * 根據電子郵件獲取用戶
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      logger.error('根據電子郵件獲取用戶失敗', { error, email });
      throw error;
    }
  }
  
  /**
   * 更新用戶資料
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
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
      
      logger.info('用戶資料更新成功', {
        userId: user._id,
        updatedFields: Object.keys(updateData),
      });
      
      return user;
    } catch (error) {
      logger.error('更新用戶資料失敗', { error, userId, updateData });
      throw error;
    }
  }
  
  /**
   * 更改用戶密碼
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }
      
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }
      
      // 驗證當前密碼
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('當前密碼錯誤');
      }
      
      // 設定新密碼
      user.password = newPassword;
      await user.save();
      
      logger.info('用戶密碼更改成功', { userId: user._id });
    } catch (error) {
      logger.error('更改用戶密碼失敗', { error, userId });
      throw error;
    }
  }
  
  /**
   * 重設密碼
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 查找具有有效重設令牌的用戶
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      }).select('+passwordResetToken +passwordResetExpires');
      
      if (!user) {
        throw new ValidationError('密碼重設令牌無效或已過期');
      }
      
      // 設定新密碼並清除重設令牌
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      
      await user.save();
      
      logger.info('密碼重設成功', { userId: user._id });
    } catch (error) {
      logger.error('密碼重設失敗', { error });
      throw error;
    }
  }
  
  /**
   * 驗證電子郵件
   */
  static async verifyEmail(userId: string, token: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('電子郵件已經驗證過了');
      }

      if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
        throw new ValidationError('驗證令牌無效或已過期');
      }

      // 更新用戶驗證狀態
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      logger.info('電子郵件驗證成功', { userId });
    } catch (error) {
      logger.error('電子郵件驗證失敗', { error, userId, token });
      throw error;
    }
  }

  /**
   * 通過令牌驗證電子郵件
   */
  static async verifyEmailByToken(token: string): Promise<void> {
    try {
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        throw new ValidationError('驗證令牌無效或已過期');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('電子郵件已經驗證過了');
      }

      // 更新用戶驗證狀態
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      logger.info('電子郵件驗證成功', { userId: user._id });
    } catch (error) {
      logger.error('電子郵件驗證失敗', { error, token });
      throw error;
    }
  }
  
  /**
   * 停用用戶
   */
  static async deactivateUser(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('無效的用戶 ID');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('用戶不存在');
      }
      
      user.isActive = false;
      await user.save();
      
      logger.info('用戶已停用', { userId: user._id });
    } catch (error) {
      logger.error('停用用戶失敗', { error, userId });
      throw error;
    }
  }
  
  /**
   * 獲取用戶列表（分頁）
   */
  static async getUsers(options: UserQueryOptions = {}): Promise<{
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
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;
      
      // 建立查詢條件
      const query: any = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
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
      
      // 計算跳過的文檔數量
      const skip = (page - 1) * limit;
      
      // 建立排序物件
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // 執行查詢
      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        User.countDocuments(query),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('獲取用戶列表失敗', { error, options });
      throw error;
    }
  }
}