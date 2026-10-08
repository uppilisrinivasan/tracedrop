# Multi-stage build for TraceDrop - Development & Production
# Optimized for efficiency and security

# Stage 1: Frontend Builder
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

# Stage 2: Backend Dependencies
FROM node:22-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci --only=production

# Stage 3: Runtime (Final Image)
FROM node:22-alpine

LABEL maintainer="TraceDrop Team"
LABEL version="1.0.0"
LABEL description="TraceDrop Phase 1 - Blood Donor Care Platform"

WORKDIR /app

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code
COPY backend/src ./backend/src
COPY backend/package*.json ./backend/

# Copy production backend dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy data folder if it exists
COPY data/ ./data 2>/dev/null || true

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create non-root user for security (optional)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "backend/src/server.js"]
