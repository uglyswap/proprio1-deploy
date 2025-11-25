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

# Build Next.js application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application using Next.js start
CMD ["npm", "start"]
