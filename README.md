# Fantasy Record Backend

一个基于 NestJS 的幻想记录后端系统，用于记录和管理用户的创意想法、情感状态和软件灵感。

## 功能特性

### 🔐 用户认证
- 用户注册和登录
- JWT 身份验证
- 密码加密存储

### 📝 幻想记录管理
- 创建、查看、更新、删除记录
- 支持标题、内容、标签、情绪状态、分类
- 关键词搜索、标签过滤、分类筛选
- 分页和排序功能
- 自动生成记录摘要

### 🗂️ 分类系统
- 创建、查看、更新、删除分类
- 支持分类名称、描述、颜色、图标
- 分类记录数量统计
- 按分类筛选记录

### 🏷️ 标签系统
- 获取所有可用标签
- 标签统计和管理
- 支持标签颜色设置

### 📎 文件附件
- 文件上传功能
- 支持图片、文档等多种格式
- 文件大小和类型验证

### 📊 数据分析
- 情绪趋势分析
- 记录统计摘要
- 可视化数据支持

### 🤖 AI 智能分析
- 心理状态分析
- 情绪波动图表
- 主题词云生成
- 软件创意可行性分析
- 自动记录摘要生成

### 🔍 高级搜索与筛选
- 多维度搜索（标题、内容、标签）
- 按分类筛选记录
- 按情绪状态筛选
- 时间范围筛选
- 分页和多种排序方式

## 技术栈

- **框架**: NestJS
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT + Passport
- **文件上传**: Multer
- **验证**: class-validator
- **配置管理**: @nestjs/config

## 项目结构

```
src/
├── auth/                 # 认证模块
│   ├── dto/             # 数据传输对象
│   ├── guards/          # 认证守卫
│   ├── strategies/      # 认证策略
│   └── decorators/      # 自定义装饰器
├── records/             # 记录管理模块
│   └── dto/             # 记录相关DTO
├── categories/          # 分类管理模块
│   └── dto/             # 分类相关DTO
├── tags/                # 标签模块
│   └── dto/             # 标签相关DTO
├── attachments/         # 附件模块
├── analytics/           # 数据分析模块
├── ai/                  # AI 分析模块
├── prisma/              # 数据库服务
└── common/              # 公共组件
    ├── filters/         # 异常过滤器
    └── interceptors/    # 响应拦截器
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 文件为 `.env` 并配置以下环境变量：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/fantasy_record_db"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# 应用配置
PORT=3000
NODE_ENV="development"

# AI 服务配置（必需）
DEEPSEEK_API_KEY="your-deepseek-api-key-here"
```

**重要安全提示：**
- 🔐 `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制
- 🔑 请将 `DEEPSEEK_API_KEY` 替换为您的真实 DeepSeek API 密钥
- 🚫 切勿在代码中硬编码 API 密钥
- 📝 生产环境请使用更强的 JWT_SECRET

**获取 DeepSeek API 密钥：**
1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在 API 管理页面创建新的 API 密钥
4. 将密钥复制到 `.env` 文件中

### 3. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移（开发环境）
npx prisma migrate dev

# 或者直接推送 schema 变更（快速原型）
npx prisma db push

# (可选) 查看数据库
npx prisma studio
```

**注意**: 如果遇到数据库 schema 冲突，可能需要重置数据库：
```bash
# 重置数据库（会清空所有数据）
npx prisma migrate reset --force
```

### 4. 启动应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

应用将在 `http://localhost:3000` 启动。

## API 接口

### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录

### 记录管理
- `GET /records` - 获取记录列表（支持搜索、过滤、分页、分类筛选）
- `POST /records` - 创建新记录
- `GET /records/:id` - 获取单个记录
- `PUT /records/:id` - 更新记录
- `DELETE /records/:id` - 删除记录

### 分类管理
- `GET /categories` - 获取所有分类（包含记录数量统计）
- `POST /categories` - 创建新分类
- `GET /categories/:id` - 获取单个分类
- `PATCH /categories/:id` - 更新分类
- `DELETE /categories/:id` - 删除分类

### 标签管理
- `GET /tags` - 获取所有标签

### 文件上传
- `POST /attachments/upload` - 上传文件

### 数据分析
- `GET /analytics/mood-trend` - 获取情绪趋势
- `GET /analytics/records-summary` - 获取记录摘要

