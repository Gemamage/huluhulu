'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  if (!token) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4'>
        <Card className='w-full max-w-md mx-auto'>
          <CardContent className='flex flex-col items-center justify-center py-8 space-y-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <AlertCircle className='h-6 w-6 text-red-600' />
            </div>
            <div className='text-center space-y-2'>
              <h2 className='text-xl font-semibold'>無效的重設連結</h2>
              <p className='text-sm text-muted-foreground'>
                重設密碼連結無效或已過期，請重新申請密碼重設。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4'>
      <ResetPasswordForm token={token} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4'>
          <Card className='w-full max-w-md mx-auto'>
            <CardContent className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
