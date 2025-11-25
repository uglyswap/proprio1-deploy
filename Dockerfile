# ================================
# SIMPLE DOCKERFILE - ProprioFinder
# Without standalone mode for maximum compatibility
# ================================

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl python3 make g++ wget

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (using npm install to auto-update lockfile)
RUN npm install --legacy-peer-deps

# Copy prisma schema first for generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy all source files
COPY . .

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

# Remove dev dependencies to reduce image size
RUN npm prune --production --legacy-peer-deps

# Expose port
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
CMD ["npm", "start"]
