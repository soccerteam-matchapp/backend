import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 401,
            message: 'No token provided',
            data: null,
            error: 'no_token',
        });
    }

    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = (payload as any).id;
        next();
    } catch (err: any) {
        if (err instanceof TokenExpiredError) {
            // 토큰 만료
            return res.status(401).json({
                status: 401,
                message: 'Token expired',
                data: null,
                error: 'token_expired',
            });
        }
        // 그 외 검증 실패
        return res.status(401).json({
            status: 401,
            message: 'Invalid token',
            data: null,
            error: 'token_invalid',
        });
    }
}