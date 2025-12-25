# Note Book

一个简洁的笔记应用，采用 Monorepo 架构，前后端共享类型定义。

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Express + TypeScript + Prisma
- **数据库**: PostgreSQL
- **架构**: Monorepo (npm workspaces)

## 项目结构

```
note-book-web/
├── backend/          # Express 后端
│   ├── src/
│   │   ├── app.ts           # Express app 配置
│   │   ├── server.ts        # 服务器启动
│   │   ├── controllers/     # 控制器层
│   │   ├── services/        # 服务层
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── errors/          # 错误处理
│   │   └── utils/           # 工具函数
│   └── prisma/              # Prisma schema
│
├── frontend/         # React 前端
│   └── src/
│       ├── components/       # React 组件
│       ├── pages/            # 页面
│       ├── contexts/         # Context API
│       ├── services/         # API 服务
│
├── shared/           # 共享代码
│   └── src/
│       └── types/            # 共享类型定义
│
├── package.json      # 根 package.json (workspaces)
└── tsconfig.json     # 根 TypeScript 配置
```

## 快速开始

### 环境要求

- Node.js >= 18.17.0
- PostgreSQL >= 15
- npm >= 7 (支持 workspaces)

### 安装依赖

```bash
# 在根目录安装所有依赖（包括 workspaces）
npm install
```

### 配置环境变量

在根目录创建 `.env` 文件（可以复制 `.env.example` 作为模板）:

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，设置你的配置：

```env
DATABASE_URL="postgresql://notedb_user:password@localhost:5432/notedb"

# Backend Server
BACKEND_PORT=3001
NODE_ENV=development

# Frontend Server
FRONTEND_PORT=3000

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=30d

# CORS (auto-generated from FRONTEND_PORT if not set)
CORS_ORIGIN=http://localhost:3000
```

**端口配置说明**：
- `BACKEND_PORT`: 后端 API 服务器端口（默认: 3001）
- `FRONTEND_PORT`: 前端开发服务器端口（默认: 3000）
- `CORS_ORIGIN`: CORS 允许的源，如果不设置会自动从 `FRONTEND_PORT` 生成

**注意**: `.env` 文件位于项目根目录，所有 workspace（前端、后端、共享包）都可以访问这些环境变量。

### 安装和启动 PostgreSQL

#### macOS (使用 Homebrew)

```bash
# 安装 PostgreSQL
brew install postgresql@15

# 启动 PostgreSQL 服务
brew services start postgresql@15

# 或者手动启动（不随系统启动）
pg_ctl -D /usr/local/var/postgresql@15 start
```

#### 创建数据库

```bash
# 连接到 PostgreSQL（使用默认的 postgres 用户）
psql postgres

# 在 psql 中创建数据库和用户
CREATE DATABASE notedb;
CREATE USER notedb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE notedb TO notedb_user;
ALTER USER notedb_user CREATEDB;  -- 授予创建数据库权限（Prisma Migrate 需要）
\q

# 连接到 notedb 数据库，授予 public schema 权限（PostgreSQL 15+ 需要）
psql notedb
GRANT ALL ON SCHEMA public TO notedb_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO notedb_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO notedb_user;
\q
```

**注意**: 
- 不要使用 PostgreSQL 保留关键字（如 `user`）作为用户名，如果必须使用，需要用双引号括起来：`CREATE USER "user" ...`
- 创建数据库后，请更新 `.env` 文件中的 `DATABASE_URL`，使用你创建的用户名和密码：
```env
DATABASE_URL="postgresql://notedb_user:your_password@localhost:5432/notedb"
```

#### 检查 PostgreSQL 是否运行

```bash
# 检查端口 5432 是否有进程监听
lsof -i :5432

# 或者使用 psql 测试连接
psql -h localhost -p 5432 -U notedb_user -d notedb
```

### 数据库设置

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate
```

### 启动项目

**同时启动前后端**:

```bash
npm run dev
```

**分别启动**:

```bash
# 启动后端
npm run dev:backend

# 启动前端
npm run dev:frontend
```

访问 http://localhost:3000

## 开发

### 构建共享包

```bash
cd shared
npm run build
```

### 代码检查

```bash
# 检查所有 workspace
npm run lint

# 修复所有 workspace
npm run lint:fix
```

### 构建项目

```bash
# 构建所有 workspace
npm run build

# 分别构建
npm run build:backend
npm run build:frontend
```

## Workspace 命令

### 后端命令

```bash
npm run dev --workspace=backend
npm run build --workspace=backend
npm run db:generate --workspace=backend
npm run db:migrate --workspace=backend
npm run db:studio --workspace=backend
```

### 前端命令

```bash
npm run dev --workspace=frontend
npm run build --workspace=frontend
npm run preview --workspace=frontend
```

### 共享包命令

```bash
npm run build --workspace=shared
npm run dev --workspace=shared
```

## API 端点

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/notes` - 获取笔记列表
- `POST /api/notes` - 创建笔记
- `GET /api/notes/:id` - 获取笔记
- `PUT /api/notes/:id` - 更新笔记
- `DELETE /api/notes/:id` - 删除笔记

## 共享类型

前后端共享的类型定义位于 `shared/src/types/index.ts`，包括：

- `User` - 用户类型
- `Note` - 笔记类型
- `Notebook` - 笔记本类型
- `Tag` - 标签类型
- `ApiResponse<T>` - API 响应类型
- `PaginatedResponse<T>` - 分页响应类型
- `AuthRequest` - 认证请求类型（后端专用）

## 部署

### 生产环境变量

确保设置以下环境变量：

- `NODE_ENV=production`
- `DATABASE_URL` - 生产数据库连接
- `JWT_SECRET` - 安全的 JWT 密钥
- `CORS_ORIGIN` - 前端域名

### 使用 PM2

```bash
cd backend
npm run build
pm2 start dist/server.js --name note-book-backend
```

## Monorepo 优势

1. **类型共享**: 前后端共享类型定义，减少类型不一致问题
2. **统一依赖管理**: 根目录统一管理依赖版本
3. **统一构建**: 可以同时构建前后端
4. **代码复用**: 共享代码可以轻松在前后端之间复用
5. **统一工具链**: ESLint、TypeScript 等工具配置统一管理
