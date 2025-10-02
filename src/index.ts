import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import authRoutes from './routes/auth.routes';
import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import phoneRoutes from './routes/phone.routes';
import { errorHandler } from './middlewares/error.handler';

// 1) .env는 있어도 되고 없어도 됨 (클라우드에선 대시보드 ENV 사용)
//    없을 때 에러 안 나게 조용히 시도만 하도록 유지
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // 중복 호출해도 무해하지만 한 번이면 충분

const app = express();
app.use(express.json());

// 2) Swagger: dist 우선, 없으면 src, 마지막으로 환경변수 경로 허용
const candidateSwaggerPaths = [
    process.env.SWAGGER_PATH,                                            // 수동 지정
    path.resolve(__dirname, 'swagger.yaml'),                             // dist/swagger.yaml (빌드 산출물에 복사)
    path.resolve(process.cwd(), 'src/swagger.yaml'),                     // 로컬 개발
].filter(Boolean) as string[];

let swaggerPath: string | undefined;
for (const p of candidateSwaggerPaths) {
    try {
        if (p && fs.existsSync(p)) {
            swaggerPath = p;
            break;
        }
    } catch { /* ignore */ }
}
if (swaggerPath) {
    const swaggerSpec = YAML.load(swaggerPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
    console.warn('⚠️ swagger.yaml 파일을 찾지 못했습니다. /api-docs 비활성화');
}

// 3) 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/auth/phone', phoneRoutes);

// 4) 에러 핸들러는 항상 맨 마지막
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI가 설정되지 않았습니다.');

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
