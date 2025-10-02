# ---- Build stage: TS compile ----
FROM node:18-alpine AS builder
WORKDIR /app

# Pin pnpm for reproducible builds
ARG PNPM_VERSION=9.15.9
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Install deps (dev 포함: tsc 실행용)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dev

# Build to dist/
COPY . .
RUN pnpm run build

# ---- Runtime stage: lightweight run ----
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

ARG PNPM_VERSION=9.15.9
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Prod deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Build artifacts
COPY --from=builder /app/dist ./dist
# Swagger spec 함께 복사 (src에 있을 때)
COPY --from=builder /app/src/swagger.yaml ./dist/swagger.yaml

# Cloudtype injects PORT; fallback for local
EXPOSE 3000
CMD ["node", "dist/index.js"]
