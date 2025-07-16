// Firebase Cloud Messaging Service Worker
// 簡化版本用於測試和調試

console.log('[firebase-messaging-sw.js] Service Worker script loaded');

// 導入 Firebase SDK - 使用最新版本
try {
  console.log('[firebase-messaging-sw.js] Loading Firebase SDK...');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
  console.log('[firebase-messaging-sw.js] Firebase SDK loaded successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to load Firebase SDK:', error);
  // 不要拋出錯誤，而是優雅地處理
  console.warn('[firebase-messaging-sw.js] Service Worker will continue without Firebase messaging');
}

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyAeDAcAvq_bWMCzEOb4ZKYN1FfyA2SWkqY",
  authDomain: "pet-find-4ce00.firebaseapp.com",
  projectId: "pet-find-4ce00",
  storageBucket: "pet-find-4ce00.firebasestorage.app",
  messagingSenderId: "1002054218017",
  appId: "1:1002054218017:web:2a0e988b59a191371c4e60"
};

// 初始化 Firebase
let messaging;

try {
  console.log('[firebase-messaging-sw.js] Initializing Firebase...');
  
  // 檢查 Firebase 是否已載入
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK not loaded');
  }
  
  // 檢查是否已經初始化
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
  } else {
    console.log('[firebase-messaging-sw.js] Firebase already initialized');
  }
  
  // 獲取 Firebase Messaging 實例
  messaging = firebase.messaging();
  console.log('[firebase-messaging-sw.js] Firebase Messaging initialized');
  
} catch (error) {
  console.error('[firebase-messaging-sw.js] Firebase initialization failed:', error);
  // 不要拋出錯誤，讓 Service Worker 繼續運行
  console.warn('[firebase-messaging-sw.js] Service Worker will continue without Firebase messaging');
  messaging = null;
}

// 處理背景消息
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || '呼嚕寵物協尋';
    const notificationOptions = {
      body: payload.notification?.body || '您有新的通知',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('[firebase-messaging-sw.js] Messaging not initialized');
}

// Service Worker 基本事件
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// 錯誤處理
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});

console.log('[firebase-messaging-sw.js] Service Worker script execution completed');