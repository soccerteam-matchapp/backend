import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
    id: string;
    iat: number;
    exp: number;
}

// 확장된 Request 타입 (userId 프로퍼티 추가)
export interface AuthenticatedRequest extends Request {
    userId?: string;
}

/**
 * Authorization 헤더의 Bearer 토큰을 검증하고,
 * 검증에 성공하면 req.userId 에 사용자 ID를 붙여서 다음으로 넘깁니다.
 */
export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = payload.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}