### AI 分析
- `GET /ai/mental-state-analysis` - 心理状态分析（返回情绪图表、词云、最新分析报告）
- `POST /ai/feasibility-analysis` - 软件创意可行性分析
- `GET /ai/analysis-history` - 获取AI分析历史记录

**AI 分析功能说明：**
- 🧠 **心理状态分析**：基于用户记录内容，使用 DeepSeek AI 生成专业的心理状态报告
- 📊 **情绪趋势图表**：可视化展示用户情绪变化趋势
- ☁️ **主题词云**：提取记录中的关键词，生成词云图
- 💡 **创意可行性分析**：针对软件创意记录，提供专业的可行性评估
- 📝 **Markdown 格式报告**：AI 生成的分析报告采用结构化的 Markdown 格式
- ⏰ **定时分析**：系统每天自动为活跃用户生成心理状态分析

## 数据库模型

### User (用户)
- id: 用户ID
- username: 用户名
- email: 邮箱
- password: 密码（加密）
- createdAt: 创建时间
- updatedAt: 更新时间

### FantasyRecord (幻想记录)
- id: 记录ID
- title: 标题
- content: 内容
- snippet: 记录摘要（自动生成）
- tags: 标签数组
- mood: 情绪状态
- attachments: 附件数组
- userId: 用户ID
- categoryId: 分类ID（可选）
- createdAt: 创建时间
- updatedAt: 更新时间

### Category (分类)
- id: 分类ID
- name: 分类名称
- description: 分类描述（可选）
- color: 分类颜色（可选）
- icon: 分类图标（可选）
- userId: 用户ID
- createdAt: 创建时间
- updatedAt: 更新时间

### Tag (标签)
- id: 标签ID
- name: 标签名称
- color: 标签颜色（可选）
- userId: 用户ID
- createdAt: 创建时间

### Attachment (附件)
- id: 附件ID
- url: 文件访问URL
- fileName: 原始文件名
- fileType: MIME类型
- fileSize: 文件大小（字节）
- userId: 用户ID
- recordId: 关联记录ID（可选）
- createdAt: 创建时间

### MoodAnalysis (情绪分析)
- id: 分析ID
- userId: 用户ID
- date: 分析日期
- moodScore: 心情分数（1-10）
- moodText: 心情文本描述
- recordCount: 当天记录数量
- createdAt: 创建时间
- updatedAt: 更新时间

## 开发指南

### 添加新功能模块

1. 使用 NestJS CLI 生成模块：
```bash
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

2. 在 `app.module.ts` 中导入新模块

3. 如需数据库操作，在模块中导入 `PrismaModule`

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 NestJS 官方风格指南
- 使用 class-validator 进行数据验证
- 所有 API 都需要适当的错误处理
- 使用环境变量管理敏感配置
- 为所有公共 API 添加 Swagger 文档

### 测试

```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 故障排除

### 常见问题

**1. 数据库连接失败**
```
Error: P1001: Can't reach database server
```
解决方案：
- 检查 MySQL 服务是否启动
- 验证 `DATABASE_URL` 配置是否正确
- 确认数据库用户权限

**2. AI 分析失败**
```
Error: DEEPSEEK_API_KEY environment variable is required
```
解决方案：
- 确保 `.env` 文件中配置了正确的 `DEEPSEEK_API_KEY`
- 验证 API 密钥是否有效
- 检查网络连接是否正常

**3. 文件上传失败**
```
Error: File too large
```
解决方案：
- 检查文件大小是否超过限制（默认 10MB）
- 确认 `uploads` 目录权限
- 验证文件类型是否支持

**4. JWT 认证失败**
```
Error: Unauthorized
```
解决方案：
- 检查 `JWT_SECRET` 配置
- 验证 token 是否过期
- 确认请求头中包含正确的 Authorization

### 调试技巧

```bash
# 启用详细日志
NODE_ENV=development npm run start:dev

# 查看数据库状态
npx prisma studio

# 检查 API 文档
# 访问 http://localhost:3000/api
```

## 部署

### Docker 部署

#### 方式一：单独部署应用（需要外部 MySQL）

```bash
# 构建镜像
docker build -t fantasy-record-backend .

# 运行容器
docker run -p 3000:3000 --env-file .env fantasy-record-backend
```

