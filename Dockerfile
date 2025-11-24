# ================================
# DOCKERFILE MULTI-STAGE - PRODUCTION READY
# ProprioFinder SaaS
# ================================

# Stage 1: Dependencies (Production only)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Stage 2: Builder (All dependencies for build)
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build && \
    echo "=== Build completed, checking output ===" && \
    ls -la .next/ && \
    if [ -d ".next/standalone" ]; then \
      echo "=== Standalone build found ==="; \
      ls -la .next/standalone/; \
    else \
      echo "=== WARNING: No standalone directory! ==="; \
    fi && \
    if [ -d ".next/static" ]; then \
      echo "=== Static files found ==="; \
      ls -la .next/static/ | head -10; \
    else \
      echo "=== WARNING: No static directory! ==="; \
    fi

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create directories
RUN mkdir -p .next/static public

# Copy files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy public if it exists
COPY --from=builder /app/public ./public/ 2>/dev/null || true

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production node_modules for Prisma
COPY --from=deps /app/node_modules ./node_modules

# Verify files
RUN ls -la && \
    if [ -f "server.js" ]; then \
      echo "=== server.js found ==="; \
    else \
      echo "=== ERROR: server.js NOT found! ==="; \
      ls -la; \
      exit 1; \
    fi

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
