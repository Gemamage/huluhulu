import mongoose, { Document, Schema, Model } from 'mongoose';
import { NotificationType } from './Notification';

/**
 * 通知偏好設定介面
 */
export interface INotificationPreference extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  preferences: {
    [key in NotificationType]: {
      push: boolean;    // 推播通知
      email: boolean;   // Email 通知
      inApp: boolean;   // 站內通知
    };
  };
  globalSettings: {
    pushEnabled: boolean;     // 全域推播開關
    emailEnabled: boolean;    // 全域 Email 開關
    quietHours: {
      enabled: boolean;
      startTime: string;      // 格式: "22:00"
      endTime: string;        // 格式: "08:00"
      timezone: string;       // 時區
    };
    frequency: {
      immediate: boolean;     // 立即通知
      digest: boolean;        // 摘要通知
      digestTime: string;     // 摘要發送時間
    };
  };
  deviceTokens: {
    fcm: string[];           // Firebase Cloud Messaging tokens
    apns: string[];          // Apple Push Notification tokens
  };
  createdAt: Date;
  updatedAt: Date;

  // 實例方法
  updatePreference(
    type: NotificationType,
    channel: 'push' | 'email' | 'inApp',
    enabled: boolean
  ): Promise<INotificationPreference>;
  addDeviceToken(platform: 'fcm' | 'apns', token: string): Promise<INotificationPreference>;
  removeDeviceToken(platform: 'fcm' | 'apns', token: string): Promise<INotificationPreference>;
  removeDeviceTokens(tokens: string[]): Promise<INotificationPreference>;
  isQuietTime(): boolean;
  shouldReceiveNotification(
    type: NotificationType,
    channel: 'push' | 'email' | 'inApp'
  ): boolean;
}

/**
 * 預設通知偏好設定
 */
const defaultPreferences = {
  [NotificationType.PET_FOUND]: {
    push: true,
    email: true,
    inApp: true,
  },
  [NotificationType.PET_MISSING]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.MATCH_FOUND]: {
    push: true,
    email: true,
    inApp: true,
  },
  [NotificationType.MESSAGE_RECEIVED]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.MESSAGE]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.COMMENT]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.REPLY]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.REVIEW]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.REPORT]: {
    push: false,
    email: true,
    inApp: true,
  },
  [NotificationType.REPORT_RESOLVED]: {
    push: true,
    email: false,
    inApp: true,
  },
  [NotificationType.SYSTEM_UPDATE]: {
    push: false,
    email: false,
    inApp: true,
  },
  [NotificationType.ACCOUNT_SECURITY]: {
    push: true,
    email: true,
    inApp: true,
  },
};

/**
 * 通知偏好設定 Schema
 */
const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: defaultPreferences,
    },
    globalSettings: {
      pushEnabled: {
        type: Boolean,
        default: true,
      },
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        startTime: {
          type: String,
          default: '22:00',
          validate: {
            validator: function (v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: '時間格式必須為 HH:MM',
          },
        },
        endTime: {
          type: String,
          default: '08:00',
          validate: {
            validator: function (v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: '時間格式必須為 HH:MM',
          },
        },
        timezone: {
          type: String,
          default: 'Asia/Taipei',
        },
      },
      frequency: {
        immediate: {
          type: Boolean,
          default: true,
        },
        digest: {
          type: Boolean,
          default: false,
        },
        digestTime: {
          type: String,
          default: '09:00',
          validate: {
            validator: function (v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: '時間格式必須為 HH:MM',
          },
        },
      },
    },
    deviceTokens: {
      fcm: {
        type: [String],
        default: [],
      },
      apns: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    collection: 'notification_preferences',
  }
);

// 實例方法
notificationPreferenceSchema.methods.updatePreference = function (
  type: NotificationType,
  channel: 'push' | 'email' | 'inApp',
  enabled: boolean
) {
  if (!this.preferences[type]) {
    this.preferences[type] = defaultPreferences[type];
  }
  this.preferences[type][channel] = enabled;
  this.markModified('preferences');
  return this.save();
};

notificationPreferenceSchema.methods.addDeviceToken = function (
  platform: 'fcm' | 'apns',
  token: string
) {
  if (!this.deviceTokens[platform].includes(token)) {
    this.deviceTokens[platform].push(token);
    return this.save();
  }
  return Promise.resolve(this);
};

notificationPreferenceSchema.methods.removeDeviceToken = function (
  platform: 'fcm' | 'apns',
  token: string
) {
  const index = this.deviceTokens[platform].indexOf(token);
  if (index > -1) {
    this.deviceTokens[platform].splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

notificationPreferenceSchema.methods.removeDeviceTokens = function (
  tokens: string[]
) {
  let modified = false;
  
  tokens.forEach(token => {
    // 檢查 FCM tokens
    const fcmIndex = this.deviceTokens.fcm.indexOf(token);
    if (fcmIndex > -1) {
      this.deviceTokens.fcm.splice(fcmIndex, 1);
      modified = true;
    }
    
    // 檢查 APNS tokens
    const apnsIndex = this.deviceTokens.apns.indexOf(token);
    if (apnsIndex > -1) {
      this.deviceTokens.apns.splice(apnsIndex, 1);
      modified = true;
    }
  });
  
  if (modified) {
    return this.save();
  }
  return Promise.resolve(this);
};

notificationPreferenceSchema.methods.isQuietTime = function () {
  if (!this.globalSettings.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: this.globalSettings.quietHours.timezone,
  });

  const startTime = this.globalSettings.quietHours.startTime;
  const endTime = this.globalSettings.quietHours.endTime;

  // 處理跨日情況（例如 22:00 到 08:00）
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

notificationPreferenceSchema.methods.shouldReceiveNotification = function (
  type: NotificationType,
  channel: 'push' | 'email' | 'inApp'
) {
  // 檢查全域設定
  if (channel === 'push' && !this.globalSettings.pushEnabled) {
    return false;
  }
  if (channel === 'email' && !this.globalSettings.emailEnabled) {
    return false;
  }

  // 檢查安靜時間（僅適用於推播通知）
  if (channel === 'push' && this.isQuietTime()) {
    return false;
  }

  // 檢查特定類型的偏好設定
  const preference = this.preferences[type];
  if (!preference) {
    return defaultPreferences[type][channel];
  }

  return preference[channel];
};

/**
 * 靜態方法介面
 */
interface INotificationPreferenceModel extends Model<INotificationPreference> {
  findByUserId(userId: string | mongoose.Types.ObjectId): Promise<INotificationPreference | null>;
  createDefault(userId: string | mongoose.Types.ObjectId): Promise<INotificationPreference>;
}

// 靜態方法
notificationPreferenceSchema.statics.findByUserId = function (userId: string | mongoose.Types.ObjectId) {
  const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  return this.findOne({ userId: objectId });
};

notificationPreferenceSchema.statics.createDefault = function (userId: string | mongoose.Types.ObjectId) {
  const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  return this.create({
    userId: objectId,
    preferences: defaultPreferences,
  });
};

export const NotificationPreference = mongoose.model<INotificationPreference, INotificationPreferenceModel>(
  'NotificationPreference',
  notificationPreferenceSchema
);
export default NotificationPreference;