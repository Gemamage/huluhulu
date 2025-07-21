'use client';

import { useAuth } from '@/contexts/auth-context';
import { UserProfile } from '@/components/user/user-profile';
import { ChangePassword } from '@/components/user/change-password';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md mx-auto'>
          <CardContent className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md mx-auto'>
          <CardContent className='flex flex-col items-center justify-center py-8 space-y-4'>
            <p className='text-muted-foreground'>請先登入以查看個人資料</p>
            <Button onClick={() => router.push('/auth/login')}>前往登入</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* 頁面標題和導航 */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回
          </Button>

          <div className='space-y-2'>
            <h1 className='text-3xl font-bold tracking-tight'>個人設定</h1>
            <p className='text-muted-foreground'>管理您的個人資料和帳號設定</p>
          </div>
        </div>

        {/* 主要內容 */}
        <Tabs defaultValue='profile' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-2 max-w-md'>
            <TabsTrigger value='profile'>個人資料</TabsTrigger>
            <TabsTrigger value='security'>安全設定</TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-6'>
            <UserProfile />
          </TabsContent>

          <TabsContent value='security' className='space-y-6'>
            <div className='flex justify-center'>
              <ChangePassword />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
