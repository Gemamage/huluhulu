#!/usr/bin/env node

/**
 * 自動重構工具
 * 幫助將大型文件拆分為更小、更易維護的模塊
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  maxLines: 600,
  projectRoot: path.join(__dirname, '..'),
  backupDir: path.join(__dirname, '..', 'refactor-backup'),
  templatesDir: path.join(__dirname, 'refactor-templates')
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

// 創建備份
function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = path.basename(filePath);
  const backupPath = path.join(CONFIG.backupDir, `${fileName}.${timestamp}.backup`);
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
  console.log(colorize(`✅ 備份已創建: ${backupPath}`, 'green'));
  return backupPath;
}

// 分析文件結構
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const analysis = {
    totalLines: lines.length,
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    constants: [],
    components: []
  };
  
  let currentFunction = null;
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;
    
    // 檢測 imports
    if (line.startsWith('import ')) {
      analysis.imports.push({ line: lineNum, content: line });
    }
    
    // 檢測 exports
    if (line.startsWith('export ')) {
      analysis.exports.push({ line: lineNum, content: line });
    }
    
    // 檢測 interfaces
    if (line.match(/^(export\s+)?interface\s+\w+/)) {
      const match = line.match(/interface\s+(\w+)/);
      if (match) {
        analysis.interfaces.push({ 
          name: match[1], 
          line: lineNum, 
          content: line 
        });
      }
    }
    
    // 檢測 types
    if (line.match(/^(export\s+)?type\s+\w+/)) {
      const match = line.match(/type\s+(\w+)/);
      if (match) {
        analysis.types.push({ 
          name: match[1], 
          line: lineNum, 
          content: line 
        });
      }
    }
    
    // 檢測 constants
    if (line.match(/^(export\s+)?const\s+[A-Z_]+\s*=/)) {
      const match = line.match(/const\s+([A-Z_]+)/);
      if (match) {
        analysis.constants.push({ 
          name: match[1], 
          line: lineNum, 
          content: line 
        });
      }
    }
    
    // 檢測函數
    if (line.match(/^(export\s+)?(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\()/)) {
      const match = line.match(/(function\s+(\w+)|const\s+(\w+)\s*=)/);
      if (match) {
        currentFunction = {
          name: match[2] || match[3],
          startLine: lineNum,
          content: [line]
        };
        inFunction = true;
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      }
    }
    
    // 檢測 React 組件
    if (line.match(/^(export\s+)?(default\s+)?function\s+[A-Z]\w*/) || 
        line.match(/^(export\s+)?const\s+[A-Z]\w*\s*=\s*(React\.)?forwardRef/) ||
        line.match(/^(export\s+)?const\s+[A-Z]\w*\s*=\s*\(/)) {
      const match = line.match(/(function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=)/);
      if (match) {
        analysis.components.push({
          name: match[2] || match[3],
          line: lineNum,
          content: line
        });
      }
    }
    
    // 追蹤函數內容
    if (inFunction && currentFunction) {
      if (lineNum > currentFunction.startLine) {
        currentFunction.content.push(line);
      }
      
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      if (braceCount === 0) {
        currentFunction.endLine = lineNum;
        currentFunction.lineCount = currentFunction.endLine - currentFunction.startLine + 1;
        analysis.functions.push(currentFunction);
        inFunction = false;
        currentFunction = null;
      }
    }
  }
  
  return analysis;
}

// 生成重構建議
function generateRefactorSuggestions(filePath, analysis) {
  const suggestions = [];
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);
  
  // 建議 1: 提取類型定義
  if (analysis.interfaces.length > 3 || analysis.types.length > 3) {
    suggestions.push({
      type: 'extract-types',
      priority: 'high',
      description: '提取類型定義到單獨文件',
      targetFile: path.join(fileDir, 'types', `${fileName}.types.ts`),
      items: [...analysis.interfaces, ...analysis.types]
    });
  }
  
  // 建議 2: 提取常量
  if (analysis.constants.length > 5) {
    suggestions.push({
      type: 'extract-constants',
      priority: 'medium',
      description: '提取常量到單獨文件',
      targetFile: path.join(fileDir, 'constants', `${fileName}.constants.ts`),
      items: analysis.constants
    });
  }
  
  // 建議 3: 拆分大型函數
  const largeFunctions = analysis.functions.filter(f => f.lineCount > 50);
  if (largeFunctions.length > 0) {
    suggestions.push({
      type: 'split-functions',
      priority: 'high',
      description: '拆分大型函數',
      items: largeFunctions
    });
  }
  
  // 建議 4: 提取 React 組件
  if (analysis.components.length > 1) {
    suggestions.push({
      type: 'extract-components',
      priority: 'medium',
      description: '將組件拆分到單獨文件',
      targetDir: path.join(fileDir, 'components'),
      items: analysis.components
    });
  }
  
  // 建議 5: 創建 hooks
  const hookCandidates = analysis.functions.filter(f => 
    f.name.startsWith('use') || 
    f.content.some(line => line.includes('useState') || line.includes('useEffect'))
  );
  
  if (hookCandidates.length > 0) {
    suggestions.push({
      type: 'extract-hooks',
      priority: 'medium',
      description: '提取自定義 hooks',
      targetDir: path.join(fileDir, 'hooks'),
      items: hookCandidates
    });
  }
  
  return suggestions;
}

