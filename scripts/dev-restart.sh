#!/bin/bash

# 呼嚕寵物協尋網站 - 重啟開發服務腳本

set -e

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

# 函數：顯示幫助資訊
show_help() {
    print_message "" ""
    print_message "🐾 呼嚕寵物協尋網站 - 重啟開發服務" "$GREEN"
    print_message "" ""
    print_message "使用方法:" "$BLUE"
    print_message "  ./scripts/dev-restart.sh [選項]" "$YELLOW"
    print_message "" ""
    print_message "選項:" "$BLUE"
    print_message "  --help              顯示此幫助資訊" "$YELLOW"
    print_message "  --clean             重啟前清理快取和日誌" "$YELLOW"
    print_message "  --frontend-only     只重啟前端服務" "$YELLOW"
    print_message "  --backend-only      只重啟後端服務" "$YELLOW"
    print_message "  --no-docker         不重啟 Docker 服務" "$YELLOW"
    print_message "  --quick             快速重啟（不重新安裝依賴）" "$YELLOW"
    print_message "" ""
    print_message "範例:" "$BLUE"
    print_message "  ./scripts/dev-restart.sh                 # 完整重啟" "$YELLOW"
    print_message "  ./scripts/dev-restart.sh --clean         # 清理後重啟" "$YELLOW"
    print_message "  ./scripts/dev-restart.sh --frontend-only # 只重啟前端" "$YELLOW"
    print_message "  ./scripts/dev-restart.sh --quick         # 快速重啟" "$YELLOW"
    print_message "" ""
}

# 函數：檢查腳本是否存在
check_scripts() {
    if [ ! -f "scripts/dev-stop.sh" ]; then
        print_message "❌ 找不到 dev-stop.sh 腳本" "$RED"
        exit 1
    fi
    
    if [ ! -f "scripts/dev-setup.sh" ]; then
        print_message "❌ 找不到 dev-setup.sh 腳本" "$RED"
        exit 1
    fi
    
    # 確保腳本有執行權限
    chmod +x scripts/dev-stop.sh
    chmod +x scripts/dev-setup.sh
}

# 函數：停止服務
stop_services() {
    local stop_args=""
    
    if [ "$CLEAN" = true ]; then
        stop_args="--clean-logs --clean-cache"
    fi
    
    if [ "$NO_DOCKER" = true ]; then
        stop_args="$stop_args --keep-docker"
    fi
    
    print_message "🛑 停止現有服務..." "$BLUE"
    ./scripts/dev-stop.sh $stop_args
}

# 函數：重啟特定服務
restart_specific_service() {
    local service=$1
    
    print_message "🔄 重啟 ${service} 服務..." "$BLUE"
    
    if [ "$service" = "frontend" ]; then
        # 停止前端服務
        if [ -f "logs/frontend.pid" ]; then
            FRONTEND_PID=$(cat logs/frontend.pid)
            if ps -p $FRONTEND_PID > /dev/null 2>&1; then
                kill $FRONTEND_PID
                print_message "✅ 前端服務已停止" "$GREEN"
            fi
            rm -f logs/frontend.pid
        fi
        
        # 重新安裝依賴（如果不是快速重啟）
        if [ "$QUICK" = false ]; then
            print_message "📦 重新安裝前端依賴..." "$BLUE"
            cd frontend
            npm install
            cd ..
        fi
        
        # 啟動前端服務
        print_message "🎨 啟動前端服務..." "$BLUE"
        mkdir -p logs
        cd frontend
        npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        cd ..
        
        # 等待啟動
        sleep 10
        
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_message "✅ 前端服務重啟成功" "$GREEN"
        else
            print_message "❌ 前端服務重啟失敗" "$RED"
            exit 1
        fi
        
    elif [ "$service" = "backend" ]; then
        # 停止後端服務
        if [ -f "logs/backend.pid" ]; then
            BACKEND_PID=$(cat logs/backend.pid)
            if ps -p $BACKEND_PID > /dev/null 2>&1; then
                kill $BACKEND_PID
                print_message "✅ 後端服務已停止" "$GREEN"
            fi
            rm -f logs/backend.pid
        fi
        
        # 重新安裝依賴（如果不是快速重啟）
        if [ "$QUICK" = false ]; then
            print_message "📦 重新安裝後端依賴..." "$BLUE"
            cd backend
            npm install
            cd ..
        fi
        
        # 啟動後端服務
        print_message "🔧 啟動後端服務..." "$BLUE"
        mkdir -p logs
        cd backend
        npm run dev > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../logs/backend.pid
        cd ..
        
        # 等待啟動
        sleep 5
        
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            print_message "✅ 後端服務重啟成功" "$GREEN"
        else
            print_message "❌ 後端服務重啟失敗" "$RED"
            exit 1
        fi
    fi
}

