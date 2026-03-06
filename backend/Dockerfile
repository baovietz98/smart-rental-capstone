# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Install all dependencies (including dev)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage - build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production dependencies only
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy prisma schema for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Regenerate Prisma Client for Linux Alpine
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "dist/src/main"]
