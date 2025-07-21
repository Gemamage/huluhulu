#!/bin/bash

# 呼嚕寵物協尋網站 - 開發環境設置腳本
# 此腳本會自動設置開發環境並啟動所有必要的服務

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：印出彩色訊息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 函數：檢查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函數：檢查 Node.js 版本
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_message "✅ Node.js 版本: v$NODE_VERSION" "$GREEN"
            return 0
        else
            print_message "❌ Node.js 版本過舊: v$NODE_VERSION (需要 >= 18.0.0)" "$RED"
            return 1
        fi
    else
        print_message "❌ 未安裝 Node.js" "$RED"
        return 1
    fi
}

# 函數：檢查 Docker
check_docker() {
    if command_exists docker && command_exists docker-compose; then
        if docker info >/dev/null 2>&1; then
            print_message "✅ Docker 已安裝且正在運行" "$GREEN"
            return 0
        else
            print_message "❌ Docker 已安裝但未運行" "$RED"
            return 1
        fi
    else
        print_message "❌ 未安裝 Docker 或 Docker Compose" "$RED"
        return 1
    fi
}

# 函數：建立環境變數檔案
setup_env_files() {
    print_message "🔧 設置環境變數檔案..." "$BLUE"
    
    # 後端環境變數
    if [ ! -f "backend/.env" ]; then
        cp .env.example backend/.env
        print_message "✅ 建立 backend/.env" "$GREEN"
    else
        print_message "ℹ️  backend/.env 已存在" "$YELLOW"
    fi
    
    # 前端環境變數
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
        print_message "✅ 建立 frontend/.env.local" "$GREEN"
    else
        print_message "ℹ️  frontend/.env.local 已存在" "$YELLOW"
    fi
}

# 函數：安裝依賴套件
install_dependencies() {
    print_message "📦 安裝依賴套件..." "$BLUE"
    
    # 安裝後端依賴
    print_message "📦 安裝後端依賴套件..." "$BLUE"
    cd backend
    npm install
    cd ..
    print_message "✅ 後端依賴套件安裝完成" "$GREEN"
    
    # 安裝前端依賴
    print_message "📦 安裝前端依賴套件..." "$BLUE"
    cd frontend
    npm install
    cd ..
    print_message "✅ 前端依賴套件安裝完成" "$GREEN"
}

# 函數：啟動資料庫服務
start_database() {
    print_message "🗄️  啟動資料庫服務..." "$BLUE"
    
    # 檢查 MongoDB 容器是否已在運行
    if docker ps | grep -q "pet-finder-mongodb"; then
        print_message "ℹ️  MongoDB 容器已在運行" "$YELLOW"
    else
        docker-compose up -d mongodb redis
        print_message "✅ 資料庫服務啟動完成" "$GREEN"
        
        # 等待資料庫啟動
        print_message "⏳ 等待資料庫啟動..." "$BLUE"
        sleep 10
    fi
}

# 函數：執行資料庫遷移
run_migrations() {
    print_message "🔄 執行資料庫初始化..." "$BLUE"
    
    # 這裡可以加入資料庫遷移腳本
    # 目前使用 init-mongo.js 進行初始化
    
    print_message "✅ 資料庫初始化完成" "$GREEN"
}

# 函數：啟動開發伺服器
start_dev_servers() {
    print_message "🚀 啟動開發伺服器..." "$BLUE"
    
    # 建立日誌目錄
    mkdir -p logs
    
    # 啟動後端伺服器（背景執行）
    print_message "🔧 啟動後端伺服器..." "$BLUE"
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待後端啟動
    sleep 5
    
    # 檢查後端是否啟動成功
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_message "✅ 後端伺服器啟動成功 (PID: $BACKEND_PID)" "$GREEN"
    else
        print_message "❌ 後端伺服器啟動失敗" "$RED"
        print_message "📋 檢查日誌: tail -f logs/backend.log" "$YELLOW"
        exit 1
    fi
    
    # 啟動前端伺服器（背景執行）
    print_message "🎨 啟動前端伺服器..." "$BLUE"
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端啟動
    sleep 10
    
    # 檢查前端是否啟動成功
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_message "✅ 前端伺服器啟動成功 (PID: $FRONTEND_PID)" "$GREEN"
    else
        print_message "❌ 前端伺服器啟動失敗" "$RED"
        print_message "📋 檢查日誌: tail -f logs/frontend.log" "$YELLOW"
        exit 1
    fi
    
    # 儲存 PID 到檔案
    echo $BACKEND_PID > logs/backend.pid
    echo $FRONTEND_PID > logs/frontend.pid
}

# 函數：顯示啟動資訊
show_startup_info() {
    print_message "" ""
    print_message "🎉 開發環境啟動完成！" "$GREEN"
    print_message "" ""
    print_message "📱 前端應用程式: http://localhost:3000" "$BLUE"
    print_message "🔧 後端 API: http://localhost:3001" "$BLUE"
    print_message "📊 API 文件: http://localhost:3001/api-docs" "$BLUE"
    print_message "🗄️  MongoDB: mongodb://localhost:27017" "$BLUE"
    print_message "🔴 Redis: redis://localhost:6379" "$BLUE"
    print_message "" ""
    print_message "📋 有用的命令:" "$YELLOW"
    print_message "  - 查看後端日誌: tail -f logs/backend.log" "$YELLOW"
    print_message "  - 查看前端日誌: tail -f logs/frontend.log" "$YELLOW"
    print_message "  - 停止服務: ./scripts/dev-stop.sh" "$YELLOW"
    print_message "  - 重啟服務: ./scripts/dev-restart.sh" "$YELLOW"
    print_message "" ""
    print_message "💡 提示: 按 Ctrl+C 停止此腳本，但服務會繼續在背景運行" "$YELLOW"
}

# 主要執行流程
main() {
    print_message "🐾 呼嚕寵物協尋網站 - 開發環境設置" "$GREEN"
    print_message "" ""
    
    # 檢查系統需求
    print_message "🔍 檢查系統需求..." "$BLUE"
    
    if ! check_node_version; then
        print_message "請安裝 Node.js 18 或更新版本" "$RED"
        exit 1
    fi
    
    if ! check_docker; then
        print_message "請安裝並啟動 Docker" "$RED"
        exit 1
    fi
    
    # 設置環境
    setup_env_files
    install_dependencies
    start_database
    run_migrations
    start_dev_servers
    show_startup_info
    
    # 保持腳本運行
    print_message "按 Ctrl+C 停止監控..." "$YELLOW"
    while true; do
        sleep 1
    done
}

# 捕捉中斷信號
trap 'print_message "\n👋 開發環境監控已停止，但服務仍在背景運行" "$YELLOW"; exit 0' INT

# 執行主程式
main "$@"