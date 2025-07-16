import mongoose, { Document, Schema } from 'mongoose';

// 留言介面定義
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  petId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentId?: mongoose.Types.ObjectId; // 用於回覆留言
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId; // 刪除者 (可能是管理員)
  reportCount: number;
  isHidden: boolean; // 被舉報後隱藏
  createdAt: Date;
  updatedAt: Date;
}

// 留言 Schema
const commentSchema = new Schema<IComment>({
  petId: {
    type: Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, '寵物ID為必填項目'],
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用戶ID為必填項目'],
    index: true,
  },
  content: {
    type: String,
    required: [true, '留言內容為必填項目'],
    trim: true,
    maxlength: [500, '留言內容不能超過 500 個字符'],
    minlength: [1, '留言內容不能為空'],
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isHidden: {
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

// 複合索引
commentSchema.index({ petId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });
commentSchema.index({ isDeleted: 1, isHidden: 1 });

// 軟刪除中介軟體
commentSchema.pre(/^find/, function(next) {
  // 預設不顯示已刪除和被隱藏的留言
  if (!this.getQuery().includeDeleted) {
    this.find({ isDeleted: false, isHidden: false });
  }
  next();
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);