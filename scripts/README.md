# 部署脚本说明

## deploy.sh

用于将项目部署到远程服务器的脚本。

### 使用方法

#### 方式 1: 使用位置参数（推荐，更简洁）

```bash
# 完整参数
./scripts/deploy.sh your-server.com root /var/www/note-book ~/.ssh/id_rsa

# 只指定主机（其他使用默认值）
./scripts/deploy.sh your-server.com

# 指定主机和用户
./scripts/deploy.sh your-server.com deploy

# 指定主机、用户和路径
./scripts/deploy.sh your-server.com deploy /opt/note-book
```

#### 方式 2: 使用命名参数

```bash
./scripts/deploy.sh --host your-server.com --user root --path /var/www/note-book --key ~/.ssh/id_rsa
```

#### 方式 3: 使用环境变量

```bash
export ECS_HOST=your-server.com
export ECS_USER=root
export ECS_DEPLOY_PATH=/var/www/note-book
export SSH_KEY=~/.ssh/id_rsa

./scripts/deploy.sh
```

#### 方式 4: 混合使用

环境变量作为默认值，命令行参数可以覆盖：

```bash
export ECS_HOST=your-server.com
export ECS_USER=root

# 使用命名参数覆盖
./scripts/deploy.sh --path /var/www/custom-path

# 或使用位置参数（只覆盖部分参数）
./scripts/deploy.sh your-server.com root /var/www/custom-path
```

### 参数说明

#### 位置参数（按顺序）

1. `HOST`: 服务器地址（必需）
2. `USER`: SSH 用户名（可选，默认: `root`）
3. `PATH`: 部署路径（可选，默认: `/var/www/note-book`）
4. `KEY`: SSH 私钥路径（可选）

#### 命名参数

- `--host HOST`: 服务器地址（必需，或通过 `ECS_HOST` 环境变量）
- `--user USER`: SSH 用户名（默认: `root`，或通过 `ECS_USER` 环境变量）
- `--path PATH`: 部署路径（默认: `/var/www/note-book`，或通过 `ECS_DEPLOY_PATH` 环境变量）
- `--key KEY`: SSH 私钥路径（可选，或通过 `SSH_KEY` 环境变量）
- `--skip-build`: 跳过构建步骤（直接使用已构建的文件）
- `--skip-migrate`: 跳过数据库迁移步骤

### 部署流程

1. **清理构建缓存** - 删除旧的构建文件和缓存
2. **生成 Prisma Client** - 生成数据库客户端
3. **构建共享包** - 构建 shared workspace
4. **构建应用** - 构建 backend 和 frontend
5. **创建部署目录** - 在服务器上创建必要的目录
6. **上传构建产物** - 上传 backend/dist 和 frontend/dist
7. **上传配置文件** - 上传 package.json 和 prisma 目录
8. **上传环境变量** - 如果有 .env.production 文件则上传
9. **服务器端操作** - 安装依赖、生成 Prisma Client、运行迁移

### 环境变量文件

脚本会检查以下文件：

- `.env.production` - 如果存在，会自动上传到服务器
- `.env` - 如果存在，会询问是否上传（建议使用 .env.production）

### 部署后操作

脚本部署完成后，需要手动重启应用服务：

#### 使用 PM2

```bash
ssh user@host
cd /var/www/note-book/backend
pm2 restart note-book-backend || pm2 start dist/server.js --name note-book-backend
```

#### 使用 systemd

```bash
ssh user@host
sudo systemctl restart note-book-backend
```

#### 手动启动

```bash
ssh user@host
cd /var/www/note-book/backend
node dist/server.js
```

### 示例

#### 完整部署（使用位置参数）

```bash
./scripts/deploy.sh 192.168.1.100 deploy /opt/note-book ~/.ssh/deploy_key
```

#### 完整部署（使用命名参数）

```bash
./scripts/deploy.sh \
  --host 192.168.1.100 \
  --user deploy \
  --path /opt/note-book \
  --key ~/.ssh/deploy_key
```

#### 仅上传（跳过构建）

```bash
./scripts/deploy.sh \
  --host 192.168.1.100 \
  --skip-build
```

#### 跳过数据库迁移

```bash
./scripts/deploy.sh \
  --host 192.168.1.100 \
  --skip-migrate
```

### 注意事项

1. 确保服务器已安装 Node.js >= 18.17.0
2. 确保服务器已安装 PostgreSQL 客户端（用于 Prisma）
3. 确保 SSH 密钥已添加到服务器的 authorized_keys
4. 确保服务器上的部署路径有写入权限
5. 生产环境建议使用 `.env.production` 而不是 `.env`
