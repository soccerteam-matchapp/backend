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

// .env (없어도 조용히 통과)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
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
            break;
        }
    } catch { /* ignore */ }
}
if (swaggerPath) {
    const swaggerSpec = YAML.load(swaggerPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
    console.warn('⚠️ swagger.yaml 파일을 찾지 못해 /api-docs 비활성화');
}

// 라우터
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/auth/phone', phoneRoutes);

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
