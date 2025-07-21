// 簡單測試寵物路由導入
console.log('開始測試寵物路由導入...');

try {
  console.log('1. 導入 Pet 模型...');
  const { Pet } = require('./src/models/Pet');
  console.log('✓ Pet 模型導入成功');
  
  console.log('2. 導入 SearchHistory 模型...');
  const { SearchHistory } = require('./src/models/SearchHistory');
  console.log('✓ SearchHistory 模型導入成功');
  
  console.log('3. 導入驗證工具...');
  const validation = require('./src/utils/validation');
  console.log('✓ 驗證工具導入成功');
  
  console.log('4. 導入錯誤處理...');
  const errors = require('./src/utils/errors');
  console.log('✓ 錯誤處理導入成功');
  
  console.log('5. 導入中介軟體...');
  const auth = require('./src/middleware/auth');
  console.log('✓ 認證中介軟體導入成功');
  
  const rbac = require('./src/middleware/rbac');
  console.log('✓ RBAC 中介軟體導入成功');
  
  const errorHandler = require('./src/middleware/error-handler');
  console.log('✓ 錯誤處理中介軟體導入成功');
  
  console.log('6. 導入寵物路由...');
  const { petRoutes } = require('./src/routes/pets');
  console.log('✓ 寵物路由導入成功');
  
  console.log('\n🎉 所有導入測試通過！');
  
} catch (error) {
  console.error('❌ 導入失敗:', error instanceof Error ? error.message : String(error));
  console.error('錯誤堆疊:', error instanceof Error ? error.stack : String(error));
  process.exit(1);
}