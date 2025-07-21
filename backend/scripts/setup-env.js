/**
 * 環境變數設定助手
 * 協助用戶快速設定 .env 檔案
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupEnvironment() {
  console.log('🚀 Cloudinary 環境變數設定助手');
  console.log('=====================================\n');

  // 檢查是否已有 .env 檔案
  if (fs.existsSync(envPath)) {
    console.log('⚠️  發現現有的 .env 檔案');
    const overwrite = await askQuestion('是否要覆寫現有設定？(y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ 設定已取消');
      rl.close();
      return;
    }
  }

  // 讀取 .env.example 作為範本
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    console.log('❌ 找不到 .env.example 檔案');
    rl.close();
    return;
  }

  console.log('請提供以下 Cloudinary 配置資訊：\n');

  // 收集 Cloudinary 配置
  const cloudinaryCloudName = await askQuestion('Cloudinary Cloud Name: ');
  const cloudinaryApiKey = await askQuestion('Cloudinary API Key: ');
  const cloudinaryApiSecret = await askQuestion('Cloudinary API Secret: ');

  // 驗證必要欄位
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    console.log('❌ 請提供所有必要的 Cloudinary 配置資訊');
    rl.close();
    return;
  }

  // 更新環境變數內容
  envContent = envContent
    .replace(/CLOUDINARY_CLOUD_NAME=.*/, `CLOUDINARY_CLOUD_NAME=${cloudinaryCloudName}`)
    .replace(/CLOUDINARY_API_KEY=.*/, `CLOUDINARY_API_KEY=${cloudinaryApiKey}`)
    .replace(/CLOUDINARY_API_SECRET=.*/, `CLOUDINARY_API_SECRET=${cloudinaryApiSecret}`);

  // 詢問是否要設定其他選項
  console.log('\n📝 其他可選設定：');
  const setupOthers = await askQuestion('是否要設定其他環境變數？(y/N): ');
  
  if (setupOthers.toLowerCase() === 'y' || setupOthers.toLowerCase() === 'yes') {
    const port = await askQuestion('後端端口 (預設: 5001): ') || '5001';
    const mongoUri = await askQuestion('MongoDB URI (預設: mongodb://localhost:27017/pet-finder): ') || 'mongodb://localhost:27017/pet-finder';
    const jwtSecret = await askQuestion('JWT Secret (留空將生成隨機值): ') || generateRandomSecret();
    
    envContent = envContent
      .replace(/PORT=.*/, `PORT=${port}`)
      .replace(/MONGODB_URI=.*/, `MONGODB_URI=${mongoUri}`)
      .replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
  }

  // 寫入 .env 檔案
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env 檔案設定完成！');
    console.log('\n📋 下一步：');
    console.log('1. 執行 npm run dev 啟動後端服務器');
    console.log('2. 測試照片上傳功能');
    console.log('3. 檢查 Cloudinary 儀表板確認圖片上傳');
    console.log('\n💡 提示：請確保不要將 .env 檔案提交到版本控制系統！');
  } catch (error) {
    console.log('❌ 寫入 .env 檔案失敗:', error.message);
  }

  rl.close();
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 處理 Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n❌ 設定已取消');
  rl.close();
});

// 執行設定
setupEnvironment().catch(console.error);