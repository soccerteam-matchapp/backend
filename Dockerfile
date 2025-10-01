# --- Build stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# pnpm 활성화
RUN corepack enable && corepack prepare pnpm@9 --activate

# 의존성 설치 (devDependencies 포함 → 빌드 필요하니까)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 후 빌드
COPY . .
RUN pnpm run build   # tsconfig에 맞춰 dist 생성됨

# --- Runtime stage ---
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# pnpm 활성화
RUN corepack enable && corepack prepare pnpm@9 --activate

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
