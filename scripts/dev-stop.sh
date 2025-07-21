#!/bin/bash

# 呼嚕寵物協尋網站 - 停止開發服務腳本

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

# 函數：停止 Node.js 進程
stop_node_processes() {
    print_message "🛑 停止 Node.js 開發伺服器..." "$BLUE"
    
    # 停止後端伺服器
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID
            print_message "✅ 後端伺服器已停止 (PID: $BACKEND_PID)" "$GREEN"
        else
            print_message "ℹ️  後端伺服器進程不存在" "$YELLOW"
        fi
        rm -f logs/backend.pid
    fi
    
    # 停止前端伺服器
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID
            print_message "✅ 前端伺服器已停止 (PID: $FRONTEND_PID)" "$GREEN"
        else
            print_message "ℹ️  前端伺服器進程不存在" "$YELLOW"
        fi
        rm -f logs/frontend.pid
    fi
    
    # 強制停止所有相關的 Node.js 進程
    print_message "🔍 檢查其他相關進程..." "$BLUE"
    
    # 停止可能的 Next.js 進程
    pkill -f "next dev" 2>/dev/null || true
    
    # 停止可能的 Node.js 開發伺服器
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "node.*dev" 2>/dev/null || true
    
    print_message "✅ 所有 Node.js 開發伺服器已停止" "$GREEN"
}

# 函數：停止 Docker 服務
stop_docker_services() {
    print_message "🐳 停止 Docker 服務..." "$BLUE"
    
    # 檢查是否有運行的容器
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        print_message "✅ Docker 服務已停止" "$GREEN"
    else
        print_message "ℹ️  沒有運行中的 Docker 服務" "$YELLOW"
    fi
}

# 函數：清理暫存檔案
cleanup_temp_files() {
    print_message "🧹 清理暫存檔案..." "$BLUE"
    
    # 清理日誌檔案（可選）
    if [ "$1" = "--clean-logs" ]; then
        rm -f logs/*.log
        print_message "✅ 日誌檔案已清理" "$GREEN"
    fi
    
    # 清理 PID 檔案
    rm -f logs/*.pid
    
    # 清理 Node.js 快取（可選）
    if [ "$1" = "--clean-cache" ]; then
        print_message "🗑️  清理 Node.js 快取..." "$BLUE"
        cd frontend && npm run clean 2>/dev/null || true && cd ..
        cd backend && npm run clean 2>/dev/null || true && cd ..
        print_message "✅ 快取已清理" "$GREEN"
    fi
    
    print_message "✅ 暫存檔案清理完成" "$GREEN"
}

# 函數：顯示狀態
show_status() {
    print_message "" ""
    print_message "📊 服務狀態檢查:" "$BLUE"
    
    # 檢查端口是否還在使用
    if lsof -i :3000 >/dev/null 2>&1; then
        print_message "⚠️  端口 3000 仍在使用中" "$YELLOW"
        lsof -i :3000
    else
        print_message "✅ 端口 3000 已釋放" "$GREEN"
    fi
    
    if lsof -i :3001 >/dev/null 2>&1; then
        print_message "⚠️  端口 3001 仍在使用中" "$YELLOW"
        lsof -i :3001
    else
        print_message "✅ 端口 3001 已釋放" "$GREEN"
    fi
    
    # 檢查 Docker 容器狀態
    if docker ps | grep -q "pet-finder"; then
        print_message "ℹ️  Docker 容器狀態:" "$BLUE"
        docker ps --filter "name=pet-finder" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_message "✅ 沒有運行中的 Docker 容器" "$GREEN"
    fi
}

# 函數：顯示幫助資訊
show_help() {
    print_message "" ""
    print_message "🐾 呼嚕寵物協尋網站 - 停止開發服務" "$GREEN"
    print_message "" ""
    print_message "使用方法:" "$BLUE"
    print_message "  ./scripts/dev-stop.sh [選項]" "$YELLOW"
    print_message "" ""
    print_message "選項:" "$BLUE"
    print_message "  --help              顯示此幫助資訊" "$YELLOW"
    print_message "  --clean-logs        同時清理日誌檔案" "$YELLOW"
    print_message "  --clean-cache       同時清理 Node.js 快取" "$YELLOW"
    print_message "  --keep-docker       保持 Docker 服務運行" "$YELLOW"
    print_message "  --force             強制停止所有相關進程" "$YELLOW"
    print_message "" ""
    print_message "範例:" "$BLUE"
    print_message "  ./scripts/dev-stop.sh                    # 正常停止" "$YELLOW"
    print_message "  ./scripts/dev-stop.sh --clean-logs       # 停止並清理日誌" "$YELLOW"
    print_message "  ./scripts/dev-stop.sh --keep-docker      # 只停止 Node.js 服務" "$YELLOW"
    print_message "" ""
}

# 主要執行流程
main() {
    # 解析命令行參數
    CLEAN_LOGS=false
    CLEAN_CACHE=false
    KEEP_DOCKER=false
    FORCE=false
    
    for arg in "$@"; do
        case $arg in
            --help)
                show_help
                exit 0
                ;;
            --clean-logs)
                CLEAN_LOGS=true
                ;;
            --clean-cache)
                CLEAN_CACHE=true
                ;;
            --keep-docker)
                KEEP_DOCKER=true
                ;;
            --force)
                FORCE=true
                ;;
            *)
                print_message "未知選項: $arg" "$RED"
                print_message "使用 --help 查看可用選項" "$YELLOW"
                exit 1
                ;;
        esac
    done
    
    print_message "🛑 停止呼嚕寵物協尋網站開發服務..." "$BLUE"
    print_message "" ""
    
    # 停止 Node.js 進程
    stop_node_processes
    
    # 停止 Docker 服務（除非指定保持）
    if [ "$KEEP_DOCKER" = false ]; then
        stop_docker_services
    else
        print_message "ℹ️  保持 Docker 服務運行" "$YELLOW"
    fi
    
    # 清理暫存檔案
    if [ "$CLEAN_LOGS" = true ]; then
        cleanup_temp_files --clean-logs
    elif [ "$CLEAN_CACHE" = true ]; then
        cleanup_temp_files --clean-cache
    else
        cleanup_temp_files
    fi
    
    # 強制清理（如果指定）
    if [ "$FORCE" = true ]; then
        print_message "💪 強制清理所有相關進程..." "$BLUE"
        pkill -f "pet-finder" 2>/dev/null || true
        pkill -f "next" 2>/dev/null || true
        pkill -f "3000\|3001" 2>/dev/null || true
        print_message "✅ 強制清理完成" "$GREEN"
    fi
    
    # 顯示最終狀態
    show_status
    
    print_message "" ""
    print_message "✅ 開發服務停止完成！" "$GREEN"
    print_message "" ""
    print_message "💡 提示:" "$YELLOW"
    print_message "  - 重新啟動: ./scripts/dev-setup.sh" "$YELLOW"
    print_message "  - 重啟服務: ./scripts/dev-restart.sh" "$YELLOW"
    print_message "" ""
}

# 執行主程式
main "$@"