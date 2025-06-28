@echo off
setlocal enabledelayedexpansion

REM Fantasy Record Backend 部署脚本 (Windows)
REM 使用方法: deploy.bat [deploy|status|logs|cleanup] [dev|prod]

set "command=%1"
set "env=%2"
if "%env%"=="" set "env=dev"

REM 颜色定义 (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印带颜色的消息
:print_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM 检查 Docker 和 Docker Compose
:check_dependencies
call :print_info "检查依赖..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker 未安装，请先安装 Docker Desktop"
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit /b 1
)

call :print_success "依赖检查通过"
goto :eof

REM 检查环境文件
:check_env_files
call :print_info "检查环境配置..."

if "%env%"=="prod" (
    REM 生产环境检查密钥文件
    if not exist "secrets" (
        call :print_error "secrets 目录不存在，请创建并配置密钥文件"
        exit /b 1
    )
    
    if not exist "secrets\mysql_root_password.txt" (
        call :print_error "密钥文件 secrets\mysql_root_password.txt 不存在"
        exit /b 1
    )
    
    if not exist "secrets\mysql_password.txt" (
        call :print_error "密钥文件 secrets\mysql_password.txt 不存在"
        exit /b 1
    )
    
    if not exist "secrets\jwt_secret.txt" (
        call :print_error "密钥文件 secrets\jwt_secret.txt 不存在"
        exit /b 1
    )
    
    if not exist "secrets\deepseek_api_key.txt" (
        call :print_error "密钥文件 secrets\deepseek_api_key.txt 不存在"
        exit /b 1
    )
    
    call :print_success "生产环境密钥文件检查通过"
) else (
    REM 开发环境检查 .env 文件
    if not exist ".env" (
        if exist ".env.example" (
            call :print_warning ".env 文件不存在，从 .env.example 复制..."
            copy ".env.example" ".env" >nul
            call :print_warning "请编辑 .env 文件并配置正确的环境变量"
        ) else (
            call :print_error ".env 文件不存在，请创建并配置环境变量"
            exit /b 1
        )
    )
    
    call :print_success "开发环境配置检查通过"
)
goto :eof

REM 构建和启动服务
:deploy_services
call :print_info "部署 %env% 环境..."

if "%env%"=="prod" (
    REM 生产环境部署
    call :print_info "构建生产环境镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    call :print_info "启动生产环境服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    call :print_info "等待数据库启动..."
    timeout /t 30 /nobreak >nul
    
    call :print_info "运行数据库迁移..."
    docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
) else (
    REM 开发环境部署
    call :print_info "构建开发环境镜像..."
    docker-compose build --no-cache
    
    call :print_info "启动开发环境服务..."
    docker-compose up -d
    
    call :print_info "等待数据库启动..."
    timeout /t 20 /nobreak >nul
    
    call :print_info "运行数据库迁移..."
    docker-compose exec app npx prisma migrate deploy
)

call :print_success "%env% 环境部署完成！"
goto :eof

REM 显示服务状态
:show_status
call :print_info "服务状态:"

if "%env%"=="prod" (
    docker-compose -f docker-compose.prod.yml ps
) else (
    docker-compose ps
)
goto :eof

REM 显示日志
:show_logs
call :print_info "应用日志:"

if "%env%"=="prod" (
    docker-compose -f docker-compose.prod.yml logs -f app
) else (
    docker-compose logs -f app
)
goto :eof

REM 清理资源
:cleanup
call :print_warning "清理 %env% 环境资源..."

if "%env%"=="prod" (
    docker-compose -f docker-compose.prod.yml down -v
) else (
    docker-compose down -v
)

call :print_success "清理完成"
goto :eof

REM 主函数
if "%command%"=="deploy" (
    call :check_dependencies
    call :check_env_files
    call :deploy_services
    call :show_status
) else if "%command%"=="status" (
    call :show_status
) else if "%command%"=="logs" (
    call :show_logs
) else if "%command%"=="cleanup" (
    call :cleanup
) else (
    echo 使用方法: %0 {deploy^|status^|logs^|cleanup} [dev^|prod]
    echo.
    echo 命令:
    echo   deploy   - 部署服务
    echo   status   - 查看服务状态
    echo   logs     - 查看应用日志
    echo   cleanup  - 清理资源
    echo.
    echo 环境:
    echo   dev      - 开发环境 ^(默认^)
    echo   prod     - 生产环境
    echo.
    echo 示例:
    echo   %0 deploy dev     # 部署开发环境
    echo   %0 deploy prod    # 部署生产环境
    echo   %0 status prod    # 查看生产环境状态
    echo   %0 logs dev       # 查看开发环境日志
    exit /b 1
)