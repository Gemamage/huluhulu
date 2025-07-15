'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { useNotificationService } from '@/hooks/useNotifications';

interface ProvidersProps {
  children: React.ReactNode;
}

// 通知服務初始化組件
function NotificationServiceProvider({ children }: { children: React.ReactNode }) {
  useNotificationService();
  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  // 建立 React Query 客戶端
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 資料快取時間 (5 分鐘)
            staleTime: 5 * 60 * 1000,
            // 快取保存時間 (10 分鐘)
            gcTime: 10 * 60 * 1000,
            // 重新聚焦時重新獲取資料
            refetchOnWindowFocus: false,
            // 重試次數
            retry: 1,
            // 重試延遲
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 錯誤重試次數
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute='class'
        defaultTheme='light'
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <NotificationServiceProvider>
            {children}
          </NotificationServiceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}