'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Save,
  Loader2,
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { ValidationRules } from '@/utils/validation';

export function UserProfile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (!user) {
    return (
      <Card className='w-full max-w-2xl mx-auto'>
        <CardContent className='flex items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    } else if (!ValidationRules.name.test(formData.name.trim())) {
      newErrors.name = ValidationRules.name.message;
    }

    if (formData.phone && !ValidationRules.phone.test(formData.phone)) {
      newErrors.phone = ValidationRules.phone.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() ? formData.phone.trim() : undefined,
      });

      await refreshUser();

      toast({
        title: '更新成功',
        description: '個人資料已成功更新',
      });
    } catch (error: any) {
      toast({
        title: '更新失敗',
        description: error.message || '更新個人資料時發生錯誤',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查檔案大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '檔案過大',
        description: '頭像檔案大小不能超過 5MB',
        variant: 'destructive',
      });
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      toast({
        title: '檔案格式錯誤',
        description: '請選擇圖片檔案',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await authService.uploadAvatar(file);
      await refreshUser();

      toast({
        title: '上傳成功',
        description: '頭像已成功更新',
      });
    } catch (error: any) {
      toast({
        title: '上傳失敗',
        description: error.message || '上傳頭像時發生錯誤',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='w-full max-w-2xl mx-auto space-y-6'>
      {/* 個人資料卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
          <CardDescription>管理您的個人資訊和帳號設定</CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* 頭像區域 */}
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='text-lg'>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <Button
                size='sm'
                variant='outline'
                className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0'
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Camera className='h-4 w-4' />
                )}
              </Button>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleAvatarUpload}
                className='hidden'
              />
            </div>

            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>{user.name}</h3>
              <p className='text-sm text-muted-foreground'>{user.email}</p>
              <div className='flex items-center space-x-2'>
                <Badge variant={user.isEmailVerified ? 'default' : 'secondary'}>
                  {user.isEmailVerified ? '已驗證' : '未驗證'}
                </Badge>
                {user.role === 'admin' && (
                  <Badge variant='outline'>管理員</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 編輯表單 */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>姓名 *</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='name'
                    type='text'
                    placeholder='請輸入您的姓名'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className='text-sm text-red-500'>{errors.name}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>手機號碼</Label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='phone'
                    type='tel'
                    placeholder='請輸入您的手機號碼'
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className='text-sm text-red-500'>{errors.phone}</p>
                )}
              </div>
            </div>

            <div className='flex justify-end'>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    更新中...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    儲存變更
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 帳號資訊卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>帳號資訊</CardTitle>
          <CardDescription>您的帳號基本資訊</CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-muted-foreground'>
                電子郵件
              </Label>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{user.email}</span>
                <Badge variant={user.isEmailVerified ? 'default' : 'secondary'}>
                  {user.isEmailVerified ? '已驗證' : '未驗證'}
                </Badge>
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-muted-foreground'>
                註冊日期
              </Label>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {!user.isEmailVerified && (
            <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4 text-yellow-600' />
                <span className='text-sm text-yellow-800'>
                  您的電子郵件尚未驗證，請檢查您的信箱並點擊驗證連結。
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
