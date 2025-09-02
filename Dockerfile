# Spark Unified Dockerfile
# Single image that can run as Agent, Manager, or Proxy based on SERVICE_TYPE environment variable

# ========================================
# Stage 1: Build Stage
# ========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove devDependencies to reduce size
RUN npm prune --production

# ========================================
# Stage 2: Production Stage
# ========================================
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S spark && \
    adduser -S spark -u 1001

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    iputils \
    net-tools \
    netcat-openbsd

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=spark:spark /app/dist ./dist
COPY --from=builder --chown=spark:spark /app/node_modules ./node_modules
COPY --from=builder --chown=spark:spark /app/package*.json ./

# Copy Docker scripts
COPY --chown=spark:spark docker/ ./docker/

# Make scripts executable
RUN find ./docker -name "*.sh" -exec chmod +x {} \;

# Create required directories
RUN mkdir -p logs config data && \
    chown -R spark:spark /app

# Set default environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV SERVICE_TYPE=agent
ENV DOCKER_RUNNER=true

# Expose all possible ports (will be mapped individually in docker-compose)
EXPOSE 3000 8080 8081 9000

# Switch to non-root user
USER spark

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Dynamic command based on SERVICE_TYPE environment variable (set at runtime)
CMD ["./docker/shared/entrypoint.sh"]

# ========================================
# Build Arguments & Labels
# ========================================
ARG BUILD_DATE
ARG VCS_REF  
ARG VERSION=1.0.0

LABEL maintainer="Spark Team <support@spark.com>" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="spark" \
      org.label-schema.description="Spark - Intelligent Message Spark (Unified Image)" \
      org.label-schema.url="https://spark.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://gitlab.com/israelways/spark" \
      org.label-schema.vendor="IsraelWays" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"