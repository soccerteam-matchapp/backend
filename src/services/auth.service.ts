// src/services/auth.service.ts
import { User, IUser } from '../models/user.model';
import { Types } from 'mongoose';             // ObjectId 타입 사용
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        hasTeams?: Types.ObjectId[];  // 그대로 ObjectId[]
        myTeams?: Types.ObjectId[];   // 그대로 ObjectId[]
    };
}

/** 액세스 토큰 생성: 페이로드엔 문자열 배열로 넣어줌 */
function generateAccessToken(
    userId: string,
    hasTeams: Types.ObjectId[] = [],
    myTeams: Types.ObjectId[] = []
): string {
    return jwt.sign(
        {
            id: userId,
            hasTeams: hasTeams.map(t => t.toString()),
            myTeams: myTeams.map(t => t.toString()),
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
}

/** 리프레시 토큰 생성 */
function generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
}

export async function loginService(
    id: string,
    password: string
): Promise<LoginResult> {
    const user = await User.findOne({ id }).exec();
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Invalid credentials');

    const hasTeams = user.hasTeams ?? [];
    const myTeams = user.myTeams ?? [];

    const accessToken = generateAccessToken(user.id, hasTeams, myTeams);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            hasTeams,              // ObjectId[] 그대로 반환
            myTeams,               // ObjectId[] 그대로 반환
        },
    };
}

export async function refreshTokenService(
    token: string
): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { id: string };
    try {
        payload = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
        throw new Error('Invalid refresh token');
    }

    const user = await User.findById(payload.id).exec();
    if (!user || user.refreshToken !== token) {
        throw new Error('Refresh token not recognized');
    }

    const hasTeams = user.hasTeams ?? [];
    const myTeams = user.myTeams ?? [];

    const accessToken = generateAccessToken(user.id, hasTeams, myTeams);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
}
