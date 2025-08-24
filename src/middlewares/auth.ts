// src/middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// 컨트롤러를 감싸 try/catch 없이 에러를 next로 전달
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
export const asyncHandler = (fn: AsyncHandler): RequestHandler =>
    (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 토큰 인증 미들웨어
export interface AuthenticatedRequest extends Request {
    userId?: string;
    role?: 'leader' | 'member';
}
export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        const err = Object.assign(new Error('no token'), { statusCode: 401, error: 'no_token' });
        return next(err);
    }
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id?: string; role?: 'leader' | 'member' };
        req.userId = payload.id;
        req.role = payload.role;
        return next();
    } catch (e) {
        if (e instanceof TokenExpiredError) {
            return next(Object.assign(new Error('token expired'), { statusCode: 401, error: 'token_expired' }));
        }
        return next(Object.assign(new Error('invalid token'), { statusCode: 401, error: 'token_invalid' }));
    }
};

// 회원가입 바디 검증 + username -> name 매핑
export const validateRegister = (req: Request, _res: Response, next: NextFunction) => {
    req.body.name = req.body.name ?? req.body.username; // username 허용 → name으로 통일
    delete req.body.username;

    const { id, name, password } = req.body;
    if (!id || !name || !password) {
        return next(Object.assign(new Error('id, name, password가 모두 필요합니다.'), {
            statusCode: 400, error: 'validation_error'
        }));
    }
    next();
};
