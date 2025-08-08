#!/bin/bash

# 盲盒商城Docker部署脚本

echo "=== 盲盒商城Docker部署脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 函数：显示帮助信息
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  build     构建Docker镜像"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志"
    echo "  status    查看服务状态"
    echo "  clean     清理容器和镜像"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build    # 构建镜像"
    echo "  $0 start    # 启动服务"
    echo "  $0 logs     # 查看日志"
}

# 函数：构建镜像
build_image() {
    echo "正在构建Docker镜像..."
    docker-compose build --no-cache
    if [ $? -eq 0 ]; then
        echo "✅ 镜像构建成功"
    else
        echo "❌ 镜像构建失败"
        exit 1
    fi
}

# 函数：启动服务
start_service() {
    echo "正在启动服务..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo "✅ 服务启动成功"
        echo "🌐 访问地址: http://localhost:7001"
        echo "📊 健康检查: http://localhost:7001/api/health"
        echo "📝 查看日志: $0 logs"
    else
        echo "❌ 服务启动失败"
        exit 1
    fi
}

# 函数：停止服务
stop_service() {
    echo "正在停止服务..."
    docker-compose down
    if [ $? -eq 0 ]; then
        echo "✅ 服务已停止"
    else
        echo "❌ 停止服务失败"
        exit 1
    fi
}

# 函数：重启服务
restart_service() {
    echo "正在重启服务..."
    docker-compose restart
    if [ $? -eq 0 ]; then
        echo "✅ 服务重启成功"
    else
        echo "❌ 服务重启失败"
        exit 1
    fi
}

# 函数：查看日志
show_logs() {
    echo "正在查看服务日志..."
    docker-compose logs -f
}

# 函数：查看状态
show_status() {
    echo "正在查看服务状态..."
    docker-compose ps
    echo ""
    echo "容器健康状态:"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

# 函数：清理
clean_up() {
    echo "正在清理容器和镜像..."
    docker-compose down --rmi all --volumes --remove-orphans
    if [ $? -eq 0 ]; then
        echo "✅ 清理完成"
    else
        echo "❌ 清理失败"
        exit 1
    fi
}

# 主逻辑
case "$1" in
    "build")
        build_image
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        restart_service
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_up
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        echo "请指定命令，使用 '$0 help' 查看帮助"
        exit 1
        ;;
    *)
        echo "未知命令: $1"
        echo "使用 '$0 help' 查看帮助"
        exit 1
        ;;
esac 