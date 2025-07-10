/**
 * AI 功能整合測試腳本
 * 測試後端 AI 服務的完整流程
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3001';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-images');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 創建測試圖像目錄和範例圖像
function createTestImages() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    fs.mkdirSync(TEST_IMAGE_PATH, { recursive: true });
    logInfo('創建測試圖像目錄');
  }

  // 創建一個簡單的測試圖像（1x1 像素的 PNG）
  const testImageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  const testImagePath = path.join(TEST_IMAGE_PATH, 'test-pet.png');
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, testImageData);
    logInfo('創建測試圖像文件');
  }

  return testImagePath;
}

// 檢查環境配置
function checkEnvironment() {
  log('\n🔍 檢查環境配置...', 'cyan');
  
  const requiredEnvVars = [
    'GOOGLE_VISION_PROJECT_ID',
    'GOOGLE_VISION_KEY_PATH'
  ];

  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    logWarning('.env 文件不存在，請確保已正確配置環境變數');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = requiredEnvVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=`)
  );

  if (missingVars.length > 0) {
    logWarning(`缺少環境變數: ${missingVars.join(', ')}`);
    return false;
  }

  logSuccess('環境配置檢查通過');
  return true;
}

// 測試伺服器連線
async function testServerConnection() {
  log('\n🌐 測試伺服器連線...', 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      logSuccess('伺服器連線正常');
      return true;
    } else {
      logError(`伺服器回應異常: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`無法連接到伺服器: ${error.message}`);
    logInfo('請確保後端伺服器正在運行 (npm run dev)');
    return false;
  }
}

// 測試圖像分析功能
async function testImageAnalysis(imagePath) {
  log('\n🧠 測試圖像分析功能...', 'cyan');
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    
    const response = await axios.post(`${BASE_URL}/api/ai/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('圖像分析功能正常');
      logInfo(`檢測到 ${response.data.data.labels.length} 個標籤`);
      logInfo(`檢測到 ${response.data.data.objects.length} 個物件`);
      
      if (response.data.data.breedPrediction) {
        logInfo(`品種預測: ${response.data.data.breedPrediction.breed} (${(response.data.data.breedPrediction.confidence * 100).toFixed(1)}%)`);
      }
      
      return true;
    } else {
      logError('圖像分析功能異常');
      return false;
    }
  } catch (error) {
    logError(`圖像分析測試失敗: ${error.message}`);
    if (error.response) {
      logError(`伺服器回應: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 測試圖像優化功能
async function testImageOptimization(imagePath) {
  log('\n🎨 測試圖像優化功能...', 'cyan');
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('quality', '80');
    formData.append('maxWidth', '800');
    formData.append('maxHeight', '600');
    
    const response = await axios.post(`${BASE_URL}/api/ai/optimize`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('圖像優化功能正常');
      const data = response.data.data;
      logInfo(`原始大小: ${(data.originalSize / 1024).toFixed(1)}KB`);
      logInfo(`優化後大小: ${(data.optimizedSize / 1024).toFixed(1)}KB`);
      logInfo(`壓縮率: ${data.compressionRatio.toFixed(1)}%`);
      logInfo(`尺寸: ${data.dimensions.width}×${data.dimensions.height}`);
      
      return true;
    } else {
      logError('圖像優化功能異常');
      return false;
    }
  } catch (error) {
    logError(`圖像優化測試失敗: ${error.message}`);
    if (error.response) {
      logError(`伺服器回應: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 測試相似寵物搜尋
async function testSimilarPetsSearch(imagePath) {
  log('\n🔍 測試相似寵物搜尋...', 'cyan');
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('limit', '5');
    
    const response = await axios.post(`${BASE_URL}/api/ai/similar-pets`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('相似寵物搜尋功能正常');
      logInfo(`找到 ${response.data.data.results.length} 個相似結果`);
      
      if (response.data.data.results.length > 0) {
        const topResult = response.data.data.results[0];
        logInfo(`最相似寵物: ${topResult.pet.name} (相似度: ${(topResult.similarity * 100).toFixed(1)}%)`);
      }
      
      return true;
    } else {
      logError('相似寵物搜尋功能異常');
      return false;
    }
  } catch (error) {
    logError(`相似寵物搜尋測試失敗: ${error.message}`);
    if (error.response) {
      logError(`伺服器回應: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 測試 AI 搜尋建議
async function testAISearchSuggestions() {
  log('\n💡 測試 AI 搜尋建議...', 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/ai/search-suggestions?query=golden`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('AI 搜尋建議功能正常');
      logInfo(`獲得 ${response.data.data.suggestions.length} 個建議`);
      
      if (response.data.data.suggestions.length > 0) {
        logInfo(`建議範例: ${response.data.data.suggestions.slice(0, 3).join(', ')}`);
      }
      
      return true;
    } else {
      logError('AI 搜尋建議功能異常');
      return false;
    }
  } catch (error) {
    logError(`AI 搜尋建議測試失敗: ${error.message}`);
    if (error.response) {
      logError(`伺服器回應: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 主測試函數
async function runTests() {
  log('🚀 開始 AI 功能整合測試', 'bright');
  log('=' * 50, 'cyan');
  
  const testImagePath = createTestImages();
  
  const tests = [
    { name: '環境配置', fn: () => checkEnvironment() },
    { name: '伺服器連線', fn: () => testServerConnection() },
    { name: '圖像分析', fn: () => testImageAnalysis(testImagePath) },
    { name: '圖像優化', fn: () => testImageOptimization(testImagePath) },
    { name: '相似寵物搜尋', fn: () => testSimilarPetsSearch(testImagePath) },
    { name: 'AI 搜尋建議', fn: () => testAISearchSuggestions() }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      logError(`測試 "${test.name}" 發生錯誤: ${error.message}`);
      results.push({ name: test.name, success: false });
    }
  }
  
  // 測試結果總結
  log('\n📊 測試結果總結', 'cyan');
  log('=' * 50, 'cyan');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    if (result.success) {
      logSuccess(`${result.name}: 通過`);
    } else {
      logError(`${result.name}: 失敗`);
    }
  });
  
  log(`\n總計: ${successCount}/${totalCount} 項測試通過`, 'bright');
  
  if (successCount === totalCount) {
    logSuccess('🎉 所有 AI 功能測試通過！系統已準備就緒');
  } else {
    logWarning('⚠️  部分測試失敗，請檢查配置和服務狀態');
  }
  
  // 清理測試文件
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    fs.rmSync(TEST_IMAGE_PATH, { recursive: true, force: true });
    logInfo('清理測試文件');
  }
}

// 執行測試
if (require.main === module) {
  runTests().catch(error => {
    logError(`測試執行失敗: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testServerConnection,
  testImageAnalysis,
  testImageOptimization,
  testSimilarPetsSearch,
  testAISearchSuggestions
};