// src/middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ValidationError } from '../utils/errors';

function getJwtSecret(): string {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set');
    return s;
}

/** JWT Payload 타입 정의 */
export interface JwtPayload {
    sub?: string;  // 사용자 _id (MongoDB ObjectId 문자열)
    id?: string;   // 구형 토큰 호환용 (username)
    role?: 'leader' | 'member';  // 사용자 역할
    iat?: number;  // issued at
    exp?: number;  // expiration
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
    role?: 'leader' | 'member';
}

/** 컨트롤러 try/catch 없이 에러를 next로 넘겨주는 래퍼 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Bearer 토큰 인증 (신규 sub 우선, 구형 id 토큰도 호환) */
export const requireAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return next(Object.assign(new Error('no token'), { statusCode: 401, error: 'no_token' }));
    }
    const token = auth.slice(7);

    try {
        const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
        let userId = payload.sub;

        // 구형 토큰(id = username)도 지원
        if (!userId && payload.id) {
            const u = await User.findOne({ id: payload.id }, { _id: 1 }).lean();
            if (u?._id) userId = String(u._id);
        }

        if (!userId) {
            return next(Object.assign(new Error('invalid token'), { statusCode: 401, error: 'token_invalid' }));
        }

        req.userId = userId;
        req.role = payload.role;
        return next();
    } catch (e) {
        if (e instanceof TokenExpiredError) {
            return next(Object.assign(new Error('token expired'), { statusCode: 401, error: 'token_expired' }));
        }
        return next(Object.assign(new Error('invalid token'), { statusCode: 401, error: 'token_invalid' }));
    }
};

/** 회원가입 Body 검증 + username -> name 매핑 */
export const validateRegister = (req: Request, _res: Response, next: NextFunction) => {
    // username으로 들어오면 name으로 통일
    req.body.name = req.body.name ?? req.body.username;
    delete req.body.username;

    const { id, name, password } = req.body as { id?: string; name?: string; password?: string };

    if (!id || !name || !password) {
        return next(new ValidationError('id, name, password가 모두 필요합니다.'));
    }
    if (typeof id !== 'string' || id.trim().length < 3) {
        return next(new ValidationError('id는 3자 이상이어야 합니다.'));
    }
    if (typeof password !== 'string' || password.length < 6) {
        return next(new ValidationError('password는 6자 이상이어야 합니다.'));
    }
    return next();
};

/** 리더 권한 검증 미들웨어 (JWT의 role이 'leader'인지 확인) */
export const requireLeader = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // requireAuth가 먼저 실행되어야 함
    if (!req.userId) {
        return next(Object.assign(new Error('authentication required'), { statusCode: 401, error: 'authentication_required' }));
    }

    if (req.role !== 'leader') {
        return next(Object.assign(new Error('leader access required'), { statusCode: 403, error: 'forbidden' }));
    }

    return next();
};
