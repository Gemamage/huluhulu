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
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  validateUserRegistration,
  convertValidationErrors,
  ValidationResult,
} from '@/utils/validation';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  redirectTo?: string;
}

export function RegisterForm({
  onSwitchToLogin,
  redirectTo = '/',
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const validationResult: ValidationResult =
      validateUserRegistration(formData);

    if (!validationResult.isValid) {
      const newErrors = convertValidationErrors(validationResult.errors);

      // 額外的前端特定驗證
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '確認密碼與密碼不一致';
      }

      if (!acceptTerms) {
        newErrors.terms = '請同意服務條款和隱私政策';
      }

      setErrors(newErrors);
      return false;
    }

    // 檢查額外的前端特定驗證
    const extraErrors: Record<string, string> = {};

    if (formData.password !== formData.confirmPassword) {
      extraErrors.confirmPassword = '確認密碼與密碼不一致';
    }

    if (!acceptTerms) {
      extraErrors.terms = '請同意服務條款和隱私政策';
    }

    if (Object.keys(extraErrors).length > 0) {
      setErrors(extraErrors);
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
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
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
        <CardTitle className='text-2xl font-bold text-center'>註冊</CardTitle>
        <CardDescription className='text-center'>
          加入呼嚕寵物協尋，幫助更多毛孩回家
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-4'>
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
            <Label htmlFor='email'>電子郵件 *</Label>
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
            <Label htmlFor='phone'>手機號碼</Label>
            <div className='relative'>
              <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='phone'
                type='tel'
                placeholder='請輸入您的手機號碼（選填）'
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

          <div className='space-y-2'>
            <Label htmlFor='password'>密碼 *</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='請輸入密碼（至少 8 個字符）'
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

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>確認密碼 *</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='請再次輸入密碼'
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

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='terms'
              checked={acceptTerms}
              onCheckedChange={checked => {
                setAcceptTerms(checked as boolean);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              disabled={isLoading}
            />
            <Label htmlFor='terms' className='text-sm'>
              我同意{' '}
              <a
                href='/terms'
                className='text-primary hover:underline'
                target='_blank'
              >
                服務條款
              </a>{' '}
              和{' '}
              <a
                href='/privacy'
                className='text-primary hover:underline'
                target='_blank'
              >
                隱私政策
              </a>
            </Label>
          </div>
          {errors.terms && (
            <p className='text-sm text-red-500'>{errors.terms}</p>
          )}
        </CardContent>

        <CardFooter className='flex flex-col space-y-4'>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? '註冊中...' : '註冊'}
          </Button>

          {onSwitchToLogin && (
            <>
              <Separator />
              <div className='text-center text-sm text-muted-foreground'>
                已經有帳號？{' '}
                <button
                  type='button'
                  onClick={onSwitchToLogin}
                  className='text-primary hover:underline font-medium'
                  disabled={isLoading}
                >
                  立即登入
                </button>
              </div>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
