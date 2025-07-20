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
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  validateUserLogin,
  convertValidationErrors,
  ValidationResult,
} from '@/utils/validation';
import Link from 'next/link';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  redirectTo?: string;
}

export function LoginForm({
  onSwitchToRegister,
  redirectTo = '/',
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const validationResult: ValidationResult = validateUserLogin(formData);

    if (!validationResult.isValid) {
      const newErrors = convertValidationErrors(validationResult.errors);
      setErrors(newErrors);
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
      await login(formData.email, formData.password);
      router.push(redirectTo);
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

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-center'>登入</CardTitle>
        <CardDescription className='text-center'>
          歡迎回到呼嚕寵物協尋
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>電子郵件</Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                placeholder='請輸入您的電子郵件'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className='text-sm text-red-500'>{errors.email}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>密碼</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='請輸入您的密碼'
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
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
          </div>

          <div className='flex justify-end'>
            <Link
              href='/auth/forgot-password'
              className='text-sm text-primary hover:underline'
            >
              忘記密碼？
            </Link>
          </div>
        </CardContent>

        <CardFooter className='flex flex-col space-y-4'>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </Button>

          {onSwitchToRegister && (
            <>
              <Separator />
              <div className='text-center text-sm text-muted-foreground'>
                還沒有帳號？{' '}
                <button
                  type='button'
                  onClick={onSwitchToRegister}
                  className='text-primary hover:underline font-medium'
                  disabled={isLoading}
                >
                  立即註冊
                </button>
              </div>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
