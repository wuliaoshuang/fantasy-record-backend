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
