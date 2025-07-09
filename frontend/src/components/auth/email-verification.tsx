'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface EmailVerificationProps {
  token?: string;
  email?: string;
}

export function EmailVerification({ token, email }: EmailVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { verifyEmail, resendVerificationEmail, user } = useAuth();
  const router = useRouter();

  // 倒數計時器
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  // 自動驗證 token
  useEffect(() => {
    if (token && isVerifying) {
      handleVerifyToken(token);
    }
  }, [token]);

  const handleVerifyToken = async (verificationToken: string) => {
    try {
      await verifyEmail(verificationToken);
      setIsSuccess(true);
      setIsError(false);
      // 3秒後自動跳轉
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      setIsError(true);
      setIsSuccess(false);
      setErrorMessage(error.message || '驗證失敗，請重試');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email && !user?.email) {
      setErrorMessage('無法獲取電子郵件地址');
      return;
    }

    setIsResending(true);
    try {
      // 使用新的無需登入的重新發送驗證郵件 API
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email || user?.email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '發送失敗');
      }
      
      setResendCooldown(60); // 60秒冷卻時間
    } catch (error: any) {
      setErrorMessage(error.message || '重新發送失敗，請重試');
    } finally {
      setIsResending(false);
    }
  };

  // 驗證中狀態
  if (isVerifying) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">驗證中</CardTitle>
          <CardDescription>
            正在驗證您的電子郵件，請稍候...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 驗證成功狀態
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">驗證成功</CardTitle>
          <CardDescription>
            您的電子郵件已成功驗證，歡迎加入呼嚕寵物協尋！
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>您現在可以使用所有功能了。</p>
            <p>頁面將在 3 秒後自動跳轉到首頁...</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => router.push('/')}
          >
            前往首頁
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 驗證失敗狀態
  if (isError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">驗證失敗</CardTitle>
          <CardDescription>
            {errorMessage || '電子郵件驗證失敗'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>可能的原因：</p>
            <ul className="text-left space-y-1">
              <li>• 驗證連結已過期</li>
              <li>• 驗證連結已被使用</li>
              <li>• 驗證連結無效</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                重新發送中...
              </>
            ) : resendCooldown > 0 ? (
              `請等待 ${resendCooldown} 秒後重試`
            ) : (
              '重新發送驗證郵件'
            )}
          </Button>
          
          <Separator />
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/auth/login')}
          >
            返回登入
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 預設狀態（等待驗證）
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">驗證您的電子郵件</CardTitle>
        <CardDescription>
          我們已發送驗證連結到您的電子郵件
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>請檢查您的電子郵件信箱：</p>
          {(email || user?.email) && (
            <p className="font-medium text-foreground">{email || user?.email}</p>
          )}
          <p>點擊郵件中的驗證連結來完成註冊。</p>
          <p>如果您沒有收到郵件，請檢查垃圾郵件資料夾。</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button 
          className="w-full" 
          onClick={handleResendEmail}
          disabled={isResending || resendCooldown > 0 || (!email && !user?.email)}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              重新發送中...
            </>
          ) : resendCooldown > 0 ? (
            `請等待 ${resendCooldown} 秒後重試`
          ) : (
            '重新發送驗證郵件'
          )}
        </Button>
        
        <Separator />
        
        <div className="text-center text-sm text-muted-foreground">
          已經驗證過了？{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-primary hover:underline font-medium"
          >
            立即登入
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}