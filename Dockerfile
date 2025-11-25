# ================================
# DOCKERFILE - ProprioFinder
# Using standalone output mode for optimized Docker deployment
# ================================

FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# ================================
# DEPENDENCIES STAGE
# ================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# ================================
# BUILD STAGE
# ================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ================================
# BUILD-TIME ENVIRONMENT VARIABLES
# Required for Next.js static generation
# Real values are injected at runtime
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

# ================================
# PRODUCTION STAGE
# ================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder
COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client (required at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

# Expose port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the standalone server
CMD ["node", "server.js"]
