# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Builder stage
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM base AS production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Add wait-for-it script or similar if complex dependency wait is needed, 
# but for now we rely on restart: always in docker-compose

EXPOSE 4000
CMD ["node", "dist/main"]
