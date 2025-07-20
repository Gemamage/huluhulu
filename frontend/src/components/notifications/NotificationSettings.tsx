// 通知設定組件
import React from 'react';
import { Settings, Mail, Smartphone, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

import { useNotificationPreferences } from '../../hooks/useNotifications';
import { NotificationPreferences } from '../../types/notification';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onClose,
}) => {
  const { preferences, loading, error, updating, updatePreferences } =
    useNotificationPreferences();

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleChannelToggle = (
    channel: 'push' | 'email' | 'sms',
    enabled: boolean
  ) => {
    if (!preferences) return;

    const updatedChannels = {
      ...preferences.channels,
      [channel]: enabled,
    };

    updatePreferences({ channels: updatedChannels });
  };

  const handleTypeToggle = (type: string, enabled: boolean) => {
    if (!preferences) return;

    const updatedTypes = {
      ...preferences.types,
      [type]: enabled,
    };

    updatePreferences({ types: updatedTypes });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            通知設定
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

  if (error || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            通知設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-destructive mb-4'>{error || '載入設定失敗'}</p>
            <Button onClick={() => window.location.reload()} variant='outline'>
              重新載入
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            通知設定
          </CardTitle>
          {onClose && (
            <Button onClick={onClose} variant='ghost' size='sm'>
              關閉
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 全域設定 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>全域設定</h3>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label className='text-base'>啟用通知</Label>
              <p className='text-sm text-muted-foreground'>
                開啟或關閉所有通知功能
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={checked => handleToggle('enabled', checked)}
              disabled={updating}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label className='text-base'>免打擾模式</Label>
              <p className='text-sm text-muted-foreground'>
                在指定時間內不接收通知
              </p>
            </div>
            <Switch
              checked={preferences.doNotDisturb}
              onCheckedChange={checked => handleToggle('doNotDisturb', checked)}
              disabled={updating}
            />
          </div>
        </div>

        <Separator />

        {/* 通知渠道 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>通知渠道</h3>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Smartphone className='h-5 w-5 text-muted-foreground' />
              <div className='space-y-0.5'>
                <Label className='text-base'>推播通知</Label>
                <p className='text-sm text-muted-foreground'>
                  在設備上顯示即時通知
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.channels.push}
              onCheckedChange={checked => handleChannelToggle('push', checked)}
              disabled={updating || !preferences.enabled}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Mail className='h-5 w-5 text-muted-foreground' />
              <div className='space-y-0.5'>
                <Label className='text-base'>電子郵件</Label>
                <p className='text-sm text-muted-foreground'>
                  透過電子郵件接收通知
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.channels.email}
              onCheckedChange={checked => handleChannelToggle('email', checked)}
              disabled={updating || !preferences.enabled}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Volume2 className='h-5 w-5 text-muted-foreground' />
              <div className='space-y-0.5'>
                <Label className='text-base'>簡訊通知</Label>
                <p className='text-sm text-muted-foreground'>
                  透過簡訊接收重要通知
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.channels.sms}
              onCheckedChange={checked => handleChannelToggle('sms', checked)}
              disabled={updating || !preferences.enabled}
            />
          </div>
        </div>

        <Separator />

        {/* 通知類型 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>通知類型</h3>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>🐾</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>寵物配對</Label>
                  <p className='text-sm text-muted-foreground'>
                    當找到可能的寵物配對時通知
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.pet_match}
                onCheckedChange={checked =>
                  handleTypeToggle('pet_match', checked)
                }
                disabled={updating || !preferences.enabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>🎉</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>寵物找到</Label>
                  <p className='text-sm text-muted-foreground'>
                    當寵物被找到時通知
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.pet_found}
                onCheckedChange={checked =>
                  handleTypeToggle('pet_found', checked)
                }
                disabled={updating || !preferences.enabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>🚨</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>寵物走失</Label>
                  <p className='text-sm text-muted-foreground'>
                    當有新的走失寵物報告時通知
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.pet_lost}
                onCheckedChange={checked =>
                  handleTypeToggle('pet_lost', checked)
                }
                disabled={updating || !preferences.enabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>📍</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>地理圍欄</Label>
                  <p className='text-sm text-muted-foreground'>
                    當在指定區域發現相關活動時通知
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.geofence}
                onCheckedChange={checked =>
                  handleTypeToggle('geofence', checked)
                }
                disabled={updating || !preferences.enabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>⏰</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>提醒</Label>
                  <p className='text-sm text-muted-foreground'>
                    定期提醒和重要事項通知
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.reminder}
                onCheckedChange={checked =>
                  handleTypeToggle('reminder', checked)
                }
                disabled={updating || !preferences.enabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>🔔</span>
                <div className='space-y-0.5'>
                  <Label className='text-base'>系統通知</Label>
                  <p className='text-sm text-muted-foreground'>
                    系統更新和重要公告
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.types.system}
                onCheckedChange={checked => handleTypeToggle('system', checked)}
                disabled={updating || !preferences.enabled}
              />
            </div>
          </div>
        </div>

        {/* 狀態指示 */}
        {updating && (
          <div className='flex items-center justify-center py-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
              正在更新設定...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
