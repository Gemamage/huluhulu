import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface CreateReviewRequest {
  revieweeId: string;
  rating: number;
  content: string;
  tags: string[];
  isAnonymous: boolean;
  petId?: string;
  conversationId?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  content?: string;
  tags?: string[];
  isAnonymous?: boolean;
}

export interface GetReviewsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  rating?: number;
  tags?: string[];
}

export interface Review {
  _id: string;
  reviewerId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  revieweeId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  petId?: {
    _id: string;
    name: string;
    images: string[];
  };
  conversationId?: string;
  rating: number;
  content: string;
  tags: string[];
  isAnonymous: boolean;
  isDeleted: boolean;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  userId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TagStats {
  tag: string;
  count: number;
  averageRating: number;
}

export interface ReviewTrend {
  date: string;
  count: number;
  averageRating: number;
}

class ReviewService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 創建評價
  async createReview(data: CreateReviewRequest): Promise<Review> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/reviews`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '創建評價失敗');
    }
  }

  // 獲取用戶評價
  async getUserReviews(
    userId: string,
    query: GetReviewsQuery = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.rating) params.append('rating', query.rating.toString());
      if (query.tags) query.tags.forEach(tag => params.append('tags', tag));

      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/user/${userId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取用戶評價失敗');
    }
  }

  // 獲取單個評價
  async getReview(reviewId: string): Promise<Review> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/${reviewId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取評價失敗');
    }
  }

  // 更新評價
  async updateReview(
    reviewId: string,
    data: UpdateReviewRequest
  ): Promise<Review> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/community/reviews/${reviewId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新評價失敗');
    }
  }

  // 刪除評價
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/community/reviews/${reviewId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刪除評價失敗');
    }
  }

  // 舉報評價
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/community/reviews/${reviewId}/report`,
        { reason },
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '舉報評價失敗');
    }
  }

  // 獲取用戶評價統計
  async getUserReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/user/${userId}/stats`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取評價統計失敗');
    }
  }

  // 獲取標籤統計
  async getTagStats(userId: string): Promise<TagStats[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/user/${userId}/tags`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取標籤統計失敗');
    }
  }

  // 獲取評價趨勢
  async getReviewTrend(
    userId: string,
    days: number = 30
  ): Promise<ReviewTrend[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/user/${userId}/trend?days=${days}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取評價趨勢失敗');
    }
  }

  // 檢查是否可以評價
  async canReview(
    revieweeId: string,
    petId?: string,
    conversationId?: string
  ): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      if (petId) params.append('petId', petId);
      if (conversationId) params.append('conversationId', conversationId);

      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/can-review/${revieweeId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data.canReview;
    } catch (error: any) {
      return false;
    }
  }

  // 獲取我寫的評價
  async getMyReviews(
    query: GetReviewsQuery = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.rating) params.append('rating', query.rating.toString());
      if (query.tags) query.tags.forEach(tag => params.append('tags', tag));

      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/my-reviews?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取我的評價失敗');
    }
  }

  // 獲取收到的評價
  async getReceivedReviews(
    query: GetReviewsQuery = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.rating) params.append('rating', query.rating.toString());
      if (query.tags) query.tags.forEach(tag => params.append('tags', tag));

      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/received?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取收到的評價失敗');
    }
  }

  // 獲取寵物相關評價
  async getPetReviews(
    petId: string,
    query: GetReviewsQuery = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.rating) params.append('rating', query.rating.toString());
      if (query.tags) query.tags.forEach(tag => params.append('tags', tag));

      const response = await axios.get(
        `${API_BASE_URL}/community/reviews/pet/${petId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取寵物評價失敗');
    }
  }
}

export const reviewService = new ReviewService();
export default reviewService;