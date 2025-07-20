import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/User";
import { UserRepository } from "../../repositories/UserRepository";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../utils/errors";
import { logger } from "../../utils/logger";
import { validateEmail, validatePassword } from "../../utils/validation";

// 介面定義
export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  avatar?: string;
  location?: {
    address: string;
    coordinates: [number, number];
  };
}

/**
 * 基本用戶服務 - 處理註冊、登入、基本CRUD操作
 */
export class BasicUserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 用戶註冊
   */
  async register(userData: RegisterUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      const { name, email, password, phone } = userData;

      // 驗證輸入
      if (!name || !email || !password) {
        throw new ValidationError("姓名、郵箱和密碼為必填項");
      }

      if (!validateEmail(email)) {
        throw new ValidationError("郵箱格式不正確");
      }

      if (!validatePassword(password)) {
        throw new ValidationError("密碼必須至少8位，包含字母和數字");
      }

      // 檢查郵箱是否已存在
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictError("該郵箱已被註冊");
      }

      // 創建用戶
      const user = await this.userRepository.create({
        name,
        email,
        password,
        phone,
      });

      // 生成 JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      logger.info("用戶註冊成功", { userId: user._id, email });

      return { user, token };
    } catch (error) {
      logger.error("用戶註冊失敗", {
        error,
        userData: { ...userData, password: "[HIDDEN]" },
      });
      throw error;
    }
  }

  /**
   * 用戶登入
   */
  async login(loginData: LoginUserData): Promise<{
    user: IUser;
    token: string;
  }> {
    try {
      const { email, password } = loginData;

      // 驗證輸入
      if (!email || !password) {
        throw new ValidationError("郵箱和密碼為必填項");
      }

      // 查找用戶
      const user = await this.userRepository.findByEmailWithPassword(email);
      if (!user) {
        throw new ValidationError("郵箱或密碼錯誤");
      }

      // 檢查帳號狀態
      if (!user.isActive) {
        throw new ValidationError("帳號已被停用，請聯繫管理員");
      }

      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ValidationError("郵箱或密碼錯誤");
      }

      // 更新最後登入時間
      await this.userRepository.updateLastLogin(user._id.toString());

      // 生成 JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      // 移除密碼字段
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;

      logger.info("用戶登入成功", { userId: user._id, email });

      return { user: userWithoutPassword as IUser, token };
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
   * 根據郵箱獲取用戶
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      if (!validateEmail(email)) {
        throw new ValidationError("郵箱格式不正確");
      }

      const user = await this.userRepository.findByEmail(email);
      return user;
    } catch (error) {
      logger.error("根據郵箱獲取用戶失敗", { error, email });
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

      // 檢查用戶是否存在
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError("用戶不存在");
      }

      // 驗證更新數據
      const updateFields: any = {};
      if (updateData.name !== undefined) {
        if (!updateData.name.trim()) {
          throw new ValidationError("姓名不能為空");
        }
        updateFields.name = updateData.name.trim();
      }

      if (updateData.phone !== undefined) {
        updateFields.phone = updateData.phone;
      }

      if (updateData.avatar !== undefined) {
        updateFields.avatar = updateData.avatar;
      }

      if (updateData.location !== undefined) {
        updateFields.location = updateData.location;
      }

      // 更新用戶
      const updatedUser = await this.userRepository.updateWithValidation(
        userId,
        updateFields,
      );

      if (!updatedUser) {
        throw new NotFoundError("更新失敗，用戶不存在");
      }

      logger.info("用戶資料更新成功", { userId, updateData });

      return updatedUser;
    } catch (error) {
      logger.error("更新用戶資料失敗", { error, userId, updateData });
      throw error;
    }
  }

  /**
   * 停用用戶帳號
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

      await this.userRepository.updateWithValidation(userId, {
        isActive: false,
      });

      logger.info("用戶帳號停用成功", { userId });
    } catch (error) {
      logger.error("停用用戶帳號失敗", { error, userId });
      throw error;
    }
  }
}
