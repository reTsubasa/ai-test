# VyOS Web UI 部署指南

## 目录
1. [概述](#概述)
2. [环境准备](#环境准备)
3. [生产环境部署](#生产环境部署)
4. [容器化部署](#容器化部署)
5. [配置管理](#配置管理)
6. [安全性配置](#安全性配置)
7. [监控和日志](#监控和日志)
8. [备份和恢复](#备份和恢复)
9. [故障排除](#故障排除)
10. [升级指南](#升级指南)

## 概述

### 部署选项
VyOS Web UI 支持多种部署方式：
- 直接部署到物理/虚拟机
- 容器化部署（Docker/Docker Compose）
- Kubernetes 部署
- 云平台部署（AWS, Azure, GCP）

### 部署架构
典型的生产部署架构包括：
- 前端服务：React 应用，负责用户界面
- 后端服务：Rust 应用，处理业务逻辑
- 数据库：存储用户、配置和监控数据
- 负载均衡器（可选）：处理 HTTPS 和流量分发
- 反向代理（可选）：提供额外的安全和缓存

## 环境准备

### 系统要求

#### 硬件要求
- **CPU**: 2 核或更多
- **内存**: 4GB RAM（最低），推荐 8GB 或更多
- **存储**: 20GB 可用空间
- **网络**: 稳定的网络连接

#### 操作系统要求
- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- **Windows**: Windows Server 2019+ (仅开发环境)
- **macOS**: macOS 12+ (仅开发环境)

#### 软件依赖
```bash
# 对于 Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git nginx supervisor sqlite3

# 对于 CentOS/RHEL
sudo yum update
sudo yum install -y curl wget git nginx supervisor sqlite
```

### 网络配置
确保以下端口可用：
- 80 (HTTP)
- 443 (HTTPS)
- 8080 (后端 API，如果未使用反向代理)
- 3000 (前端开发服务器)

### 证书准备
为了生产环境的安全性，建议提前准备 SSL 证书：

```bash
# 使用 Let's Encrypt 获取免费 SSL 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 生产环境部署

### 方法一：传统部署

#### 1. 安装 Rust 和 Node.js

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 安装 Node.js (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
```

#### 2. 克隆和构建项目

```bash
# 克隆代码
git clone https://github.com/vyos/web-ui.git
cd vyos-web-ui

# 构建后端
cd backend
cargo build --release
cd ..

# 构建前端
cd frontend
npm install
npm run build
cd ..
```

#### 3. 配置系统服务

创建后端服务文件 `/etc/systemd/system/vyos-web-backend.service`：

```ini
[Unit]
Description=VyOS Web UI Backend Service
After=network.target

[Service]
Type=simple
User=vyos-web
Group=vyos-web
WorkingDirectory=/opt/vyos-web-ui/backend
ExecStart=/opt/vyos-web-ui/backend/target/release/vyos-web-backend
Restart=always
RestartSec=10
Environment=DATABASE_URL=sqlite:///opt/vyos-web-ui/data/vyos.db
Environment=JWT_SECRET_KEY=your-super-secret-key
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

创建前端服务文件（使用 Nginx）：

```bash
sudo mkdir -p /var/www/vyos-web-ui
sudo cp -r frontend/dist/* /var/www/vyos-web-ui/
```

#### 4. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/vyos-web-ui`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/vyos-web-ui;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/vyos-web-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 启动服务

```bash
# 创建用户
sudo useradd -r -s /bin/false vyos-web

# 创建数据目录
sudo mkdir -p /opt/vyos-web-ui/data
sudo chown vyos-web:vyos-web /opt/vyos-web-ui/data

# 启动后端服务
sudo systemctl daemon-reload
sudo systemctl enable vyos-web-backend
sudo systemctl start vyos-web-backend

# 检查服务状态
sudo systemctl status vyos-web-backend
```

### 方法二：使用 Supervisor（替代 systemd）

如果更喜欢使用 Supervisor，创建配置文件 `/etc/supervisor/conf.d/vyos-web.conf`：

```ini
[program:vyos-web-backend]
command=/opt/vyos-web-ui/backend/target/release/vyos-web-backend
directory=/opt/vyos-web-ui/backend
user=vyos-web
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/vyos-web-backend.log
environment=DATABASE_URL="sqlite:///opt/vyos-web-ui/data/vyos.db",JWT_SECRET_KEY="your-super-secret-key",APP_ENV="production"
```

启动 Supervisor 服务：

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start vyos-web-backend
```

## 容器化部署

### Docker Compose 部署

#### 1. 准备 Docker Compose 文件

创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  backend:
    image: vyos/web-ui-backend:latest
    container_name: vyos-web-backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=sqlite:///app/data/vyos.db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - APP_ENV=production
      - SERVER_HOST=0.0.0.0
      - SERVER_PORT=8080
    volumes:
      - vyos-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: vyos/web-ui-frontend:latest
    container_name: vyos-web-frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:8080/api
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: vyos-web-nginx
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
      - nginx-log:/var/log/nginx
    restart: unless-stopped
    depends_on:
      - frontend
      - backend

volumes:
  vyos-data:
  nginx-log:
```

#### 2. 配置 Nginx 反向代理

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:80;
    }

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/ssl/certs/vyos.crt;
        ssl_certificate_key /etc/ssl/private/vyos.key;

        # API 代理
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket 代理
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 前端静态文件
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
```

#### 3. 启动容器化部署

```bash
# 创建环境文件
cat > .env << EOF
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 单容器部署

也可以创建单个容器同时运行前端和后端：

创建 Dockerfile：

```dockerfile
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM rust:1.75 AS backend-build
WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# 复制后端二进制文件
COPY --from=backend-build /app/target/release/vyos-web-backend /usr/local/bin/

# 复制前端构建结果
COPY --from=frontend-build /app/dist ./frontend/dist

# 创建数据目录
RUN mkdir -p /var/lib/vyos-web-ui

EXPOSE 8080

CMD ["sh", "-c", "vyos-web-backend & nginx -g 'daemon off;'"]
```

## 配置管理

### 环境变量配置

创建 `.env.production` 文件：

```bash
# 数据库配置
DATABASE_URL=sqlite:///var/lib/vyos-web-ui/vyos.db
# 或者对于 MySQL
# DATABASE_URL=mysql://user:password@localhost:3306/vyos_web_ui

# JWT 配置
JWT_SECRET_KEY=your-production-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# 应用配置
APP_ENV=production
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# 日志配置
LOG_LEVEL=INFO
LOG_FILE_PATH=/var/log/vyos-web-ui/app.log

# VyOS 系统连接配置
VYOS_API_BASE_URL=https://vyos-system-api:8443
VYOS_API_TIMEOUT_SECS=30

# 监控配置
MONITORING_REFRESH_INTERVAL_MS=5000
MAX_METRICS_HISTORY_HOURS=24

# 安全配置
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINS=15
PASSWORD_MIN_LENGTH=8
```

### 数据库配置

#### SQLite（默认）
SQLite 是默认数据库，适合中小型部署：

```bash
# 创建数据库文件
mkdir -p /var/lib/vyos-web-ui
chown vyos-web:vyos-web /var/lib/vyos-web-ui
chmod 750 /var/lib/vyos-web-ui

# 初始化数据库
sqlite3 /var/lib/vyos-web-ui/vyos.db ".read migrations/001_initial_schema.sql"
```

#### MySQL（生产推荐）
对于大型部署，建议使用 MySQL：

```sql
-- 创建数据库和用户
CREATE DATABASE vyos_web_ui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vyos_web'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON vyos_web_ui.* TO 'vyos_web'@'%';
FLUSH PRIVILEGES;
```

### 反向代理配置

#### Nginx 高级配置

创建 `/etc/nginx/conf.d/vyos-web-security.conf`：

```nginx
# 限制请求大小
client_max_body_size 10M;

# 安全头
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header Referrer-Policy "no-referrer-when-downgrade";

# 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 速率限制
limit_req_zone $binary_remote_addr zone=v2api:10m rate=10r/s;
limit_req zone=v2api burst=20 nodelay;
```

## 安全性配置

### SSL/TLS 配置

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 手动证书配置

```bash
# 生成自签名证书（仅用于测试）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/vyos-web.key \
    -out /etc/ssl/certs/vyos-web.crt
```

### 身份验证和授权

#### OAuth 2.0/OpenID Connect（可选）

配置文件 `oauth2_config.json`：

```json
{
  "provider": "keycloak",
  "client_id": "vyos-web-ui",
  "client_secret": "your-client-secret",
  "authorization_url": "https://your-keycloak-server/auth/realms/your-realm/protocol/openid-connect/auth",
  "token_url": "https://your-keycloak-server/auth/realms/your-realm/protocol/openid-connect/token",
  "user_info_url": "https://your-keycloak-server/auth/realms/your-realm/protocol/openid-connect/userinfo"
}
```

### 防火墙配置

#### UFW 配置

```bash
# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable
```

#### iptables 配置（高级）

```bash
# 允许回环流量
iptables -A INPUT -i lo -j ACCEPT

# 允许已建立的连接
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# 允许 HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 限制 SSH 连接频率
iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min --limit-burst 3 -j ACCEPT

# 丢弃其他所有输入流量
iptables -A INPUT -j DROP
```

## 监控和日志

### 应用日志配置

#### 日志轮转

创建 `/etc/logrotate.d/vyos-web-ui`：

```bash
/var/log/vyos-web-ui/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 vyos-web vyos-web
    postrotate
        systemctl reload vyos-web-backend > /dev/null 2>&1 || true
    endscript
}
```

#### 日志级别配置

后端服务日志配置：

```bash
# 在环境变量中设置
export RUST_LOG=info,vyos_web_backend=debug,sqlx=warn
```

### 系统监控

#### 使用 Prometheus + Grafana

创建 Prometheus 配置 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vyos-web-ui'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: /metrics
```

#### 系统资源监控脚本

创建监控脚本 `/opt/vyos-web-ui/scripts/health-check.sh`：

```bash
#!/bin/bash

# 检查服务状态
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)

# 检查磁盘空间
DISK_USAGE=$(df /var/lib/vyos-web-ui | awk 'NR==2 {print $5}' | sed 's/%//')

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')

# 发送告警（如果需要）
if [ "$BACKEND_STATUS" != "200" ]; then
    echo "ERROR: Backend service unavailable" | mail -s "VyOS Web UI Alert" admin@company.com
fi

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%" | mail -s "Disk Space Alert" admin@company.com
fi

if [ "$(echo "$MEM_USAGE > 80" | bc)" -eq 1 ]; then
    echo "WARNING: Memory usage is ${MEM_USAGE}%" | mail -s "Memory Usage Alert" admin@company.com
fi
```

### 性能监控

#### 数据库性能监控

创建数据库监控脚本：

```sql
-- 检查慢查询
SHOW PROCESSLIST;

-- 检查索引使用情况
EXPLAIN QUERY PLAN SELECT * FROM users WHERE username = 'test';

-- 检查数据库锁
PRAGMA lock_status;
```

## 备份和恢复

### 自动备份脚本

创建备份脚本 `/opt/vyos-web-ui/scripts/backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/vyos-web-ui"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="vyos-web-ui-backup-$DATE"

mkdir -p $BACKUP_DIR

# 备份数据库
cp /var/lib/vyos-web-ui/vyos.db $BACKUP_DIR/${BACKUP_NAME}_db.sqlite

# 备份配置文件
tar -czf $BACKUP_DIR/${BACKUP_NAME}_configs.tar.gz \
    /etc/vyos-web-ui/ \
    /etc/nginx/sites-available/vyos-web-ui \
    /etc/systemd/system/vyos-web-backend.service

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "vyos-web-ui-backup-*" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}"
```

### 定时备份任务

添加到 crontab：

```bash
# 每天凌晨2点执行备份
0 2 * * * /opt/vyos-web-ui/scripts/backup.sh
```

### 灾难恢复流程

#### 从备份恢复

```bash
# 1. 停止服务
sudo systemctl stop vyos-web-backend

# 2. 恢复数据库
cp /path/to/backup/vyos.db /var/lib/vyos-web-ui/vyos.db
chown vyos-web:vyos-web /var/lib/vyos-web-ui/vyos.db

# 3. 恢复配置
tar -xzf /path/to/backup/configs.tar.gz -C /

# 4. 重新加载配置
sudo systemctl daemon-reload
sudo systemctl start vyos-web-backend
```

## 故障排除

### 服务启动问题

#### 检查服务状态

```bash
# 检查后端服务
sudo systemctl status vyos-web-backend
sudo journalctl -u vyos-web-backend -f

# 检查 Nginx
sudo systemctl status nginx
sudo journalctl -u nginx -f

# 检查 Docker 容器
docker-compose ps
docker-compose logs -f
```

#### 常见启动错误

```bash
# 检查端口占用
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :3000

# 检查权限问题
ls -la /var/lib/vyos-web-ui/
ls -la /opt/vyos-web-ui/

# 检查配置文件语法
nginx -t
```

### 性能问题

#### 高 CPU 使用率

```bash
# 检查进程
top -p $(pgrep vyos-web-backend)

# 检查日志中的错误
tail -f /var/log/vyos-web-backend.log

# 检查数据库查询
sqlite3 /var/lib/vyos-web-ui/vyos.db "PRAGMA compile_options;"
```

#### 高内存使用率

```bash
# 检查内存使用
free -h
ps aux | grep vyos-web-backend

# 检查是否有内存泄漏
pmap -x $(pgrep vyos-web-backend)
```

### 网络连接问题

#### 连接超时

```bash
# 检查防火墙
sudo ufw status
sudo iptables -L

# 检查监听端口
sudo ss -tlnp

# 测试连通性
curl -v http://localhost:8080/health
curl -v https://your-domain.com/api/health
```

## 升级指南

### 版本升级准备

#### 1. 备份数据

```bash
sudo systemctl stop vyos-web-backend
/opt/vyos-web-ui/scripts/backup.sh
sudo systemctl start vyos-web-backend
```

#### 2. 检查兼容性

```bash
# 检查当前版本
curl -s http://localhost:8080/version

# 检查数据库迁移需求
sqlite3 /var/lib/vyos-web-ui/vyos.db ".tables"
```

### 从 v1.x 升级到 v2.x

#### 1. 数据库迁移

```bash
# 执行数据库迁移脚本
sqlite3 /var/lib/vyos-web-ui/vyos.db < migrations/upgrade-v2.sql
```

#### 2. 配置文件更新

更新环境变量和配置文件，特别是 API 路径和认证方式的变化。

#### 3. 部署新版本

```bash
# 停止当前服务
sudo systemctl stop vyos-web-backend

# 下载新版本
cd /opt/vyos-web-ui
git pull origin main
cd backend
cargo build --release

# 启动服务
sudo systemctl start vyos-web-backend
sudo systemctl status vyos-web-backend
```

### 回滚计划

如果升级失败，立即执行回滚：

```bash
# 1. 停止新版本
sudo systemctl stop vyos-web-backend

# 2. 恢复旧版本二进制文件
sudo cp /opt/vyos-web-ui/backup/vyos-web-backend-old /opt/vyos-web-ui/backend/target/release/vyos-web-backend

# 3. 恢复旧数据库备份
sudo cp /opt/backups/vyos-web-ui/previous_db.sqlite /var/lib/vyos-web-ui/vyos.db

# 4. 启动旧版本
sudo systemctl start vyos-web-backend
```

### 验证升级

升级完成后执行以下验证：

```bash
# 检查服务健康
curl -s http://localhost:8080/health

# 检查 API 功能
curl -s http://localhost:8080/api/v1/auth/health

# 检查前端访问
curl -s https://your-domain.com | grep "VyOS Web UI"

# 检查日志
sudo journalctl -u vyos-web-backend --since "1 minute ago"
```

## 附录

### 安全加固清单

- [ ] 使用强密码和密钥
- [ ] 配置 SSL/TLS
- [ ] 设置防火墙规则
- [ ] 定期更新系统和依赖
- [ ] 配置日志审计
- [ ] 实施备份策略
- [ ] 配置监控和告警

### 性能调优建议

- 使用 SSD 存储数据库
- 增加内存以提高缓存效率
- 使用 CDN 加速静态资源
- 配置负载均衡器
- 实施数据库连接池

### 监控指标

**系统指标**:
- CPU 使用率
- 内存使用率
- 磁盘 I/O
- 网络带宽

**应用指标**:
- API 响应时间
- 并发用户数
- 错误率
- 数据库查询性能

**业务指标**:
- 配置应用成功率
- 监控数据收集率
- 用户认证成功率