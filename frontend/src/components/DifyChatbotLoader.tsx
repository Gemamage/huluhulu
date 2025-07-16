'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

/**
 * Dify 聊天機器人載入器元件
 * 負責動態設定聊天機器人的用戶資訊
 */
export default function DifyChatbotLoader() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // 設定 Dify 聊天機器人配置
    if (typeof window !== 'undefined') {
      window.difyChatbotConfig = {
        token: 'FKpA4O7UI8g4LQaf',
        systemVariables: {
          // 如果用戶已登入，傳遞用戶 ID
          ...(isAuthenticated && user?._id && { user_id: user._id })
        },
        userVariables: {
          // 如果用戶已登入，傳遞用戶姓名
          ...(isAuthenticated && user?.firstName && user?.lastName && {
            name: `${user.firstName} ${user.lastName}`
          })
        }
      };
    }
  }, [user, isAuthenticated]);

  return null; // 這個元件不渲染任何內容
}

// 擴展 Window 介面以支援 difyChatbotConfig
declare global {
  interface Window {
    difyChatbotConfig: {
      token: string;
      systemVariables?: {
        user_id?: string;
      };
      userVariables?: {
        name?: string;
      };
    };
  }
}