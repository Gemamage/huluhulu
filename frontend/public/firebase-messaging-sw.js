// Firebase Cloud Messaging Service Worker
// 此檔案必須放在 public 目錄下，用於處理背景推播通知

// 導入 Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 配置 - 請替換為您的實際配置
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 獲取 Firebase Messaging 實例
const messaging = firebase.messaging();

// 處理背景消息
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || '呼嚕寵物協尋';
  const notificationOptions = {
    body: payload.notification?.body || '您有新的通知',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: {
      ...payload.data,
      click_action: payload.notification?.click_action || '/notifications'
    },
    actions: [
      {
        action: 'view',
        title: '查看',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: '關閉',
        icon: '/icon-close.png'
      }
    ],
    requireInteraction: payload.data?.priority === 'high',
    silent: false,
    vibrate: [200, 100, 200]
  };

  // 顯示通知
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 處理通知點擊事件
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  const clickAction = event.notification.data?.click_action || '/notifications';
  const action = event.action;
  
  if (action === 'dismiss') {
    // 用戶選擇關閉通知，不執行任何操作
    return;
  }
  
  // 處理通知點擊
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 檢查是否已有打開的窗口
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // 如果有打開的窗口，聚焦並導航到目標頁面
          client.focus();
          return client.navigate(clickAction);
        }
      }
      
      // 如果沒有打開的窗口，打開新窗口
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// 處理通知關閉事件
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed.');
  
  // 可以在這裡記錄通知關閉的統計信息
  const notificationData = event.notification.data;
  if (notificationData?.notificationId) {
    // 發送統計信息到服務器（可選）
    fetch('/api/notifications/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: notificationData.notificationId,
        action: 'closed',
        timestamp: Date.now()
      })
    }).catch(err => console.log('Failed to send notification stats:', err));
  }
});

// 處理推送事件（用於自定義推送）
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received.');
  
  if (!event.data) {
    return;
  }
  
  try {
    const payload = event.data.json();
    const title = payload.title || '呼嚕寵物協尋';
    const options = {
      body: payload.body || '您有新的通知',
      icon: payload.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: payload.tag || 'general',
      data: payload.data || {},
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200]
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
  }
});

// Service Worker 安裝事件
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing.');
  
  // 跳過等待，立即激活新的 Service Worker
  self.skipWaiting();
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating.');
  
  // 立即控制所有客戶端
  event.waitUntil(self.clients.claim());
});

// 處理消息事件（用於與主線程通信）
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 錯誤處理
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});