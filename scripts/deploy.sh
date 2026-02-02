#!/bin/bash

# 部署脚本
# 用法: 
#   位置参数: ./scripts/deploy.sh [HOST] [USER] [PATH] [KEY]
#   命名参数: ./scripts/deploy.sh [--host HOST] [--user USER] [--path PATH] [--key KEY] [--skip-build] [--skip-migrate]
# 选项:
#   --host HOST         服务器地址
#   --user USER         SSH 用户名
#   --path PATH         部署路径
#   --key KEY           SSH 私钥路径
#   --skip-build        跳过构建步骤
#   --skip-migrate      跳过数据库迁移

set -e

# 默认配置
ECS_HOST="${ECS_HOST:-}"
ECS_USER="${ECS_USER:-root}"
ECS_DEPLOY_PATH="${ECS_DEPLOY_PATH:-/var/www/note-book}"
SSH_KEY="${SSH_KEY:-}"
SKIP_BUILD=false
SKIP_MIGRATE=false

# 解析命令行参数
# 如果第一个参数不是以 -- 开头，则按位置参数解析
if [[ $# -gt 0 && ! "$1" =~ ^-- ]]; then
  # 位置参数模式: HOST [USER] [PATH] [KEY]
  ECS_HOST="$1"
  [[ $# -gt 1 ]] && ECS_USER="$2"
  [[ $# -gt 2 ]] && ECS_DEPLOY_PATH="$3"
  [[ $# -gt 3 ]] && SSH_KEY="$4"
else
  # 命名参数模式
  while [[ $# -gt 0 ]]; do
    case $1 in
      --host)
        ECS_HOST="$2"
        shift 2
        ;;
      --user)
        ECS_USER="$2"
        shift 2
        ;;
      --path)
        ECS_DEPLOY_PATH="$2"
        shift 2
        ;;
      --key)
        SSH_KEY="$2"
        shift 2
        ;;
      --skip-build)
        SKIP_BUILD=true
        shift
        ;;
      --skip-migrate)
        SKIP_MIGRATE=true
        shift
        ;;
      *)
        echo "未知选项: $1"
        echo "用法:"
        echo "  位置参数: $0 [HOST] [USER] [PATH] [KEY]"
        echo "  命名参数: $0 [--host HOST] [--user USER] [--path PATH] [--key KEY] [--skip-build] [--skip-migrate]"
        exit 1
        ;;
    esac
  done
fi

# 检查必需参数
if [ -z "$ECS_HOST" ]; then
  echo "错误: 必须提供服务器地址 (通过 --host 参数或 ECS_HOST 环境变量)"
  exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# 准备 SSH 命令
SSH_OPTS=""
SCP_OPTS=""

if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
  SCP_OPTS="-i $SSH_KEY"
fi

# 测试 SSH 连接
echo "测试 SSH 连接..."
if ! ssh $SSH_OPTS -o ConnectTimeout=10 -o BatchMode=yes $ECS_USER@$ECS_HOST "echo 'SSH 连接成功'" 2>/dev/null; then
  echo "错误: 无法连接到服务器 $ECS_USER@$ECS_HOST"
  echo "请检查:"
  echo "  1. 服务器地址是否正确: $ECS_HOST"
  echo "  2. 网络连接是否正常"
  echo "  3. SSH 密钥是否正确: ${SSH_KEY:-未指定}"
  echo "  4. 服务器防火墙是否允许 SSH 连接 (端口 22)"
  echo ""
  echo "可以手动测试连接:"
  echo "  ssh $SSH_OPTS $ECS_USER@$ECS_HOST"
  exit 1
fi

echo "=========================================="
echo "开始部署到: $ECS_USER@$ECS_HOST:$ECS_DEPLOY_PATH"
echo "=========================================="

# 构建步骤
if [ "$SKIP_BUILD" = false ]; then
  echo ""
  echo "步骤 1: 清理构建缓存..."
  rm -f shared/tsconfig.tsbuildinfo
  rm -f backend/tsconfig.tsbuildinfo
  rm -f frontend/tsconfig.tsbuildinfo
  rm -rf shared/dist backend/dist frontend/dist

  echo ""
  echo "步骤 2: 生成 Prisma Client..."
  npm run db:generate --workspace=backend

  echo ""
  echo "步骤 3: 构建共享包..."
  npm run build --workspace=shared

  echo ""
  echo "步骤 4: 构建应用..."
  npm run build

  echo ""
  echo "构建完成！"
else
  echo ""
  echo "跳过构建步骤..."
fi

# 部署步骤
echo ""
echo "步骤 5: 创建部署目录..."
ssh $SSH_OPTS $ECS_USER@$ECS_HOST "mkdir -p $ECS_DEPLOY_PATH/backend $ECS_DEPLOY_PATH/frontend $ECS_DEPLOY_PATH/logs"

echo ""
echo "步骤 6: 压缩构建产物和配置文件..."
# 创建临时目录用于打包
TEMP_DIR=$(mktemp -d)
DEPLOY_ZIP="$TEMP_DIR/deploy-$(date +%Y%m%d-%H%M%S).zip"

# 复制需要部署的文件到临时目录
mkdir -p "$TEMP_DIR/deploy/backend" "$TEMP_DIR/deploy/frontend"
cp -r backend/dist "$TEMP_DIR/deploy/backend/"
cp -r frontend/dist "$TEMP_DIR/deploy/frontend/"
cp package.json "$TEMP_DIR/deploy/"
cp package-lock.json "$TEMP_DIR/deploy/"
cp backend/package.json "$TEMP_DIR/deploy/backend/"
cp -r backend/prisma "$TEMP_DIR/deploy/backend/"

# 检查是否有 .env 文件需要包含
if [ -f ".env.production" ]; then
  cp .env.production "$TEMP_DIR/deploy/.env"
  echo "  包含 .env.production 文件"
elif [ -f ".env" ]; then
  echo ""
  echo "警告: 发现 .env 文件，建议使用 .env.production 作为生产环境配置"
  read -p "是否包含 .env 文件? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env "$TEMP_DIR/deploy/.env"
    echo "  包含 .env 文件"
  fi
fi

# 压缩文件
cd "$TEMP_DIR"
zip -r "$DEPLOY_ZIP" deploy/ > /dev/null
cd "$PROJECT_ROOT"
ZIP_SIZE=$(du -h "$DEPLOY_ZIP" | cut -f1)
echo "  压缩完成: $DEPLOY_ZIP ($ZIP_SIZE)"

echo ""
echo "步骤 7: 上传压缩包到服务器..."
REMOTE_ZIP="$ECS_DEPLOY_PATH/deploy.zip"
scp $SCP_OPTS "$DEPLOY_ZIP" $ECS_USER@$ECS_HOST:$REMOTE_ZIP
echo "  上传完成"

echo ""
echo "步骤 8: 在服务器上解压缩..."
ssh $SSH_OPTS $ECS_USER@$ECS_HOST bash << EOF
set -e
cd $ECS_DEPLOY_PATH

# 检查 unzip 命令是否可用
if ! command -v unzip &> /dev/null; then
  echo "错误: 服务器上未安装 unzip 命令"
  echo "请先安装: apt-get install unzip 或 yum install unzip"
  exit 1
fi

# 备份现有文件（如果存在）
if [ -d "backend/dist" ] || [ -d "frontend/dist" ]; then
  echo "  备份现有文件..."
  BACKUP_DIR="backup-\$(date +%Y%m%d-%H%M%S)"
  mkdir -p "\$BACKUP_DIR"
  [ -d "backend/dist" ] && mv backend/dist "\$BACKUP_DIR/backend-dist" || true
  [ -d "frontend/dist" ] && mv frontend/dist "\$BACKUP_DIR/frontend-dist" || true
  [ -f "package.json" ] && mv package.json "\$BACKUP_DIR/" || true
  [ -f "backend/package.json" ] && mv backend/package.json "\$BACKUP_DIR/" || true
  [ -d "backend/prisma" ] && mv backend/prisma "\$BACKUP_DIR/backend-prisma" || true
fi

# 解压缩
echo "  解压缩文件..."
unzip -q -o $REMOTE_ZIP -d .

# 移动文件到正确位置
if [ -d "deploy" ]; then
  echo "  移动文件到部署目录..."
  # 移动 backend 相关文件
  if [ -d "deploy/backend/dist" ]; then
    mkdir -p backend
    rm -rf backend/dist
    mv deploy/backend/dist backend/
  fi
  if [ -f "deploy/backend/package.json" ]; then
    mkdir -p backend
    mv deploy/backend/package.json backend/
  fi
  if [ -d "deploy/backend/prisma" ]; then
    mkdir -p backend
    rm -rf backend/prisma
    mv deploy/backend/prisma backend/
  fi
  
  # 移动 frontend 相关文件
  if [ -d "deploy/frontend/dist" ]; then
    mkdir -p frontend
    rm -rf frontend/dist
    mv deploy/frontend/dist frontend/
  fi
  
  # 移动根目录文件
  [ -f "deploy/package.json" ] && mv deploy/package.json . || true
  [ -f "deploy/package-lock.json" ] && mv deploy/package-lock.json . || true
  [ -f "deploy/.env" ] && mv deploy/.env . || true
  
  # 清理临时目录
  rm -rf deploy
fi

# 清理压缩包
rm -f $REMOTE_ZIP

echo "  解压缩完成"
EOF

# 清理本地临时文件
rm -rf "$TEMP_DIR"
echo "  清理本地临时文件完成"

echo ""
echo "步骤 9: 在服务器上执行部署操作..."
ssh $SSH_OPTS $ECS_USER@$ECS_HOST bash << EOF
set -e
cd $ECS_DEPLOY_PATH

# 加载环境变量（SSH 非交互式登录时不会自动加载）
# 尝试加载常见的配置文件
[ -f ~/.bashrc ] && source ~/.bashrc
[ -f ~/.bash_profile ] && source ~/.bash_profile
[ -f ~/.profile ] && source ~/.profile
[ -f /etc/profile ] && source /etc/profile

# 如果使用 nvm，加载 nvm
[ -s "\$HOME/.nvm/nvm.sh" ] && source "\$HOME/.nvm/nvm.sh"
[ -s "/usr/local/opt/nvm/nvm.sh" ] && source "/usr/local/opt/nvm/nvm.sh"

# 检查 Node.js 和 npm 是否已安装
echo "检查 Node.js 和 npm..."

# 尝试查找 node 和 npm 的完整路径
NODE_CMD=\$(command -v node 2>/dev/null || which node 2>/dev/null || echo "")
NPM_CMD=\$(command -v npm 2>/dev/null || which npm 2>/dev/null || echo "")

# 如果找不到，尝试常见路径
if [ -z "\$NODE_CMD" ]; then
  for path in /usr/local/bin/node /usr/bin/node \$HOME/.nvm/versions/node/*/bin/node; do
    if [ -x "\$path" ]; then
      NODE_CMD="\$path"
      break
    fi
  done
fi

if [ -z "\$NPM_CMD" ]; then
  for path in /usr/local/bin/npm /usr/bin/npm \$HOME/.nvm/versions/node/*/bin/npm; do
    if [ -x "\$path" ]; then
      NPM_CMD="\$path"
      break
    fi
  done
fi

if [ -z "\$NODE_CMD" ] || [ ! -x "\$NODE_CMD" ]; then
  echo "错误: 服务器上未找到 Node.js"
  echo "已尝试查找的路径:"
  echo "  - command -v node"
  echo "  - which node"
  echo "  - /usr/local/bin/node"
  echo "  - /usr/bin/node"
  echo "  - ~/.nvm/versions/node/*/bin/node"
  echo ""
  echo "请先安装 Node.js，可以使用以下方法之一:"
  echo "  - 使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
  echo "  - 使用包管理器: apt-get install nodejs npm 或 yum install nodejs npm"
  echo "  - 从官网下载: https://nodejs.org/"
  exit 1
fi

if [ -z "\$NPM_CMD" ] || [ ! -x "\$NPM_CMD" ]; then
  echo "错误: 服务器上未找到 npm"
  echo "已尝试查找的路径:"
  echo "  - command -v npm"
  echo "  - which npm"
  echo "  - /usr/local/bin/npm"
  echo "  - /usr/bin/npm"
  echo "  - ~/.nvm/versions/node/*/bin/npm"
  echo ""
  echo "请先安装 npm，可以使用以下方法之一:"
  echo "  - 使用包管理器: apt-get install npm 或 yum install npm"
  echo "  - 或重新安装 Node.js (npm 通常与 Node.js 一起安装)"
  exit 1
fi

# 导出找到的命令路径，确保后续可以使用
export PATH="\$(dirname \$NODE_CMD):\$PATH"
export PATH="\$(dirname \$NPM_CMD):\$PATH"

echo "  Node.js 路径: \$NODE_CMD"
echo "  Node.js 版本: \$(\$NODE_CMD --version)"
echo "  npm 路径: \$NPM_CMD"
echo "  npm 版本: \$(\$NPM_CMD --version)"

echo "安装根目录依赖..."
if [ -f "package.json" ]; then
  npm ci --production --no-audit --no-fund
fi

cd backend
echo "安装后端依赖..."
if [ -f "package.json" ]; then
  npm ci --production --no-audit --no-fund
fi

cd ..
echo "生成 Prisma Client..."
if [ -d "prisma" ]; then
  npm run db:generate
fi

if [ "$SKIP_MIGRATE" = false ]; then
  echo "运行数据库迁移..."
  if [ -d "prisma" ]; then
    npm run db:migrate || echo "警告: 数据库迁移失败，请手动检查"
  fi
else
  echo "跳过数据库迁移..."
fi

echo ""
echo "启动 Backend 服务..."

# 停止可能正在运行的旧进程
OLD_PID=\$(pgrep -f "node.*dist/server.js" || true)
if [ -n "\$OLD_PID" ]; then
  echo "  停止旧进程 (PID: \$OLD_PID)..."
  kill \$OLD_PID 2>/dev/null || true
  sleep 2
fi

# 使用 nohup 在后台启动服务
nohup npm run start > ../logs/backend.log 2>&1 &
NEW_PID=\$!
echo "  Backend 已启动 (PID: \$NEW_PID)"

# 等待几秒确认进程正常运行
sleep 3
if ps -p \$NEW_PID > /dev/null 2>&1; then
  echo "  Backend 服务运行正常"
else
  echo "  警告: Backend 服务可能启动失败，请检查日志: $ECS_DEPLOY_PATH/logs/backend.log"
fi

echo ""
echo "部署完成！"
EOF

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "服务器信息:"
echo "  地址: $ECS_USER@$ECS_HOST"
echo "  路径: $ECS_DEPLOY_PATH"
echo "  日志: $ECS_DEPLOY_PATH/logs/backend.log"
