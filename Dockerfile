ARG BUILD_ID=force-1
# ---- Build stage: TS compile ----
FROM node:18-alpine AS builder
WORKDIR /app

ARG PNPM_VERSION=9.15.9
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml ./
# lockfile 불일치 우회
RUN pnpm install --dev --no-frozen-lockfile

COPY . .
RUN pnpm run build

# ---- Runtime stage: lightweight run ----
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

ARG PNPM_VERSION=9.15.9
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/swagger.yaml ./dist/swagger.yaml

EXPOSE 3000
CMD ["node", "dist/index.js"]
