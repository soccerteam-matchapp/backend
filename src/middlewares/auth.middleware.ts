import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
    userId?: string;
    hasTeams?: string[];
    myTeams?: string[];
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 401,
            message: 'no token',
            data: null,
            error: 'no_token',
        });
    }

    const token = auth.split(' ')[1];

    try {
        // 토큰 검증
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & {
            id?: string;
            hasTeams?: string[];
            myTeams?: string[];
        };

        // 검증 성공 → 요청 컨텍스트에 붙여서 이후 컨트롤러에서 사용
        req.userId = payload.id;
        req.hasTeams = payload.hasTeams ?? [];
        req.myTeams = payload.myTeams ?? [];

        return next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            // ★ 프론트가 리프레시 트리거할 수 있게 정확한 신호 주기
            return res.status(401).json({
                status: 401,
                message: 'token expired',
                data: null,
                error: 'token_expired',
            });
        }
        return res.status(401).json({
            status: 401,
            message: 'invalid token',
            data: null,
            error: 'token_invalid',
        });
    }
}
