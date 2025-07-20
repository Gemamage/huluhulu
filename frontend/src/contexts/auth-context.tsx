'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authService, User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfile: (data: { name: string; phone?: string }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 檢查認證狀態
  const checkAuthStatus = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 登入
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await authService.login({ email, password });
      setUser(result.user);

      toast({
        title: '登入成功',
        description: `歡迎回來，${result.user.name}！`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '登入失敗';
      toast({
        title: '登入失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 註冊
  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    try {
      setIsLoading(true);
      const result = await authService.register({
        email,
        password,
        name,
        phone: phone || undefined,
      });
      setUser(result.user);

      toast({
        title: '註冊成功',
        description: '歡迎加入呼嚕寵物協尋！請檢查您的電子郵件以驗證帳號。',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '註冊失敗';
      toast({
        title: '註冊失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);

      toast({
        title: '已登出',
        description: '您已成功登出。',
      });
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使登出請求失敗，也要清除本地狀態
      setUser(null);
    }
  };

  // 刷新用戶資訊
  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('刷新用戶資訊失敗:', error);
      setUser(null);
    }
  };

  // 忘記密碼
  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);

      toast({
        title: '郵件已發送',
        description: '請檢查您的電子郵件以重設密碼。',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '發送重設密碼郵件失敗';
      toast({
        title: '發送失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 重設密碼
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword({ token, newPassword });

      toast({
        title: '密碼重設成功',
        description: '您的密碼已成功重設，請使用新密碼登入。',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '重設密碼失敗';
      toast({
        title: '重設失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 驗證電子郵件
  const verifyEmail = async (token: string) => {
    try {
      await authService.verifyEmail(token);

      // 刷新用戶資訊以更新驗證狀態
      await refreshUser();

      toast({
        title: '電子郵件驗證成功',
        description: '您的電子郵件已成功驗證。',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '電子郵件驗證失敗';
      toast({
        title: '驗證失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 重新發送驗證郵件
  const resendVerificationEmail = async () => {
    try {
      await authService.resendVerificationEmail();

      toast({
        title: '驗證郵件已發送',
        description: '請檢查您的電子郵件以驗證帳號。',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '發送驗證郵件失敗';
      toast({
        title: '發送失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 更新個人資料
  const updateProfile = async (data: { name: string; phone?: string }) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);

      toast({
        title: '個人資料更新成功',
        description: '您的個人資料已成功更新。',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '更新個人資料失敗';
      toast({
        title: '更新失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 更改密碼
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await authService.changePassword(currentPassword, newPassword);

      toast({
        title: '密碼更改成功',
        description: '您的密碼已成功更改。',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '更改密碼失敗';
      toast({
        title: '更改失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 上傳頭像
  const uploadAvatar = async (file: File) => {
    try {
      const updatedUser = await authService.uploadAvatar(file);
      setUser(updatedUser);

      toast({
        title: '頭像上傳成功',
        description: '您的頭像已成功更新。',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '上傳頭像失敗';
      toast({
        title: '上傳失敗',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 自動刷新令牌
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (authService.isAuthenticated()) {
          authService.autoRefreshToken().catch(console.error);
        }
      },
      5 * 60 * 1000
    ); // 每 5 分鐘檢查一次

    return () => clearInterval(interval);
  }, []);

  // 初始化認證狀態
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && authService.isAuthenticated(),
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    updateProfile,
    changePassword,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
