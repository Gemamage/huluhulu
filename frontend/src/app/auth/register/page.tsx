'use client';

import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <Link
            href='/'
            className='text-2xl font-bold text-orange-600 hover:text-orange-700'
          >
            呼嚕寵物協尋
          </Link>
        </div>
        <RegisterForm />
        <div className='mt-6 text-center'>
          <Link
            href='/auth/login'
            className='text-sm text-gray-600 hover:text-gray-900'
          >
            已經有帳號？立即登入
          </Link>
        </div>
      </div>
    </div>
  );
}
