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
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

// 에러 핸들러 (항상 마지막)
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI가 설정되지 않았습니다.');

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

export default app;
