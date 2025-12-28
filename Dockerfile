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

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/config ./config
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/nest-cli.json ./nest-cli.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["node", "dist/main"]