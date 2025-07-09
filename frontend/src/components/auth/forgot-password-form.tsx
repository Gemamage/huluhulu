'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ValidationRules } from '@/utils/validation';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { forgotPassword } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '請輸入電子郵件';
    } else if (!ValidationRules.email.test(email)) {
      newErrors.email = '請輸入有效的電子郵件格式';
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
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      // 錯誤已在 AuthContext 中處理
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    // 清除錯誤
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">郵件已發送</CardTitle>
          <CardDescription>
            我們已將密碼重設連結發送到您的電子郵件
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>請檢查您的電子郵件信箱：</p>
            <p className="font-medium text-foreground">{email}</p>
            <p>如果您沒有收到郵件，請檢查垃圾郵件資料夾。</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {onBack && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回登入
              </Button>
              
              <Separator />
              
              <div className="text-center text-sm text-muted-foreground">
                沒有收到郵件？{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  重新發送
                </button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">忘記密碼</CardTitle>
        <CardDescription className="text-center">
          輸入您的電子郵件地址，我們將發送密碼重設連結給您
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="請輸入您的電子郵件"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>我們將發送一封包含密碼重設連結的郵件到您的信箱。</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? '發送中...' : '發送重設連結'}
          </Button>

          {onBack && (
            <>
              <Separator />
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={onBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回登入
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}