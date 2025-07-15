// Firebase 配置和初始化
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase 配置 - 這些值需要從 Firebase Console 獲取
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 初始化 Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase 服務實例
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

// 檢查是否在瀏覽器環境中
const isClient = typeof window !== 'undefined';

// 初始化 Firebase Messaging
if (isClient && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase messaging initialization failed:', error);
  }
}

// 初始化 Firebase Analytics (僅在生產環境)
if (isClient && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Firebase analytics initialization failed:', error);
  }
}

/**
 * 獲取 FCM Token
 * @returns Promise<string | null> FCM Token 或 null
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return null;
  }

  try {
    // VAPID Key 需要從 Firebase Console 獲取
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (token) {
      console.log('FCM Token generated:', token);
      return token;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

/**
 * 設置前景消息監聽器
 * @param callback 收到消息時的回調函數
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return;
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

/**
 * 請求通知權限
 * @returns Promise<NotificationPermission>
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isClient || !('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // 請求權限
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * 檢查通知權限狀態
 * @returns NotificationPermission
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isClient || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * 顯示本地通知
 * @param title 通知標題
 * @param options 通知選項
 */
export const showLocalNotification = (title: string, options?: NotificationOptions) => {
  if (!isClient || !('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });
  }
};

export { app, messaging, analytics };
export default app;