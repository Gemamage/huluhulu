import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { NotificationType, NotificationPriority } from '../models/Notification';

/**
 * Socket 事件類型
 */
export enum SocketEvents {
  // 連接相關
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // 通知相關
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_DELIVERED = 'notification_delivered',
  
  // 聊天相關
  MESSAGE = 'message',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  
  // 寵物協尋相關
  PET_STATUS_UPDATE = 'pet_status_update',
  MATCH_FOUND = 'match_found',
  
  // 系統相關
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
}

/**
 * 即時通知資料介面
 */
export interface RealtimeNotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: any;
  timestamp: Date;
  actionUrl?: string;
  imageUrl?: string;
}

/**
 * 使用者 Socket 資訊
 */
interface UserSocketInfo {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * Socket 服務類別
 */
export class SocketService {
  private static io: SocketIOServer | null = null;
  private static userSockets = new Map<string, UserSocketInfo[]>(); // userId -> socket info array
  private static socketUsers = new Map<string, string>(); // socketId -> userId

  /**
   * 初始化 Socket.IO 服務
   */
  static initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // 中介軟體：驗證 JWT Token
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('未提供認證 token'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as any;
        socket.data.userId = decoded.userId;
        socket.data.user = decoded;
        
        next();
      } catch (error) {
        logger.error('Socket 認證失敗', { error });
        next(new Error('認證失敗'));
      }
    });

    // 處理連接事件
    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO 服務初始化成功');
    return this.io;
  }

  /**
   * 處理用戶連接
   */
  private static handleConnection(socket: Socket): void {
    const userId = socket.data.userId;
    const socketInfo: UserSocketInfo = {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    // 記錄用戶 socket 連接
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socketInfo);
    this.socketUsers.set(socket.id, userId);

    // 加入用戶個人房間
    socket.join(`user:${userId}`);

    logger.info('用戶連接成功', {
      userId,
      socketId: socket.id,
      totalConnections: this.userSockets.get(userId)!.length,
    });

    // 通知其他用戶該用戶上線
    socket.broadcast.emit(SocketEvents.USER_ONLINE, {
      userId,
      timestamp: new Date(),
    });

    // 處理加入房間
    socket.on(SocketEvents.JOIN_ROOM, (roomId: string) => {
      socket.join(roomId);
      logger.debug('用戶加入房間', { userId, socketId: socket.id, roomId });
    });

    // 處理離開房間
    socket.on(SocketEvents.LEAVE_ROOM, (roomId: string) => {
      socket.leave(roomId);
      logger.debug('用戶離開房間', { userId, socketId: socket.id, roomId });
    });

    // 處理通知已讀
    socket.on(SocketEvents.NOTIFICATION_READ, (notificationId: string) => {
      this.handleNotificationRead(userId, notificationId);
    });

    // 處理通知送達確認
    socket.on(SocketEvents.NOTIFICATION_DELIVERED, (notificationId: string) => {
      this.handleNotificationDelivered(userId, notificationId);
    });

    // 處理訊息相關事件
    socket.on(SocketEvents.MESSAGE, (data: any) => {
      this.handleMessage(socket, data);
    });

    socket.on(SocketEvents.MESSAGE_READ, (data: any) => {
      this.handleMessageRead(socket, data);
    });

    socket.on(SocketEvents.TYPING_START, (data: any) => {
      this.handleTyping(socket, data, true);
    });

    socket.on(SocketEvents.TYPING_STOP, (data: any) => {
      this.handleTyping(socket, data, false);
    });

    // 處理斷線
    socket.on(SocketEvents.DISCONNECT, (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // 更新最後活動時間
    socket.onAny(() => {
      this.updateLastActivity(userId, socket.id);
    });
  }

  /**
   * 處理用戶斷線
   */
  private static handleDisconnection(socket: Socket, reason: string): void {
    const userId = this.socketUsers.get(socket.id);
    
    if (userId) {
      // 移除 socket 記錄
      const userSocketList = this.userSockets.get(userId);
      if (userSocketList) {
        const index = userSocketList.findIndex(info => info.socketId === socket.id);
        if (index !== -1) {
          userSocketList.splice(index, 1);
        }
        
        // 如果用戶沒有其他連接，則清理記錄並通知下線
        if (userSocketList.length === 0) {
          this.userSockets.delete(userId);
          socket.broadcast.emit(SocketEvents.USER_OFFLINE, {
            userId,
            timestamp: new Date(),
          });
        }
      }
      
      this.socketUsers.delete(socket.id);
      
      logger.info('用戶斷線', {
        userId,
        socketId: socket.id,
        reason,
        remainingConnections: this.userSockets.get(userId)?.length || 0,
      });
    }
  }

  /**
   * 發送即時通知給特定用戶
   */
  static async sendNotificationToUser(
    userId: string,
    notification: RealtimeNotificationData
  ): Promise<boolean> {
    try {
      if (!this.io) {
        logger.warn('Socket.IO 尚未初始化');
        return false;
      }

      const room = `user:${userId}`;
      this.io.to(room).emit(SocketEvents.NOTIFICATION, notification);
      
      logger.debug('即時通知已發送', {
        userId,
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
      });
      
      return true;
    } catch (error) {
      logger.error('發送即時通知失敗', { error, userId, notificationId: notification.id });
      return false;
    }
  }

  /**
   * 發送即時通知給多個用戶
   */
  static async sendNotificationToUsers(
    userIds: string[],
    notification: RealtimeNotificationData
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      const success = await this.sendNotificationToUser(userId, notification);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  /**
   * 廣播系統公告
   */
  static broadcastSystemAnnouncement(announcement: {
    title: string;
    message: string;
    priority: NotificationPriority;
    actionUrl?: string;
  }): void {
    if (!this.io) {
      logger.warn('Socket.IO 尚未初始化');
      return;
    }

    this.io.emit(SocketEvents.SYSTEM_ANNOUNCEMENT, {
      ...announcement,
      timestamp: new Date(),
    });

    logger.info('系統公告已廣播', { title: announcement.title });
  }

  /**
   * 發送寵物狀態更新
   */
  static sendPetStatusUpdate(
    userId: string,
    petId: string,
    status: string,
    message: string
  ): void {
    if (!this.io) {
      logger.warn('Socket.IO 尚未初始化');
      return;
    }

    const room = `user:${userId}`;
    this.io.to(room).emit(SocketEvents.PET_STATUS_UPDATE, {
      petId,
      status,
      message,
      timestamp: new Date(),
    });

    logger.debug('寵物狀態更新已發送', { userId, petId, status });
  }

  /**
   * 檢查用戶是否在線
   */
  static isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0;
  }

  /**
   * 取得在線用戶列表
   */
  static getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * 取得用戶連接數
   */
  static getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.length || 0;
  }

  /**
   * 處理通知已讀
   */
  private static handleNotificationRead(userId: string, notificationId: string): void {
    logger.debug('通知已讀', { userId, notificationId });
    // 這裡可以更新資料庫中的通知狀態
  }

  /**
   * 處理通知送達確認
   */
  private static handleNotificationDelivered(userId: string, notificationId: string): void {
    logger.debug('通知送達確認', { userId, notificationId });
    // 這裡可以更新資料庫中的通知送達狀態
  }

  /**
   * 處理訊息
   */
  private static handleMessage(socket: Socket, data: any): void {
    const userId = socket.data.userId;
    logger.debug('收到訊息', { userId, messageData: data });
    
    // 轉發訊息給目標用戶
    if (data.targetUserId) {
      const targetRoom = `user:${data.targetUserId}`;
      socket.to(targetRoom).emit(SocketEvents.MESSAGE, {
        ...data,
        fromUserId: userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * 處理訊息已讀
   */
  private static handleMessageRead(socket: Socket, data: any): void {
    const userId = socket.data.userId;
    logger.debug('訊息已讀', { userId, messageData: data });
    
    // 通知發送者訊息已被讀取
    if (data.fromUserId) {
      const senderRoom = `user:${data.fromUserId}`;
      socket.to(senderRoom).emit(SocketEvents.MESSAGE_READ, {
        messageId: data.messageId,
        readBy: userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * 處理輸入狀態
   */
  private static handleTyping(socket: Socket, data: any, isTyping: boolean): void {
    const userId = socket.data.userId;
    
    if (data.targetUserId) {
      const targetRoom = `user:${data.targetUserId}`;
      const event = isTyping ? SocketEvents.TYPING_START : SocketEvents.TYPING_STOP;
      
      socket.to(targetRoom).emit(event, {
        fromUserId: userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * 更新最後活動時間
   */
  private static updateLastActivity(userId: string, socketId: string): void {
    const userSocketList = this.userSockets.get(userId);
    if (userSocketList) {
      const socketInfo = userSocketList.find(info => info.socketId === socketId);
      if (socketInfo) {
        socketInfo.lastActivity = new Date();
      }
    }
  }

  /**
   * 清理非活躍連接
   */
  static cleanupInactiveConnections(inactiveThresholdMinutes: number = 30): void {
    const threshold = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, socketList] of this.userSockets.entries()) {
      const activeConnections = socketList.filter(info => info.lastActivity > threshold);
      
      if (activeConnections.length !== socketList.length) {
        const inactiveConnections = socketList.filter(info => info.lastActivity <= threshold);
        
        // 斷開非活躍連接
        inactiveConnections.forEach(info => {
          const socket = this.io?.sockets.sockets.get(info.socketId);
          if (socket) {
            socket.disconnect(true);
            cleanedCount++;
          }
        });
        
        // 更新記錄
        if (activeConnections.length > 0) {
          this.userSockets.set(userId, activeConnections);
        } else {
          this.userSockets.delete(userId);
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info('清理非活躍連接完成', { cleanedCount, thresholdMinutes: inactiveThresholdMinutes });
    }
  }

  /**
   * 取得服務統計資訊
   */
  static getStats(): {
    totalConnections: number;
    onlineUsers: number;
    averageConnectionsPerUser: number;
  } {
    const totalConnections = Array.from(this.userSockets.values())
      .reduce((sum, connections) => sum + connections.length, 0);
    const onlineUsers = this.userSockets.size;
    const averageConnectionsPerUser = onlineUsers > 0 ? totalConnections / onlineUsers : 0;

    return {
      totalConnections,
      onlineUsers,
      averageConnectionsPerUser: Math.round(averageConnectionsPerUser * 100) / 100,
    };
  }
}