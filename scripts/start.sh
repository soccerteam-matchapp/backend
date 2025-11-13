#!/bin/bash
set -e

echo "===== 런타임 컨테이너 시작 ====="
echo "현재 디렉토리: $(pwd)"
echo "파일 목록:"
ls -la || true

# dist/index.js가 없으면 빌드 수행
if [ ! -f "dist/index.js" ]; then
  echo "⚠️ dist/index.js 없음. 빌드 시작..."
  
  # pnpm 보장
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@9 --activate || true
  else
    npm i -g pnpm@9
  fi
  
  # 의존성 설치
  if [ ! -d "node_modules" ]; then
    echo "---- node_modules 없음. 의존성 설치 ----"
    pnpm install --no-frozen-lockfile || exit 1
  fi
  
  # Swagger 병합
  echo "---- Swagger 병합 ----"
  pnpm run merge-swagger || exit 1
  
  # TypeScript 컴파일
  echo "---- TypeScript 컴파일 ----"
  pnpm exec tsc || exit 1
  
  # Swagger 파일 복사
  echo "---- Swagger 파일 복사 ----"
  pnpm exec cpx src/swagger.yaml dist || exit 1
  
  echo "✅ 빌드 완료"
  echo "dist/index.js 확인:"
  ls -lh dist/index.js || echo "❌ dist/index.js 여전히 없음!"
else
  echo "✅ dist/index.js 존재. 서버 시작..."
fi

# 서버 시작
echo "===== 서버 시작 ====="
node dist/index.js

