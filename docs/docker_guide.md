# Docker Guide for VyOS Web UI

This guide provides comprehensive instructions for building, deploying, and managing the VyOS Web UI application using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Structure](#project-structure)
4. [Building with Docker](#building-with-docker)
5. [Development Environment](#development-environment)
6. [Production Environment](#production-environment)
7. [Configuration Management](#configuration-management)
8. [Volume Management](#volume-management)
9. [Troubleshooting](#troubleshooting)
10. [Updating Containers](#updating-containers)
11. [Security Considerations](#security-considerations)

---

## Prerequisites

Before proceeding, ensure you have the following installed:

### Docker Engine

| Platform | Installation Command |
|----------|---------------------|
| macOS | `brew install --cask docker` |
| Ubuntu/Debian | `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh` |
| CentOS/RHEL | `sudo yum install -y yum-utils && sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo && sudo yum install docker-ce docker-ce-cli containerd.io` |

### Docker Compose

Docker Compose V2 is included with Docker Desktop and Docker Engine installation.

### Verify Installation

```bash
docker --version
docker compose version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## Installation

1. Clone the repository (if not already done):
   ```bash
   git clone <repository-url>
   cd new_ai
   ```

2. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```

3. Review and update the `.env` file with your configuration:
   ```bash
   # Edit .env file
   nano .env  # or use your preferred editor
   ```

---

## Project Structure

```
new_ai/
├── Dockerfile                  # Multi-stage Docker build file
├── docker-compose.yml          # Development environment configuration
├── docker-compose.prod.yml     # Production environment configuration
├── .dockerignore              # Files excluded from Docker build context
├── nginx.conf                 # Nginx configuration for production
├── .env                       # Environment variables (create from .env.example)
├── backend/                   # Rust backend application
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── src/
│   └── migrations/
└── frontend/                  # React frontend application
    ├── package.json
    ├── package-lock.json
    ├── src/
    └── vite.config.ts
```

---

## Building with Docker

### Build Individual Services

#### Build Backend Only

```bash
# Build backend runtime image
docker build --target backend-runtime -t vyos-web-ui-backend:latest .
```

#### Build Frontend Only

```bash
# Build frontend runtime image
docker build --target frontend-runtime -t vyos-web-ui-frontend:latest .
```

#### Build All Images

```bash
# Build complete multi-stage image
docker build -t vyos-web-ui:latest .
```

### Build with Compose

#### Development Build

```bash
# Build development images
docker compose build

# Build specific service
docker compose build backend
docker compose build frontend
```

#### Production Build

```bash
# Build production images
docker compose -f docker-compose.prod.yml build
```

### Build Arguments

You can customize builds using build arguments:

```bash
docker build --build-arg RUST_VERSION=1.82 -t vyos-web-ui:latest .
```

---

## Development Environment

### Starting Development Services

```bash
# Start all services
docker compose up

# Start services in detached mode
docker compose up -d

# Start specific service
docker compose up backend
```

### Accessing Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React development server |
| Backend API | http://localhost:8080 | Rust API server |
| Mailhog | http://localhost:8025 | Email testing interface |
| phpMyAdmin | http://localhost:8081 | MySQL management (if enabled) |

### Viewing Logs

```bash
# Follow all logs
docker compose logs -f

# Follow specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# View last 100 lines
docker compose logs --tail=100

# View logs since a specific time
docker compose logs --since="2024-01-01T00:00:00"
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

### Development Workflow

1. Make changes to source code
2. Frontend hot-reloads automatically
3. For backend changes, restart the service:
   ```bash
   docker compose restart backend
   ```

### Running Commands in Containers

```bash
# Open a shell in the backend container
docker compose exec backend bash

# Run Rust tests
docker compose exec backend cargo test

# Open a shell in the frontend container
docker compose exec frontend sh

# Install new npm packages
docker compose exec frontend npm install <package>
```

### Using MySQL in Development

To use MySQL instead of SQLite in development:

1. Uncomment the `mysql` service in `docker-compose.yml`
2. Update the `DATABASE_URL` environment variable:
   ```bash
   DATABASE_URL=mysql://vyos_user:vyos_password@mysql:3306/vyos_web_ui
   ```
3. Start the services:
   ```bash
   docker compose up -d mysql backend frontend
   ```

---

## Production Environment

### Preparing for Production

1. Create a production environment file:
   ```bash
   cp .env.example .env.prod
   ```

2. Edit `.env.prod` with production values:
   ```bash
   # Required for production
   JWT_SECRET_KEY=<generate-a-secure-random-key>
   MYSQL_ROOT_PASSWORD=<strong-password>
   MYSQL_PASSWORD=<strong-password>
   ```

3. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```

### Starting Production Services

```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d
```

### Accessing Production Services

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost | Main application |
| API | http://localhost/api | Backend API |
| Dozzle | http://localhost:8090 | Log viewer |

### Production Services Overview

| Service | Image | Purpose |
|---------|-------|---------|
| nginx | nginx:1.27-alpine | Reverse proxy and static file server |
| backend | vyos-web-ui-backend:latest | Rust API server |
| frontend | vyos-web-ui-frontend:latest | React static files |
| mysql | mysql:8.0 | Production database |
| redis | redis:7-alpine | Caching and session store |
| watchtower | containrrr/watchtower | Automatic container updates |
| dozzle | amir20/dozzle | Log viewer |

### Scaling Services

```bash
# Scale backend service
docker compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend service (with load balancer)
docker compose -f docker-compose.prod.yml up -d --scale frontend=2
```

---

## Configuration Management

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Development Environment Variables

```bash
# Server Configuration
SERVER_PORT=8080
FRONTEND_PORT=3000

# JWT Authentication
JWT_SECRET_KEY=dev_secret_key_for_local_testing_only
JWT_EXPIRATION_MINUTES=60

# Database
MYSQL_PORT=3306
MYSQL_DATABASE=vyos_web_ui
MYSQL_USER=vyos_user
MYSQL_PASSWORD=vyos_password
MYSQL_ROOT_PASSWORD=root_password

# Mailhog
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025

# phpMyAdmin (optional)
PHPMYADMIN_PORT=8081
```

#### Production Environment Variables

```bash
# Required - MUST BE SET
JWT_SECRET_KEY=<generate-with-openssl-rand-base64-32>
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_PASSWORD=<strong-password>

# Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# Backend
LOG_LEVEL=info
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Database
MYSQL_DATABASE=vyos_web_ui
MYSQL_USER=vyos_user

# Session
SESSION_MAX_AGE_SECONDS=3600

# SSL/TLS
SSL_CERT_PATH=/etc/nginx/certs/fullchain.pem
SSL_KEY_PATH=/etc/nginx/certs/privkey.pem

# VyOS API (optional)
VYOS_API_URL=https://vyos.example.com/api
VYOS_API_USERNAME=admin
VYOS_API_PASSWORD=<vyos-password>

# Resource Limits
BACKEND_CPU_LIMIT=2
BACKEND_MEMORY_LIMIT=1G
FRONTEND_CPU_LIMIT=0.5
FRONTEND_MEMORY_LIMIT=256M
MYSQL_CPU_LIMIT=2
MYSQL_MEMORY_LIMIT=2G
REDIS_CPU_LIMIT=0.5
REDIS_MEMORY_LIMIT=256M

# Network
NETWORK_SUBNET=172.20.0.0/16

# Data Paths
BACKEND_DATA_PATH=./data/backend
BACKEND_LOGS_PATH=./logs/backend
MYSQL_DATA_PATH=./data/mysql
REDIS_DATA_PATH=./data/redis
NGINX_LOGS_PATH=./logs/nginx

# Watchtower
WATCHTOWER_POLL_INTERVAL=86400

# Dozzle
DOZZLE_PORT=8090
```

### Passing Environment Variables

#### Via Compose File

Variables defined in `.env` are automatically picked up by Docker Compose.

#### Via Command Line

```bash
docker compose -f docker-compose.prod.yml up -d -e JWT_SECRET_KEY="your-secret"
```

#### Via Docker Secrets (Production Recommended)

1. Create secrets:
   ```bash
   echo "your-secret" | docker secret create jwt_secret -
   ```

2. Reference secrets in docker-compose.prod.yml:
   ```yaml
   secrets:
     jwt_secret:
       external: true

   services:
     backend:
       secrets:
         - jwt_secret
   ```

### SSL/TLS Configuration

For production with SSL:

1. Create certificates directory:
   ```bash
   mkdir -p nginx/certs
   ```

2. Obtain SSL certificates (Let's Encrypt recommended):
   ```bash
   # Using certbot
   sudo certbot certonly --standalone -d yourdomain.com
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/
   ```

3. Update `nginx.conf` to enable SSL server block

4. Restart nginx:
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

---

## Volume Management

### List Volumes

```bash
docker volume ls
```

### Inspect Volume

```bash
docker volume inspect vyos_web_ui_backend-data
```

### Backup Volumes

```bash
# Backup MySQL data
docker run --rm -v vyos_web_ui_mysql-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/mysql-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup Redis data
docker run --rm -v vyos_web_ui_redis-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup backend data
docker run --rm -v vyos_web_ui_backend-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/backend-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore MySQL data
docker run --rm -v vyos_web_ui_mysql-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/mysql-backup-20240101.tar.gz -C /data

# Restore Redis data
docker run --rm -v vyos_web_ui_redis-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/redis-backup-20240101.tar.gz -C /data
```

### Delete Volumes

```bash
# Stop containers first
docker compose -f docker-compose.prod.yml down

# Remove specific volume
docker volume rm vyos_web_ui_mysql-data

# Remove all unused volumes
docker volume prune
```

### Persist Data with Bind Mounts

Production configuration uses bind mounts for better control:

```yaml
volumes:
  mysql-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/mysql
```

Ensure directories exist before starting:
```bash
mkdir -p data/mysql data/redis data/backend logs/backend logs/nginx
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs backend

# Inspect container
docker compose exec backend env
```

### Build Failures

#### Out of Disk Space

```bash
# Clean up Docker system
docker system prune -a

# Remove unused images
docker image prune -a

# Remove build cache
docker builder prune
```

#### Network Issues

```bash
# Restart Docker daemon
sudo systemctl restart docker  # Linux
# or restart Docker Desktop (macOS/Windows)

# Check network
docker network inspect vyos-network

# Recreate network
docker compose down
docker network prune
docker compose up -d
```

### Database Connection Issues

```bash
# Check if MySQL is healthy
docker compose -f docker-compose.prod.yml ps mysql

# View MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# Test MySQL connection
docker compose -f docker-compose.prod.yml exec mysql mysql -u vyos_user -p vyos_web_ui
```

### Permission Issues

```bash
# Fix volume permissions
sudo chown -R 1000:1000 data/
sudo chown -R 1000:1000 logs/
```

### Health Check Failures

```bash
# Check health status
docker inspect vyos-web-ui-backend-prod | grep -A 10 Health

# Disable health check temporarily for debugging
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

### Frontend Build Issues

```bash
# Clear node modules cache
docker compose run --rm frontend rm -rf node_modules package-lock.json
docker compose run --rm frontend npm install

# Rebuild without cache
docker compose build --no-cache frontend
```

### Backend Build Issues

```bash
# Clear Cargo cache
docker compose run --rm backend cargo clean

# Rebuild without cache
docker compose build --no-cache backend
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `port is already allocated` | Change port in .env or stop conflicting service |
| `cannot connect to Docker daemon` | Start Docker service: `sudo systemctl start docker` |
| `no such file or directory` | Check file paths in volumes section |
| `permission denied` | Fix directory permissions with `chmod`/`chown` |
| `connection refused` | Check service is running and ports are correct |

---

## Updating Containers

### Zero-Downtime Updates

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Update services
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# Restart with new images
docker compose -f docker-compose.prod.yml up -d
```

### Rolling Updates

```bash
# Update backend with rolling restart
docker compose -f docker-compose.prod.yml up -d --scale backend=4
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Using Watchtower (Auto-Updates)

Watchtower automatically updates containers when new images are available:

1. Enable watchtower in docker-compose.prod.yml (already enabled by default)
2. Set update interval:
   ```bash
   WATCHTOWER_POLL_INTERVAL=86400  # Check daily
   ```
3. Push new images to registry
4. Watchtower will automatically update containers

### Manual Image Update Workflow

```bash
# 1. Build new image
docker build -t vyos-web-ui-backend:latest .

# 2. Stop old container
docker compose -f docker-compose.prod.yml stop backend

# 3. Remove old container
docker compose -f docker-compose.prod.yml rm -f backend

# 4. Start new container
docker compose -f docker-compose.prod.yml up -d backend

# 5. Verify health
docker compose -f docker-compose.prod.yml ps backend
```

---

## Security Considerations

### Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique passwords** for all services
3. **Generate secure JWT secrets** using `openssl rand -base64 32`
4. **Enable SSL/TLS** in production
5. **Use resource limits** to prevent DoS attacks
6. **Regularly update base images** and dependencies
7. **Run containers as non-root users** (configured in Dockerfile)
8. **Use Docker secrets** for sensitive data in production
9. **Enable health checks** for all services
10. **Monitor logs** for suspicious activity

### Image Security Scanning

```bash
# Scan images with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image vyos-web-ui-backend:latest

# Scan images with Snyk
docker run --rm -v $(pwd):/project snyk/snyk-cli:latest snyk test --docker-file=Dockerfile vyos-web-ui-backend:latest
```

### Container Hardening

```bash
# Run with read-only root filesystem
docker run --read-only --tmpfs /tmp vyos-web-ui-backend:latest

# Drop all capabilities
docker run --cap-drop=all --cap-add=NET_BIND_SERVICE vyos-web-ui-backend:latest

# Set security options
docker run --security-opt=no-new-privileges vyos-web-ui-backend:latest
```

### Network Isolation

```bash
# Create isolated network
docker network create --driver bridge --internal vyos-internal

# Connect services to isolated network
docker network connect vyos-internal backend
docker network connect vyos-internal mysql
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Rust Docker Best Practices](https://doc.rust-lang.org/cargo/guide/building.html#building-on-docker)
- [React Production Build](https://vitejs.dev/guide/build.html)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs with `docker compose logs`
3. Consult the main project documentation in `/docs/`
4. Open an issue in the project repository