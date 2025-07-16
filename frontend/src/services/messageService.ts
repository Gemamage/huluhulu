import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface SendMessageRequest {
  receiverId: string;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  petId?: string;
}

export interface GetMessagesQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetConversationsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SearchMessagesQuery {
  query: string;
  conversationId?: string;
  page?: number;
  limit?: number;
}

export interface User {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  receiverId: User;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  petId?: {
    _id: string;
    name: string;
    images: string[];
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    messageType: 'text' | 'image';
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UnreadStats {
  totalUnread: number;
  conversationCounts: Array<{
    conversationId: string;
    count: number;
  }>;
}

class MessageService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 獲取或創建對話
  async getOrCreateConversation(
    receiverId: string,
    petId?: string
  ): Promise<Conversation> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/messages/conversation`,
        { receiverId, petId },
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '創建對話失敗');
    }
  }

  // 發送訊息
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/messages`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '發送訊息失敗');
    }
  }

  // 獲取對話訊息
  async getConversationMessages(
    conversationId: string,
    query: GetMessagesQuery = {}
  ): Promise<MessagesResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await axios.get(
        `${API_BASE_URL}/community/messages/conversation/${conversationId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取對話訊息失敗');
    }
  }

  // 獲取用戶對話列表
  async getUserConversations(
    query: GetConversationsQuery = {}
  ): Promise<ConversationsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await axios.get(
        `${API_BASE_URL}/community/messages/conversations?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取對話列表失敗');
    }
  }

  // 標記訊息為已讀
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await axios.put(
        `${API_BASE_URL}/community/messages/conversation/${conversationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '標記已讀失敗');
    }
  }

  // 刪除訊息
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/community/messages/${messageId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刪除訊息失敗');
    }
  }

  // 刪除對話
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/community/messages/conversation/${conversationId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刪除對話失敗');
    }
  }

  // 獲取未讀訊息統計
  async getUnreadStats(): Promise<UnreadStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/messages/unread/stats`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取未讀統計失敗');
    }
  }

  // 搜索訊息
  async searchMessages(
    query: SearchMessagesQuery
  ): Promise<MessagesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('query', query.query);
      if (query.conversationId) params.append('conversationId', query.conversationId);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());

      const response = await axios.get(
        `${API_BASE_URL}/community/messages/search?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '搜索訊息失敗');
    }
  }

  // 獲取單個訊息
  async getMessage(messageId: string): Promise<Message> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/messages/${messageId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取訊息失敗');
    }
  }

  // 獲取對話詳情
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/messages/conversation/${conversationId}/details`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取對話詳情失敗');
    }
  }
}

export const messageService = new MessageService();
export default messageService;