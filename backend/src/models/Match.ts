import mongoose, { Document, Schema } from 'mongoose';
import { IPet } from './Pet';
import { IUser } from './User';

export interface IMatch extends Document {
  lostPet: mongoose.Types.ObjectId | IPet;
  foundPet: mongoose.Types.ObjectId | IPet;
  similarity: number;
  confidence: 'low' | 'medium' | 'high';
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: Date;
  rejectedAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId | IUser;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>({
  lostPet: {
    type: Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
    index: true
  },
  foundPet: {
    type: Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
    index: true
  },
  similarity: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  confidence: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
    index: true
  },
  confirmedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// 複合索引確保不會有重複的配對
matchSchema.index({ lostPet: 1, foundPet: 1 }, { unique: true });

// 索引優化查詢性能
matchSchema.index({ createdAt: -1 });
matchSchema.index({ similarity: -1 });
matchSchema.index({ status: 1, createdAt: -1 });

export const Match = mongoose.model<IMatch>('Match', matchSchema);