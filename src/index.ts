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

console.log('===== 애플리케이션 초기화 시작 =====');
console.log('현재 작업 디렉토리:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node.js 버전:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

const app = express();
console.log('✅ Express 앱 생성 완료');

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:5174')
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

// 헬스체크 엔드포인트는 라우터 등록 전에 먼저 등록 (가장 빠른 응답)
// Cloudtype 헬스체크가 빠르게 응답받을 수 있도록
app.get('/health', (_req, res) => {
    try {
        const mongoState = mongoose.connection.readyState;
        const mongoConnected = mongoState === 1; // 1 = connected

        res.status(200).json({
            status: 200,
            message: 'OK',
            data: {
                healthy: true,
                mongodb: mongoConnected ? 'connected' : 'disconnected'
            }
        });
    } catch (err) {
        // 에러가 나도 서버는 살아있다는 신호
        res.status(200).json({
            status: 200,
            message: 'OK',
            data: {
                healthy: true,
                mongodb: 'unknown'
            }
        });
    }
});

// 루트 경로도 헬스체크로 사용 (Cloudtype이 루트로 헬스체크할 수 있음)
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 200,
        message: 'OK',
        data: {
            healthy: true,
            service: 'Sportly API'
        }
    });
});

// 라우터 (헬스체크 이후 등록)
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/auth/phone', phoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance-polls', attendancePoll);

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

// 서버를 먼저 시작 (환경 변수 체크 전에도 헬스체크 가능)
console.log('');
console.log('===== 서버 시작 시도 =====');
console.log(`포트: ${PORT}, 호스트: ${HOST}`);

let server: any;
try {
    server = app.listen(PORT, HOST, () => {
        console.log('');
        console.log('========================================');
        console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
        console.log(`📖 Swagger UI: http://${HOST}:${PORT}/api-docs`);
        console.log(`❤️  Health Check: http://${HOST}:${PORT}/health`);
        console.log('========================================');
        console.log('');

        // 서버 시작 후 환경 변수 체크 (서버는 계속 실행)
        if (!MONGO_URI) {
            console.error('⚠️  MONGO_URI가 설정되지 않았습니다.');
            console.error('Cloudtype 대시보드에서 환경 변수를 설정해주세요.');
            console.error('서버는 실행 중이지만 데이터베이스 기능이 작동하지 않습니다.');
        }

        if (!JWT_SECRET) {
            console.error('⚠️  JWT_SECRET이 설정되지 않았습니다.');
            console.error('Cloudtype 대시보드에서 환경 변수를 설정해주세요.');
            console.error('서버는 실행 중이지만 인증 기능이 작동하지 않습니다.');
        }
    });

    // 서버 에러 핸들링
    server.on('error', (err: NodeJS.ErrnoException) => {
        console.error('');
        console.error('❌ 서버 listen 에러 발생:');
        if (err.code === 'EADDRINUSE') {
            console.error(`포트 ${PORT}가 이미 사용 중입니다.`);
        } else {
            console.error('에러 코드:', err.code);
            console.error('에러 메시지:', err.message);
            console.error('에러 스택:', err.stack);
        }
        process.exit(1);
    });

    console.log('✅ 서버 listen 호출 완료 (콜백 대기 중...)');
} catch (err: any) {
    console.error('');
    console.error('❌ 서버 시작 실패:');
    console.error('에러 타입:', err?.constructor?.name || typeof err);
    console.error('에러 메시지:', err?.message || String(err));
    if (err?.stack) {
        console.error('에러 스택:', err.stack);
    }
    process.exit(1);
}

// MongoDB 연결은 백그라운드에서 처리 (서버 시작을 막지 않음)
if (MONGO_URI) {
    console.log('');
    console.log('MongoDB 연결 시도 중...');
    console.log(`연결 URI: ${MONGO_URI.substring(0, 20)}...`);

    mongoose
        .connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10초 타임아웃
            socketTimeoutMS: 45000,
        })
        .then(() => {
            console.log('✅ MongoDB connected');
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
            console.error('⚠️  MongoDB 연결에 실패했습니다. 서버는 계속 실행되지만 데이터베이스 기능이 작동하지 않을 수 있습니다.');
            console.error('다음을 확인해주세요:');
            console.error('  1. MONGO_URI가 올바른지 확인');
            console.error('  2. MongoDB 서버가 실행 중인지 확인');
            console.error('  3. 네트워크 연결 상태 확인');
            console.error('');
            // MongoDB 연결 실패해도 서버는 계속 실행 (헬스체크는 작동)
        });
} else {
    console.log('');
    console.log('⚠️  MONGO_URI가 설정되지 않아 MongoDB 연결을 건너뜁니다.');
}

// 프로세스 종료 이벤트 핸들링 (서버가 계속 실행되도록)
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error('스택:', err.stack);
    // 서버를 종료하지 않고 계속 실행 (프로덕션에서는 로깅만)
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('이유:', reason);
    // 서버를 종료하지 않고 계속 실행 (프로덕션에서는 로깅만)
    // process.exit(1);
});

export default app;