# 函數：完整重啟
full_restart() {
    print_message "🔄 執行完整重啟..." "$BLUE"
    
    # 停止所有服務
    stop_services
    
    # 等待一下確保服務完全停止
    sleep 2
    
    # 重新啟動
    if [ "$QUICK" = true ]; then
        print_message "⚡ 快速重啟模式" "$YELLOW"
        # 快速重啟邏輯
        restart_specific_service "backend"
        restart_specific_service "frontend"
    else
        print_message "🚀 完整重啟模式" "$BLUE"
        # 使用完整的設置腳本
        ./scripts/dev-setup.sh
    fi
}

# 函數：顯示重啟後的狀態
show_restart_status() {
    print_message "" ""
    print_message "📊 重啟後狀態:" "$BLUE"
    
    # 檢查服務狀態
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_message "✅ 前端服務: http://localhost:3000" "$GREEN"
    else
        print_message "❌ 前端服務未運行" "$RED"
    fi
    
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_message "✅ 後端服務: http://localhost:3001" "$GREEN"
    else
        print_message "❌ 後端服務未運行" "$RED"
    fi
    
    # 檢查 Docker 服務
    if docker ps | grep -q "pet-finder-mongodb"; then
        print_message "✅ MongoDB 服務正在運行" "$GREEN"
    else
        print_message "⚠️  MongoDB 服務未運行" "$YELLOW"
    fi
    
    if docker ps | grep -q "pet-finder-redis"; then
        print_message "✅ Redis 服務正在運行" "$GREEN"
    else
        print_message "⚠️  Redis 服務未運行" "$YELLOW"
    fi
    
    print_message "" ""
    print_message "📋 有用的命令:" "$YELLOW"
    print_message "  - 查看後端日誌: tail -f logs/backend.log" "$YELLOW"
    print_message "  - 查看前端日誌: tail -f logs/frontend.log" "$YELLOW"
    print_message "  - 停止服務: ./scripts/dev-stop.sh" "$YELLOW"
    print_message "" ""
}

# 主要執行流程
main() {
    # 解析命令行參數
    CLEAN=false
    FRONTEND_ONLY=false
    BACKEND_ONLY=false
    NO_DOCKER=false
    QUICK=false
    
    for arg in "$@"; do
        case $arg in
            --help)
                show_help
                exit 0
                ;;
            --clean)
                CLEAN=true
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                ;;
            --backend-only)
                BACKEND_ONLY=true
                ;;
            --no-docker)
                NO_DOCKER=true
                ;;
            --quick)
                QUICK=true
                ;;
            *)
                print_message "未知選項: $arg" "$RED"
                print_message "使用 --help 查看可用選項" "$YELLOW"
                exit 1
                ;;
        esac
    done
    
    print_message "🔄 呼嚕寵物協尋網站 - 重啟開發服務" "$GREEN"
    print_message "" ""
    
    # 檢查必要的腳本
    check_scripts
    
    # 根據參數執行不同的重啟邏輯
    if [ "$FRONTEND_ONLY" = true ]; then
        print_message "🎨 只重啟前端服務" "$BLUE"
        restart_specific_service "frontend"
    elif [ "$BACKEND_ONLY" = true ]; then
        print_message "🔧 只重啟後端服務" "$BLUE"
        restart_specific_service "backend"
    else
        full_restart
    fi
    
    # 顯示重啟後狀態
    show_restart_status
    
    print_message "✅ 重啟完成！" "$GREEN"
}

# 執行主程式
main "$@"