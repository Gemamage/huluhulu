import mongoose, { Document, Schema } from 'mongoose';

// 評價介面定義
export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId; // 評價者
  revieweeId: mongoose.Types.ObjectId; // 被評價者
  petId?: mongoose.Types.ObjectId; // 相關寵物
  conversationId?: mongoose.Types.ObjectId; // 相關對話
  rating: number; // 1-5 星評價
  content?: string;
  tags: string[]; // 評價標籤 (如: 友善, 準時, 負責任等)
  isAnonymous: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  reportCount: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 評價統計介面定義
export interface IReviewStats extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: Array<{
    tag: string;
    count: number;
  }>;
  lastUpdated: Date;
}

// 評價 Schema
const reviewSchema = new Schema<IReview>({
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '評價者ID為必填項目'],
    index: true,
  },
  revieweeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '被評價者ID為必填項目'],
    index: true,
  },
  petId: {
    type: Schema.Types.ObjectId,
    ref: 'Pet',
    default: null,
    index: true,
  },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
  },
  rating: {
    type: Number,
    required: [true, '評價分數為必填項目'],
    min: [1, '評價分數最低為 1'],
    max: [5, '評價分數最高為 5'],
    validate: {
      validator: Number.isInteger,
      message: '評價分數必須為整數',
    },
  },
  content: {
    type: String,
    trim: true,
    maxlength: [500, '評價內容不能超過 500 個字符'],
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '標籤長度不能超過 20 個字符'],
  }],
  isAnonymous: {
    type: Boolean,
    default: false,
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
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
});

// 評價統計 Schema
const reviewStatsSchema = new Schema<IReviewStats>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingDistribution: {
    1: { type: Number, default: 0, min: 0 },
    2: { type: Number, default: 0, min: 0 },
    3: { type: Number, default: 0, min: 0 },
    4: { type: Number, default: 0, min: 0 },
    5: { type: Number, default: 0, min: 0 },
  },
  commonTags: [{
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
});

// 複合索引
reviewSchema.index({ reviewerId: 1, revieweeId: 1 }, { unique: true }); // 防止重複評價
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ petId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, createdAt: -1 });
reviewSchema.index({ isDeleted: 1, isHidden: 1 });

// 注意：查詢時需要手動添加 { isDeleted: false, isHidden: false } 條件

// 評價後更新統計的中介軟體
reviewSchema.post('save', async function() {
  if (this.isNew && !this.isDeleted && !this.isHidden) {
    await updateReviewStats(this.revieweeId);
  }
});

reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateReviewStats(doc.revieweeId);
  }
});

// 更新評價統計的輔助函數
async function updateReviewStats(userId: mongoose.Types.ObjectId) {
  const Review = mongoose.model<IReview>('Review');
  const ReviewStats = mongoose.model<IReviewStats>('ReviewStats');
  
  const reviews = await Review.find({ 
    revieweeId: userId, 
    isDeleted: false, 
    isHidden: false 
  });
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const tagCounts: { [key: string]: number } = {};
  
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    review.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const commonTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 取前10個最常見的標籤
  
  await ReviewStats.findOneAndUpdate(
    { userId },
    {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // 保留一位小數
      ratingDistribution,
      commonTags,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );
}

export const Review = mongoose.model<IReview>('Review', reviewSchema);
export const ReviewStats = mongoose.model<IReviewStats>('ReviewStats', reviewStatsSchema);