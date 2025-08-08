@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo === 盲盒商城Docker部署脚本 ===

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker未安装，请先安装Docker
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

REM 显示帮助信息
if "%1"=="help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="" goto :show_help

REM 主逻辑
if "%1"=="build" goto :build_image
if "%1"=="start" goto :start_service
if "%1"=="stop" goto :stop_service
if "%1"=="restart" goto :restart_service
if "%1"=="logs" goto :show_logs
if "%1"=="status" goto :show_status
if "%1"=="clean" goto :clean_up

echo 未知命令: %1
echo 使用 'docker-deploy.bat help' 查看帮助
pause
exit /b 1

:show_help
echo 用法: docker-deploy.bat [命令]
echo.
echo 命令:
echo   build     构建Docker镜像
echo   start     启动服务
echo   stop      停止服务
echo   restart   重启服务
echo   logs      查看日志
echo   status    查看服务状态
echo   clean     清理容器和镜像
echo   help      显示此帮助信息
echo.
echo 示例:
echo   docker-deploy.bat build    # 构建镜像
echo   docker-deploy.bat start    # 启动服务
echo   docker-deploy.bat logs     # 查看日志
pause
exit /b 0

:build_image
echo 正在构建Docker镜像...
docker-compose build --no-cache
if errorlevel 1 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
) else (
    echo ✅ 镜像构建成功
)
pause
exit /b 0

:start_service
echo 正在启动服务...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
) else (
    echo ✅ 服务启动成功
    echo 🌐 访问地址: http://localhost:7001
    echo 📊 健康检查: http://localhost:7001/api/health
    echo 📝 查看日志: docker-deploy.bat logs
)
pause
exit /b 0

:stop_service
echo 正在停止服务...
docker-compose down
if errorlevel 1 (
    echo ❌ 停止服务失败
    pause
    exit /b 1
) else (
    echo ✅ 服务已停止
)
pause
exit /b 0

:restart_service
echo 正在重启服务...
docker-compose restart
if errorlevel 1 (
    echo ❌ 服务重启失败
    pause
    exit /b 1
) else (
    echo ✅ 服务重启成功
)
pause
exit /b 0

:show_logs
echo 正在查看服务日志...
docker-compose logs -f
exit /b 0

:show_status
echo 正在查看服务状态...
docker-compose ps
echo.
echo 容器健康状态:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
pause
exit /b 0

:clean_up
echo 正在清理容器和镜像...
docker-compose down --rmi all --volumes --remove-orphans
if errorlevel 1 (
    echo ❌ 清理失败
    pause
    exit /b 1
) else (
    echo ✅ 清理完成
)
pause
exit /b 0 