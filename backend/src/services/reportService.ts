import mongoose from "mongoose";
import { Report, ReportStats, IReport, IReportStats } from "../models/Report";
import { User } from "../models/User";
import { Comment } from "../models/Comment";
import { Review } from "../models/Review";
import { Message } from "../models/Message";
import { Pet } from "../models/Pet";
import { NotificationService } from "./notificationService";
import { NotificationType } from "../models/Notification";

export interface CreateReportData {
  reporterId: string;
  reportedUserId?: string;
  reportedContentId?: string;
  contentType: "user" | "comment" | "review" | "message" | "pet";
  reportType: string;
  reason: string;
  description?: string;
  evidence?: string[];
}

export interface UpdateReportData {
  status?: "pending" | "investigating" | "resolved" | "dismissed";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  resolution?: string;
}

export interface ReportQuery {
  status?: string;
  priority?: string;
  contentType?: string;
  reportType?: string;
  assignedTo?: string;
  reporterId?: string;
  reportedUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  dateFrom?: Date;
  dateTo?: Date;
}

export class ReportService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * 創建舉報
   */
  async createReport(data: CreateReportData): Promise<IReport> {
    const {
      reporterId,
      reportedUserId,
      reportedContentId,
      contentType,
      reportType,
      reason,
      description = "",
      evidence = [],
    } = data;

    // 驗證舉報者
    const reporter = await User.findById(reporterId);
    if (!reporter) {
      throw new Error("舉報者不存在");
    }

    // 驗證被舉報的用戶（如果提供）
    if (reportedUserId) {
      const reportedUser = await User.findById(reportedUserId);
      if (!reportedUser) {
        throw new Error("被舉報的用戶不存在");
      }

      // 不能舉報自己
      if (reporterId === reportedUserId) {
        throw new Error("不能舉報自己");
      }
    }

    // 驗證被舉報的內容是否存在
    if (reportedContentId) {
      await this.validateReportedContent(reportedContentId, contentType);
    }

    // 檢查是否已經舉報過相同內容
    const existingReport = await Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      reportedContentId: reportedContentId
        ? new mongoose.Types.ObjectId(reportedContentId)
        : null,
      contentType,
      isDeleted: false,
    });

    if (existingReport) {
      throw new Error("您已經舉報過此內容");
    }

    // 創建舉報
    const report = new Report({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      reportedUserId: reportedUserId
        ? new mongoose.Types.ObjectId(reportedUserId)
        : null,
      reportedContentId: reportedContentId
        ? new mongoose.Types.ObjectId(reportedContentId)
        : null,
      contentType,
      reportType,
      reason: reason.trim(),
      description: description.trim(),
      evidence: evidence.filter((url) => url.trim().length > 0),
    });

    await report.save();

    // 通知管理員
    await this.notifyAdmins(report);

    // 更新統計
    await this.updateReportStats(report);

    const createdReport = await this.getReportById(report._id.toString());
    if (!createdReport) {
      throw new Error("創建舉報後無法獲取舉報詳情");
    }
    return createdReport;
  }

  /**
   * 獲取舉報詳情
   */
  async getReportById(reportId: string): Promise<IReport | null> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new Error("無效的舉報ID");
    }

    return await Report.findById(reportId)
      .populate("reporterId", "username email avatar")
      .populate("reportedUserId", "username email avatar")
      .populate("assignedTo", "username email")
      .populate("resolvedBy", "username email")
      .lean();
  }

  /**
   * 獲取舉報列表
   */
  async getReports(query: ReportQuery): Promise<{
    reports: IReport[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      pending: number;
      investigating: number;
      resolved: number;
      dismissed: number;
    };
  }> {
    const {
      status,
      priority,
      contentType,
      reportType,
      assignedTo,
      reporterId,
      reportedUserId,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = query;

    // 構建查詢條件
    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (contentType) filter.contentType = contentType;
    if (reportType) filter.reportType = reportType;
    if (assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    if (reporterId) filter.reporterId = new mongoose.Types.ObjectId(reporterId);
    if (reportedUserId)
      filter.reportedUserId = new mongoose.Types.ObjectId(reportedUserId);

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    // 計算分頁
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // 執行查詢
    const [reports, total, stats] = await Promise.all([
      Report.find(filter)
        .populate("reporterId", "username email avatar")
        .populate("reportedUserId", "username email avatar")
        .populate("assignedTo", "username email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
      this.getReportStatusStats(),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * 更新舉報
   */
  async updateReport(
    reportId: string,
    adminId: string,
    data: UpdateReportData,
  ): Promise<IReport | null> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new Error("無效的舉報ID");
    }

    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error("舉報不存在");
    }

    // 構建更新資料
    const updateData: any = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "resolved" || data.status === "dismissed") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = new mongoose.Types.ObjectId(adminId);
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo
        ? new mongoose.Types.ObjectId(data.assignedTo)
        : null;
    }
    if (data.resolution !== undefined)
      updateData.resolution = data.resolution.trim();

    const updatedReport = await Report.findByIdAndUpdate(reportId, updateData, {
      new: true,
    })
      .populate("reporterId", "username email avatar")
      .populate("reportedUserId", "username email avatar")
      .populate("assignedTo", "username email")
      .populate("resolvedBy", "username email");

    // 如果狀態變更為已處理，發送通知
    if (data.status === "resolved" && updatedReport) {
      await this.notifyReporter(updatedReport);
    }

    return updatedReport;
  }

  /**
   * 刪除舉報
   */
  async deleteReport(reportId: string, adminId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new Error("無效的舉報ID");
    }

    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error("舉報不存在");
    }

    // 軟刪除
    await Report.findByIdAndUpdate(reportId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(adminId),
    });

    return true;
  }

  /**
   * 批量處理舉報
   */
  async batchUpdateReports(
    reportIds: string[],
    adminId: string,
    data: UpdateReportData,
  ): Promise<number> {
    const validIds = reportIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validIds.length === 0) {
      throw new Error("沒有有效的舉報ID");
    }

    const updateData: any = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "resolved" || data.status === "dismissed") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = new mongoose.Types.ObjectId(adminId);
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo
        ? new mongoose.Types.ObjectId(data.assignedTo)
        : null;
    }

    const result = await Report.updateMany(
      {
        _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
        isDeleted: false,
      },
      updateData,
    );

    return result.modifiedCount;
  }

  /**
   * 獲取舉報統計
   */
  async getReportStats(timeRange?: "day" | "week" | "month" | "year"): Promise<{
    total: number;
    byStatus: { [key: string]: number };
    byType: { [key: string]: number };
    byContentType: { [key: string]: number };
    trends: Array<{ date: string; count: number }>;
  }> {
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case "day":
          startDate.setDate(now.getDate() - 1);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      dateFilter = { createdAt: { $gte: startDate } };
    }

    const [total, byStatus, byType, byContentType, trends] = await Promise.all([
      Report.countDocuments({ isDeleted: false, ...dateFilter }),
      this.getGroupedStats("status", dateFilter),
      this.getGroupedStats("reportType", dateFilter),
      this.getGroupedStats("contentType", dateFilter),
      this.getTrendStats(timeRange || "month"),
    ]);

    return {
      total,
      byStatus,
      byType,
      byContentType,
      trends,
    };
  }

  /**
   * 獲取用戶舉報歷史
   */
  async getUserReportHistory(
    userId: string,
    type: "reporter" | "reported" = "reporter",
  ): Promise<IReport[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("無效的用戶ID");
    }

    const filter: any = { isDeleted: false };
    if (type === "reporter") {
      filter.reporterId = new mongoose.Types.ObjectId(userId);
    } else {
      filter.reportedUserId = new mongoose.Types.ObjectId(userId);
    }

    return await Report.find(filter)
      .populate("reporterId", "username email avatar")
      .populate("reportedUserId", "username email avatar")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /**
   * 自動處理舉報
   */
  async autoProcessReports(): Promise<{
    processed: number;
    actions: Array<{ reportId: string; action: string; reason: string }>;
  }> {
    const actions: Array<{ reportId: string; action: string; reason: string }> =
      [];
    let processed = 0;

    // 自動處理高風險舉報
    const highRiskReports = await Report.find({
      status: "pending",
      reportType: { $in: ["暴力威脅", "仇恨言論", "詐騙行為"] },
      isDeleted: false,
    });

    for (const report of highRiskReports) {
      await Report.findByIdAndUpdate(report._id, {
        priority: "urgent",
        status: "investigating",
      });

      actions.push({
        reportId: report._id.toString(),
        action: "escalated",
        reason: "高風險內容自動升級處理",
      });
      processed++;
    }

    // 自動隱藏被多次舉報的內容
    await this.autoHideReportedContent();

    return { processed, actions };
  }

  /**
   * 驗證被舉報的內容是否存在
   */
  private async validateReportedContent(
    contentId: string,
    contentType: string,
  ): Promise<void> {
    let content;

    switch (contentType) {
      case "comment":
        content = await Comment.findById(contentId);
        break;
      case "review":
        content = await Review.findById(contentId);
        break;
      case "message":
        content = await Message.findById(contentId);
        break;
      case "pet":
        content = await Pet.findById(contentId);
        break;
      case "user":
        content = await User.findById(contentId);
        break;
      default:
        throw new Error("無效的內容類型");
    }

    if (!content) {
      throw new Error("被舉報的內容不存在");
    }
  }

  /**
   * 通知管理員
   */
  private async notifyAdmins(report: IReport): Promise<void> {
    try {
      // 獲取所有管理員
      const admins = await User.find({ role: "admin" }).select("_id");

      for (const admin of admins) {
        await NotificationService.sendNotification({
          userId: admin._id.toString(),
          type: NotificationType.REPORT,
          title: "新舉報通知",
          message: `收到新的${report.contentType}舉報：${report.reportType}`,
          data: {
            reportId: report._id.toString(),
            contentType: report.contentType,
            reportType: report.reportType,
            priority: report.priority,
          },
        });
      }
    } catch (error) {
      console.error("通知管理員失敗:", error);
    }
  }

  /**
   * 通知舉報者
   */
  private async notifyReporter(report: IReport): Promise<void> {
    try {
      await NotificationService.sendNotification({
        userId: report.reporterId.toString(),
        type: NotificationType.REPORT_RESOLVED,
        title: "舉報處理完成",
        message: `您的舉報已處理完成`,
        data: {
          reportId: report._id.toString(),
          status: report.status,
          resolution: report.resolution,
        },
      });
    } catch (error) {
      console.error("通知舉報者失敗:", error);
    }
  }

  /**
   * 更新舉報統計
   */
  private async updateReportStats(report: IReport): Promise<void> {
    // 這裡可以實作更詳細的統計邏輯
    // 例如更新用戶的舉報統計、內容的舉報統計等
  }

  /**
   * 獲取舉報狀態統計
   */
  private async getReportStatusStats(): Promise<{
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
  }> {
    const stats = await Report.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { pending: 0, investigating: 0, resolved: 0, dismissed: 0 };
    stats.forEach((stat) => {
      if (stat._id in result) {
        result[stat._id as keyof typeof result] = stat.count;
      }
    });

    return result;
  }

  /**
   * 獲取分組統計
   */
  private async getGroupedStats(
    field: string,
    dateFilter: any,
  ): Promise<{ [key: string]: number }> {
    const stats = await Report.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 },
        },
      },
    ]);

    const result: { [key: string]: number } = {};
    stats.forEach((stat) => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  /**
   * 獲取趨勢統計
   */
  private async getTrendStats(
    timeRange: string,
  ): Promise<Array<{ date: string; count: number }>> {
    const now = new Date();
    const startDate = new Date();
    let groupFormat = "%Y-%m-%d";

    switch (timeRange) {
      case "day":
        startDate.setDate(now.getDate() - 7);
        groupFormat = "%Y-%m-%d";
        break;
      case "week":
        startDate.setDate(now.getDate() - 30);
        groupFormat = "%Y-%m-%d";
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 12);
        groupFormat = "%Y-%m";
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 5);
        groupFormat = "%Y";
        break;
    }

    const trends = await Report.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return trends;
  }

  /**
   * 自動隱藏被舉報的內容
   */
  private async autoHideReportedContent(): Promise<void> {
    // 獲取被多次舉報的內容
    const reportedContent = await Report.aggregate([
      {
        $match: {
          isDeleted: false,
          reportedContentId: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            contentId: "$reportedContentId",
            contentType: "$contentType",
          },
          reportCount: { $sum: 1 },
        },
      },
      {
        $match: {
          reportCount: { $gte: 3 }, // 3次以上舉報
        },
      },
    ]);

    // 隱藏被多次舉報的內容
    for (const item of reportedContent) {
      const { contentId, contentType } = item._id;

      switch (contentType) {
        case "comment":
          await Comment.findByIdAndUpdate(contentId, { isHidden: true });
          break;
        case "review":
          await Review.findByIdAndUpdate(contentId, { isHidden: true });
          break;
        // 其他內容類型的處理...
      }
    }
  }
}

export const reportService = new ReportService();
