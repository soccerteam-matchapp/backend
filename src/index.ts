import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.handler';

import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import attendancePoll from './routes/attendancePoll.routes';
import phoneRoutes from './routes/phone.routes';

import path from 'path';
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

// .env가 프로젝트 루트에 있을 때
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 환경 변수 로드
dotenv.config();

// 번들 결과 파일 경로 (dev: src/swagger.yaml)
const swaggerPath = path.resolve(process.cwd(), 'src/swagger.yaml');
// 필요하다면 환경변수로 전환 가능: SWAGGER_PATH=dist/swagger.yaml
const swaggerSpec = YAML.load(swaggerPath);

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);

app.use('/api/teams', teamRoutes);   // ← 인증 미들웨어는 라우터 안에서 적용됨
app.use('/api/matches', matchRoutes);   // ← 인증 미들웨어는 라우터 안에서 적용됨
app.use('/api/attendancePoll', attendancePoll);   // ← 인증 미들웨어는 라우터 안에서 적용됨
app.use('/api/auth/phone', phoneRoutes);

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI가 설정되지 않았습니다.');



mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
        });;
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });