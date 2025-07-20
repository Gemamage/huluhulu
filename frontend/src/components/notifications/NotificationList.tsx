'use client';
// 通知列表組件
import React from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationData, NotificationType } from '../../types/notification';

interface NotificationListProps {
  onSettingsClick?: () => void;
  showHeader?: boolean;
  maxHeight?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onSettingsClick,
  showHeader = true,
  maxHeight = '400px',
}) => {
  const {
    notifications,
    loading,
    error,
    pagination,
    markAsRead,
    markAllAsRead,
    refresh,
    loadMore,
    hasMore,
  } = useNotifications();

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MATCH_FOUND':
      case 'pet_match':
        return '🐾';
      case 'PET_STATUS_UPDATE':
      case 'pet_found':
        return '🎉';
      case 'pet_lost':
        return '🚨';
      case 'GEOFENCE_ALERT':
      case 'geofence':
        return '📍';
      case 'REMINDER':
      case 'reminder':
        return '⏰';
      case 'SYSTEM_ANNOUNCEMENT':
      case 'system':
        return '🔔';
      case 'MESSAGE':
        return '💬';
      case 'COMMENT':
        return '💭';
      default:
        return '📢';
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'MATCH_FOUND':
      case 'pet_match':
        return '寵物配對';
      case 'PET_STATUS_UPDATE':
      case 'pet_found':
        return '寵物找到';
      case 'pet_lost':
        return '寵物走失';
      case 'GEOFENCE_ALERT':
      case 'geofence':
        return '地理圍欄';
      case 'REMINDER':
      case 'reminder':
        return '提醒';
      case 'SYSTEM_ANNOUNCEMENT':
      case 'system':
        return '系統';
      case 'MESSAGE':
        return '訊息';
      case 'COMMENT':
        return '評論';
      default:
        return '通知';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              通知中心
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              通知中心
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-destructive mb-4'>{error}</p>
            <Button onClick={refresh} variant='outline'>
              重試
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              通知中心
              {unreadCount > 0 && (
                <Badge variant='destructive' className='ml-2'>
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className='flex items-center gap-2'>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant='ghost'
                  size='sm'
                  className='text-xs'
                >
                  <CheckCheck className='h-4 w-4 mr-1' />
                  全部已讀
                </Button>
              )}
              {onSettingsClick && (
                <Button onClick={onSettingsClick} variant='ghost' size='sm'>
                  <Settings className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className='p-0'>
        {notifications.length === 0 ? (
          <div className='text-center py-8 px-4'>
            <Bell className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>暫無通知</p>
          </div>
        ) : (
          <ScrollArea className={`w-full`} style={{ maxHeight }}>
            <div className='space-y-1'>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    icon={getNotificationIcon(notification.type)}
                    typeText={getNotificationTypeText(notification.type)}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}

              {hasMore && (
                <div className='p-4 text-center'>
                  <Button
                    onClick={loadMore}
                    variant='ghost'
                    size='sm'
                    disabled={loading}
                  >
                    {loading ? '載入中...' : '載入更多'}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
