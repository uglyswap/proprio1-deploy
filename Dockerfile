# ================================
# MULTI-STAGE DOCKERFILE - ProprioFinder
# Optimized for Next.js standalone output
# ================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ================================
# BUILD-TIME ENVIRONMENT VARIABLES
# Placeholders for Next.js static generation
# Real values injected at runtime by Dokploy
# ================================
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-placeholder-32chars"
ENV STRIPE_SECRET_KEY="sk_test_placeholder"
ENV STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
ENV STRIPE_WEBHOOK_SECRET="whsec_placeholder"
ENV STRIPE_BASIC_PRICE_ID="price_basic"
ENV STRIPE_PRO_PRICE_ID="price_pro"
ENV STRIPE_ENTERPRISE_PRICE_ID="price_enterprise"
ENV NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID="price_basic"
ENV NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_pro"
ENV NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_enterprise"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_NAME="ProprioFinder"
ENV REDIS_URL="redis://localhost:6379"
ENV REDIS_HOST="localhost"
ENV REDIS_PORT="6379"
ENV ENCRYPTION_SECRET="build-time-encryption-secret-32ch"
ENV CRON_SECRET="build-time-cron-secret"
ENV DROPCONTACT_API_KEY="placeholder"

# Build Next.js
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files (required for runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the standalone server
CMD ["node", "server.js"]
