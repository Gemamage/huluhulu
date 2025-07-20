// useAuth hook
// 這個文件提供前端測試所需的認證 hook

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // 獲取當前用戶
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
    retry: false,
  });

  // 登入
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: data => {
      queryClient.setQueryData(['currentUser'], data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // 註冊
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: data => {
      queryClient.setQueryData(['currentUser'], data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // 登出
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
    },
  });

  // 忘記密碼
  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
  });

  // 重設密碼
  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
  });

  // 驗證電子郵件
  const verifyEmailMutation = useMutation({
    mutationFn: authService.verifyEmail,
  });

  // 更新個人資料
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: data => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  // 更改密碼
  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
  });

  return {
    // 狀態
    user: user || null,
    isLoading,
    error,
    isAuthenticated: !!user,

    // 方法
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: (email: string) =>
      forgotPasswordMutation.mutateAsync({ email }),
    resetPassword: (token: string, password: string, confirmPassword: string) =>
      resetPasswordMutation.mutateAsync({ token, password, confirmPassword }),
    verifyEmail: verifyEmailMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,

    // 載入狀態
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    isResetPasswordLoading: resetPasswordMutation.isPending,
    isVerifyEmailLoading: verifyEmailMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,

    // 錯誤狀態
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
    forgotPasswordError: forgotPasswordMutation.error,
    resetPasswordError: resetPasswordMutation.error,
    verifyEmailError: verifyEmailMutation.error,
    updateProfileError: updateProfileMutation.error,
    changePasswordError: changePasswordMutation.error,
  };
};
