#!/bin/bash

# Fantasy Record Backend 部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_dependencies() {
    print_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 检查环境文件
check_env_files() {
    print_info "检查环境配置..."
    
    if [ "$1" = "prod" ]; then
        # 生产环境检查密钥文件
        if [ ! -d "secrets" ]; then
            print_error "secrets 目录不存在，请创建并配置密钥文件"
            exit 1
        fi
        
        required_secrets=("mysql_root_password.txt" "mysql_password.txt" "jwt_secret.txt" "deepseek_api_key.txt")
        for secret in "${required_secrets[@]}"; do
            if [ ! -f "secrets/$secret" ]; then
                print_error "密钥文件 secrets/$secret 不存在"
                exit 1
            fi
        done
        
        print_success "生产环境密钥文件检查通过"
    else
        # 开发环境检查 .env 文件
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                print_warning ".env 文件不存在，从 .env.example 复制..."
                cp .env.example .env
                print_warning "请编辑 .env 文件并配置正确的环境变量"
            else
                print_error ".env 文件不存在，请创建并配置环境变量"
                exit 1
            fi
        fi
        
        print_success "开发环境配置检查通过"
    fi
}

# 构建和启动服务
deploy_services() {
    local env=$1
    print_info "部署 $env 环境..."
    
    if [ "$env" = "prod" ]; then
        # 生产环境部署
        print_info "构建生产环境镜像..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        print_info "启动生产环境服务..."
        docker-compose -f docker-compose.prod.yml up -d
        
        print_info "等待数据库启动..."
        sleep 30
        
        print_info "运行数据库迁移..."
        docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
        
    else
        # 开发环境部署
        print_info "构建开发环境镜像..."
        docker-compose build --no-cache
        
        print_info "启动开发环境服务..."
        docker-compose up -d
        
        print_info "等待数据库启动..."
        sleep 20
        
        print_info "运行数据库迁移..."
        docker-compose exec app npx prisma migrate deploy
    fi
    
    print_success "$env 环境部署完成！"
}

# 显示服务状态
show_status() {
    local env=$1
    print_info "服务状态:"
    
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker-compose ps
    fi
}

# 显示日志
show_logs() {
    local env=$1
    print_info "应用日志:"
    
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml logs -f app
    else
        docker-compose logs -f app
    fi
}

# 清理资源
cleanup() {
    local env=$1
    print_warning "清理 $env 环境资源..."
    
    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml down -v
    else
        docker-compose down -v
    fi
    
    print_success "清理完成"
}

# 主函数
main() {
    local command=$1
    local env=${2:-dev}
    
    case $command in
        "deploy")
            check_dependencies
            check_env_files $env
            deploy_services $env
            show_status $env
            ;;
        "status")
            show_status $env
            ;;
        "logs")
            show_logs $env
            ;;
        "cleanup")
            cleanup $env
            ;;
        *)
            echo "使用方法: $0 {deploy|status|logs|cleanup} [dev|prod]"
            echo ""
            echo "命令:"
            echo "  deploy   - 部署服务"
            echo "  status   - 查看服务状态"
            echo "  logs     - 查看应用日志"
            echo "  cleanup  - 清理资源"
            echo ""
            echo "环境:"
            echo "  dev      - 开发环境 (默认)"
            echo "  prod     - 生产环境"
            echo ""
            echo "示例:"
            echo "  $0 deploy dev     # 部署开发环境"
            echo "  $0 deploy prod    # 部署生产环境"
            echo "  $0 status prod    # 查看生产环境状态"
            echo "  $0 logs dev       # 查看开发环境日志"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"