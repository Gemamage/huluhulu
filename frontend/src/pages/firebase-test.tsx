// Firebase 測試頁面
import { useEffect, useState } from 'react';
import { getFCMToken, requestNotificationPermission } from '../lib/firebase';

const FirebaseTestPage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testFirebaseConfig = () => {
    console.log('Firebase Config Test:');
    console.log(
      'API Key:',
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing'
    );
    console.log(
      'Auth Domain:',
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing'
    );
    console.log(
      'Project ID:',
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing'
    );
    console.log(
      'Messaging Sender ID:',
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        ? '✓ Set'
        : '✗ Missing'
    );
    console.log(
      'App ID:',
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing'
    );
    console.log(
      'VAPID Key:',
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✓ Set' : '✗ Missing'
    );
  };

  const testNotificationPermission = async () => {
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      console.log('Notification permission:', perm);
    } catch (err) {
      console.error('Permission request failed:', err);
      setError(
        err instanceof Error ? err.message : 'Permission request failed'
      );
    }
  };

  const testFCMToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const fcmToken = await getFCMToken();
      setToken(fcmToken);
      console.log('FCM Token:', fcmToken);
    } catch (err) {
      console.error('FCM Token generation failed:', err);
      setError(
        err instanceof Error ? err.message : 'FCM Token generation failed'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testFirebaseConfig();
  }, []);

  return (
    <div className='container mx-auto p-8'>
      <h1 className='text-3xl font-bold mb-8'>Firebase 測試頁面</h1>

      <div className='space-y-6'>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>環境變數檢查</h2>
          <button
            onClick={testFirebaseConfig}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            檢查 Firebase 配置
          </button>
          <p className='mt-2 text-sm text-gray-600'>
            請查看瀏覽器控制台以獲取詳細信息
          </p>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>通知權限測試</h2>
          <div className='flex items-center space-x-4'>
            <button
              onClick={testNotificationPermission}
              className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
            >
              請求通知權限
            </button>
            <span
              className={`px-3 py-1 rounded text-sm ${
                permission === 'granted'
                  ? 'bg-green-100 text-green-800'
                  : permission === 'denied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              權限狀態: {permission}
            </span>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>FCM Token 測試</h2>
          <button
            onClick={testFCMToken}
            disabled={loading}
            className='bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50'
          >
            {loading ? '生成中...' : '生成 FCM Token'}
          </button>

          {token && (
            <div className='mt-4'>
              <h3 className='font-semibold'>FCM Token:</h3>
              <p className='text-sm bg-gray-100 p-2 rounded break-all'>
                {token}
              </p>
            </div>
          )}

          {error && (
            <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
              <strong>錯誤:</strong> {error}
            </div>
          )}
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Service Worker 狀態</h2>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                  .getRegistrations()
                  .then(registrations => {
                    console.log('Service Worker registrations:', registrations);
                    registrations.forEach(registration => {
                      console.log(
                        'SW:',
                        registration.scope,
                        registration.active?.state
                      );
                    });
                  });
              }
            }}
            className='bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600'
          >
            檢查 Service Worker 狀態
          </button>
          <p className='mt-2 text-sm text-gray-600'>
            請查看瀏覽器控制台以獲取詳細信息
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTestPage;
