// 通知統計組件
import React from 'react';
import {
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useNotificationStats } from '../../hooks/useNotifications';
import { NotificationType } from '../../types/notification';

export const NotificationStats: React.FC = () => {
  const { stats, loading, error, refresh } = useNotificationStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            通知統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            通知統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-destructive mb-4'>{error || '載入統計失敗'}</p>
            <button onClick={refresh} className='text-primary hover:underline'>
              重試
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
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

  const getTypeName = (type: string) => {
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
        return '其他';
    }
  };

  const readPercentage =
    stats.totalCount > 0
      ? Math.round((stats.readCount / stats.totalCount) * 100)
      : 0;

  return (
    <div className='space-y-6'>
      {/* 總覽統計 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Bell className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  總通知數
                </p>
                <p className='text-2xl font-bold'>{stats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  未讀通知
                </p>
                <p className='text-2xl font-bold text-red-600'>
                  {stats.unreadCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <CheckCircle className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  已讀通知
                </p>
                <p className='text-2xl font-bold text-green-600'>
                  {stats.readCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Clock className='h-6 w-6 text-orange-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  今日通知
                </p>
                <p className='text-2xl font-bold text-orange-600'>
                  {stats.todayCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 閱讀進度 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>閱讀進度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>已讀率</span>
              <span>{readPercentage}%</span>
            </div>
            <Progress value={readPercentage} className='h-2' />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>已讀: {stats.readCount}</span>
              <span>總計: {stats.totalCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知類型分布 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>通知類型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Object.entries(stats.typeStats).map(([type, count]) => {
              const percentage =
                stats.totalCount > 0
                  ? Math.round((count / stats.totalCount) * 100)
                  : 0;

              return (
                <div key={type} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>{getTypeIcon(type)}</span>
                      <span className='text-sm font-medium'>
                        {getTypeName(type)}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>{count}</Badge>
                      <span className='text-xs text-muted-foreground'>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className='h-1' />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 最近活動 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>最近活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between py-2'>
              <span className='text-sm text-muted-foreground'>
                今日收到通知
              </span>
              <Badge variant='outline'>{stats.todayCount} 條</Badge>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span className='text-sm text-muted-foreground'>
                本週收到通知
              </span>
              <Badge variant='outline'>{stats.weekCount || 0} 條</Badge>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span className='text-sm text-muted-foreground'>
                本月收到通知
              </span>
              <Badge variant='outline'>{stats.monthCount || 0} 條</Badge>
            </div>
            <div className='flex items-center justify-between py-2'>
              <span className='text-sm text-muted-foreground'>
                最後更新時間
              </span>
              <span className='text-xs text-muted-foreground'>
                {new Date().toLocaleString('zh-TW')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
