#!/usr/bin/env node

/**
 * 代碼品質檢查工具
 * 自動檢測代碼文件長度、複雜度和潛在問題
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  maxLines: 600,
  warningLines: 550,
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'],
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  projectRoot: path.join(__dirname, '..')
};

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

// 獲取所有代碼文件
function getAllCodeFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(item)) {
        getAllCodeFiles(fullPath, files);
      }
    } else {
      const ext = path.extname(item);
      if (CONFIG.includeExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// 計算文件行數
function getLineCount(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

// 檢查文件複雜度
function checkComplexity(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 簡單的複雜度指標
    const metrics = {
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      interfaces: (content.match(/interface\s+\w+/g) || []).length,
      imports: (content.match(/import\s+.*from/g) || []).length,
      exports: (content.match(/export\s+/g) || []).length,
      todos: (content.match(/\/\/\s*TODO|\/\*\s*TODO/gi) || []).length,
      fixmes: (content.match(/\/\/\s*FIXME|\/\*\s*FIXME/gi) || []).length
    };
    
    return metrics;
  } catch (error) {
    return null;
  }
}

// 檢查代碼品質問題
function checkCodeQuality() {
  console.log(colorize('🔍 開始代碼品質檢查...', 'blue'));
  console.log('\n');
  
  const files = getAllCodeFiles(CONFIG.projectRoot);
  const issues = {
    oversized: [],
    warnings: [],
    todos: [],
    fixmes: [],
    complex: []
  };
  
  let totalLines = 0;
  let totalFiles = 0;
  
  for (const file of files) {
    const relativePath = path.relative(CONFIG.projectRoot, file);
    const lineCount = getLineCount(file);
    const complexity = checkComplexity(file);
    
    totalLines += lineCount;
    totalFiles++;
    
    // 檢查文件大小
    if (lineCount > CONFIG.maxLines) {
      issues.oversized.push({ file: relativePath, lines: lineCount });
    } else if (lineCount > CONFIG.warningLines) {
      issues.warnings.push({ file: relativePath, lines: lineCount });
    }
    
    // 檢查複雜度
    if (complexity) {
      if (complexity.functions > 20) {
        issues.complex.push({ 
          file: relativePath, 
          reason: `過多函數 (${complexity.functions})`,
          metrics: complexity
        });
      }
      
      if (complexity.todos > 0) {
        issues.todos.push({ file: relativePath, count: complexity.todos });
      }
      
      if (complexity.fixmes > 0) {
        issues.fixmes.push({ file: relativePath, count: complexity.fixmes });
      }
    }
  }
  
  // 輸出結果
  console.log(colorize('📊 檢查結果統計', 'bold'));
  console.log(`總文件數: ${totalFiles}`);
  console.log(`總行數: ${totalLines.toLocaleString()}`);
  console.log(`平均每文件行數: ${Math.round(totalLines / totalFiles)}`);
  console.log('\n');
  
  // 超大文件警告
  if (issues.oversized.length > 0) {
    console.log(colorize('🚨 緊急：超過 600 行的文件', 'red'));
    issues.oversized.forEach(issue => {
      console.log(`  ${colorize('❌', 'red')} ${issue.file} (${issue.lines} 行)`);
    });
    console.log('\n');
  }
  
  // 警告文件
  if (issues.warnings.length > 0) {
    console.log(colorize('⚠️  警告：接近 600 行的文件', 'yellow'));
    issues.warnings.forEach(issue => {
      console.log(`  ${colorize('⚠️', 'yellow')} ${issue.file} (${issue.lines} 行)`);
    });
    console.log('\n');
  }
  
  // 複雜文件
  if (issues.complex.length > 0) {
    console.log(colorize('🔧 複雜度警告', 'yellow'));
    issues.complex.forEach(issue => {
      console.log(`  ${colorize('🔧', 'yellow')} ${issue.file} - ${issue.reason}`);
    });
    console.log('\n');
  }
  
  // TODO 和 FIXME
  if (issues.todos.length > 0) {
    console.log(colorize('📝 待辦事項 (TODO)', 'blue'));
    issues.todos.forEach(issue => {
      console.log(`  ${colorize('📝', 'blue')} ${issue.file} (${issue.count} 個)`);
    });
    console.log('\n');
  }
  
  if (issues.fixmes.length > 0) {
    console.log(colorize('🐛 需要修復 (FIXME)', 'red'));
    issues.fixmes.forEach(issue => {
      console.log(`  ${colorize('🐛', 'red')} ${issue.file} (${issue.count} 個)`);
    });
    console.log('\n');
  }
  
  // 總結
  const totalIssues = issues.oversized.length + issues.warnings.length + issues.complex.length;
  
  if (totalIssues === 0) {
    console.log(colorize('✅ 恭喜！沒有發現代碼品質問題', 'green'));
  } else {
    console.log(colorize(`📋 發現 ${totalIssues} 個需要關注的問題`, 'yellow'));
    
    if (issues.oversized.length > 0) {
      console.log(colorize('\n🎯 建議優先處理超過 600 行的文件：', 'bold'));
      issues.oversized.forEach(issue => {
        console.log(`   1. 重構 ${issue.file}`);
      });
    }
  }
  
  console.log('\n');
  console.log(colorize('💡 提示：運行 npm run lint 檢查代碼風格', 'blue'));
  console.log(colorize('💡 提示：運行 npm test 執行測試', 'blue'));
  
  return {
    totalFiles,
    totalLines,
    issues,
    hasIssues: totalIssues > 0
  };
}

// 生成報告
function generateReport(results) {
  const reportPath = path.join(CONFIG.projectRoot, 'code-quality-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.totalFiles,
      totalLines: results.totalLines,
      averageLines: Math.round(results.totalLines / results.totalFiles)
    },
    issues: results.issues,
    recommendations: []
  };
  
  // 生成建議
  if (results.issues.oversized.length > 0) {
    report.recommendations.push({
      priority: 'high',
      type: 'refactor',
      description: '立即重構超過 600 行的文件',
      files: results.issues.oversized.map(i => i.file)
    });
  }
  
  if (results.issues.warnings.length > 0) {
    report.recommendations.push({
      priority: 'medium',
      type: 'refactor',
      description: '考慮重構接近 600 行的文件',
      files: results.issues.warnings.map(i => i.file)
    });
  }
  
  if (results.issues.complex.length > 0) {
    report.recommendations.push({
      priority: 'medium',
      type: 'simplify',
      description: '簡化複雜的文件結構',
      files: results.issues.complex.map(i => i.file)
    });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(colorize(`📄 詳細報告已保存到: ${reportPath}`, 'blue'));
}

// 主函數
function main() {
  try {
    const results = checkCodeQuality();
    generateReport(results);
    
    // 如果有嚴重問題，返回錯誤碼
    if (results.issues.oversized.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(colorize('❌ 檢查過程中發生錯誤:', 'red'), error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = { checkCodeQuality, generateReport };