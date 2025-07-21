#!/usr/bin/env node

/**
 * Git Hooks 設置腳本
 * 自動設置 pre-commit 和 pre-push hooks 來確保代碼品質
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const gitHooksDir = path.join(projectRoot, '.git', 'hooks');

// 顏色輸出
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Pre-commit hook 內容
const preCommitHook = `#!/bin/sh
#
# 自動生成的 pre-commit hook
# 在提交前檢查代碼品質
#

echo "🔍 執行 pre-commit 檢查..."

# 檢查代碼品質
echo "📊 檢查代碼品質..."
node scripts/code-quality-check.js
if [ $? -ne 0 ]; then
  echo "❌ 代碼品質檢查失敗！請修復問題後再提交。"
  echo "💡 運行 'npm run quality:check' 查看詳細報告"
  exit 1
fi

# 運行 linting
echo "🔧 檢查代碼風格..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ 代碼風格檢查失敗！請修復 linting 錯誤後再提交。"
  echo "💡 運行 'npm run lint' 查看詳細錯誤"
  echo "💡 運行 'npm run format' 自動修復格式問題"
  exit 1
fi

# 運行測試
echo "🧪 運行測試..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ 測試失敗！請修復測試錯誤後再提交。"
  echo "💡 運行 'npm test' 查看詳細錯誤"
  exit 1
fi

echo "✅ 所有檢查通過！可以安全提交。"
exit 0
`;

// Pre-push hook 內容
const prePushHook = `#!/bin/sh
#
# 自動生成的 pre-push hook
# 在推送前執行額外檢查
#

echo "🚀 執行 pre-push 檢查..."

# 檢查是否有大型文件需要重構
echo "📏 檢查文件大小..."
node scripts/code-quality-check.js
if [ $? -ne 0 ]; then
  echo "⚠️ 發現需要重構的大型文件"
  echo "💡 建議在推送前運行重構：npm run refactor:check"
  echo "❓ 是否繼續推送？(y/N)"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "❌ 推送已取消"
    exit 1
  fi
fi

# 運行完整測試套件
echo "🧪 運行完整測試套件..."
npm run test:all
if [ $? -ne 0 ]; then
  echo "❌ 完整測試失敗！請修復後再推送。"
  exit 1
fi

# 檢查構建
echo "🏗️ 檢查構建..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 構建失敗！請修復構建錯誤後再推送。"
  exit 1
fi

echo "✅ 所有檢查通過！可以安全推送。"
exit 0
`;

// Commit-msg hook 內容
const commitMsgHook = `#!/bin/sh
#
# 自動生成的 commit-msg hook
# 檢查提交訊息格式
#

commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .{1,50}'

error_msg="❌ 提交訊息格式錯誤！

正確格式: <type>(<scope>): <description>

類型 (type):
  feat:     新功能
  fix:      修復 bug
  docs:     文檔更新
  style:    代碼格式調整
  refactor: 重構代碼
  test:     測試相關
  chore:    其他雜項

範例:
  feat(auth): 添加用戶登錄功能
  fix(api): 修復寵物搜索 API 錯誤
  docs: 更新 README 文檔
  refactor(components): 重構寵物表單組件"

if ! grep -qE "$commit_regex" "$1"; then
    echo "$error_msg" >&2
    exit 1
fi

# 檢查提交訊息長度
first_line=$(head -n1 "$1")
if [ \${#first_line} -gt 72 ]; then
    echo "❌ 提交訊息第一行過長！請保持在 72 字符以內。" >&2
    exit 1
fi

echo "✅ 提交訊息格式正確"
exit 0
`;

// 設置 Git hooks
function setupGitHooks() {
  console.log(colorize('🔧 設置 Git Hooks...', 'blue'));
  
  // 檢查是否在 Git 倉庫中
  if (!fs.existsSync(path.join(projectRoot, '.git'))) {
    console.error(colorize('❌ 當前目錄不是 Git 倉庫！', 'red'));
    console.log(colorize('💡 請先運行: git init', 'yellow'));
    process.exit(1);
  }
  
  // 確保 hooks 目錄存在
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }
  
  const hooks = [
    { name: 'pre-commit', content: preCommitHook },
    { name: 'pre-push', content: prePushHook },
    { name: 'commit-msg', content: commitMsgHook }
  ];
  
  for (const hook of hooks) {
    const hookPath = path.join(gitHooksDir, hook.name);
    
    // 備份現有的 hook
    if (fs.existsSync(hookPath)) {
      const backupPath = `${hookPath}.backup.${Date.now()}`;
      fs.copyFileSync(hookPath, backupPath);
      console.log(colorize(`📦 已備份現有 ${hook.name} hook: ${backupPath}`, 'yellow'));
    }
    
    // 寫入新的 hook
    fs.writeFileSync(hookPath, hook.content);
    
    // 設置執行權限 (Unix/Linux/macOS)
    if (process.platform !== 'win32') {
      try {
        execSync(`chmod +x "${hookPath}"`);
      } catch (error) {
        console.warn(colorize(`⚠️ 無法設置 ${hook.name} 執行權限`, 'yellow'));
      }
    }
    
    console.log(colorize(`✅ 已設置 ${hook.name} hook`, 'green'));
  }
  
  console.log(colorize('\n🎉 Git Hooks 設置完成！', 'green'));
  console.log('\n現在每次提交時會自動檢查:');
  console.log('  📊 代碼品質');
  console.log('  🔧 代碼風格');
  console.log('  🧪 測試');
  console.log('  📝 提交訊息格式');
  console.log('\n每次推送時會額外檢查:');
  console.log('  🧪 完整測試套件');
  console.log('  🏗️ 構建');
}

// 移除 Git hooks
function removeGitHooks() {
  console.log(colorize('🗑️ 移除 Git Hooks...', 'yellow'));
  
  const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
  
  for (const hookName of hooks) {
    const hookPath = path.join(gitHooksDir, hookName);
    
    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      console.log(colorize(`✅ 已移除 ${hookName} hook`, 'green'));
    }
  }
  
  console.log(colorize('🎉 Git Hooks 移除完成！', 'green'));
}

// 檢查 Git hooks 狀態
function checkGitHooks() {
  console.log(colorize('🔍 檢查 Git Hooks 狀態...', 'blue'));
  
  const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
  
  for (const hookName of hooks) {
    const hookPath = path.join(gitHooksDir, hookName);
    
    if (fs.existsSync(hookPath)) {
      const stats = fs.statSync(hookPath);
      const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
      
      console.log(colorize(`✅ ${hookName}`, 'green'), 
                 isExecutable ? colorize('(可執行)', 'green') : colorize('(不可執行)', 'yellow'));
    } else {
      console.log(colorize(`❌ ${hookName}`, 'red'), colorize('(未設置)', 'red'));
    }
  }
}

// 測試 Git hooks
function testGitHooks() {
  console.log(colorize('🧪 測試 Git Hooks...', 'blue'));
  
  try {
    // 測試代碼品質檢查
    console.log(colorize('📊 測試代碼品質檢查...', 'yellow'));
    execSync('node scripts/code-quality-check.js', { stdio: 'inherit' });
    
    // 測試 linting
    console.log(colorize('🔧 測試代碼風格檢查...', 'yellow'));
    execSync('npm run lint', { stdio: 'inherit' });
    
    console.log(colorize('✅ Git Hooks 測試通過！', 'green'));
  } catch (error) {
    console.error(colorize('❌ Git Hooks 測試失敗！', 'red'));
    console.log(colorize('💡 請修復上述問題後再次測試', 'yellow'));
    process.exit(1);
  }
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'setup':
    case 'install':
      setupGitHooks();
      break;
    case 'remove':
    case 'uninstall':
      removeGitHooks();
      break;
    case 'check':
    case 'status':
      checkGitHooks();
      break;
    case 'test':
      testGitHooks();
      break;
    default:
      console.log(colorize('🔧 Git Hooks 管理工具', 'bold'));
      console.log('\n使用方法:');
      console.log('  node scripts/setup-git-hooks.js <command>');
      console.log('\n命令:');
      console.log('  setup/install    設置 Git hooks');
      console.log('  remove/uninstall 移除 Git hooks');
      console.log('  check/status     檢查 Git hooks 狀態');
      console.log('  test             測試 Git hooks');
      console.log('\n範例:');
      console.log('  node scripts/setup-git-hooks.js setup');
      console.log('  node scripts/setup-git-hooks.js check');
      break;
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  setupGitHooks,
  removeGitHooks,
  checkGitHooks,
  testGitHooks
};