import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import registerRoutes from './routes/register.routes';
import { errorHandler } from './middlewares/error.handler';
import path from 'path';

// .env가 프로젝트 루트에 있을 때
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 환경 변수 로드
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/auth', registerRoutes);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI가 설정되지 않았습니다.');

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });