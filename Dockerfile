# =============================================================================
# Multi-stage Dockerfile for VyOS Web UI
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Backend Builder
# -----------------------------------------------------------------------------
FROM rust:1.82-slim AS backend-builder

WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source files
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
COPY backend/migrations ./migrations

# Build the backend binary
RUN cargo build --release

# -----------------------------------------------------------------------------
# Stage 2: Frontend Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source files
COPY frontend/.eslintrc.js frontend/.prettierrc ./
COPY frontend/tsconfig.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/index.html ./
COPY frontend/src ./src

# Build the frontend for production
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Backend Runtime
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim AS backend-runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for running the application
RUN useradd -m -u 1000 vyos && \
    mkdir -p /app/backend/data /app/backend/migrations && \
    chown -R vyos:vyos /app

WORKDIR /app/backend

# Copy the backend binary from builder
COPY --from=backend-builder --chown=vyos:vyos /app/backend/target/release/vyos-web-ui-backend ./vyos-web-ui-backend

# Copy migrations
COPY --from=backend-builder --chown=vyos:vyos /app/backend/migrations ./migrations

# Switch to non-root user
USER vyos

# Expose the backend port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Set environment defaults
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV APP_ENV=production
ENV LOG_LEVEL=info
DATABASE_URL=sqlite:/app/backend/data/database.db

# Run the backend
CMD ["./vyos-web-ui-backend"]

# -----------------------------------------------------------------------------
# Stage 4: Frontend Runtime
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS frontend-runtime

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for nginx
RUN addgroup -g 1000 -S nginx && \
    adduser -u 1000 -S -D -H -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /run/nginx /usr/share/nginx/html

# Expose the frontend port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]