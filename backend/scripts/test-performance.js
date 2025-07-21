#!/usr/bin/env node

/**
 * 測試性能監控腳本
 * 用於測量和比較測試執行性能
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 性能測試配置
const PERFORMANCE_CONFIG = {
  iterations: 3, // 運行次數
  warmup: 1,     // 預熱次數
  timeout: 300000, // 5分鐘超時
};

// 測試場景配置
const TEST_SCENARIOS = {
  unit: {
    name: '單元測試',
    pattern: 'test/models/*.test.ts test/utils/*.test.ts',
    expectedTime: 10000 // 10秒
  },
  service: {
    name: '服務測試',
    pattern: 'test/services/*.test.ts',
    expectedTime: 30000 // 30秒
  },
  route: {
    name: '路由測試',
    pattern: 'test/routes/*.test.ts',
    expectedTime: 60000 // 60秒
  },
  all: {
    name: '全部測試',
    pattern: 'test/**/*.test.ts',
    expectedTime: 120000 // 2分鐘
  }
};

class TestPerformanceMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // 運行性能測試
  async runPerformanceTest(scenario, useOptimized = false) {
    console.log(`\n🚀 開始測試: ${scenario.name} ${useOptimized ? '(優化版)' : '(原版)'}`);
    
    const setupFile = useOptimized ? 'test/setup-optimized.ts' : 'test/setup.ts';
    const jestConfig = useOptimized ? 'jest.config.js' : 'jest.config.original.js';
    
    const results = [];
    
    // 預熱運行
    if (PERFORMANCE_CONFIG.warmup > 0) {
      console.log('🔥 預熱中...');
      try {
        await this.runSingleTest(scenario.pattern, setupFile, jestConfig, true);
      } catch (error) {
        console.warn('預熱失敗，繼續執行正式測試');
      }
    }
    
    // 正式測試運行
    for (let i = 0; i < PERFORMANCE_CONFIG.iterations; i++) {
      console.log(`📊 第 ${i + 1}/${PERFORMANCE_CONFIG.iterations} 次運行`);
      
      try {
        const result = await this.runSingleTest(scenario.pattern, setupFile, jestConfig);
        results.push(result);
        
        console.log(`   ⏱️  耗時: ${result.duration}ms`);
        console.log(`   ✅ 通過: ${result.passed}/${result.total}`);
        
      } catch (error) {
        console.error(`   ❌ 運行失敗: ${error.message}`);
        results.push({
          duration: PERFORMANCE_CONFIG.timeout,
          passed: 0,
          total: 0,
          failed: true,
          error: error.message
        });
      }
    }
    
    return this.calculateStats(results, scenario, useOptimized);
  }
  
  // 運行單次測試
  async runSingleTest(pattern, setupFile, jestConfig, isWarmup = false) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const jestArgs = [
        '--config', jestConfig,
        '--setupFilesAfterEnv', setupFile,
        '--testPathPattern', pattern,
        '--verbose=false',
        '--silent=true',
        '--passWithNoTests'
      ];
      
      if (isWarmup) {
        jestArgs.push('--maxWorkers=1');
      }
      
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: PERFORMANCE_CONFIG.timeout
      });
      
      let output = '';
      let errorOutput = '';
      
      jest.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      jest.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          const stats = this.parseJestOutput(output);
          resolve({
            duration,
            passed: stats.passed,
            total: stats.total,
            failed: false
          });
        } else {
          reject(new Error(`Jest 退出碼: ${code}\n${errorOutput}`));
        }
      });
      
      jest.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // 解析 Jest 輸出
  parseJestOutput(output) {
    const passedMatch = output.match(/(\d+) passed/);
    const totalMatch = output.match(/Tests:\s+(\d+) passed/);
    
    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      total: totalMatch ? parseInt(totalMatch[1]) : 0
    };
  }
  
  // 計算統計數據
  calculateStats(results, scenario, useOptimized) {
    const validResults = results.filter(r => !r.failed);
    
    if (validResults.length === 0) {
      return {
        scenario: scenario.name,
        optimized: useOptimized,
        failed: true,
        error: '所有測試運行都失敗了'
      };
    }
    
    const durations = validResults.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    const totalPassed = validResults.reduce((sum, r) => sum + r.passed, 0);
    const totalTests = validResults.reduce((sum, r) => sum + r.total, 0);
    
    return {
      scenario: scenario.name,
      optimized: useOptimized,
      iterations: validResults.length,
      avgDuration: Math.round(avgDuration),
      minDuration,
      maxDuration,
      totalPassed,
      totalTests,
      passRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0,
      performance: this.evaluatePerformance(avgDuration, scenario.expectedTime),
      failed: false
    };
  }
  
  // 評估性能
  evaluatePerformance(actualTime, expectedTime) {
    const ratio = actualTime / expectedTime;
    
    if (ratio <= 0.7) return '🚀 優秀';
    if (ratio <= 1.0) return '✅ 良好';
    if (ratio <= 1.5) return '⚠️ 一般';
    return '❌ 需要優化';
  }
  
  // 生成性能報告
  generateReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 測試性能報告');
    console.log('='.repeat(80));
    
    const originalResults = results.filter(r => !r.optimized);
    const optimizedResults = results.filter(r => r.optimized);
    
    console.log('\n📈 性能對比:');
    console.log('-'.repeat(80));
    console.log('場景\t\t原版(ms)\t優化版(ms)\t改進\t\t性能評級');
    console.log('-'.repeat(80));
    
    for (const original of originalResults) {
      const optimized = optimizedResults.find(r => r.scenario === original.scenario);
      
      if (optimized && !optimized.failed) {
        const improvement = ((original.avgDuration - optimized.avgDuration) / original.avgDuration * 100).toFixed(1);
        const improvementText = improvement > 0 ? `↓${improvement}%` : `↑${Math.abs(improvement)}%`;
        
        console.log(`${original.scenario}\t${original.avgDuration}\t\t${optimized.avgDuration}\t\t${improvementText}\t\t${optimized.performance}`);
      }
    }
    
    // 總體統計
    const totalOriginal = originalResults.reduce((sum, r) => sum + r.avgDuration, 0);
    const totalOptimized = optimizedResults.reduce((sum, r) => sum + r.avgDuration, 0);
    const totalImprovement = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
    
    console.log('-'.repeat(80));
    console.log(`總計\t\t${totalOriginal}\t\t${totalOptimized}\t\t↓${totalImprovement}%`);
    
    // 保存報告到文件
    this.saveReportToFile(results);
  }
  
  // 保存報告到文件
  saveReportToFile(results) {
    const reportPath = path.join(__dirname, '..', 'test-performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalScenarios: Object.keys(TEST_SCENARIOS).length,
        totalIterations: PERFORMANCE_CONFIG.iterations,
        executionTime: Date.now() - this.startTime
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細報告已保存到: ${reportPath}`);
  }
}

// 主執行函數
async function main() {
  console.log('🎯 開始測試性能監控');
  console.log(`配置: ${PERFORMANCE_CONFIG.iterations} 次迭代, ${PERFORMANCE_CONFIG.warmup} 次預熱`);
  
  const monitor = new TestPerformanceMonitor();
  const results = [];
  
  // 備份原始配置
  const originalConfigPath = path.join(__dirname, '..', 'jest.config.js');
  const backupConfigPath = path.join(__dirname, '..', 'jest.config.original.js');
  
  if (fs.existsSync(originalConfigPath) && !fs.existsSync(backupConfigPath)) {
    fs.copyFileSync(originalConfigPath, backupConfigPath);
    console.log('✅ 已備份原始 Jest 配置');
  }
  
  try {
    // 測試每個場景
    for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
      // 測試原版
      const originalResult = await monitor.runPerformanceTest(scenario, false);
      results.push(originalResult);
      
      // 測試優化版
      const optimizedResult = await monitor.runPerformanceTest(scenario, true);
      results.push(optimizedResult);
    }
    
    // 生成報告
    monitor.generateReport(results);
    
  } catch (error) {
    console.error('❌ 性能測試失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TestPerformanceMonitor, TEST_SCENARIOS, PERFORMANCE_CONFIG };