// src/middlewares/error.handler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    // MongoDB duplicate key => 409
    if (err?.code === 11000) {
        err = Object.assign(new Error('이미 존재하는 아이디입니다.'), { statusCode: 409, error: 'duplicate_key' });
    }

    if (err?.message === 'Invalid credentials') {
        err = Object.assign(new Error('Invalid credentials.'), {
            statusCode: 401, error: 'invalid_credentials'
        });
    }
    const statusCode = Number(err?.statusCode) || 500;
    const message = err?.message || '서버 오류가 발생했습니다.';
    const error = err?.error || 'server_error';



    res.status(statusCode).json({ status: statusCode, message, data: null, error });
};
