# 代碼品質工具使用指南

本項目提供了一套完整的代碼品質管理工具，幫助您維護高品質的代碼庫。

## 🛠️ 工具概覽

### 1. 代碼品質檢查工具 (`code-quality-check.js`)
自動檢測代碼文件長度、複雜度和潛在問題。

### 2. 自動重構工具 (`auto-refactor.js`)
幫助將大型文件拆分為更小、更易維護的模塊。

### 3. Git Hooks 管理工具 (`setup-git-hooks.js`)
設置自動化的代碼品質檢查流程。

### 4. 品質儀表板 (`quality-dashboard.js`)
生成可視化的代碼品質報告和趨勢分析。

## 📋 可用命令

### 代碼品質檢查
```bash
# 基本品質檢查
npm run quality:check

# 生成詳細報告
npm run quality:report

# 修復代碼風格問題
npm run quality:fix

# 嚴格模式檢查
npm run refactor:check

# 完整品質檢查（包含儀表板）
npm run quality:full
```

### 自動重構
```bash
# 預覽重構建議（不執行實際重構）
npm run refactor:preview

# 自動重構指定文件
npm run refactor:auto <file-path>

# 範例：重構 lost-pet-form.tsx
npm run refactor:auto frontend/src/components/pets/lost-pet-form.tsx

# 預覽模式
npm run refactor:auto frontend/src/components/pets/lost-pet-form.tsx --dry-run
```

### Git Hooks 管理
```bash
# 設置 Git hooks
npm run hooks:setup

# 檢查 hooks 狀態
npm run hooks:check

# 測試 hooks
npm run hooks:test

# 移除 hooks
npm run hooks:remove
```

### 品質儀表板
```bash
# 顯示品質儀表板
npm run dashboard

# 顯示品質趨勢
npm run dashboard:trends
```

## 🎯 使用流程

### 日常開發流程

1. **開始開發前**
   ```bash
   # 檢查當前代碼品質
   npm run quality:check
   
   # 查看儀表板
   npm run dashboard
   ```

2. **開發過程中**
   ```bash
   # 定期檢查代碼品質
   npm run quality:check
   
   # 修復代碼風格問題
   npm run quality:fix
   ```

3. **提交前**
   ```bash
   # Git hooks 會自動執行以下檢查：
   # - 代碼品質檢查
   # - 代碼風格檢查
   # - 測試
   # - 提交訊息格式檢查
   ```

4. **推送前**
   ```bash
   # Git hooks 會自動執行：
   # - 完整測試套件
   # - 構建檢查
   ```

### 重構流程

1. **識別需要重構的文件**
   ```bash
   npm run quality:check
   ```

2. **預覽重構建議**
   ```bash
   npm run refactor:auto <file-path> --dry-run
   ```

3. **執行重構**
   ```bash
   npm run refactor:auto <file-path>
   ```

4. **驗證重構結果**
   ```bash
   npm test
   npm run lint
   npm run quality:check
   ```

## 📊 品質標準

### 文件大小限制
- **警告線**: 550 行
- **限制線**: 600 行
- **建議**: 單個文件不超過 600 行

### 複雜度指標
- **函數數量**: 單文件不超過 20 個函數
- **組件數量**: 單文件建議只包含 1 個主要組件
- **導入語句**: 合理組織，避免過多依賴

### 測試覆蓋率目標
- **最低要求**: 50%
- **良好標準**: 70%
- **優秀標準**: 90%+

### 品質評分標準
- **A+ (90-100)**: 🏆 優秀
- **A (80-89)**: ✨ 良好
- **B+ (70-79)**: 👍 合格
- **B (60-69)**: 👌 可接受
- **C+ (50-59)**: ⚠️ 需要改進
- **C (40-49)**: ⚠️ 有問題
- **D (30-39)**: 😟 嚴重問題
- **F (0-29)**: 💥 需要重構

## 🔧 工具配置

### 代碼品質檢查配置
文件: `scripts/code-quality-check.js`

```javascript
const CONFIG = {
  maxLines: 600,           // 最大行數限制
  warningLines: 550,       // 警告行數
  excludeDirs: [           // 排除的目錄
    'node_modules', 
    '.git', 
    'dist', 
    'build', 
    '.next', 
    'coverage'
  ],
  includeExtensions: [     // 包含的文件類型
    '.ts', '.tsx', '.js', '.jsx'
  ]
};
```

### Git Hooks 配置

#### Pre-commit Hook
- 代碼品質檢查
- 代碼風格檢查 (ESLint)
- 單元測試
- 提交訊息格式檢查

#### Pre-push Hook
- 完整測試套件
- 構建檢查
- 大型文件警告

#### Commit Message 格式
```
<type>(<scope>): <description>

類型 (type):
- feat:     新功能
- fix:      修復 bug
- docs:     文檔更新
- style:    代碼格式調整
- refactor: 重構代碼
- test:     測試相關
- chore:    其他雜項

範例:
feat(auth): 添加用戶登錄功能
fix(api): 修復寵物搜索 API 錯誤
docs: 更新 README 文檔
```

## 📈 報告和分析

### 品質報告文件
- `code-quality-report.json`: 詳細的代碼品質報告
- `quality-reports/`: 歷史報告目錄
- `quality-reports/latest-report.json`: 最新報告

### 儀表板功能
- 總體品質評分
- 項目統計信息
- Git 統計信息
- 依賴統計
- 測試覆蓋率
- 代碼品質問題列表
- 改進建議
- 趨勢分析

## 🚀 最佳實踐

### 1. 定期檢查
- 每日運行 `npm run quality:check`
- 每週查看 `npm run dashboard`
- 每月分析 `npm run dashboard:trends`

### 2. 重構策略
- 優先處理超過 600 行的文件
- 按照重構指南逐步拆分
- 重構後立即運行測試

### 3. 團隊協作
- 所有團隊成員都應設置 Git hooks
- 定期分享品質報告
- 建立代碼審查流程

### 4. 持續改進
- 根據趨勢分析調整開發策略
- 定期更新品質標準
- 收集團隊反饋優化工具

## 🔍 故障排除

### 常見問題

#### 1. Git hooks 不工作
```bash
# 檢查 hooks 狀態
npm run hooks:check

# 重新設置 hooks
npm run hooks:setup

# 測試 hooks
npm run hooks:test
```

#### 2. 代碼品質檢查失敗
```bash
# 查看詳細錯誤
npm run quality:check

# 修復代碼風格
npm run quality:fix

# 查看具體問題
cat code-quality-report.json
```

#### 3. 重構工具錯誤
```bash
# 使用預覽模式檢查
npm run refactor:auto <file-path> --dry-run

# 檢查備份文件
ls refactor-backup/
```

#### 4. 測試覆蓋率數據缺失
```bash
# 運行測試生成覆蓋率報告
npm run test:coverage

# 檢查覆蓋率文件
ls frontend/coverage/
ls backend/coverage/
```

## 📚 相關文檔

- [代碼品質增強計劃](./CODE_QUALITY_ENHANCEMENT.md)
- [重構指南](./REFACTORING_GUIDE.md)
- [Netlify 部署指南](./NETLIFY_DEPLOYMENT.md)
- [項目 README](./README.md)

## 🤝 貢獻

如果您有改進建議或發現問題，請：

1. 創建 Issue 描述問題
2. 提交 Pull Request 包含改進
3. 更新相關文檔
4. 確保所有品質檢查通過

---

**記住**: 代碼品質是一個持續改進的過程。這些工具幫助您維護高標準，但最重要的是團隊的共同努力和持續學習。