# Sử dụng node image
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/config ./config

# Create exports directory with proper permissions
RUN mkdir -p ./exports && chown -R nestjs:nodejs ./exports && chmod -R 755 ./exports

# Change ownership of the entire app directory to nestjs user
RUN chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000
CMD ["node", "dist/main"]