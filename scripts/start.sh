#!/bin/bash
set -e

echo "===== 런타임 컨테이너 시작 ====="
echo "현재 시간: $(date)"
echo "현재 디렉토리: $(pwd)"
echo "Node.js 버전: $(node --version)"
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
  
  # 의존성 설치 (devDependencies 포함)
  if [ ! -d "node_modules" ]; then
    echo "---- node_modules 없음. 의존성 설치 (devDependencies 포함) ----"
    # NODE_ENV를 임시로 변경하여 devDependencies도 설치
    NODE_ENV=development $PNPM_CMD install --no-frozen-lockfile || exit 1
  fi
  
  # Swagger 병합
  echo "---- Swagger 병합 ----"
  $PNPM_CMD run merge-swagger || exit 1
  
  # TypeScript 컴파일 (로컬에 설치된 tsc 사용, 메모리 제한 증가)
  echo "---- TypeScript 컴파일 (메모리 제한: 4GB) ----"
  export NODE_OPTIONS="--max-old-space-size=4096"
  if [ -f "node_modules/.bin/tsc" ]; then
    ./node_modules/.bin/tsc || exit 1
  elif command -v tsc >/dev/null 2>&1; then
    tsc || exit 1
  else
    echo "❌ tsc를 찾을 수 없습니다. typescript가 설치되었는지 확인하세요."
    exit 1
  fi
  
  # Swagger 파일 복사 (로컬에 설치된 cpx 사용)
  echo "---- Swagger 파일 복사 ----"
  if [ -f "node_modules/.bin/cpx" ]; then
    ./node_modules/.bin/cpx src/swagger.yaml dist || exit 1
  elif command -v cpx >/dev/null 2>&1; then
    cpx src/swagger.yaml dist || exit 1
  else
    echo "❌ cpx를 찾을 수 없습니다. cpx가 설치되었는지 확인하세요."
    exit 1
  fi
  
  echo "✅ 빌드 완료"
  echo "dist/index.js 확인:"
  ls -lh dist/index.js || echo "❌ dist/index.js 여전히 없음!"
else
  echo "✅ dist/index.js 존재. 서버 시작..."
fi

# 서버 시작
echo "===== 서버 시작 ====="
echo "환경 변수 확인:"
echo "  NODE_ENV: ${NODE_ENV:-not set}"
echo "  PORT: ${PORT:-not set}"
if [ -z "$MONGO_URI" ]; then
    echo "  ❌ MONGO_URI: 설정 안됨 (필수)"
else
    echo "  ✅ MONGO_URI: 설정됨 (길이: ${#MONGO_URI})"
fi
if [ -z "$JWT_SECRET" ]; then
    echo "  ❌ JWT_SECRET: 설정 안됨 (필수)"
else
    echo "  ✅ JWT_SECRET: 설정됨 (길이: ${#JWT_SECRET})"
fi

echo ""
echo "dist/index.js 파일 확인:"
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js 파일이 없습니다!"
    exit 1
fi
ls -lh dist/index.js

echo ""
echo "Node.js로 서버 실행 시작..."
echo "=========================================="
echo "실행 명령: node dist/index.js"
echo "=========================================="

# 포그라운드로 실행 (Cloudtype이 프로세스를 관리)
exec node dist/index.js

