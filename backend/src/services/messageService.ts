import mongoose from "mongoose";
import {
  Message,
  Conversation,
  IMessage,
  IConversation,
} from "../models/Message";
import { User } from "../models/User";
import { Pet } from "../models/Pet";
import { NotificationService } from "./notificationService";
import { NotificationType } from "../models/Notification";
import { SocketService } from "./socketService";

export interface CreateConversationData {
  participants: string[];
  petId?: string;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: "text" | "image" | "system";
  imageUrl?: string;
}

export interface MessageQuery {
  conversationId: string;
  page?: number;
  limit?: number;
  before?: Date;
  after?: Date;
}

export interface ConversationQuery {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export class MessageService {
  private notificationService: NotificationService;
  private socketService: SocketService;

  constructor() {
    this.notificationService = new NotificationService();
    this.socketService = new SocketService();
  }

  /**
   * 創建或獲取對話
   */
  async createOrGetConversation(
    data: CreateConversationData,
  ): Promise<IConversation> {
    const { participants, petId } = data;

    if (participants.length !== 2) {
      throw new Error("對話必須包含兩個參與者");
    }

    // 驗證參與者是否存在
    const users = await User.find({
      _id: { $in: participants.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    if (users.length !== 2) {
      throw new Error("參與者不存在");
    }

    // 驗證寵物是否存在（如果提供）
    if (petId) {
      const pet = await Pet.findById(petId);
      if (!pet) {
        throw new Error("寵物不存在");
      }
    }

    // 查找現有對話
    const participantIds = participants.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 },
    }).populate("participants", "username avatar email");

    // 如果不存在，創建新對話
    if (!conversation) {
      conversation = new Conversation({
        participants: participantIds,
        petId: petId ? new mongoose.Types.ObjectId(petId) : null,
        lastMessageAt: new Date(),
      });
      await conversation.save();
      await conversation.populate("participants", "username avatar email");
    }

    return conversation;
  }

  /**
   * 發送訊息
   */
  async sendMessage(data: SendMessageData): Promise<IMessage> {
    const {
      conversationId,
      senderId,
      content,
      messageType = "text",
      imageUrl,
    } = data;

    // 驗證對話是否存在
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("對話不存在");
    }

    // 驗證發送者是否為對話參與者
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    if (!conversation.participants.some((p) => p.equals(senderObjectId))) {
      throw new Error("您不是此對話的參與者");
    }

    // 獲取接收者
    const receiverId = conversation.participants.find(
      (p) => !p.equals(senderObjectId),
    );
    if (!receiverId) {
      throw new Error("找不到接收者");
    }

    // 創建訊息
    const message = new Message({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: senderObjectId,
      receiverId,
      content: content.trim(),
      messageType,
      imageUrl: messageType === "image" ? imageUrl : undefined,
    });

    await message.save();

    // 更新對話的最後訊息
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    // 填充訊息資料
    await message.populate([
      { path: "senderId", select: "username avatar email" },
      { path: "receiverId", select: "username avatar email" },
    ]);

    // 發送即時通知
    await this.sendMessageNotification(message);

    return message;
  }

  /**
   * 獲取對話訊息
   */
  async getMessages(query: MessageQuery): Promise<{
    messages: IMessage[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const { conversationId, page = 1, limit = 50, before, after } = query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("無效的對話ID");
    }

    // 構建查詢條件
    const filter: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    };
    if (before) filter.createdAt = { $lt: before };
    if (after) filter.createdAt = { ...filter.createdAt, $gt: after };

    // 計算分頁
    const skip = (page - 1) * limit;

