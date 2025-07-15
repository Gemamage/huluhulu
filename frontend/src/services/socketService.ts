// Socket.IO 客戶端服務
import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { 
  SocketEvents, 
  RealtimeNotificationData, 
  NotificationType 
} from '../types/notification';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * 初始化 Socket 連接
   */
  public async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = authService.getToken();
      if (!token) {
        console.warn('No auth token available for socket connection');
        this.isConnecting = false;
        return;
      }

      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Socket connection failed:', error);
      this.isConnecting = false;
    }
  }

  /**
   * 設置 Socket 事件監聽器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 連接成功
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // 加入用戶房間
      this.joinUserRoom();
    });

    // 連接失敗
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    // 斷開連接
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        // 服務器主動斷開，需要重新連接
        this.handleReconnect();
      }
    });

    // 接收通知
    this.socket.on(SocketEvents.NOTIFICATION, (notification: RealtimeNotificationData) => {
      console.log('Received notification:', notification);
      this.handleNotification(notification);
      
      // 確認通知送達
      this.socket?.emit(SocketEvents.NOTIFICATION_DELIVERED, {
        notificationId: notification.id
      });
    });

    // 寵物狀態更新
    this.socket.on(SocketEvents.PET_STATUS_UPDATE, (data) => {
      console.log('Pet status update:', data);
      this.emit('petStatusUpdate', data);
    });

    // 寵物配對通知
    this.socket.on(SocketEvents.PET_MATCH_FOUND, (data) => {
      console.log('Pet match found:', data);
      this.emit('petMatchFound', data);
    });

    // 系統公告
    this.socket.on(SocketEvents.SYSTEM_ANNOUNCEMENT, (data) => {
      console.log('System announcement:', data);
      this.emit('systemAnnouncement', data);
    });
  }

  /**
   * 加入用戶房間
   */
  private joinUserRoom(): void {
    const user = authService.getCurrentUser();
    if (user && this.socket) {
      this.socket.emit(SocketEvents.JOIN_ROOM, {
        room: `user:${user._id}`
      });
    }
  }

  /**
   * 處理重新連接
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 處理接收到的通知
   */
  private handleNotification(notification: RealtimeNotificationData): void {
    // 觸發通知事件
    this.emit('notification', notification);
    
    // 根據通知類型觸發特定事件
    switch (notification.type) {
      case NotificationType.MATCH_FOUND:
        this.emit('matchFound', notification);
        break;
      case NotificationType.PET_STATUS_UPDATE:
        this.emit('petStatusUpdate', notification);
        break;
      case NotificationType.GEOFENCE_ALERT:
        this.emit('geofenceAlert', notification);
        break;
      case NotificationType.REMINDER:
        this.emit('reminder', notification);
        break;
      default:
        break;
    }
  }

  /**
   * 標記通知為已讀
   */
  public markNotificationAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SocketEvents.NOTIFICATION_READ, {
        notificationId
      });
    }
  }

  /**
   * 斷開連接
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * 檢查連接狀態
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 添加事件監聽器
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * 移除事件監聽器
   */
  public off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 觸發事件
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * 發送自定義事件
   */
  public send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send event:', event);
    }
  }
}

// 創建單例實例
export const socketService = new SocketService();
export default socketService;