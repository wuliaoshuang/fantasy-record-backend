# Fantasy Record Backend

一个基于 NestJS 的幻想记录后端系统，用于记录和管理用户的创意想法、情感状态和软件灵感。

## 功能特性

### 🔐 用户认证
- 用户注册和登录
- JWT 身份验证
- 密码加密存储

### 📝 幻想记录管理
- 创建、查看、更新、删除记录
- 支持标题、内容、标签、情绪状态
- 关键词搜索和标签过滤
- 分页和排序功能

### 🏷️ 标签系统
- 获取所有可用标签
- 标签统计和管理

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
├── tags/                # 标签模块
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

创建 `.env` 文件并配置以下环境变量：

```env
DATABASE_URL="mysql://root:password@localhost:3306/fantasy_record_db"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 3. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# (可选) 查看数据库
npx prisma studio
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
- `GET /records` - 获取记录列表（支持搜索、过滤、分页）
- `POST /records` - 创建新记录
- `GET /records/:id` - 获取单个记录
- `PUT /records/:id` - 更新记录
- `DELETE /records/:id` - 删除记录

### 标签管理
- `GET /tags` - 获取所有标签

### 文件上传
- `POST /attachments/upload` - 上传文件

### 数据分析
- `GET /analytics/mood-trend` - 获取情绪趋势
- `GET /analytics/records-summary` - 获取记录摘要

### AI 分析
- `GET /ai/mental-state-analysis` - 心理状态分析
- `POST /ai/feasibility-analysis` - 软件创意可行性分析

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
- tags: 标签数组
- mood: 情绪状态
- attachments: 附件数组
- userId: 用户ID
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

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t fantasy-record-backend .

# 运行容器
docker run -p 3000:3000 --env-file .env fantasy-record-backend
```

### 生产环境注意事项

1. 确保数据库连接安全
2. 使用强密码作为 JWT_SECRET
3. 配置适当的 CORS 策略
4. 启用 HTTPS
5. 设置文件上传大小限制
6. 配置日志记录

## 许可证

MIT License
