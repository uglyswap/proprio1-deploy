# ================================
# DOCKERFILE ULTRA-SIMPLIFIED
# ProprioFinder SaaS
# ================================

FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy everything
COPY . .

# Install ALL dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 3000
ENV PORT=3000

# Start the app
CMD ["npm", "start"]
