import mongoose from 'mongoose';
import { Comment, IComment } from '../models/Comment';
import { Pet } from '../models/Pet';
import { User } from '../models/User';
import { NotificationService } from './notificationService';
import { NotificationType } from '../models/Notification';

export interface CreateCommentData {
  petId: string;
  userId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content?: string;
}

export interface CommentQuery {
  petId?: string;
  userId?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export class CommentService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * 創建新留言
   */
  async createComment(data: CreateCommentData): Promise<IComment> {
    const { petId, userId, content, parentId } = data;

    // 驗證寵物是否存在
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new Error('寵物不存在');
    }

    // 驗證用戶是否存在
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用戶不存在');
    }

    // 如果是回覆留言，驗證父留言是否存在
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        throw new Error('父留言不存在');
      }
      if (parentComment.petId.toString() !== petId) {
        throw new Error('回覆留言必須在同一寵物頁面下');
      }
    }

    // 創建留言
    const comment = new Comment({
      petId: new mongoose.Types.ObjectId(petId),
      userId: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
    });

    await comment.save();

    // 發送通知
    await this.sendCommentNotification(comment, pet);

    const createdComment = await this.getCommentById(comment._id.toString());
    if (!createdComment) {
      throw new Error('創建留言後無法獲取留言詳情');
    }
    return createdComment;
  }

  /**
   * 獲取留言詳情
   */
  async getCommentById(commentId: string): Promise<IComment | null> {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('無效的留言ID');
    }

    return await Comment.findById(commentId)
      .populate('userId', 'username avatar email')
      .populate('petId', 'name images')
      .lean();
  }

  /**
   * 獲取特定寵物的留言列表
   */
  async getCommentsByPet(petId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    comments: IComment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    return await this.getComments({
      petId,
      page,
      limit,
      sortBy,
      sortOrder
    });
  }

  /**
   * 獲取留言列表
   */
  async getComments(query: CommentQuery): Promise<{
    comments: IComment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      petId,
      userId,
      parentId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = query;

    // 構建查詢條件
    const filter: any = {};
    if (petId) filter.petId = new mongoose.Types.ObjectId(petId);
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    if (parentId !== undefined) {
      filter.parentId = parentId ? new mongoose.Types.ObjectId(parentId) : null;
    }
    if (includeDeleted) {
      filter.includeDeleted = true;
    }

    // 計算分頁
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 執行查詢
    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('userId', 'username avatar email')
        .populate('petId', 'name images')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter)
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 獲取留言樹狀結構
   */
  async getCommentTree(petId: string, page: number = 1, limit: number = 20): Promise<{
    comments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new Error('無效的寵物ID');
    }

    // 獲取主留言
    const skip = (page - 1) * limit;
    const [mainComments, total] = await Promise.all([
      Comment.find({ 
        petId: new mongoose.Types.ObjectId(petId), 
        parentId: null 
      })
        .populate('userId', 'username avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ 
        petId: new mongoose.Types.ObjectId(petId), 
        parentId: null 
      })
    ]);

    // 獲取每個主留言的回覆
    const commentsWithReplies = await Promise.all(
      mainComments.map(async (comment: any) => {
        const replies = await Comment.find({ 
          parentId: comment._id 
        })
          .populate('userId', 'username avatar email')
          .sort({ createdAt: 1 })
          .limit(10) // 限制回覆數量
          .lean();

        const replyCount = await Comment.countDocuments({ 
          parentId: comment._id 
        });

        return {
          ...comment,
          replies,
          replyCount,
          hasMoreReplies: replyCount > 10
        };
      })
    );

    return {
      comments: commentsWithReplies,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 更新留言
   */
  async updateComment(
    commentId: string, 
    userId: string, 
    data: UpdateCommentData
  ): Promise<IComment | null> {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('無效的留言ID');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('留言不存在');
    }

    // 檢查權限
    if (comment.userId.toString() !== userId) {
      throw new Error('無權限修改此留言');
    }

    // 更新留言
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { 
        ...data,
        content: data.content?.trim()
      },
      { new: true }
    )
      .populate('userId', 'username avatar email')
      .populate('petId', 'name images');

    return updatedComment;
  }

  /**
   * 刪除留言
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('無效的留言ID');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('留言不存在');
    }

    // 檢查權限
    if (!isAdmin && comment.userId.toString() !== userId) {
      throw new Error('無權限刪除此留言');
    }

    // 軟刪除
    await Comment.findByIdAndUpdate(commentId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId)
    });

    // 同時刪除所有回覆
    await Comment.updateMany(
      { parentId: new mongoose.Types.ObjectId(commentId) },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: new mongoose.Types.ObjectId(userId)
      }
    );

    return true;
  }

  /**
   * 舉報留言
   */
  async reportComment(commentId: string, reporterId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('無效的留言ID');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('留言不存在');
    }

    // 增加舉報次數
    await Comment.findByIdAndUpdate(commentId, {
      $inc: { reportCount: 1 }
    });

    // 如果舉報次數超過閾值，自動隱藏
    const updatedComment = await Comment.findById(commentId);
    if (updatedComment && updatedComment.reportCount >= 5) {
      await Comment.findByIdAndUpdate(commentId, {
        isHidden: true
      });
    }

    return true;
  }

  /**
   * 獲取用戶留言統計
   */
  async getUserCommentStats(userId: string): Promise<{
    totalComments: number;
    totalReplies: number;
    recentComments: IComment[];
  }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('無效的用戶ID');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalComments, totalReplies, recentComments] = await Promise.all([
      Comment.countDocuments({ userId: userObjectId, parentId: null }),
      Comment.countDocuments({ userId: userObjectId, parentId: { $ne: null } }),
      Comment.find({ userId: userObjectId })
        .populate('petId', 'name images')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    return {
      totalComments,
      totalReplies,
      recentComments
    };
  }

  /**
   * 發送留言通知
   */
  private async sendCommentNotification(comment: IComment, pet: any): Promise<void> {
    try {
      // 通知寵物主人
      if (pet.userId.toString() !== comment.userId.toString()) {
        await NotificationService.sendNotification({
          userId: pet.userId.toString(),
          type: NotificationType.COMMENT,
          title: '新留言通知',
          message: `有人在您的寵物「${pet.name}」頁面留言了`,
          data: {
            petId: pet._id.toString(),
            commentId: comment._id.toString(),
            commenterId: comment.userId.toString()
          }
        });
      }

      // 如果是回覆，通知被回覆的用戶
      if (comment.parentId) {
        const parentComment = await Comment.findById(comment.parentId);
        if (parentComment && parentComment.userId.toString() !== comment.userId.toString()) {
          await NotificationService.sendNotification({
            userId: parentComment.userId.toString(),
            type: NotificationType.REPLY,
            title: '留言回覆通知',
            message: `有人回覆了您的留言`,
            data: {
              petId: pet._id.toString(),
              commentId: comment._id.toString(),
              parentCommentId: parentComment._id.toString(),
              replierId: comment.userId.toString()
            }
          });
        }
      }
    } catch (error) {
      console.error('發送留言通知失敗:', error);
    }
  }
}

export const commentService = new CommentService();