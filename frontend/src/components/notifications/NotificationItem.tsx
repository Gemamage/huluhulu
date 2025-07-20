// 通知項目組件
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Check, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import {
  NotificationData,
  NotificationPriority,
} from '../../types/notification';

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
  icon?: string;
  typeText?: string;
  showActions?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClick,
  icon,
  typeText,
  showActions = true,
}) => {
  const isUnread = notification.status === 'unread';

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityText = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '普通';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }

    // 如果是未讀通知，點擊後標記為已讀
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        isUnread && 'bg-blue-50 border-l-4 border-l-blue-500'
      )}
      onClick={handleClick}
    >
      <div className='flex items-start gap-3'>
        {/* 圖標 */}
        <div className='flex-shrink-0'>
          {icon ? (
            <span className='text-2xl'>{icon}</span>
          ) : (
            <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
              <span className='text-primary text-sm font-medium'>
                {notification.type.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 內容 */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              {/* 標題和類型 */}
              <div className='flex items-center gap-2 mb-1'>
                <h4
                  className={cn(
                    'text-sm font-medium truncate',
                    isUnread ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {notification.title}
                </h4>
                {typeText && (
                  <Badge variant='outline' className='text-xs'>
                    {typeText}
                  </Badge>
                )}
                <Badge
                  variant={getPriorityColor(notification.priority)}
                  className='text-xs'
                >
                  {getPriorityText(notification.priority)}
                </Badge>
              </div>

              {/* 消息內容 */}
              <p
                className={cn(
                  'text-sm line-clamp-2',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {notification.message}
              </p>

              {/* 時間 */}
              <p className='text-xs text-muted-foreground mt-1'>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: zhTW,
                })}
              </p>
            </div>

            {/* 操作按鈕 */}
            {showActions && (
              <div className='flex items-center gap-1 flex-shrink-0'>
                {notification.actionUrl && (
                  <Button
                    onClick={handleActionClick}
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                  >
                    <ExternalLink className='h-4 w-4' />
                  </Button>
                )}
                {isUnread && (
                  <Button
                    onClick={handleMarkAsRead}
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                  >
                    <Check className='h-4 w-4' />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 額外數據顯示 */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className='mt-2 p-2 bg-muted/30 rounded text-xs'>
              {notification.data.petName && (
                <span className='inline-block mr-2'>
                  寵物: {notification.data.petName}
                </span>
              )}
              {notification.data.location && (
                <span className='inline-block mr-2'>
                  地點: {notification.data.location}
                </span>
              )}
              {notification.data.matchScore && (
                <span className='inline-block mr-2'>
                  匹配度: {notification.data.matchScore}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
