# Docker 部署指南

本指南将帮助您使用 Docker 快速部署 Fantasy Record Backend 应用。

## 📋 前置要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- Docker Compose
- Git

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd fantasy-record-backend
```

### 2. 配置环境变量

#### 开发环境

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置以下变量：
# - DATABASE_URL
# - JWT_SECRET
# - DEEPSEEK_API_KEY
```

#### 生产环境

```bash
# 配置密钥文件
echo "your-mysql-root-password" > secrets/mysql_root_password.txt
echo "your-mysql-user-password" > secrets/mysql_password.txt
echo "your-jwt-secret-key" > secrets/jwt_secret.txt
echo "your-deepseek-api-key" > secrets/deepseek_api_key.txt
```

### 3. 部署应用

#### 使用部署脚本（推荐）

**Linux/Mac:**
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 部署开发环境
./deploy.sh deploy dev

# 部署生产环境
./deploy.sh deploy prod
```

**Windows:**
```cmd
# 部署开发环境
deploy.bat deploy dev

# 部署生产环境
deploy.bat deploy prod
```

#### 手动部署

**开发环境:**
```bash
# 构建并启动服务
docker-compose up -d

# 等待数据库启动
sleep 20

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy
```

**生产环境:**
```bash
# 构建并启动服务
docker-compose -f docker-compose.prod.yml up -d

# 等待数据库启动
sleep 30

# 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## 📊 管理命令

### 查看服务状态

```bash
# 开发环境
docker-compose ps

# 生产环境
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f mysql

# 查看所有服务日志
docker-compose logs -f
```

### 进入容器

```bash
# 进入应用容器
docker-compose exec app bash

# 进入数据库容器
docker-compose exec mysql mysql -u fantasy_user -p fantasy_record
```

### 停止和清理

```bash
# 停止服务
docker-compose down

# 停止服务并删除数据卷
docker-compose down -v

# 清理未使用的镜像
docker system prune -f
```

## 🔧 数据库管理

### Prisma 操作

```bash
# 生成 Prisma 客户端
docker-compose exec app npx prisma generate

# 查看数据库状态
docker-compose exec app npx prisma migrate status

# 重置数据库（开发环境）
docker-compose exec app npx prisma migrate reset

# 推送 schema 变更（开发环境）
docker-compose exec app npx prisma db push

# 打开 Prisma Studio
docker-compose exec app npx prisma studio
```

### 数据库备份和恢复

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u fantasy_user -p fantasy_record > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u fantasy_user -p fantasy_record < backup.sql
```

## 🔒 安全配置

### 生产环境安全检查清单

- [ ] 更改所有默认密码
- [ ] 使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）
- [ ] 配置 SSL 证书
- [ ] 限制数据库端口访问
- [ ] 配置防火墙规则
- [ ] 启用日志监控
- [ ] 定期备份数据库
- [ ] 更新系统和依赖包

### SSL 证书配置

```bash
# 创建 SSL 目录
mkdir ssl

# 生成自签名证书（仅用于测试）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# 生产环境建议使用 Let's Encrypt
```

## 🐛 故障排除

### 常见问题

**1. 容器启动失败**
```bash
# 查看详细错误信息
docker-compose logs app

# 检查端口占用
netstat -tulpn | grep :3000
```

**2. 数据库连接失败**
```bash
# 检查数据库容器状态
docker-compose ps mysql

# 测试数据库连接
docker-compose exec mysql mysql -u fantasy_user -p
```

**3. 权限问题**
```bash
# 修复文件权限
sudo chown -R $USER:$USER .

# 修复上传目录权限
sudo chmod 755 uploads/
```

**4. 内存不足**
```bash
# 增加 Docker 内存限制
# 在 Docker Desktop 设置中调整内存分配

# 或修改 docker-compose.yml 中的资源限制
```

### 性能优化

**1. 数据库优化**
```sql
-- 查看数据库性能
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';

-- 优化查询
EXPLAIN SELECT * FROM FantasyRecord WHERE userId = 1;
```

**2. 应用优化**
```bash
# 启用生产模式
export NODE_ENV=production

# 使用 PM2 管理进程（可选）
npm install -g pm2
pm2 start dist/main.js --name fantasy-app
```

## 📈 监控和日志

### 日志配置

```yaml
# docker-compose.yml 中添加日志配置
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 检查数据库健康状态
docker-compose exec mysql mysqladmin ping
```

## 🔄 更新和维护

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy
```

### 定期维护

```bash
# 清理未使用的镜像和容器
docker system prune -f

# 备份数据库
./scripts/backup-database.sh

# 更新依赖包
docker-compose exec app npm update
```

## 📞 获取帮助

如果遇到问题，请：

1. 查看应用日志：`docker-compose logs -f app`
2. 检查数据库状态：`docker-compose ps mysql`
3. 查看 [故障排除文档](README.md#故障排除)
4. 提交 Issue 到项目仓库

---

更多详细信息请参考 [README.md](README.md) 文档。