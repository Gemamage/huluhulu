import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface CreateCommentRequest {
  petId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface GetCommentsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface Comment {
  _id: string;
  petId: string;
  userId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  reportCount: number;
  isHidden: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserCommentsStats {
  totalComments: number;
  totalReplies: number;
  totalReports: number;
  recentComments: Comment[];
}

class CommentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 創建留言
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/comments`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '創建留言失敗');
    }
  }

  // 獲取寵物的留言
  async getCommentsByPet(
    petId: string,
    query: GetCommentsQuery = {}
  ): Promise<CommentsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await axios.get(
        `${API_BASE_URL}/community/comments/pet/${petId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取留言失敗');
    }
  }

  // 獲取留言樹狀結構
  async getCommentsTree(petId: string): Promise<Comment[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/comments/pet/${petId}/tree`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取留言樹狀結構失敗');
    }
  }

  // 獲取單個留言
  async getComment(commentId: string): Promise<Comment> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/comments/${commentId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取留言失敗');
    }
  }

  // 更新留言
  async updateComment(
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/community/comments/${commentId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新留言失敗');
    }
  }

  // 刪除留言
  async deleteComment(commentId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/community/comments/${commentId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刪除留言失敗');
    }
  }

  // 舉報留言
  async reportComment(commentId: string, reason: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/community/comments/${commentId}/report`,
        { reason },
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '舉報留言失敗');
    }
  }

  // 獲取用戶留言統計
  async getUserCommentsStats(userId: string): Promise<UserCommentsStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/comments/user/${userId}/stats`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取用戶留言統計失敗');
    }
  }

  // 獲取用戶的留言
  async getUserComments(
    userId: string,
    query: GetCommentsQuery = {}
  ): Promise<CommentsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await axios.get(
        `${API_BASE_URL}/community/comments/user/${userId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取用戶留言失敗');
    }
  }
}

export const commentService = new CommentService();
export default commentService;