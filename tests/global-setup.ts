import { chromium, FullConfig } from '@playwright/test';

/**
 * 全局測試設置
 * 在所有測試開始前執行一次
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 開始 E2E 測試全局設置...');
  
  // 等待服務器啟動
  console.log('⏳ 等待前端和後端服務器啟動...');
  
  // 檢查前端服務器
  await waitForServer('http://localhost:3000', 'Frontend');
  
  // 檢查後端服務器
  await waitForServer('http://localhost:5000/api/health', 'Backend');
  
  // 創建測試用戶和數據
  await setupTestData();
  
  console.log('✅ 全局設置完成');
}

/**
 * 等待服務器啟動
 */
async function waitForServer(url: string, name: string, maxRetries = 30) {
  console.log(`⏳ 等待 ${name} 服務器啟動: ${url}`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        console.log(`✅ ${name} 服務器已啟動`);
        return;
      }
    } catch (error) {
      // 服務器還未啟動，繼續等待
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`❌ ${name} 服務器啟動超時`);
}

/**
 * 設置測試數據
 */
async function setupTestData() {
  console.log('📝 設置測試數據...');
  
  try {
    // 創建測試用戶
    const testUsers = [
      {
        email: 'test@example.com',
        password: 'Test123!',
        name: '測試用戶',
        phone: '0912345678'
      },
      {
        email: 'admin@example.com',
        password: 'Admin123!',
        name: '管理員',
        phone: '0987654321',
        role: 'admin'
      }
    ];
    
    // 發送請求創建測試用戶
    for (const user of testUsers) {
      try {
        await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });
      } catch (error) {
        // 用戶可能已存在，忽略錯誤
        console.log(`用戶 ${user.email} 可能已存在`);
      }
    }
    
    console.log('✅ 測試數據設置完成');
  } catch (error) {
    console.warn('⚠️ 測試數據設置失敗，將在測試中動態創建:', error);
  }
}

export default globalSetup;