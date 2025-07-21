/**
 * AI 功能測試腳本
 * 用於測試 Google Vision API 和圖像處理功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 測試配置
const BASE_URL = 'http://localhost:3001';
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500'; // 測試用狗狗圖片

// 顏色輸出函數
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 測試函數
async function testAIFeatures() {
  log('blue', '🚀 開始測試 AI 功能...');
  console.log('\n');

  try {
    // 1. 測試伺服器連線
    log('yellow', '📡 測試伺服器連線...');
    const healthCheck = await axios.get(`${BASE_URL}/api/health`);
    if (healthCheck.status === 200) {
      log('green', '✅ 伺服器連線正常');
    }
  } catch (error) {
    log('red', '❌ 伺服器連線失敗');
    log('red', `錯誤: ${error.message}`);
    log('yellow', '請確保後端伺服器正在運行 (npm run dev)');
    return;
  }

  try {
    // 2. 測試圖像分析
    log('yellow', '\n🔍 測試圖像分析功能...');
    const analyzeResponse = await axios.post(`${BASE_URL}/api/ai/analyze`, {
      imageUrl: TEST_IMAGE_URL
    });
    
    if (analyzeResponse.status === 200) {
      log('green', '✅ 圖像分析功能正常');
      console.log('分析結果:', JSON.stringify(analyzeResponse.data, null, 2));
    }
  } catch (error) {
    log('red', '❌ 圖像分析功能失敗');
    if (error.response) {
      console.log('錯誤詳情:', error.response.data);
    } else {
      console.log('錯誤:', error.message);
    }
  }

  try {
    // 3. 測試圖像優化
    log('yellow', '\n🎨 測試圖像優化功能...');
    const optimizeResponse = await axios.post(`${BASE_URL}/api/ai/optimize`, {
      imageUrl: TEST_IMAGE_URL,
      width: 300,
      height: 300,
      quality: 80
    });
    
    if (optimizeResponse.status === 200) {
      log('green', '✅ 圖像優化功能正常');
      console.log('優化結果:', {
        originalSize: optimizeResponse.data.originalSize,
        optimizedSize: optimizeResponse.data.optimizedSize,
        compressionRatio: optimizeResponse.data.compressionRatio
      });
    }
  } catch (error) {
    log('red', '❌ 圖像優化功能失敗');
    if (error.response) {
      console.log('錯誤詳情:', error.response.data);
    } else {
      console.log('錯誤:', error.message);
    }
  }

  try {
    // 4. 測試圖像裁剪
    log('yellow', '\n✂️ 測試圖像裁剪功能...');
    const cropResponse = await axios.post(`${BASE_URL}/api/ai/crop`, {
      imageUrl: TEST_IMAGE_URL,
      x: 50,
      y: 50,
      width: 200,
      height: 200
    });
    
    if (cropResponse.status === 200) {
      log('green', '✅ 圖像裁剪功能正常');
      console.log('裁剪結果:', {
        originalDimensions: cropResponse.data.originalDimensions,
        croppedDimensions: cropResponse.data.croppedDimensions
      });
    }
  } catch (error) {
    log('red', '❌ 圖像裁剪功能失敗');
    if (error.response) {
      console.log('錯誤詳情:', error.response.data);
    } else {
      console.log('錯誤:', error.message);
    }
  }

  // 5. 環境變數檢查
  log('yellow', '\n⚙️ 檢查環境變數配置...');
  
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'GOOGLE_VISION_PROJECT_ID',
      'GOOGLE_VISION_KEY_PATH'
    ];
    
    let allConfigured = true;
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        log('green', `✅ ${varName} 已配置`);
      } else {
        log('red', `❌ ${varName} 未配置`);
        allConfigured = false;
      }
    });
    
    if (allConfigured) {
      log('green', '✅ 所有必要的環境變數都已配置');
    } else {
      log('yellow', '⚠️ 請檢查 .env 檔案中的 Google Vision API 設定');
    }
  } else {
    log('red', '❌ 找不到 .env 檔案');
    log('yellow', '請複製 .env.example 為 .env 並配置相關設定');
  }

  // 6. Google Vision 金鑰檔案檢查
  log('yellow', '\n🔑 檢查 Google Vision 金鑰檔案...');
  
  const keyPaths = [
    path.join(__dirname, 'config', 'google-vision-key.json'),
    path.join(__dirname, 'google-vision-key.json')
  ];
  
  let keyFound = false;
  keyPaths.forEach(keyPath => {
    if (fs.existsSync(keyPath)) {
      log('green', `✅ 找到金鑰檔案: ${keyPath}`);
      keyFound = true;
    }
  });
  
  if (!keyFound) {
    log('red', '❌ 找不到 Google Vision API 金鑰檔案');
    log('yellow', '請參考 GOOGLE_CLOUD_SETUP.md 設定 Google Cloud 憑證');
  }

  log('blue', '\n🏁 AI 功能測試完成!');
  
  // 總結
  console.log('\n' + '='.repeat(50));
  log('blue', '📋 測試總結:');
  log('yellow', '1. 如果所有測試都通過，AI 功能已準備就緒');
  log('yellow', '2. 如果有失敗的測試，請檢查相關配置');
  log('yellow', '3. 確保 Google Cloud Vision API 已正確設定');
  log('yellow', '4. 檢查網路連線和 API 額度');
  console.log('='.repeat(50));
}

// 執行測試
if (require.main === module) {
  testAIFeatures().catch(error => {
    log('red', '測試執行失敗:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { testAIFeatures };