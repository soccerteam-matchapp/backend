#!/bin/bash
set -e

echo "===== 런타임 컨테이너 시작 ====="
echo "현재 디렉토리: $(pwd)"
echo "파일 목록:"
ls -la || true

# dist/index.js가 없으면 빌드 수행
if [ ! -f "dist/index.js" ]; then
  echo "⚠️ dist/index.js 없음. 빌드 시작..."
  
  # pnpm 확인 및 사용 (권한 문제 방지를 위해 npx 사용)
  if command -v pnpm >/dev/null 2>&1; then
    PNPM_CMD="pnpm"
    echo "✅ pnpm 발견: $(which pnpm)"
  else
    PNPM_CMD="npx -y pnpm@9"
    echo "⚠️ pnpm 없음. npx를 통해 사용"
  fi
  
  # 의존성 설치
  if [ ! -d "node_modules" ]; then
    echo "---- node_modules 없음. 의존성 설치 ----"
    $PNPM_CMD install --no-frozen-lockfile || exit 1
  fi
  
  # Swagger 병합
  echo "---- Swagger 병합 ----"
  $PNPM_CMD run merge-swagger || exit 1
  
  # TypeScript 컴파일
  echo "---- TypeScript 컴파일 ----"
  $PNPM_CMD exec tsc || exit 1
  
  # Swagger 파일 복사
  echo "---- Swagger 파일 복사 ----"
  $PNPM_CMD exec cpx src/swagger.yaml dist || exit 1
  
  echo "✅ 빌드 완료"
  echo "dist/index.js 확인:"
  ls -lh dist/index.js || echo "❌ dist/index.js 여전히 없음!"
else
  echo "✅ dist/index.js 존재. 서버 시작..."
fi

# 서버 시작
echo "===== 서버 시작 ====="
node dist/index.js

