import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface CreateReportRequest {
  reportedUserId?: string;
  contentId?: string;
  contentType: 'user' | 'comment' | 'message' | 'review' | 'pet';
  reportType: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  reason: string;
  description?: string;
  evidence?: string[];
}

export interface UpdateReportRequest {
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolution?: string;
}

export interface GetReportsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  reportType?: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  contentType?: 'user' | 'comment' | 'message' | 'review' | 'pet';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Report {
  _id: string;
  reporterId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  reportedUserId?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  contentId?: string;
  contentType: 'user' | 'comment' | 'message' | 'review' | 'pet';
  reportType: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  reason: string;
  description?: string;
  evidence: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminId?: {
    _id: string;
    username: string;
  };
  adminNotes?: string;
  resolution?: string;
  resolvedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStats {
  targetId: string;
  targetType: 'user' | 'content';
  totalReports: number;
  reportTypeDistribution: {
    spam: number;
    harassment: number;
    inappropriate: number;
    fake: number;
    other: number;
  };
  statusDistribution: {
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
  };
  lastReportedAt: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReportSummary {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  highPriorityReports: number;
  recentReports: Report[];
}

class ReportService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 創建舉報
  async createReport(data: CreateReportRequest): Promise<Report> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/reports`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '提交舉報失敗');
    }
  }

  // 獲取我的舉報
  async getMyReports(
    query: GetReportsQuery = {}
  ): Promise<ReportsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.status) params.append('status', query.status);
      if (query.reportType) params.append('reportType', query.reportType);
      if (query.contentType) params.append('contentType', query.contentType);
      if (query.priority) params.append('priority', query.priority);

      const response = await axios.get(
        `${API_BASE_URL}/community/reports/my-reports?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取我的舉報失敗');
    }
  }

  // 獲取單個舉報
  async getReport(reportId: string): Promise<Report> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reports/${reportId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取舉報詳情失敗');
    }
  }

  // 刪除舉報（僅限舉報者）
  async deleteReport(reportId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/community/reports/${reportId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刪除舉報失敗');
    }
  }

  // 獲取用戶舉報統計
  async getUserReportStats(userId: string): Promise<ReportStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reports/user/${userId}/stats`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取用戶舉報統計失敗');
    }
  }

  // 獲取內容舉報統計
  async getContentReportStats(
    contentId: string,
    contentType: string
  ): Promise<ReportStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reports/content/${contentId}/stats?contentType=${contentType}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取內容舉報統計失敗');
    }
  }

  // 管理員功能 - 獲取所有舉報
  async getAllReports(
    query: GetReportsQuery = {}
  ): Promise<ReportsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.status) params.append('status', query.status);
      if (query.reportType) params.append('reportType', query.reportType);
      if (query.contentType) params.append('contentType', query.contentType);
      if (query.priority) params.append('priority', query.priority);

      const response = await axios.get(
        `${API_BASE_URL}/community/admin/reports?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取舉報列表失敗');
    }
  }

  // 管理員功能 - 更新舉報狀態
  async updateReportStatus(
    reportId: string,
    data: UpdateReportRequest
  ): Promise<Report> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/community/admin/reports/${reportId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新舉報狀態失敗');
    }
  }

  // 管理員功能 - 批量處理舉報
  async batchUpdateReports(
    reportIds: string[],
    data: UpdateReportRequest
  ): Promise<void> {
    try {
      await axios.put(
        `${API_BASE_URL}/community/admin/reports/batch`,
        {
          reportIds,
          ...data
        },
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '批量處理舉報失敗');
    }
  }

  // 管理員功能 - 獲取舉報摘要
  async getReportSummary(): Promise<ReportSummary> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/admin/reports/summary`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '獲取舉報摘要失敗');
    }
  }

  // 管理員功能 - 自動處理舉報
  async autoProcessReports(): Promise<{
    processed: number;
    resolved: number;
    dismissed: number;
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/community/admin/reports/auto-process`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '自動處理舉報失敗');
    }
  }

  // 檢查是否已舉報
  async hasReported(
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/community/reports/check?contentId=${contentId}&contentType=${contentType}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data.hasReported;
    } catch (error: any) {
      return false;
    }
  }

  // 獲取舉報類型選項
  getReportTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'spam',
        label: '垃圾訊息',
        description: '重複發送無意義或廣告內容'
      },
      {
        value: 'harassment',
        label: '騷擾行為',
        description: '惡意騷擾、威脅或霸凌他人'
      },
      {
        value: 'inappropriate',
        label: '不當內容',
        description: '包含不適當、冒犯性或違法內容'
      },
      {
        value: 'fake',
        label: '虛假資訊',
        description: '提供虛假或誤導性資訊'
      },
      {
        value: 'other',
        label: '其他',
        description: '其他違反社群規範的行為'
      }
    ];
  }

  // 獲取內容類型選項
  getContentTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'user', label: '用戶' },
      { value: 'comment', label: '留言' },
      { value: 'message', label: '私訊' },
      { value: 'review', label: '評價' },
      { value: 'pet', label: '寵物資訊' }
    ];
  }

  // 獲取狀態選項
  getStatusOptions(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'pending', label: '待處理', color: 'orange' },
      { value: 'investigating', label: '調查中', color: 'blue' },
      { value: 'resolved', label: '已解決', color: 'green' },
      { value: 'dismissed', label: '已駁回', color: 'gray' }
    ];
  }

  // 獲取優先級選項
  getPriorityOptions(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'low', label: '低', color: 'green' },
      { value: 'medium', label: '中', color: 'yellow' },
      { value: 'high', label: '高', color: 'orange' },
      { value: 'urgent', label: '緊急', color: 'red' }
    ];
  }
}

export const reportService = new ReportService();
export default reportService;