import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * 搜尋歷史介面
 */
export interface ISearchHistory extends Document {
  userId: mongoose.Types.ObjectId;
  searchQuery: string;
  filters: {
    type?: string;
    status?: string;
    location?: string;
    breed?: string;
    radius?: number;
  };
  resultCount: number;
  searchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 搜尋歷史靜態方法介面
 */
export interface ISearchHistoryModel extends Model<ISearchHistory> {
  recordSearch(
    userId: string,
    searchQuery: string,
    filters: any,
    resultCount: number
  ): Promise<ISearchHistory | null>;
  getUserSearchHistory(userId: string, limit?: number): Promise<ISearchHistory[]>;
  getPopularSearches(limit?: number): Promise<any[]>;
  clearUserHistory(userId: string): Promise<any>;
}

/**
 * 搜尋歷史 Schema
 */
const searchHistorySchema = new Schema<ISearchHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  searchQuery: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  filters: {
    type: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'reunited']
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200
    },
    breed: {
      type: String,
      trim: true,
      maxlength: 100
    },
    radius: {
      type: Number,
      min: 1,
      max: 100,
      default: 10
    }
  },
  resultCount: {
    type: Number,
    required: true,
    min: 0
  },
  searchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'search_histories'
});

// 複合索引：用戶 + 搜尋時間（用於查詢用戶的搜尋歷史）
searchHistorySchema.index({ userId: 1, searchedAt: -1 });

// 複合索引：用戶 + 搜尋查詢（用於避免重複記錄）
searchHistorySchema.index({ userId: 1, searchQuery: 1, 'filters.type': 1, 'filters.status': 1 });

// TTL 索引：自動刪除 90 天前的搜尋歷史
searchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * 靜態方法：記錄搜尋歷史
 */
searchHistorySchema.statics.recordSearch = async function(
  userId: string,
  searchQuery: string,
  filters: any,
  resultCount: number
) {
  try {
    // 檢查是否已有相同的搜尋記錄（24小時內）
    const existingSearch = await this.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      searchQuery,
      'filters.type': filters.type,
      'filters.status': filters.status,
      'filters.location': filters.location,
      searchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingSearch) {
      // 更新現有記錄
      existingSearch.resultCount = resultCount;
      existingSearch.searchedAt = new Date();
      await existingSearch.save();
      return existingSearch;
    } else {
      // 創建新記錄
      const searchHistory = new this({
        userId: new mongoose.Types.ObjectId(userId),
        searchQuery,
        filters,
        resultCount,
        searchedAt: new Date()
      });
      await searchHistory.save();
      return searchHistory;
    }
  } catch (error) {
    console.error('記錄搜尋歷史失敗:', error);
    // 不拋出錯誤，避免影響主要搜尋功能
    return null;
  }
};

/**
 * 靜態方法：獲取用戶搜尋歷史
 */
searchHistorySchema.statics.getUserSearchHistory = async function(
  userId: string,
  limit: number = 10
) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId)
  })
    .sort({ searchedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * 靜態方法：獲取熱門搜尋關鍵字
 */
searchHistorySchema.statics.getPopularSearches = async function(limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        searchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 最近 7 天
      }
    },
    {
      $group: {
        _id: '$searchQuery',
        count: { $sum: 1 },
        lastSearched: { $max: '$searchedAt' }
      }
    },
    {
      $match: {
        count: { $gte: 2 } // 至少被搜尋 2 次
      }
    },
    {
      $sort: { count: -1, lastSearched: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        searchQuery: '$_id',
        count: 1,
        lastSearched: 1,
        _id: 0
      }
    }
  ]);
};

/**
 * 靜態方法：清理用戶搜尋歷史
 */
searchHistorySchema.statics.clearUserHistory = async function(userId: string) {
  return this.deleteMany({
    userId: new mongoose.Types.ObjectId(userId)
  });
};

export const SearchHistory = mongoose.model<ISearchHistory, ISearchHistoryModel>('SearchHistory', searchHistorySchema);