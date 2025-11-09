# Backend Dockerfile - Optimized for size
FROM node:20-alpine AS builder

# Use /build as working directory to ensure consistent output structure
WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production image - smaller base
FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy standalone build (server.js is directly in .next/standalone/)
COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/public ./public

# Create data directory
RUN mkdir -p /app/data

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Use node directly instead of npm for faster startup
CMD ["node", "server.js"]
