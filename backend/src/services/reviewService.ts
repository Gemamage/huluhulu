import mongoose from "mongoose";
import { Review, ReviewStats, IReview, IReviewStats } from "../models/Review";
import { User } from "../models/User";
import { Pet } from "../models/Pet";
import { Conversation } from "../models/Message";
import { NotificationService } from "./notificationService";
import { NotificationType } from "../models/Notification";

export interface CreateReviewData {
  reviewerId: string;
  revieweeId: string;
  petId?: string;
  conversationId?: string;
  rating: number;
  content?: string;
  tags?: string[];
  isAnonymous?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  content?: string;
  tags?: string[];
  isAnonymous?: boolean;
}

export interface ReviewQuery {
  revieweeId?: string;
  reviewerId?: string;
  petId?: string;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
}

export class ReviewService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * 創建評價
   */
  async createReview(data: CreateReviewData): Promise<IReview> {
    const {
      reviewerId,
      revieweeId,
      petId,
      conversationId,
      rating,
      content = "",
      tags = [],
      isAnonymous = false,
    } = data;

    // 驗證評價者和被評價者
    if (reviewerId === revieweeId) {
      throw new Error("不能評價自己");
    }

    const [reviewer, reviewee] = await Promise.all([
      User.findById(reviewerId),
      User.findById(revieweeId),
    ]);

    if (!reviewer) {
      throw new Error("評價者不存在");
    }
    if (!reviewee) {
      throw new Error("被評價者不存在");
    }

    // 驗證寵物是否存在（如果提供）
    if (petId) {
      const pet = await Pet.findById(petId);
      if (!pet) {
        throw new Error("寵物不存在");
      }
    }

    // 驗證對話是否存在（如果提供）
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("對話不存在");
      }

      // 檢查評價者是否為對話參與者
      const reviewerObjectId = new mongoose.Types.ObjectId(reviewerId);
      if (!conversation.participants.some((p) => p.equals(reviewerObjectId))) {
        throw new Error("您不是此對話的參與者，無法進行評價");
      }
    }

    // 檢查是否已經評價過
    const existingReview = await Review.findOne({
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
    });

    if (existingReview) {
      throw new Error("您已經評價過此用戶");
    }

    // 創建評價
    const review = new Review({
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      petId: petId ? new mongoose.Types.ObjectId(petId) : null,
      conversationId: conversationId
        ? new mongoose.Types.ObjectId(conversationId)
        : null,
      rating,
      content: content.trim(),
      tags: tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      isAnonymous,
    });

    await review.save();

    // 發送通知
    await this.sendReviewNotification(review, reviewer, reviewee);

    const createdReview = await this.getReviewById(review._id.toString());
    if (!createdReview) {
      throw new Error("創建評價後無法獲取評價詳情");
    }
    return createdReview;
  }

  /**
   * 獲取評價詳情
   */
  async getReviewById(reviewId: string): Promise<IReview | null> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error("無效的評價ID");
    }

    return await Review.findById(reviewId)
      .populate("reviewerId", "username avatar email")
      .populate("revieweeId", "username avatar email")
      .populate("petId", "name images")
      .lean();
  }

  /**
   * 獲取評價列表
   */
  async getReviews(query: ReviewQuery): Promise<{
    reviews: IReview[];
    total: number;
    page: number;
    totalPages: number;
    stats?: {
      averageRating: number;
      ratingDistribution: { [key: number]: number };
    };
  }> {
    const {
      revieweeId,
      reviewerId,
      petId,
      rating,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = query;

    // 構建查詢條件
    const filter: any = {};
    if (revieweeId) filter.revieweeId = new mongoose.Types.ObjectId(revieweeId);
    if (reviewerId) filter.reviewerId = new mongoose.Types.ObjectId(reviewerId);
    if (petId) filter.petId = new mongoose.Types.ObjectId(petId);
    if (rating) filter.rating = rating;
    if (includeDeleted) {
      filter.includeDeleted = true;
    }

    // 計算分頁
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // 執行查詢
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("reviewerId", "username avatar email")
        .populate("revieweeId", "username avatar email")
        .populate("petId", "name images")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // 如果查詢特定用戶的評價，計算統計資料
    let stats;
    if (revieweeId) {
      const allReviews = await Review.find({
        revieweeId: new mongoose.Types.ObjectId(revieweeId),
      });
      const totalRating = allReviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const averageRating =
        allReviews.length > 0 ? totalRating / allReviews.length : 0;

      const ratingDistribution: { [key: number]: number } = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      allReviews.forEach((review) => {
        const rating = review.rating;
        if (
          rating !== undefined &&
          rating !== null &&
          typeof rating === "number" &&
          rating >= 1 &&
          rating <= 5
        ) {
          const ratingKey = Math.floor(rating);
          if (ratingDistribution[ratingKey] !== undefined) {
            ratingDistribution[ratingKey]++;
          }
        }
      });

      stats = {
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      };
    }

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * 更新評價
   */
  async updateReview(
    reviewId: string,
    reviewerId: string,
    data: UpdateReviewData,
  ): Promise<IReview | null> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error("無效的評價ID");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("評價不存在");
    }

    // 檢查權限
    if (review.reviewerId.toString() !== reviewerId) {
      throw new Error("無權限修改此評價");
    }

    // 更新評價
    const updateData: any = {};
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.content !== undefined) updateData.content = data.content.trim();
    if (data.tags !== undefined) {
      updateData.tags = data.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    if (data.isAnonymous !== undefined)
      updateData.isAnonymous = data.isAnonymous;

    const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
      new: true,
    })
      .populate("reviewerId", "username avatar email")
      .populate("revieweeId", "username avatar email")
      .populate("petId", "name images");

    return updatedReview;
  }

  /**
   * 刪除評價
   */
  async deleteReview(
    reviewId: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error("無效的評價ID");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("評價不存在");
    }

    // 檢查權限
    if (!isAdmin && review.reviewerId.toString() !== userId) {
      throw new Error("無權限刪除此評價");
    }

    // 軟刪除
    await Review.findByIdAndUpdate(reviewId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    });

    return true;
  }

  /**
   * 舉報評價
   */
  async reportReview(reviewId: string, reporterId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error("無效的評價ID");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("評價不存在");
    }

    // 增加舉報次數
    await Review.findByIdAndUpdate(reviewId, {
      $inc: { reportCount: 1 },
    });

    // 如果舉報次數超過閾值，自動隱藏
    const updatedReview = await Review.findById(reviewId);
    if (updatedReview && updatedReview.reportCount >= 3) {
      await Review.findByIdAndUpdate(reviewId, {
        isHidden: true,
      });
    }

    return true;
  }

  /**
   * 獲取用戶評價統計
   */
  async getUserReviewStats(userId: string): Promise<IReviewStats | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    return await ReviewStats.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();
  }

  /**
   * 獲取評價標籤統計
   */
  async getTagStats(
    userId?: string,
  ): Promise<Array<{ tag: string; count: number }>> {
    const matchStage: any = { isDeleted: false, isHidden: false };
    if (userId) {
      matchStage.revieweeId = new mongoose.Types.ObjectId(userId);
    }

    const tagStats = await Review.aggregate([
      { $match: matchStage },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          tag: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    return tagStats;
  }

  /**
   * 獲取評價趨勢
   */
  async getReviewTrends(
    userId: string,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      count: number;
      averageRating: number;
    }>
  > {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Review.aggregate([
      {
        $match: {
          revieweeId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
          isDeleted: false,
          isHidden: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          totalRating: { $sum: "$rating" },
        },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          averageRating: {
            $round: [{ $divide: ["$totalRating", "$count"] }, 1],
          },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return trends;
  }

  /**
   * 檢查是否可以評價
   */
  async canReview(
    reviewerId: string,
    revieweeId: string,
  ): Promise<{
    canReview: boolean;
    reason?: string;
  }> {
    if (reviewerId === revieweeId) {
      return { canReview: false, reason: "不能評價自己" };
    }

    // 檢查是否已經評價過
    const existingReview = await Review.findOne({
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
    });

    if (existingReview) {
      return { canReview: false, reason: "您已經評價過此用戶" };
    }

    // 檢查是否有互動記錄（對話或寵物相關）
    const hasInteraction = await Conversation.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(reviewerId),
          new mongoose.Types.ObjectId(revieweeId),
        ],
      },
    });

    if (!hasInteraction) {
      return { canReview: false, reason: "您需要先與此用戶有互動才能進行評價" };
    }

    return { canReview: true };
  }

  /**
   * 發送評價通知
   */
  private async sendReviewNotification(
    review: IReview,
    reviewer: any,
    reviewee: any,
  ): Promise<void> {
    try {
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      await NotificationService.sendNotification({
        userId: reviewee._id.toString(),
        type: NotificationType.REVIEW,
        title: "收到新評價",
        message: review.isAnonymous
          ? `有人給了您 ${stars} 的評價`
          : `${reviewer.username} 給了您 ${stars} 的評價`,
        data: {
          reviewId: review._id.toString(),
          reviewerId: review.isAnonymous ? null : reviewer._id.toString(),
          rating: review.rating,
        },
      });
    } catch (error) {
      console.error("發送評價通知失敗:", error);
    }
  }
}

export const reviewService = new ReviewService();
