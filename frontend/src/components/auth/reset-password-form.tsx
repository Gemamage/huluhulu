'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

import {
  validateNewPassword,
  convertValidationErrors,
  ValidationResult,
} from '@/utils/validation';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const validationResult: ValidationResult = validateNewPassword(formData);

    if (!validationResult.isValid) {
      const newErrors = convertValidationErrors(validationResult.errors);

      // 額外的前端特定驗證
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '密碼確認不一致';
      }

      setErrors(newErrors);
      return false;
    }

    // 檢查額外的前端特定驗證
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: '密碼確認不一致' });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
      // 3秒後自動跳轉到登入頁面
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      // 錯誤已在 AuthContext 中處理
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

  if (isSuccess) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle className='text-2xl font-bold'>密碼重設成功</CardTitle>
          <CardDescription>
            您的密碼已成功重設，即將跳轉到登入頁面
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='text-center text-sm text-muted-foreground space-y-2'>
            <p>您現在可以使用新密碼登入您的帳號。</p>
            <p>頁面將在 3 秒後自動跳轉...</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button className='w-full' onClick={() => router.push('/auth/login')}>
            立即登入
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-center'>
          重設密碼
        </CardTitle>
        <CardDescription className='text-center'>
          請輸入您的新密碼
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='password'>新密碼</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='請輸入新密碼（至少 8 個字符）'
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='text-sm text-red-500'>{errors.password}</p>
            )}
            <div className='text-xs text-muted-foreground'>
              密碼必須包含至少一個小寫字母、一個大寫字母和一個數字
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>確認新密碼</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='請再次輸入新密碼'
                value={formData.confirmPassword}
                onChange={e =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='text-sm text-red-500'>{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? '重設中...' : '重設密碼'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
