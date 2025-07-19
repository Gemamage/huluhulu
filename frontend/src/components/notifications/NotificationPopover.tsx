'use client';
// 通知彈出組件
import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { NotificationList } from './NotificationList';
import { useNotificationStats } from '../../hooks/useNotifications';

interface NotificationPopoverProps {
  onSettingsClick?: () => void;
  onViewAllClick?: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  onSettingsClick,
  onViewAllClick
}) => {
  const [open, setOpen] = useState(false);
  const { stats } = useNotificationStats();

  const unreadCount = stats?.unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {onSettingsClick && (
                <Button
                  onClick={() => {
                    onSettingsClick();
                    setOpen(false);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-hidden">
          <NotificationList 
            showHeader={false}
            maxHeight="320px"
          />
        </div>
        
        {onViewAllClick && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                onClick={() => {
                  onViewAllClick();
                  setOpen(false);
                }}
                variant="ghost"
                className="w-full text-sm"
              >
                查看全部通知
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};