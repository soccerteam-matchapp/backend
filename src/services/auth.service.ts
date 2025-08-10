import { User, IUser } from '../models/user.model';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

type Role = 'leader' | 'member';

/** 액세스 토큰: 함수 내부에서 role 계산 후 { id, role }만 담아 서명 */
function generateAccessToken(user: IUser): string {
    const role: Role = (user.myTeams?.length ?? 0) > 0 ? 'leader' : 'member';
    return jwt.sign({ id: user.id, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/** 리프레시 토큰: 최소 정보(id)만 */
function generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        hasTeams?: Types.ObjectId[];
        myTeams?: Types.ObjectId[];
        role: Role; // 응답 데이터에도 role 포함(프론트 편의)
    };
}

export async function loginService(id: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ id }).exec();
    if (!user) throw new Error('Invalid credentials');

    const ok = await user.comparePassword(password);
    if (!ok) throw new Error('Invalid credentials');

    const accessToken = generateAccessToken(user);       // ← 함수 내부에서 role 계산 & 포함
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    const role: Role = (user.myTeams?.length ?? 0) > 0 ? 'leader' : 'member';

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            hasTeams: user.hasTeams ?? [],
            myTeams: user.myTeams ?? [],
            role,                                            // 응답 데이터에도 제공
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

    // 멤버십 변경이 있었을 수 있으므로 여기서도 최신 role로 다시 서명
    const accessToken = generateAccessToken(user);       // ← role 포함
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
}