#### 方式二：使用 Docker Compose（推荐）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: fantasy-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: fantasy_record
      MYSQL_USER: fantasy_user
      MYSQL_PASSWORD: fantasy_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-init:/docker-entrypoint-initdb.d
    networks:
      - fantasy-network

  # 应用服务
  app:
    build: .
    container_name: fantasy-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "mysql://fantasy_user:fantasy_password@mysql:3306/fantasy_record"
      JWT_SECRET: "your-super-secret-jwt-key"
      JWT_EXPIRES_IN: "7d"
      PORT: 3000
      NODE_ENV: "production"
      DEEPSEEK_API_KEY: "your-deepseek-api-key"
    depends_on:
      - mysql
    volumes:
      - ./uploads:/app/uploads
    networks:
      - fantasy-network

volumes:
  mysql_data:

networks:
  fantasy-network:
    driver: bridge
```

启动服务：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

#### 数据库初始化和迁移

**首次部署时：**

```bash
# 进入应用容器
docker exec -it fantasy-app bash

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 或者直接推送 schema（开发环境）
npx prisma db push
```

**生产环境数据迁移：**

```bash
# 创建新的迁移文件
npx prisma migrate dev --name migration_name

# 部署迁移到生产环境
npx prisma migrate deploy
```

#### Dockerfile 优化建议

创建 `Dockerfile`：

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装 pnpm 和依赖
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物和必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]
```

### 生产环境注意事项

#### 数据库安全配置

1. **MySQL 安全设置**
   - 使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）
   - 禁用 root 远程登录
   - 创建专用数据库用户，仅授予必要权限
   - 启用 SSL 连接
   - 定期备份数据库

2. **Prisma 生产配置**
   ```bash
   # 设置连接池
   DATABASE_URL="mysql://user:password@host:3306/database?connection_limit=10&pool_timeout=20"
   
   # 启用查询日志（调试时）
   DATABASE_URL="mysql://user:password@host:3306/database?sslaccept=strict&logging=true"
   ```

3. **数据库备份策略**
   ```bash
   # 创建备份脚本
   #!/bin/bash
   DATE=$(date +"%Y%m%d_%H%M%S")
   mysqldump -u username -p database_name > backup_$DATE.sql
   
   # 设置定时备份（crontab）
   0 2 * * * /path/to/backup_script.sh
   ```

#### 应用安全配置

1. **环境变量安全**
   - 使用强密码作为 JWT_SECRET（至少 32 位随机字符）
   - 妥善保管 DEEPSEEK_API_KEY
   - 不要在代码中硬编码敏感信息

2. **网络安全**
   - 配置适当的 CORS 策略
   - 启用 HTTPS
   - 使用防火墙限制数据库端口访问
   - 配置反向代理（如 Nginx）

3. **文件和资源限制**
   - 设置文件上传大小限制
   - 配置请求频率限制
   - 启用文件类型验证

4. **监控和日志**
   - 配置应用日志记录
   - 监控数据库性能
   - 设置错误告警
   - 定期检查安全日志

#### Docker 生产部署建议

1. **容器安全**
   ```yaml
   # docker-compose.prod.yml
   services:
     mysql:
       # 使用非 root 用户
       user: "1001:1001"
       # 限制容器权限
       cap_drop:
         - ALL
       cap_add:
         - CHOWN
         - DAC_OVERRIDE
         - SETGID
         - SETUID
     
     app:
       # 只读根文件系统
       read_only: true
       # 临时文件系统
       tmpfs:
         - /tmp
         - /app/uploads
   ```

2. **资源限制**
   ```yaml
   services:
     mysql:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '0.5'
     app:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.3'
   ```

3. **健康检查**
   ```yaml
   services:
     mysql:
       healthcheck:
         test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
         timeout: 20s
         retries: 10
     
     app:
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

## 版本更新日志

### v2.0.0 (最新)
- ✨ 新增分类系统，支持记录分类管理
- ✨ 增强标签系统，支持标签颜色设置
- ✨ 自动生成记录摘要功能
- ✨ 新增情绪分析数据模型
- 🔧 优化数据库结构，增加外键关联
- 🔧 完善API接口，支持分类筛选
- 📚 更新API文档和数据模型说明

### v1.0.0
- 🎉 基础功能实现
- 🔐 用户认证系统
- 📝 幻想记录CRUD操作
- 🏷️ 标签管理
- 📎 文件附件上传
- 📊 数据分析功能
- 🤖 AI智能分析

## 许可证

MIT License
