'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-6'>
          <Link
            href='/auth/login'
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            返回登入
          </Link>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-8'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>忘記密碼</h1>
            <p className='text-gray-600'>
              輸入您的電子郵件地址，我們將發送重設密碼的連結給您
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
