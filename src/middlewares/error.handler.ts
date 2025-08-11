import { Request, Response, NextFunction } from 'express';

// 우리가 만든 AppError 기반 처리 (없으면 일반 Error도 처리)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    // AppError 기반이면 그대로 사용
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.isOperational ? err.message : '서버 오류가 발생했습니다.';

    res.status(statusCode).json({
        status,
        message
    });
};