// 執行重構
function executeRefactor(filePath, suggestions, options = {}) {
  console.log(colorize(`🔧 開始重構: ${filePath}`, 'blue'));
  
  // 創建備份
  const backupPath = createBackup(filePath);
  
  const refactorPlan = {
    originalFile: filePath,
    backupFile: backupPath,
    timestamp: new Date().toISOString(),
    suggestions: suggestions,
    createdFiles: [],
    modifiedFiles: []
  };
  
  try {
    for (const suggestion of suggestions) {
      if (options.skipTypes && suggestion.type === 'extract-types') continue;
      if (options.skipConstants && suggestion.type === 'extract-constants') continue;
      
      console.log(colorize(`  📝 執行: ${suggestion.description}`, 'yellow'));
      
      switch (suggestion.type) {
        case 'extract-types':
          executeExtractTypes(suggestion, refactorPlan);
          break;
        case 'extract-constants':
          executeExtractConstants(suggestion, refactorPlan);
          break;
        case 'extract-components':
          executeExtractComponents(suggestion, refactorPlan);
          break;
        case 'extract-hooks':
          executeExtractHooks(suggestion, refactorPlan);
          break;
        default:
          console.log(colorize(`    ⚠️ 跳過未實現的重構類型: ${suggestion.type}`, 'yellow'));
      }
    }
    
    // 保存重構計劃
    const planPath = path.join(CONFIG.backupDir, `refactor-plan-${Date.now()}.json`);
    fs.writeFileSync(planPath, JSON.stringify(refactorPlan, null, 2));
    
    console.log(colorize(`✅ 重構完成！`, 'green'));
    console.log(colorize(`📋 重構計劃已保存: ${planPath}`, 'blue'));
    
    return refactorPlan;
    
  } catch (error) {
    console.error(colorize(`❌ 重構失敗: ${error.message}`, 'red'));
    
    // 恢復備份
    fs.copyFileSync(backupPath, filePath);
    console.log(colorize(`🔄 已恢復原始文件`, 'yellow'));
    
    throw error;
  }
}

