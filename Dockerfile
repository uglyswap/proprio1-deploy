# ================================
# DOCKERFILE SIMPLE - ProprioFinder
# Single stage build for reliability
# ================================

FROM node:20-alpine

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci --legacy-peer-deps

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy all source files
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ================================
# BUILD-TIME ENVIRONMENT VARIABLES
# These are placeholders for Next.js build
# Real values are injected at runtime
# ================================
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-placeholder"
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
ENV ENCRYPTION_SECRET="build-time-encryption-secret"
ENV CRON_SECRET="build-time-cron-secret"
ENV DROPCONTACT_API_KEY="placeholder"

# Build Next.js application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# ================================
# RUNTIME CONFIGURATION
# Real environment variables are set by Dokploy
# ================================

# Expose port
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application using Next.js start
CMD ["npm", "start"]
