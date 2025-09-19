# =============================================================================
# MCP TypeScript Boilerplate - Production Dockerfile
# =============================================================================
#
# Multi-stage Docker build for production deployment of MCP TypeScript servers
# Optimized for security, performance, and minimal image size
#
# Build: docker build -t mcp-boilerplate-ts .
# Run:   docker run -p 8000-8006:8000-8006 mcp-boilerplate-ts
#
# @author MCP Boilerplate Team
# @version 1.0.0
# =============================================================================

# =============================================================================
# Stage 1: Build Environment
# =============================================================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./

# Copy workspace package files
COPY servers/*/package.json ./servers/
COPY templates/*/package.json ./templates/
COPY examples/*/package.json ./examples/

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Install dev dependencies for build
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY servers/ ./servers/
COPY templates/ ./templates/
COPY examples/ ./examples/
COPY tests/ ./tests/

# Build all projects
RUN npm run type-check
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# =============================================================================
# Stage 2: Production Runtime
# =============================================================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    tini \
    curl

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=mcp:mcp /app/dist ./dist
COPY --from=builder --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:mcp /app/package*.json ./

# Copy production scripts
COPY --chown=mcp:mcp deployment/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --chown=mcp:mcp deployment/docker/healthcheck.sh /usr/local/bin/healthcheck.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/healthcheck.sh

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs && \
    chown -R mcp:mcp /app/data /app/logs

# Switch to non-root user
USER mcp

# Expose ports for all servers
EXPOSE 8000 8001 8002 8003 8004 8005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"
ENV NPM_CONFIG_LOGLEVEL=warn

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command
CMD ["/usr/local/bin/entrypoint.sh"]

# =============================================================================
# Development Override
# =============================================================================
FROM builder AS development

# Install development tools
RUN npm install --include=dev

# Switch to non-root user
USER mcp

# Expose ports
EXPOSE 8000 8001 8002 8003 8004 8005

# Development environment
ENV NODE_ENV=development
ENV DEBUG=mcp:*

# Use nodemon for hot reload
CMD ["npm", "run", "dev"]

# =============================================================================
# Metadata
# =============================================================================
LABEL maintainer="MCP Boilerplate Team"
LABEL version="1.0.0"
LABEL description="Production-ready MCP TypeScript server ecosystem"
LABEL org.opencontainers.image.title="MCP TypeScript Boilerplate"
LABEL org.opencontainers.image.description="Production-ready MCP servers built with official TypeScript SDK"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="MCP Boilerplate Team"
LABEL org.opencontainers.image.url="https://github.com/netadx1ai/mcp-boilerplate-ts"
LABEL org.opencontainers.image.source="https://github.com/netadx1ai/mcp-boilerplate-ts"
LABEL org.opencontainers.image.licenses="MIT"