    // 執行查詢
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("senderId", "username avatar email")
        .populate("receiverId", "username avatar email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      messages: messages.reverse(), // 反轉順序，最新的在底部
      total,
      page,
      totalPages,
      hasMore,
    };
  }

  /**
   * 獲取用戶對話列表
   */
  async getConversations(query: ConversationQuery): Promise<{
    conversations: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { userId, page = 1, limit = 20, search } = query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 構建查詢條件
    const filter: any = {
      participants: userObjectId,
      isActive: true,
    };

    // 如果有搜索條件，需要先找到匹配的用戶
    if (search) {
      const searchUsers = await User.find({
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const searchUserIds = searchUsers.map((u) => u._id);
      filter.participants = { $in: [userObjectId, ...searchUserIds] };
    }

    // 計算分頁
    const skip = (page - 1) * limit;

    // 執行查詢
    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("participants", "username avatar email lastActiveAt")
        .populate("lastMessage")
        .populate("petId", "name images")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    // 為每個對話添加未讀訊息數量
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userObjectId,
          isRead: false,
        });

        // 獲取對話夥伴資訊
        const partner = conv.participants.find(
          (p: any) => !p._id.equals(userObjectId),
        );

        return {
          ...conv,
          unreadCount,
          partner,
        };
      }),
    );

    return {
      conversations: conversationsWithUnread,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 標記訊息為已讀
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("無效的對話ID");
    }

    const result = await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        receiverId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return result.modifiedCount;
  }

  /**
   * 刪除訊息
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new Error("無效的訊息ID");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("訊息不存在");
    }

    // 檢查權限（只有發送者可以刪除）
    if (message.senderId.toString() !== userId) {
      throw new Error("無權限刪除此訊息");
    }

    // 軟刪除
    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    });

    return true;
  }

  /**
   * 刪除對話
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("無效的對話ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("對話不存在");
    }

    // 檢查權限
    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!conversation.participants.some((p) => p.equals(userObjectId))) {
      throw new Error("您不是此對話的參與者");
    }

    // 將對話標記為非活躍
    await Conversation.findByIdAndUpdate(conversationId, {
      isActive: false,
    });

    return true;
  }

  /**
   * 獲取未讀訊息統計
   */
  async getUnreadStats(userId: string): Promise<{
    totalUnread: number;
    conversationsWithUnread: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalUnread, conversationsWithUnread] = await Promise.all([
      Message.countDocuments({
        receiverId: userObjectId,
        isRead: false,
      }),
      Message.aggregate([
        {
          $match: {
            receiverId: userObjectId,
            isRead: false,
          },
        },
        {
          $group: {
            _id: "$conversationId",
          },
        },
        {
          $count: "count",
        },
      ]),
    ]);

    return {
      totalUnread,
      conversationsWithUnread: conversationsWithUnread[0]?.count || 0,
    };
  }

  /**
   * 搜索訊息
   */
  async searchMessages(
    userId: string,
    keyword: string,
    conversationId?: string,
  ): Promise<IMessage[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 構建查詢條件
    const filter: any = {
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      content: { $regex: keyword, $options: "i" },
      messageType: "text",
    };

    if (conversationId) {
      filter.conversationId = new mongoose.Types.ObjectId(conversationId);
    }

    const messages = await Message.find(filter)
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar")
      .populate("conversationId")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return messages;
  }

  /**
   * 發送訊息通知
   */
  private async sendMessageNotification(message: IMessage): Promise<void> {
    try {
      const sender = await User.findById(message.senderId).lean();
      const receiver = await User.findById(message.receiverId).lean();

      if (!sender || !receiver) return;

      // 發送推播通知
      await NotificationService.sendNotification({
        userId: message.receiverId.toString(),
        type: NotificationType.MESSAGE,
        title: `來自 ${(sender as any)?.username || "用戶"} 的訊息`,
        message:
          message.messageType === "text"
            ? message.content.substring(0, 50) +
              (message.content.length > 50 ? "..." : "")
            : "發送了一張圖片",
        data: {
          conversationId: message.conversationId.toString(),
          messageId: message._id.toString(),
          senderId: message.senderId.toString(),
        },
      });

      // 發送即時 Socket 通知（如果 SocketService 有 sendToUser 方法）
      if (typeof (this.socketService as any).sendToUser === "function") {
        (this.socketService as any).sendToUser(
          message.receiverId.toString(),
          "new_message",
          {
            message: {
              ...message.toObject(),
              sender: { username: (sender as any)?.username || "用戶" },
            },
          },
        );
      }
    } catch (error) {
      console.error("發送訊息通知失敗:", error);
    }
  }
}

export const messageService = new MessageService();
