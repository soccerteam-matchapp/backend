import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
    userId?: string;
    role?: 'leader' | 'member';
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ status: 401, message: 'no token', data: null, error: 'no_token' });
    }

    const token = auth.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id?: string; role?: 'leader' | 'member' };
        req.userId = payload.id;
        req.role = payload.role; // ← 토큰에 담긴 role 사용 가능
        return next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            return res.status(401).json({ status: 401, message: 'token expired', data: null, error: 'token_expired' });
        }
        return res.status(401).json({ status: 401, message: 'invalid token', data: null, error: 'token_invalid' });
    }
}
