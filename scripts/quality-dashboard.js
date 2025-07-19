#!/usr/bin/env node

/**
 * 代碼品質儀表板
 * 生成可視化的代碼品質報告和趨勢分析
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  reportsDir: path.join(__dirname, '..', 'quality-reports'),
  maxLines: 600,
  warningLines: 550
};

// 顏色輸出
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 創建進度條
function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${colorize(bar, 'blue')} ${percentage}%`;
}

// 獲取 Git 統計信息
function getGitStats() {
  try {
    const stats = {
      totalCommits: 0,
      contributors: 0,
      lastCommit: '',
      branch: ''
    };
    
    // 獲取總提交數
    try {
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
      stats.totalCommits = parseInt(commitCount);
    } catch (e) {
      stats.totalCommits = 0;
    }
    
    // 獲取貢獻者數量
    try {
      const contributors = execSync('git shortlog -sn', { encoding: 'utf8' });
      stats.contributors = contributors.split('\n').filter(line => line.trim()).length;
    } catch (e) {
      stats.contributors = 0;
    }
    
    // 獲取最後提交
    try {
      const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { encoding: 'utf8' });
      stats.lastCommit = lastCommit;
    } catch (e) {
      stats.lastCommit = 'N/A';
    }
    
    // 獲取當前分支
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      stats.branch = branch;
    } catch (e) {
      stats.branch = 'N/A';
    }
    
    return stats;
  } catch (error) {
    return {
      totalCommits: 0,
      contributors: 0,
      lastCommit: 'N/A',
      branch: 'N/A'
    };
  }
}

// 獲取依賴統計
function getDependencyStats() {
  const stats = {
    frontend: { dependencies: 0, devDependencies: 0 },
    backend: { dependencies: 0, devDependencies: 0 },
    root: { dependencies: 0, devDependencies: 0 }
  };
  
  // 檢查根目錄 package.json
  const rootPackagePath = path.join(CONFIG.projectRoot, 'package.json');
  if (fs.existsSync(rootPackagePath)) {
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    stats.root.dependencies = Object.keys(rootPackage.dependencies || {}).length;
    stats.root.devDependencies = Object.keys(rootPackage.devDependencies || {}).length;
  }
  
  // 檢查前端 package.json
  const frontendPackagePath = path.join(CONFIG.projectRoot, 'frontend', 'package.json');
  if (fs.existsSync(frontendPackagePath)) {
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    stats.frontend.dependencies = Object.keys(frontendPackage.dependencies || {}).length;
    stats.frontend.devDependencies = Object.keys(frontendPackage.devDependencies || {}).length;
  }
  
  // 檢查後端 package.json
  const backendPackagePath = path.join(CONFIG.projectRoot, 'backend', 'package.json');
  if (fs.existsSync(backendPackagePath)) {
    const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    stats.backend.dependencies = Object.keys(backendPackage.dependencies || {}).length;
    stats.backend.devDependencies = Object.keys(backendPackage.devDependencies || {}).length;
  }
  
  return stats;
}

// 獲取測試覆蓋率
function getTestCoverage() {
  const coverage = {
    frontend: { lines: 0, functions: 0, branches: 0, statements: 0 },
    backend: { lines: 0, functions: 0, branches: 0, statements: 0 }
  };
  
  // 嘗試讀取前端覆蓋率報告
  const frontendCoveragePath = path.join(CONFIG.projectRoot, 'frontend', 'coverage', 'coverage-summary.json');
  if (fs.existsSync(frontendCoveragePath)) {
    try {
      const frontendCoverage = JSON.parse(fs.readFileSync(frontendCoveragePath, 'utf8'));
      if (frontendCoverage.total) {
        coverage.frontend.lines = frontendCoverage.total.lines.pct || 0;
        coverage.frontend.functions = frontendCoverage.total.functions.pct || 0;
        coverage.frontend.branches = frontendCoverage.total.branches.pct || 0;
        coverage.frontend.statements = frontendCoverage.total.statements.pct || 0;
      }
    } catch (e) {
      // 忽略解析錯誤
    }
  }
  
  // 嘗試讀取後端覆蓋率報告
  const backendCoveragePath = path.join(CONFIG.projectRoot, 'backend', 'coverage', 'coverage-summary.json');
  if (fs.existsSync(backendCoveragePath)) {
    try {
      const backendCoverage = JSON.parse(fs.readFileSync(backendCoveragePath, 'utf8'));
      if (backendCoverage.total) {
        coverage.backend.lines = backendCoverage.total.lines.pct || 0;
        coverage.backend.functions = backendCoverage.total.functions.pct || 0;
        coverage.backend.branches = backendCoverage.total.branches.pct || 0;
        coverage.backend.statements = backendCoverage.total.statements.pct || 0;
      }
    } catch (e) {
      // 忽略解析錯誤
    }
  }
  
  return coverage;
}

// 生成代碼品質評分
function calculateQualityScore(codeQuality, testCoverage) {
  let score = 100;
  
  // 根據超大文件扣分
  score -= codeQuality.issues.oversized.length * 15;
  
  // 根據警告文件扣分
  score -= codeQuality.issues.warnings.length * 5;
  
  // 根據複雜文件扣分
  score -= codeQuality.issues.complex.length * 8;
  
  // 根據 TODO/FIXME 扣分
  score -= codeQuality.issues.todos.length * 2;
  score -= codeQuality.issues.fixmes.length * 3;
  
  // 根據測試覆蓋率調整
  const avgCoverage = (testCoverage.frontend.lines + testCoverage.backend.lines) / 2;
  if (avgCoverage < 50) {
    score -= 20;
  } else if (avgCoverage < 70) {
    score -= 10;
  } else if (avgCoverage > 90) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// 生成品質等級
function getQualityGrade(score) {
  if (score >= 90) return { grade: 'A+', color: 'green', emoji: '🏆' };
  if (score >= 80) return { grade: 'A', color: 'green', emoji: '✨' };
  if (score >= 70) return { grade: 'B+', color: 'blue', emoji: '👍' };
  if (score >= 60) return { grade: 'B', color: 'blue', emoji: '👌' };
  if (score >= 50) return { grade: 'C+', color: 'yellow', emoji: '⚠️' };
  if (score >= 40) return { grade: 'C', color: 'yellow', emoji: '😐' };
  if (score >= 30) return { grade: 'D', color: 'red', emoji: '😟' };
  return { grade: 'F', color: 'red', emoji: '💥' };
}

// 生成儀表板
function generateDashboard() {
  console.log(colorize('\n🎯 代碼品質儀表板', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));
  
  // 獲取各種統計信息
  console.log(colorize('📊 收集數據中...', 'yellow'));
  
  const gitStats = getGitStats();
  const depStats = getDependencyStats();
  const testCoverage = getTestCoverage();
  
  // 運行代碼品質檢查
  let codeQuality;
  try {
    const { checkCodeQuality } = require('./code-quality-check.js');
    codeQuality = checkCodeQuality();
  } catch (error) {
    console.error(colorize('❌ 無法獲取代碼品質數據', 'red'));
    return;
  }
  
  // 計算品質評分
  const qualityScore = calculateQualityScore(codeQuality, testCoverage);
  const qualityGrade = getQualityGrade(qualityScore);
  
  console.clear();
  
  // 顯示標題
  console.log(colorize('\n🎯 代碼品質儀表板', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));
  
  // 顯示總體評分
  console.log(colorize('\n📈 總體品質評分', 'bold'));
  console.log(`${qualityGrade.emoji} 評分: ${colorize(qualityScore + '/100', qualityGrade.color)} (${colorize(qualityGrade.grade, qualityGrade.color)})`);
  console.log(`${createProgressBar(qualityScore, 100)}`);
  
  // 顯示項目統計
  console.log(colorize('\n📊 項目統計', 'bold'));
  console.log(`📁 總文件數: ${colorize(codeQuality.totalFiles.toLocaleString(), 'cyan')}`);
  console.log(`📝 總行數: ${colorize(codeQuality.totalLines.toLocaleString(), 'cyan')}`);
  console.log(`📊 平均每文件行數: ${colorize(Math.round(codeQuality.totalLines / codeQuality.totalFiles), 'cyan')}`);
  
  // 顯示 Git 統計
  console.log(colorize('\n🔄 版本控制', 'bold'));
  console.log(`🌿 當前分支: ${colorize(gitStats.branch, 'green')}`);
  console.log(`📝 總提交數: ${colorize(gitStats.totalCommits.toLocaleString(), 'cyan')}`);
  console.log(`👥 貢獻者: ${colorize(gitStats.contributors, 'cyan')}`);
  console.log(`⏰ 最後提交: ${colorize(gitStats.lastCommit, 'dim')}`);
  
  // 顯示依賴統計
  console.log(colorize('\n📦 依賴統計', 'bold'));
  const totalDeps = depStats.root.dependencies + depStats.frontend.dependencies + depStats.backend.dependencies;
  const totalDevDeps = depStats.root.devDependencies + depStats.frontend.devDependencies + depStats.backend.devDependencies;
  console.log(`📦 生產依賴: ${colorize(totalDeps, 'cyan')}`);
  console.log(`🔧 開發依賴: ${colorize(totalDevDeps, 'cyan')}`);
  console.log(`   └─ 前端: ${depStats.frontend.dependencies}/${depStats.frontend.devDependencies}`);
  console.log(`   └─ 後端: ${depStats.backend.dependencies}/${depStats.backend.devDependencies}`);
  
  // 顯示測試覆蓋率
  console.log(colorize('\n🧪 測試覆蓋率', 'bold'));
  const frontendAvg = (testCoverage.frontend.lines + testCoverage.frontend.functions + 
                      testCoverage.frontend.branches + testCoverage.frontend.statements) / 4;
  const backendAvg = (testCoverage.backend.lines + testCoverage.backend.functions + 
                     testCoverage.backend.branches + testCoverage.backend.statements) / 4;
  
  console.log(`🎨 前端覆蓋率: ${colorize(frontendAvg.toFixed(1) + '%', frontendAvg > 70 ? 'green' : frontendAvg > 50 ? 'yellow' : 'red')}`);
  console.log(`   ├─ 行覆蓋率: ${testCoverage.frontend.lines}%`);
  console.log(`   ├─ 函數覆蓋率: ${testCoverage.frontend.functions}%`);
  console.log(`   ├─ 分支覆蓋率: ${testCoverage.frontend.branches}%`);
  console.log(`   └─ 語句覆蓋率: ${testCoverage.frontend.statements}%`);
  
  console.log(`⚙️ 後端覆蓋率: ${colorize(backendAvg.toFixed(1) + '%', backendAvg > 70 ? 'green' : backendAvg > 50 ? 'yellow' : 'red')}`);
  console.log(`   ├─ 行覆蓋率: ${testCoverage.backend.lines}%`);
  console.log(`   ├─ 函數覆蓋率: ${testCoverage.backend.functions}%`);
  console.log(`   ├─ 分支覆蓋率: ${testCoverage.backend.branches}%`);
  console.log(`   └─ 語句覆蓋率: ${testCoverage.backend.statements}%`);
  
  // 顯示代碼品質問題
  console.log(colorize('\n🔍 代碼品質問題', 'bold'));
  
  const totalIssues = codeQuality.issues.oversized.length + 
                     codeQuality.issues.warnings.length + 
                     codeQuality.issues.complex.length;
  
  if (totalIssues === 0) {
    console.log(colorize('✅ 沒有發現代碼品質問題！', 'green'));
  } else {
    console.log(`🚨 緊急問題: ${colorize(codeQuality.issues.oversized.length, 'red')} (超過 ${CONFIG.maxLines} 行)`);
    console.log(`⚠️ 警告問題: ${colorize(codeQuality.issues.warnings.length, 'yellow')} (接近 ${CONFIG.maxLines} 行)`);
    console.log(`🔧 複雜問題: ${colorize(codeQuality.issues.complex.length, 'yellow')}`);
    console.log(`📝 待辦事項: ${colorize(codeQuality.issues.todos.length, 'blue')}`);
    console.log(`🐛 需修復: ${colorize(codeQuality.issues.fixmes.length, 'red')}`);
  }
  
  // 顯示建議
  console.log(colorize('\n💡 改進建議', 'bold'));
  
  if (codeQuality.issues.oversized.length > 0) {
    console.log(colorize('🔴 高優先級:', 'red'));
    console.log(`   └─ 立即重構 ${codeQuality.issues.oversized.length} 個超大文件`);
    console.log(`   └─ 運行: npm run refactor:auto <file-path>`);
  }
  
  if (frontendAvg < 70 || backendAvg < 70) {
    console.log(colorize('🟡 中優先級:', 'yellow'));
    console.log(`   └─ 提高測試覆蓋率到 70% 以上`);
    console.log(`   └─ 運行: npm run test:coverage`);
  }
  
  if (codeQuality.issues.todos.length > 10) {
    console.log(colorize('🔵 低優先級:', 'blue'));
    console.log(`   └─ 處理 ${codeQuality.issues.todos.length} 個 TODO 項目`);
  }
  
  // 顯示快速操作
  console.log(colorize('\n⚡ 快速操作', 'bold'));
  console.log(`🔧 檢查代碼品質: ${colorize('npm run quality:check', 'cyan')}`);
  console.log(`🎨 修復代碼風格: ${colorize('npm run quality:fix', 'cyan')}`);
  console.log(`🔄 自動重構: ${colorize('npm run refactor:preview', 'cyan')}`);
  console.log(`🧪 運行測試: ${colorize('npm test', 'cyan')}`);
  console.log(`📊 更新儀表板: ${colorize('npm run dashboard', 'cyan')}`);
  
  console.log(colorize('\n═'.repeat(60), 'blue'));
  console.log(colorize(`📅 報告生成時間: ${new Date().toLocaleString('zh-TW')}`, 'dim'));
  
  // 保存報告
  saveReport({
    timestamp: new Date().toISOString(),
    qualityScore,
    qualityGrade: qualityGrade.grade,
    codeQuality,
    gitStats,
    depStats,
    testCoverage
  });
}

// 保存報告
function saveReport(data) {
  if (!fs.existsSync(CONFIG.reportsDir)) {
    fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(CONFIG.reportsDir, `quality-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
  
  // 保存最新報告
  const latestReportPath = path.join(CONFIG.reportsDir, 'latest-report.json');
  fs.writeFileSync(latestReportPath, JSON.stringify(data, null, 2));
  
  console.log(colorize(`💾 報告已保存: ${reportPath}`, 'dim'));
}

// 顯示趨勢分析
function showTrends() {
  console.log(colorize('\n📈 品質趨勢分析', 'bold'));
  
  const reportsDir = CONFIG.reportsDir;
  if (!fs.existsSync(reportsDir)) {
    console.log(colorize('❌ 沒有歷史報告數據', 'red'));
    return;
  }
  
  const reportFiles = fs.readdirSync(reportsDir)
    .filter(file => file.startsWith('quality-report-') && file.endsWith('.json'))
    .sort()
    .slice(-10); // 最近 10 個報告
  
  if (reportFiles.length < 2) {
    console.log(colorize('❌ 需要至少 2 個報告才能顯示趨勢', 'yellow'));
    return;
  }
  
  const reports = reportFiles.map(file => {
    const content = fs.readFileSync(path.join(reportsDir, file), 'utf8');
    return JSON.parse(content);
  });
  
  // 顯示評分趨勢
  console.log('\n評分趨勢:');
  reports.forEach((report, index) => {
    const date = new Date(report.timestamp).toLocaleDateString('zh-TW');
    const score = report.qualityScore;
    const grade = report.qualityGrade;
    
    let trend = '';
    if (index > 0) {
      const prevScore = reports[index - 1].qualityScore;
      if (score > prevScore) trend = colorize('↗️', 'green');
      else if (score < prevScore) trend = colorize('↘️', 'red');
      else trend = colorize('→', 'yellow');
    }
    
    console.log(`  ${date}: ${score}/100 (${grade}) ${trend}`);
  });
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'trends':
    case 'trend':
      showTrends();
      break;
    case 'dashboard':
    case 'show':
    default:
      generateDashboard();
      break;
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  generateDashboard,
  showTrends,
  calculateQualityScore,
  getQualityGrade
};