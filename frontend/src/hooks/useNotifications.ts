'use client';
// 通知相關的 React Hook
import { useState, useEffect, useCallback } from 'react';
import {
  NotificationData,
  NotificationStats,
  NotificationPreferences,
  NotificationQuery,
  RealtimeNotificationData,
  NotificationStatus,
} from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useToast } from './use-toast';

/**
 * 通知列表 Hook
 */
export const useNotifications = (query: NotificationQuery = {}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getNotifications({
        page: pagination.page,
        limit: pagination.limit,
        ...query,
      });

      if (response.success && response.data) {
        setNotifications(
          Array.isArray(response.data) ? response.data : [response.data]
        );
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取通知失敗');
    } finally {
      setLoading(false);
    }
  }, [query, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      // 更新本地狀態
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // 更新本地狀態
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          status: NotificationStatus.READ,
        }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, pagination.totalPages]);

  return {
    notifications,
    loading,
    error,
    pagination,
    markAsRead,
    markAllAsRead,
    refresh,
    loadMore,
    hasMore: pagination.page < pagination.totalPages,
  };
};

/**
 * 通知統計 Hook
 */
export const useNotificationStats = () => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取統計失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
};

/**
 * 通知偏好設定 Hook
 */
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const preferencesData = await notificationService.getPreferences();
      setPreferences(preferencesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取偏好設定失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        setUpdating(true);
        await notificationService.updatePreferences(newPreferences);

        // 更新本地狀態
        setPreferences(prev => (prev ? { ...prev, ...newPreferences } : null));

        toast({
          title: '設定已更新',
          description: '通知偏好設定已成功更新',
        });
      } catch (err) {
        toast({
          title: '更新失敗',
          description: err instanceof Error ? err.message : '更新偏好設定失敗',
          variant: 'destructive',
        });
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  return {
    preferences,
    loading,
    error,
    updating,
    updatePreferences,
    refresh: fetchPreferences,
  };
};

/**
 * 即時通知 Hook
 */
export const useRealtimeNotifications = () => {
  const [realtimeNotifications, setRealtimeNotifications] = useState<
    RealtimeNotificationData[]
  >([]);
  const { toast } = useToast();

  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === 'undefined') return;

    // 監聽即時通知事件
    const handleRealtimeNotification = (
      event: CustomEvent<RealtimeNotificationData>
    ) => {
      const notification = event.detail;

      // 添加到即時通知列表
      setRealtimeNotifications(prev => [notification, ...prev.slice(0, 9)]); // 保持最新 10 條

      // 顯示 Toast 通知
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };

    window.addEventListener(
      'realtimeNotification',
      handleRealtimeNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'realtimeNotification',
        handleRealtimeNotification as EventListener
      );
    };
  }, [toast]);

  const clearRealtimeNotifications = useCallback(() => {
    setRealtimeNotifications([]);
  }, []);

  const removeRealtimeNotification = useCallback((notificationId: string) => {
    setRealtimeNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  return {
    realtimeNotifications,
    clearRealtimeNotifications,
    removeRealtimeNotification,
  };
};

/**
 * 通知服務初始化 Hook
 */
export const useNotificationService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeService = async () => {
      try {
        await notificationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        setInitError(
          error instanceof Error ? error.message : '初始化通知服務失敗'
        );
      }
    };

    initializeService();

    // 清理函數
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return {
    isInitialized,
    initError,
  };
};
