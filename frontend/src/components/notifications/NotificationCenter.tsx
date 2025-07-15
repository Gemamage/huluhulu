// 通知中心主組件
import React, { useState } from 'react';
import { Bell, Settings, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NotificationList } from './NotificationList';
import { NotificationSettings } from './NotificationSettings';
import { NotificationStats } from './NotificationStats';
import { useNotificationStats } from '../../hooks/useNotifications';

interface NotificationCenterProps {
  defaultTab?: 'notifications' | 'settings' | 'stats';
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  defaultTab = 'notifications',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { stats } = useNotificationStats();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              通知中心
              {stats && stats.unreadCount > 0 && (
                <Badge variant="destructive">
                  {stats.unreadCount}
                </Badge>
              )}
            </CardTitle>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                關閉
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                通知
                {stats && stats.unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                統計
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                設定
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="mt-6">
              <NotificationList 
                showHeader={false}
                maxHeight="600px"
                onSettingsClick={() => setActiveTab('settings')}
              />
            </TabsContent>
            
            <TabsContent value="stats" className="mt-6">
              <NotificationStats />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <NotificationSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};