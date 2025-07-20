// 重構後的智能通知服務 - 模組化架構
// 原始文件已備份為 smartNotificationService-backup.ts

export {
  SmartNotificationService,
  smartNotificationService,
  AIMatchingService,
  GeofenceService,
  ReminderService,
  NotificationStatisticsService,
  SmartNotificationConfig,
  AIMatchingConfig,
  GeofenceConfig,
  GeofenceArea,
  ReminderConfig,
  SmartNotificationStats,
  UserNotificationStats
} from './notifications';

// 為了向後兼容，也導出默認實例
import { smartNotificationService } from './notifications';
export default smartNotificationService;