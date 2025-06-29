# ----- STAGE 1: Build -----
FROM node:20-alpine AS builder

WORKDIR /app

# 设置 npm 为淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm（可选，如果还需要使用 pnpm）
RUN npm install -g pnpm

# 拷贝依赖文件
COPY package*.json pnpm-lock.yaml ./

# 使用 npm 安装所有依赖（包含 devDependencies）
RUN npm install --legacy-peer-deps

# 拷贝 prisma schema 并生成客户端
COPY prisma ./prisma
RUN npx prisma generate

# 拷贝源代码（排除node_modules）
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# 构建项目
RUN npm run build


# ----- STAGE 2: Production -----
FROM node:20-alpine AS production

WORKDIR /app

# 设置国内镜像
RUN npm config set registry https://registry.npmmirror.com

# 拷贝依赖声明
COPY package*.json ./

# 安装生产依赖
RUN npm install --only=production --legacy-peer-deps

# 拷贝构建结果与必要资源
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 启动应用
CMD ["node", "dist/main"]
