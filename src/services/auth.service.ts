import { User, IUser } from '../models/user.model';
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
        hasTeams?: string[];
        myTeams?: string[];
    };
}

/** 액세스 토큰 생성 */
function generateAccessToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
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

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 리프레시 토큰 DB 저장
    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            hasTeams: user.hasTeams?.map(t => t.toString()),
            myTeams: user.myTeams?.map(t => t.toString()),
        },
    };
}

/**
 * 전달받은 리프레시 토큰으로 새 토큰 발급
 */
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

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
}
