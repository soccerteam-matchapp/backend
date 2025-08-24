// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, IUser } from '../models/user.model';
import { ValidationError, AuthError } from '../utils/errors';

const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export type Role = 'leader' | 'member';

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;      // MongoDB _id 문자열
        name: string;
        role: Role;
    };
}

function getJwtSecret(): string {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set');
    return s;
}

function resolveRole(user: IUser): Role {
    return (user.myTeams?.length ?? 0) > 0 ? 'leader' : 'member';
}

/** 액세스 토큰: sub(_id) + role */
function generateAccessToken(user: IUser): string {
    return jwt.sign(
        { sub: String(user._id), role: resolveRole(user) },
        getJwtSecret(),
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
}

/** 리프레시 토큰: sub(_id)만 */
function generateRefreshToken(user: IUser): string {
    return jwt.sign(
        { sub: String(user._id) },
        getJwtSecret(),
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
}

/** 회원가입 (모델 pre-save 훅이 비번 해시 처리) */
export const registerUser = async (id: string, name: string, password: string) => {
    const existing = await User.findOne({ id }).lean().exec();
    if (existing) throw new ValidationError('이미 존재하는 사용자입니다.');
    const user = new User({ id, name, password });
    await user.save();
};

/** 로그인 */
export const loginService = async (id: string, password: string): Promise<LoginResult> => {
    const user = await User.findOne({ id }).exec();
    if (!user) throw new AuthError('Invalid credentials.');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new AuthError('Invalid credentials.');

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: {
            id: String(user._id),
            name: user.name,
            role: resolveRole(user),
        },
    };
};

/** 리프레시 토큰 재발급 */
export const refreshTokenService = async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
    let payload: any;
    try {
        payload = jwt.verify(token, getJwtSecret()) as { sub?: string };
    } catch {
        throw new AuthError('Invalid refresh token.');
    }

    if (!payload?.sub) {
        throw new AuthError('Invalid refresh token.');
    }

    const user = await User.findById(payload.sub).exec();
    if (!user || user.refreshToken !== token) {
        throw new AuthError('Refresh token not recognized.');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
};
