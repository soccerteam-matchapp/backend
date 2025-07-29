import { User, IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRES_IN = '1h';

export interface LoginResult {
    token: string;
    user: {
        id: string;
        name: string;
        belonging: string[];
        myTeams: string[];
    };
}

export async function loginService(
    id: string,
    password: string
): Promise<LoginResult> {
    // 사용자를 id 필드로 조회
    const user = await User.findOne({ id }).exec();
    if (!user) throw new Error('Invalid credentials');

    // 비밀번호 검증
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Invalid credentials');

    // JWT 생성
    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    // 반환 사용자 정보에 belonging, myTeams 포함
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            belonging: user.belonging.map(teamId => teamId.toString()),
            myTeams: user.myTeams.map(teamId => teamId.toString()),
        },
    };
}