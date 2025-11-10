FROM node:18

# pnpm 보장 및 활성화
RUN corepack enable && corepack prepare pnpm@9 --activate || npm i -g pnpm@9

WORKDIR /app

# 의존성 파일 복사
COPY package.json pnpm-lock.yaml* ./

# 의존성 설치
RUN pnpm install --no-frozen-lockfile

# 소스 코드 복사
COPY . .

# Swagger 병합
RUN pnpm run merge-swagger

# TypeScript 컴파일
RUN pnpm exec tsc

# Swagger 파일 복사
RUN pnpm exec cpx src/swagger.yaml dist

# Swagger 확인
RUN echo "---- dist/swagger.yaml 확인 ----" && \
    if [ -f "dist/swagger.yaml" ]; then \
      echo "✅ dist/swagger.yaml 존재" && \
      wc -l dist/swagger.yaml && \
      grep -c "^  /" dist/swagger.yaml && \
      echo "---- Notification API 확인 ----" && \
      grep -c "/notifications" dist/swagger.yaml || echo "⚠️ Notification API 없음"; \
    else \
      echo "❌ dist/swagger.yaml 없음!" && exit 1; \
    fi

EXPOSE 3000

CMD ["node", "./dist/index.js"]

