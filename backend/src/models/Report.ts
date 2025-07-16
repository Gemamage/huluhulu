import mongoose, { Document, Schema } from 'mongoose';

// 舉報介面定義
export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId; // 舉報者
  reportedUserId?: mongoose.Types.ObjectId; // 被舉報的用戶
  reportedContentId?: mongoose.Types.ObjectId; // 被舉報的內容ID
  contentType: 'user' | 'comment' | 'review' | 'message' | 'pet'; // 舉報內容類型
  reportType: string; // 舉報類型
  reason: string; // 舉報原因
  description?: string; // 詳細描述
  evidence?: string[]; // 證據圖片URLs
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'; // 處理狀態
  priority: 'low' | 'medium' | 'high' | 'urgent'; // 優先級
  assignedTo?: mongoose.Types.ObjectId; // 分配給的管理員
  resolution?: string; // 處理結果
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 舉報統計介面定義
export interface IReportStats extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // 被舉報用戶的統計
  contentId?: mongoose.Types.ObjectId; // 被舉報內容的統計
  contentType: string;
  totalReports: number;
  reportTypes: Array<{
    type: string;
    count: number;
  }>;
  statusDistribution: {
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
  };
  lastReportedAt: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 舉報 Schema
const reportSchema = new Schema<IReport>({
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '舉報者ID為必填項目'],
    index: true,
  },
  reportedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  reportedContentId: {
    type: Schema.Types.ObjectId,
    default: null,
    index: true,
  },
  contentType: {
    type: String,
    enum: ['user', 'comment', 'review', 'message', 'pet'],
    required: [true, '內容類型為必填項目'],
    index: true,
  },
  reportType: {
    type: String,
    required: [true, '舉報類型為必填項目'],
    enum: [
      '不當內容',
      '騷擾行為',
      '虛假信息',
      '垃圾訊息',
      '詐騙行為',
      '侵犯隱私',
      '仇恨言論',
      '暴力威脅',
      '侵犯版權',
      '其他'
    ],
    index: true,
  },
  reason: {
    type: String,
    required: [true, '舉報原因為必填項目'],
    trim: true,
    maxlength: [200, '舉報原因不能超過 200 個字符'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '詳細描述不能超過 1000 個字符'],
    default: '',
  },
  evidence: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: '證據必須是有效的URL',
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true,
    index: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: [1000, '處理結果不能超過 1000 個字符'],
    default: '',
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// 舉報統計 Schema
const reportStatsSchema = new Schema<IReportStats>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    default: null,
    index: true,
  },
  contentType: {
    type: String,
    required: true,
    index: true,
  },
  totalReports: {
    type: Number,
    default: 0,
    min: 0,
  },
  reportTypes: [{
    type: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
  }],
  statusDistribution: {
    pending: { type: Number, default: 0, min: 0 },
    investigating: { type: Number, default: 0, min: 0 },
    resolved: { type: Number, default: 0, min: 0 },
    dismissed: { type: Number, default: 0, min: 0 },
  },
  lastReportedAt: {
    type: Date,
    default: Date.now,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// 複合索引
reportSchema.index({ reporterId: 1, reportedUserId: 1, contentType: 1 });
reportSchema.index({ reportedContentId: 1, contentType: 1 });
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ createdAt: -1, status: 1 });

// 防止重複舉報同一內容
reportSchema.index({ 
  reporterId: 1, 
  reportedContentId: 1, 
  contentType: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    reportedContentId: { $ne: null },
    isDeleted: false 
  }
});

// 軟刪除中介軟體
reportSchema.pre(/^find/, function(next) {
  if (!this.getQuery().includeDeleted) {
    this.find({ isDeleted: false });
  }
  next();
});

// 自動設置優先級的中介軟體
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    // 根據舉報類型自動設置優先級
    const highPriorityTypes = ['暴力威脅', '騷擾行為', '詐騙行為'];
    const urgentTypes = ['仇恨言論'];
    
    if (urgentTypes.includes(this.reportType)) {
      this.priority = 'urgent';
    } else if (highPriorityTypes.includes(this.reportType)) {
      this.priority = 'high';
    }
  }
  next();
});

// 狀態變更時的中介軟體
reportSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.status === 'resolved' || update.status === 'dismissed') {
    update.resolvedAt = new Date();
  }
  next();
});

export const Report = mongoose.model<IReport>('Report', reportSchema);
export const ReportStats = mongoose.model<IReportStats>('ReportStats', reportStatsSchema);