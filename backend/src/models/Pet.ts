import mongoose, { Document, Schema } from 'mongoose';

// 聯絡資訊介面
export interface IContactInfo {
  name: string;
  phone: string;
  email: string;
}

// AI 分析結果介面
export interface IAIAnalysis {
  confidence: number;
  labels: string[];
  detectedBreed?: string;
  colors: string[];
  features: string[];
}

// 圖像特徵介面
export interface IImageFeatures {
  imageUrl: string;
  features: number[]; // 特徵向量
  analysis?: IAIAnalysis;
  processedAt: Date;
}

// 寵物介面定義
export interface IPet extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string | null;
  gender: 'male' | 'female' | 'unknown';
  age?: number | null;
  color?: string | null;
  size: 'small' | 'medium' | 'large';
  status: 'lost' | 'found' | 'reunited';
  description: string;
  lastSeenLocation: string;
  lastSeenDate: Date;
  contactInfo: IContactInfo;
  images: string[];
  reward?: number | null;
  isUrgent: boolean;
  microchipId?: string | null;
  vaccinations?: string[] | null;
  medicalConditions?: string[] | null;
  specialMarks?: string | null;
  personality?: string[] | null;
  viewCount: number;
  shareCount: number;
  userId: mongoose.Types.ObjectId;
  // AI 相關字段
  aiFeatures?: IImageFeatures[];
  aiBreedPrediction?: string;
  aiConfidence?: number;
  aiTags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 聯絡資訊 Schema
const contactInfoSchema = new Schema<IContactInfo>({
  name: {
    type: String,
    required: [true, '聯絡人姓名為必填項目'],
    trim: true,
    maxlength: [50, '聯絡人姓名長度不能超過 50 個字符'],
  },
  phone: {
    type: String,
    required: [true, '聯絡電話為必填項目'],
    trim: true,
    match: [/^[+]?[0-9\s\-()]+$/, '請提供有效的電話號碼'],
  },
  email: {
    type: String,
    required: [true, '聯絡電子郵件為必填項目'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '請提供有效的電子郵件地址'],
  },
}, { _id: false });

// AI 分析結果 Schema
const aiAnalysisSchema = new Schema<IAIAnalysis>({
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  labels: {
    type: [String],
    default: [],
  },
  detectedBreed: {
    type: String,
    trim: true,
  },
  colors: {
    type: [String],
    default: [],
  },
  features: {
    type: [String],
    default: [],
  },
}, { _id: false });

// 圖像特徵 Schema
const imageFeaturesSchema = new Schema<IImageFeatures>({
  imageUrl: {
    type: String,
    required: true,
  },
  features: {
    type: [Number],
    required: true,
  },
  analysis: {
    type: aiAnalysisSchema,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// 寵物 Schema
const petSchema = new Schema<IPet>({
  name: {
    type: String,
    required: [true, '寵物名稱為必填項目'],
    trim: true,
    maxlength: [50, '寵物名稱長度不能超過 50 個字符'],
  },
  type: {
    type: String,
    required: [true, '寵物類型為必填項目'],
    enum: {
      values: ['dog', 'cat', 'bird', 'rabbit', 'other'],
      message: '寵物類型必須是: dog, cat, bird, rabbit, other 其中之一',
    },
  },
  breed: {
    type: String,
    trim: true,
    maxlength: [50, '品種名稱長度不能超過 50 個字符'],
  },
  gender: {
    type: String,
    required: [true, '寵物性別為必填項目'],
    enum: {
      values: ['male', 'female', 'unknown'],
      message: '寵物性別必須是: male, female, unknown 其中之一',
    },
  },
  age: {
    type: Number,
    min: [0, '年齡不能為負數'],
    max: [50, '年齡不能超過 50 歲'],
  },
  color: {
    type: String,
    trim: true,
    maxlength: [100, '顏色描述長度不能超過 100 個字符'],
  },
  size: {
    type: String,
    required: [true, '寵物體型為必填項目'],
    enum: {
      values: ['small', 'medium', 'large'],
      message: '寵物體型必須是: small, medium, large 其中之一',
    },
  },
  status: {
    type: String,
    required: [true, '狀態為必填項目'],
    enum: {
      values: ['lost', 'found', 'reunited'],
      message: '狀態必須是: lost, found, reunited 其中之一',
    },
  },
  description: {
    type: String,
    required: [true, '描述為必填項目'],
    trim: true,
    maxlength: [1000, '描述長度不能超過 1000 個字符'],
  },
  lastSeenLocation: {
    type: String,
    required: [true, '最後出現地點為必填項目'],
    trim: true,
    maxlength: [200, '地點描述長度不能超過 200 個字符'],
  },
  lastSeenDate: {
    type: Date,
    required: [true, '最後出現日期為必填項目'],
  },
  contactInfo: {
    type: contactInfoSchema,
    required: [true, '聯絡資訊為必填項目'],
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images: string[]) {
        return images.length <= 10;
      },
      message: '圖片數量不能超過 10 張',
    },
  },
  reward: {
    type: Number,
    min: [0, '獎金不能為負數'],
    max: [1000000, '獎金不能超過 1,000,000'],
    default: 0,
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  microchipId: {
    type: String,
    trim: true,
    maxlength: [50, '晶片編號長度不能超過 50 個字符'],
  },
  vaccinations: {
    type: [String],
    default: [],
  },
  medicalConditions: {
    type: [String],
    default: [],
  },
  specialMarks: {
    type: String,
    trim: true,
    maxlength: [500, '特殊標記描述長度不能超過 500 個字符'],
  },
  personality: {
    type: [String],
    default: [],
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, '瀏覽次數不能為負數'],
  },
  shareCount: {
    type: Number,
    default: 0,
    min: [0, '分享次數不能為負數'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用戶 ID 為必填項目'],
  },
  // AI 相關字段
  aiFeatures: {
    type: [imageFeaturesSchema],
    default: [],
  },
  aiBreedPrediction: {
    type: String,
    trim: true,
    maxlength: [100, 'AI 品種預測長度不能超過 100 個字符'],
  },
  aiConfidence: {
    type: Number,
    min: [0, 'AI 信心度不能為負數'],
    max: [1, 'AI 信心度不能超過 1'],
  },
  aiTags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 20;
      },
      message: 'AI 標籤數量不能超過 20 個',
    },
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

// 建立索引
petSchema.index({ status: 1 });
petSchema.index({ type: 1 });
petSchema.index({ lastSeenLocation: 'text', description: 'text', name: 'text' });
petSchema.index({ createdAt: -1 });
petSchema.index({ userId: 1 });
petSchema.index({ isUrgent: -1, createdAt: -1 });

// 匯出寵物模型
export const Pet = mongoose.model<IPet>('Pet', petSchema);