// 提取類型定義
function executeExtractTypes(suggestion, refactorPlan) {
  const targetDir = path.dirname(suggestion.targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const typeContent = suggestion.items.map(item => item.content).join('\n\n');
  const fileContent = `// 自動生成的類型定義文件\n// 生成時間: ${new Date().toISOString()}\n\n${typeContent}\n`;
  
  fs.writeFileSync(suggestion.targetFile, fileContent);
  refactorPlan.createdFiles.push(suggestion.targetFile);
  
  console.log(colorize(`    ✅ 已創建類型文件: ${suggestion.targetFile}`, 'green'));
}

// 提取常量
function executeExtractConstants(suggestion, refactorPlan) {
  const targetDir = path.dirname(suggestion.targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const constantContent = suggestion.items.map(item => item.content).join('\n');
  const fileContent = `// 自動生成的常量定義文件\n// 生成時間: ${new Date().toISOString()}\n\n${constantContent}\n`;
  
  fs.writeFileSync(suggestion.targetFile, fileContent);
  refactorPlan.createdFiles.push(suggestion.targetFile);
  
  console.log(colorize(`    ✅ 已創建常量文件: ${suggestion.targetFile}`, 'green'));
}

// 提取組件
function executeExtractComponents(suggestion, refactorPlan) {
  if (!fs.existsSync(suggestion.targetDir)) {
    fs.mkdirSync(suggestion.targetDir, { recursive: true });
  }
  
  for (const component of suggestion.items) {
    const componentFile = path.join(suggestion.targetDir, `${component.name}.tsx`);
    const componentContent = `// 自動提取的組件\n// 生成時間: ${new Date().toISOString()}\n\nimport React from 'react';\n\n// TODO: 添加必要的 imports\n// TODO: 添加 props 類型定義\n\n${component.content}\n\nexport default ${component.name};\n`;
    
    fs.writeFileSync(componentFile, componentContent);
    refactorPlan.createdFiles.push(componentFile);
    
    console.log(colorize(`    ✅ 已創建組件文件: ${componentFile}`, 'green'));
  }
}

// 提取 hooks
function executeExtractHooks(suggestion, refactorPlan) {
  if (!fs.existsSync(suggestion.targetDir)) {
    fs.mkdirSync(suggestion.targetDir, { recursive: true });
  }
  
  for (const hook of suggestion.items) {
    const hookFile = path.join(suggestion.targetDir, `${hook.name}.ts`);
    const hookContent = `// 自動提取的 hook\n// 生成時間: ${new Date().toISOString()}\n\nimport { useState, useEffect } from 'react';\n\n// TODO: 添加必要的 imports\n// TODO: 添加類型定義\n\n${hook.content.join('\n')}\n\nexport default ${hook.name};\n`;
    
    fs.writeFileSync(hookFile, hookContent);
    refactorPlan.createdFiles.push(hookFile);
    
    console.log(colorize(`    ✅ 已創建 hook 文件: ${hookFile}`, 'green'));
  }
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(colorize('🔧 自動重構工具', 'bold'));
    console.log('\n使用方法:');
    console.log('  node scripts/auto-refactor.js <file-path> [options]');
    console.log('\n選項:');
    console.log('  --dry-run          只顯示建議，不執行重構');
    console.log('  --skip-types       跳過類型提取');
    console.log('  --skip-constants   跳過常量提取');
    console.log('\n範例:');
    console.log('  node scripts/auto-refactor.js frontend/src/components/pets/lost-pet-form.tsx');
    console.log('  node scripts/auto-refactor.js frontend/src/components/pets/lost-pet-form.tsx --dry-run');
    return;
  }
  
  const filePath = path.resolve(args[0]);
  const options = {
    dryRun: args.includes('--dry-run'),
    skipTypes: args.includes('--skip-types'),
    skipConstants: args.includes('--skip-constants')
  };
  
  if (!fs.existsSync(filePath)) {
    console.error(colorize(`❌ 文件不存在: ${filePath}`, 'red'));
    process.exit(1);
  }
  
  try {
    console.log(colorize(`🔍 分析文件: ${filePath}`, 'blue'));
    const analysis = analyzeFile(filePath);
    
    console.log(colorize(`\n📊 文件分析結果:`, 'bold'));
    console.log(`  總行數: ${analysis.totalLines}`);
    console.log(`  導入語句: ${analysis.imports.length}`);
    console.log(`  函數: ${analysis.functions.length}`);
    console.log(`  組件: ${analysis.components.length}`);
    console.log(`  接口: ${analysis.interfaces.length}`);
    console.log(`  類型: ${analysis.types.length}`);
    console.log(`  常量: ${analysis.constants.length}`);
    
    const suggestions = generateRefactorSuggestions(filePath, analysis);
    
    if (suggestions.length === 0) {
      console.log(colorize('\n✅ 此文件不需要重構', 'green'));
      return;
    }
    
    console.log(colorize(`\n💡 重構建議 (${suggestions.length} 項):`, 'bold'));
    suggestions.forEach((suggestion, index) => {
      const priority = suggestion.priority === 'high' ? '🔴' : '🟡';
      console.log(`  ${priority} ${index + 1}. ${suggestion.description}`);
      if (suggestion.targetFile) {
        console.log(`     目標文件: ${suggestion.targetFile}`);
      }
      if (suggestion.targetDir) {
        console.log(`     目標目錄: ${suggestion.targetDir}`);
      }
      console.log(`     影響項目: ${suggestion.items.length} 個`);
    });
    
    if (options.dryRun) {
      console.log(colorize('\n🔍 這是預覽模式，沒有執行實際重構', 'yellow'));
      return;
    }
    
    console.log(colorize('\n⚠️ 即將開始重構，請確保已提交當前更改', 'yellow'));
    
    // 在實際項目中，這裡可以添加用戶確認
    const refactorPlan = executeRefactor(filePath, suggestions, options);
    
    console.log(colorize('\n🎉 重構完成！請檢查生成的文件並進行必要的調整', 'green'));
    console.log(colorize('💡 建議運行測試確保功能正常', 'blue'));
    
  } catch (error) {
    console.error(colorize(`❌ 重構失敗: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  generateRefactorSuggestions,
  executeRefactor
};