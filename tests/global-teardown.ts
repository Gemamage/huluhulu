import { FullConfig } from '@playwright/test';

/**
 * 全局測試拆卸
 * 在所有測試完成後執行一次
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 開始 E2E 測試全局清理...');
  
  try {
    // 清理測試數據
    await cleanupTestData();
    
    console.log('✅ 全局清理完成');
  } catch (error) {
    console.warn('⚠️ 全局清理過程中出現錯誤:', error);
  }
}

/**
 * 清理測試數據
 */
async function cleanupTestData() {
  console.log('🗑️ 清理測試數據...');
  
  try {
    // 清理測試用戶創建的寵物數據
    const testEmails = ['test@example.com', 'admin@example.com'];
    
    for (const email of testEmails) {
      try {
        // 登入獲取 token
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: email.includes('admin') ? 'Admin123!' : 'Test123!'
          }),
        });
        
        if (loginResponse.ok) {
          const { token } = await loginResponse.json();
          
          // 獲取用戶的寵物列表並刪除
          const petsResponse = await fetch('http://localhost:5000/api/pets/my-pets', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (petsResponse.ok) {
            const pets = await petsResponse.json();
            
            // 刪除每個寵物
            for (const pet of pets) {
              await fetch(`http://localhost:5000/api/pets/${pet._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
            }
          }
        }
      } catch (error) {
        console.log(`清理用戶 ${email} 的數據時出錯:`, error);
      }
    }
    
    console.log('✅ 測試數據清理完成');
  } catch (error) {
    console.warn('⚠️ 測試數據清理失敗:', error);
  }
}

export default globalTeardown;