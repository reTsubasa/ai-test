# VyOS Web UI - Deployment Guide

## Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Installation Steps](#installation-steps)
- [Configuration Options](#configuration-options)
- [Deployment Environments](#deployment-environments)
- [Deployment Options](#deployment-options)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive instructions for deploying the VyOS Web UI in various environments, including development, staging, and production.

---

## System Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2 GB | 4+ GB |
| Disk Space | 10 GB | 20+ GB |
| Operating System | Linux (Ubuntu 20.04+, Debian 11+) | Latest LTS |

### Software Dependencies

| Software | Version | Purpose |
|----------|---------|---------|
| Rust | 1.70+ | Backend compilation |
| Node.js | 18+ | Frontend build |
| npm | 9+ | Package management |
| SQLite | 3.x | Database (development) |
| MySQL | 8.0+ | Database (production) |
| Nginx | 1.18+ | Reverse proxy (recommended) |

### Network Requirements

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | HTTP | Web interface (redirects to HTTPS) |
| 443 | HTTPS | Web interface |
| 8080 | HTTP | Backend API (internal) |
| 8443 | HTTPS | Backend API (internal) |

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass in CI/CD
- [ ] Security audit completed
- [ ] Database migrations prepared
- [ ] SSL/TLS certificates obtained
- [ ] Environment variables configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Log aggregation set up
- [ ] DNS records configured
- [ ] Firewall rules configured

---

## Installation Steps

### Step 1: System Preparation

Update the system and install dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    nginx \
    mysql-server \
    sqlite3
```

### Step 2: Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add Rust to PATH
source $HOME/.cargo/env
```

### Step 3: Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Clone the Repository

```bash
cd /opt
sudo git clone <repository-url> vyos-web-ui
cd vyos-web-ui
```

### Step 5: Build the Backend

```bash
cd backend

# Build release version
cargo build --release

# Verify build
./target/release/vyos-web-ui-backend --version
```

### Step 6: Build the Frontend

```bash
cd ../frontend

# Install dependencies
npm ci --production=false

# Build for production
npm run build

# The build output will be in ./dist
```

### Step 7: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
sudo nano .env
```

Production environment variables:

```env
# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
APP_ENV=production

# Database Configuration
DATABASE_URL=mysql://vyos_user:strong_password@localhost:3306/vyos_web_ui

# Authentication
JWT_SECRET_KEY=<generate-a-strong-random-secret>
JWT_EXPIRATION_MINUTES=60

# Logging
LOG_LEVEL=info

# VyOS API Configuration
VYOS_API_URL=https://your-vyos-node:8443
VYOS_API_USERNAME=vyos
VYOS_API_PASSWORD=<strong-password>
```

Generate a secure JWT secret:

```bash
openssl rand -base64 64
```

### Step 8: Setup Database

#### MySQL Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE vyos_web_ui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vyos_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON vyos_web_ui.* TO 'vyos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Run Migrations

```bash
cd backend

# Create data directory
mkdir -p data

# Run database initialization
# (This will depend on your migration tool)
```

---

## Configuration Options

### Backend Configuration

Create `/etc/vyos-web-ui/config.toml`:

```toml
[server]
host = "127.0.0.1"
port = 8080
workers = 4

[database]
url = "mysql://vyos_user:strong_password@localhost:3306/vyos_web_ui"
max_connections = 10
min_connections = 2
connection_timeout = 30

[auth]
jwt_secret = "<your-jwt-secret>"
jwt_expiration_minutes = 60
refresh_token_expiration_days = 7

[logging]
level = "info"
format = "json"

[vyos]
api_url = "https://your-vyos-node:8443"
api_username = "vyos"
api_password = "<strong-password>"
timeout = 30
```

### Frontend Configuration

Create `/opt/vyos-web-ui/frontend/.env.production`:

```env
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=wss://your-domain.com/ws
VITE_APP_TITLE="VyOS Web UI"
VITE_APP_ENVIRONMENT=production
```

### Nginx Configuration

Create `/etc/nginx/sites-available/vyos-web-ui`:

```nginx
upstream backend {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        root /opt/vyos-web-ui/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vyos-web-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Deployment Environments

### Development

Purpose: Local development and testing.

**Characteristics:**
- Hot reload enabled
- Debug logging
- SQLite database
- No HTTPS
- Permissive CORS

**Quick Start:**

```bash
# Backend
cd backend
cargo run

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Staging

Purpose: Pre-production testing environment.

**Characteristics:**
- Production-like configuration
- HTTPS enabled
- MySQL database
- Restricted CORS
- Separate from production

**Configuration:**

```env
APP_ENV=staging
DATABASE_URL=mysql://vyos_staging:password@localhost:3306/vyos_web_ui_staging
LOG_LEVEL=debug
```

### Production

Purpose: Live environment for end users.

**Characteristics:**
- Optimized builds
- HTTPS required
- MySQL database
- Strict CORS
- Limited logging
- Rate limiting enabled

**Configuration:**

```env
APP_ENV=production
DATABASE_URL=mysql://vyos_prod:strong_password@localhost:3306/vyos_web_ui_prod
LOG_LEVEL=warn
```

---

## Deployment Options

### Option 1: Manual Deployment

Suitable for small deployments or initial setup.

**Steps:**

1. Follow the Installation Steps above
2. Create systemd service files
3. Configure nginx
4. Set up SSL certificates
5. Start services

### Option 2: Docker Deployment

Suitable for containerized deployments.

#### Dockerfile (Backend)

```dockerfile
FROM rust:1.70-slim as builder

WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/vyos-web-ui-backend /app/

EXPOSE 8080

CMD ["./vyos-web-ui-backend"]
```

#### Dockerfile (Frontend)

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=mysql://vyos:password@db:3306/vyos_web_ui
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - APP_ENV=production
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=vyos_web_ui
      - MYSQL_USER=vyos
      - MYSQL_PASSWORD=password
      - MYSQL_ROOT_PASSWORD=rootpassword
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

### Option 3: Systemd Service

Create `/etc/systemd/system/vyos-web-ui-backend.service`:

```ini
[Unit]
Description=VyOS Web UI Backend
After=network.target mysql.service

[Service]
Type=simple
User=vyos
WorkingDirectory=/opt/vyos-web-ui/backend
ExecStart=/opt/vyos-web-ui/backend/target/release/vyos-web-ui-backend
Restart=on-failure
RestartSec=5

EnvironmentFile=/etc/vyos-web-ui/config.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable vyos-web-ui-backend
sudo systemctl start vyos-web-ui-backend
sudo systemctl status vyos-web-ui-backend
```

---

## Monitoring and Maintenance

### Application Monitoring

Use the following tools for monitoring:

#### Health Checks

```bash
# Basic health check
curl https://your-domain.com/api/health

# Detailed health check
curl https://your-domain.com/api/health/detailed
```

#### Log Monitoring

Backend logs:

```bash
sudo journalctl -u vyos-web-ui-backend -f
```

Nginx logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

MySQL logs:

```bash
sudo tail -f /var/log/mysql/error.log
```

### Performance Monitoring

#### System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tunlp
```

#### Application Metrics

The application exposes metrics that can be monitored with Prometheus:

```bash
curl http://localhost:8080/metrics
```

### Maintenance Tasks

#### Database Maintenance

```bash
# Backup database
mysqldump -u vyos -p vyos_web_ui > backup_$(date +%Y%m%d).sql

# Optimize tables
mysql -u vyos -p vyos_web_ui -e "OPTIMIZE TABLE users, nodes, config_history;"

# Check for corruption
mysqlcheck -u vyos -p --check vyos_web_ui
```

#### Log Rotation

Create `/etc/logrotate.d/vyos-web-ui`:

```
/var/log/vyos-web-ui/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 vyos vyos
    sharedscripts
    postrotate
        systemctl reload vyos-web-ui-backend > /dev/null 2>&1 || true
    endscript
}
```

#### Software Updates

```bash
# Update application
cd /opt/vyos-web-ui
sudo git pull origin master

# Rebuild backend
cd backend
cargo build --release

# Rebuild frontend
cd ../frontend
npm ci
npm run build

# Restart services
sudo systemctl restart vyos-web-ui-backend
sudo systemctl reload nginx
```

---

## Backup and Recovery

### Backup Strategy

#### Daily Automated Backup

Create a cron job:

```bash
sudo crontab -e
```

Add:

```
0 2 * * * /opt/vyos-web-ui/scripts/backup.sh
```

#### Backup Script

Create `/opt/vyos-web-ui/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/vyos-web-ui"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u vyos -p'password' vyos_web_ui > $BACKUP_DIR/database_$DATE.sql
gzip $BACKUP_DIR/database_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/vyos-web-ui

# Delete old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
```

Make it executable:

```bash
sudo chmod +x /opt/vyos-web-ui/scripts/backup.sh
```

### Recovery Procedure

#### Database Recovery

```bash
# Stop application
sudo systemctl stop vyos-web-ui-backend

# Restore database
gunzip /var/backups/vyos-web-ui/database_20250201.sql.gz
mysql -u vyos -p vyos_web_ui < /var/backups/vyos-web-ui/database_20250201.sql

# Start application
sudo systemctl start vyos-web-ui-backend
```

#### Application Recovery

```bash
# Stop services
sudo systemctl stop vyos-web-ui-backend
sudo systemctl stop nginx

# Restore application
cd /opt
sudo rm -rf vyos-web-ui
sudo tar -xzf /var/backups/vyos-web-ui/app_20250201.tar.gz

# Start services
sudo systemctl start vyos-web-ui-backend
sudo systemctl start nginx
```

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Problem:** Backend service fails to start.

**Solution:**

```bash
# Check service status
sudo systemctl status vyos-web-ui-backend

# View logs
sudo journalctl -u vyos-web-ui-backend -n 50

# Check configuration
sudo /opt/vyos-web-ui/backend/target/release/vyos-web-ui-backend --check-config

# Verify database connection
mysql -u vyos -p -e "SELECT 1"
```

#### Database Connection Errors

**Problem:** Application cannot connect to database.

**Solution:**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u vyos -p -h localhost vyos_web_ui

# Check credentials
grep DATABASE_URL /opt/vyos-web-ui/.env

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'vyos_web_ui';"
```

#### Frontend Build Fails

**Problem:** Frontend build process fails.

**Solution:**

```bash
# Clear cache
cd frontend
rm -rf node_modules package-lock.json dist

# Reinstall dependencies
npm ci

# Check Node.js version
node --version
npm --version

# Build with verbose output
npm run build -- --verbose
```

#### Nginx Configuration Errors

**Problem:** Nginx fails to start or reload.

**Solution:**

```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T

# View error log
sudo tail -f /var/log/nginx/error.log

# Restart service
sudo systemctl restart nginx
```

#### High Memory Usage

**Problem:** Application consumes excessive memory.

**Solution:**

```bash
# Check memory usage
free -h

# Monitor process memory
htop

# Check database connection pool
mysql -u vyos -p -e "SHOW PROCESSLIST;"

# Adjust pool size in configuration
```

#### SSL Certificate Issues

**Problem:** HTTPS/SSL not working.

**Solution:**

```bash
# Check certificate exists
ls -la /etc/ssl/certs/your-domain.com.crt

# Check certificate validity
openssl x509 -in /etc/ssl/certs/your-domain.com.crt -noout -dates

# Test certificate
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Getting Help

If you encounter issues not covered here:

1. Check application logs
2. Review this guide thoroughly
3. Check the GitHub issues
4. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs

---

**Version**: 0.1.0
**Last Updated**: February 2025