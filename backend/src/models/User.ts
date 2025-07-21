import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/environment";

// 隱私設定介面
export interface IPrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  allowDirectContact: boolean;
  showFullName: boolean;
  profileVisibility: "public" | "registered" | "private";
  emailNotifications: {
    newMatches: boolean;
    messages: boolean;
    updates: boolean;
    marketing: boolean;
  };
  smsNotifications: {
    urgentAlerts: boolean;
    matches: boolean;
  };
}

// 用戶介面定義
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  role: "user" | "moderator" | "admin";
  lastLoginAt?: Date;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  authProvider?: "local" | "google";
  privacySettings: IPrivacySettings;
  createdAt: Date;
  updatedAt: Date;

  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

// 用戶 Schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "電子郵件為必填項目"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "請提供有效的電子郵件地址"],
    },
    password: {
      type: String,
      required: [true, "密碼為必填項目"],
      minlength: [6, "密碼長度至少需要 6 個字符"],
      select: false, // 預設不返回密碼
    },
    name: {
      type: String,
      required: [true, "姓名為必填項目"],
      trim: true,
      maxlength: [50, "姓名長度不能超過 50 個字符"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[0-9\s\-()]+$/, "請提供有效的電話號碼"],
    },
    avatar: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      sparse: true, // 允許多個 null 值
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    lastLoginAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    privacySettings: {
      showEmail: {
        type: Boolean,
        default: false,
      },
      showPhone: {
        type: Boolean,
        default: true,
      },
      allowDirectContact: {
        type: Boolean,
        default: true,
      },
      showFullName: {
        type: Boolean,
        default: false,
      },
      profileVisibility: {
        type: String,
        enum: ["public", "registered", "private"],
        default: "registered",
      },
      emailNotifications: {
        newMatches: {
          type: Boolean,
          default: true,
        },
        messages: {
          type: Boolean,
          default: true,
        },
        updates: {
          type: Boolean,
          default: false,
        },
        marketing: {
          type: Boolean,
          default: false,
        },
      },
      smsNotifications: {
        urgentAlerts: {
          type: Boolean,
          default: true,
        },
        matches: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        delete (ret as any).password;
        delete (ret as any).passwordResetToken;
        delete (ret as any).passwordResetExpires;
        delete (ret as any).emailVerificationToken;
        delete (ret as any).emailVerificationExpires;
        return ret;
      },
    },
  },
);

// 密碼加密中介軟體
userSchema.pre("save", async function (next) {
  // 只有在密碼被修改時才進行加密
  if (!this.isModified("password")) return next();

  try {
    // 生成鹽值並加密密碼
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 比較密碼方法
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 生成 JWT 認證令牌
userSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

// 生成密碼重設令牌
userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = jwt.sign(
    { id: this._id, type: "password-reset" },
    config.jwt.secret,
    { expiresIn: "1h" } as jwt.SignOptions,
  );

  this.passwordResetToken = resetToken;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 小時後過期

  return resetToken;
};

// 生成電子郵件驗證令牌
userSchema.methods.generateEmailVerificationToken = function (): string {
  const verificationToken = jwt.sign(
    { id: this._id, type: "email-verification" },
    config.jwt.secret,
    { expiresIn: "24h" } as jwt.SignOptions,
  );

  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小時後過期

  return verificationToken;
};

// 建立索引
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "privacySettings.profileVisibility": 1 });

// 匯出用戶模型
export const User = mongoose.model<IUser>("User", userSchema);
