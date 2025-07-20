import mongoose, { Document, Schema } from "mongoose";

/**
 * 通知類型枚舉
 */
export enum NotificationType {
  PET_FOUND = "pet_found", // 寵物被找到
  PET_MISSING = "pet_missing", // 新的走失寵物
  MATCH_FOUND = "match_found", // 找到可能的匹配
  MESSAGE_RECEIVED = "message_received", // 收到訊息
  MESSAGE = "message", // 訊息通知
  COMMENT = "comment", // 評論通知
  REPLY = "reply", // 回覆通知
  REVIEW = "review", // 評價通知
  REPORT = "report", // 舉報通知
  REPORT_RESOLVED = "report_resolved", // 舉報處理完成
  SYSTEM_UPDATE = "system_update", // 系統更新
  ACCOUNT_SECURITY = "account_security", // 帳號安全
}

/**
 * 通知優先級
 */
export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * 通知狀態
 */
export enum NotificationStatus {
  PENDING = "pending", // 待發送
  SCHEDULED = "scheduled", // 已排程
  SENT = "sent", // 已發送
  DELIVERED = "delivered", // 已送達
  READ = "read", // 已讀
  FAILED = "failed", // 發送失敗
}

/**
 * 通知介面
 */
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: {
    push: {
      enabled: boolean;
      sent: boolean;
      sentAt?: Date;
    };
    email: {
      enabled: boolean;
      sent: boolean;
      sentAt?: Date;
    };
    inApp: {
      enabled: boolean;
      sent: boolean;
      sentAt?: Date;
    };
  };
  data?: { [key: string]: any };
  actionUrl?: string;
  imageUrl?: string;
  metadata?: {
    petId?: mongoose.Types.ObjectId;
    matchId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  scheduledAt?: Date; // 排程發送時間
  sentAt?: Date; // 實際發送時間
  readAt?: Date; // 讀取時間
  expiresAt?: Date; // 過期時間
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 通知 Schema
 */
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      index: true,
    },
    channels: {
      push: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: {
          type: Date,
        },
      },
      email: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: {
          type: Date,
        },
      },
      inApp: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: {
          type: Date,
        },
      },
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    readAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

// 複合索引
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 虛擬欄位
notificationSchema.virtual("isRead").get(function () {
  return this.status === NotificationStatus.READ;
});

notificationSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// 實例方法
notificationSchema.methods.markAsRead = function () {
  this.status = NotificationStatus.READ;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsSent = function () {
  this.status = NotificationStatus.SENT;
  this.sentAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function () {
  this.status = NotificationStatus.DELIVERED;
  return this.save();
};

notificationSchema.methods.markAsFailed = function () {
  this.status = NotificationStatus.FAILED;
  return this.save();
};

// 靜態方法
notificationSchema.statics.findUnreadByUser = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.find({
    userId,
    status: { $ne: NotificationStatus.READ },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByUserAndType = function (
  userId: mongoose.Types.ObjectId,
  type: NotificationType,
) {
  return this.find({ userId, type }).sort({ createdAt: -1 });
};

notificationSchema.statics.findPendingNotifications = function () {
  return this.find({
    status: NotificationStatus.PENDING,
    $and: [
      {
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      },
    ],
  }).sort({ priority: -1, createdAt: 1 });
};

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
export default Notification;
