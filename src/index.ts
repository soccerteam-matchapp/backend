import 'reflect-metadata';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import attendancePoll from './routes/attendancePoll.routes';
import phoneRoutes from './routes/phone.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middlewares/error.handler';

// .env (없어도 조용히 통과)
dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true, // 쿠키/Authorization 헤더 쓰면 true
    }),
);
app.use(express.json());

// Swagger: dist/swagger.yaml → 없으면 src/swagger.yaml → 환경변수 지정
const candidateSwaggerPaths = [
    process.env.SWAGGER_PATH,
    path.resolve(__dirname, 'swagger.yaml'),
    path.resolve(process.cwd(), 'src/swagger.yaml'),
].filter(Boolean) as string[];

let swaggerPath: string | undefined;
for (const p of candidateSwaggerPaths) {
    try {
        if (p && fs.existsSync(p)) {
            swaggerPath = p;
            console.log(`✅ Swagger 파일 발견: ${p}`);
            break;
        } else {
            console.log(`⚠️  Swagger 파일 없음: ${p}`);
        }
    } catch (err) {
        console.warn(`⚠️  Swagger 경로 확인 실패: ${p}`, err);
    }
}
if (swaggerPath) {
    try {
        const swaggerSpec = YAML.load(swaggerPath);
        const pathCount = Object.keys(swaggerSpec.paths || {}).length;
        console.log(`✅ Swagger 로드 완료: ${pathCount}개 엔드포인트`);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    } catch (err) {
        console.error('❌ Swagger 파일 로드 실패:', err);
    }
} else {
    console.warn('⚠️ swagger.yaml 파일을 찾지 못해 /api-docs 비활성화');
    console.warn('   시도한 경로:', candidateSwaggerPaths);
}

// 라우터
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/auth/phone', phoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance-polls', attendancePoll);

// 헬스체크 엔드포인트 (MongoDB 연결 전에도 응답 가능)
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 200, message: 'OK', data: { healthy: true } });
});

// 에러 핸들러 (항상 마지막)
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

console.log('===== 서버 시작 준비 =====');
console.log(`PORT: ${PORT}`);
console.log(`HOST: ${HOST}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('환경 변수 확인:');
console.log(`  MONGO_URI: ${MONGO_URI ? `설정됨 (길이: ${MONGO_URI.length})` : '❌ 설정 안됨'}`);
console.log(`  JWT_SECRET: ${JWT_SECRET ? `설정됨 (길이: ${JWT_SECRET.length})` : '❌ 설정 안됨'}`);

if (!MONGO_URI) {
    console.error('');
    console.error('❌ MONGO_URI가 설정되지 않았습니다.');
    console.error('Cloudtype 대시보드에서 환경 변수를 설정해주세요.');
    console.error('');
    process.exit(1);
}

if (!JWT_SECRET) {
    console.error('');
    console.error('❌ JWT_SECRET이 설정되지 않았습니다.');
    console.error('Cloudtype 대시보드에서 환경 변수를 설정해주세요.');
    console.error('');
    process.exit(1);
}

console.log('');
console.log('MongoDB 연결 시도 중...');
console.log(`연결 URI: ${MONGO_URI.substring(0, 20)}...`);

// MongoDB 연결 옵션 설정 (타임아웃 등)
mongoose
    .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000, // 10초 타임아웃
        socketTimeoutMS: 45000,
    })
    .then(() => {
        console.log('✅ MongoDB connected');
        console.log('');
        app.listen(PORT, HOST, () => {
            console.log('========================================');
            console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
            console.log(`✅ 서버가 정상적으로 시작되었습니다.`);
            console.log(`📖 Swagger UI: http://${HOST}:${PORT}/api-docs`);
            console.log(`❤️  Health Check: http://${HOST}:${PORT}/health`);
            console.log('========================================');
        });
    })
    .catch((err) => {
        console.error('');
        console.error('❌ MongoDB connection error:');
        console.error(`  메시지: ${err.message}`);
        console.error(`  이름: ${err.name}`);
        if (err.stack) {
            console.error(`  스택:\n${err.stack}`);
        }
        console.error('');
        console.error('MongoDB 연결에 실패했습니다. 다음을 확인해주세요:');
        console.error('  1. MONGO_URI가 올바른지 확인');
        console.error('  2. MongoDB 서버가 실행 중인지 확인');
        console.error('  3. 네트워크 연결 상태 확인');
        console.error('');
        process.exit(1);
    });

// 프로세스 종료 이벤트 핸들링
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error('스택:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('이유:', reason);
    process.exit(1);
});

export default app;
