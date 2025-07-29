import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

// 비밀번호 해싱 함수
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// 비밀번호 검증 함수
export async function verifyPassword(
    candidatePassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
}


export async function loginService(
    id: string,
    password: string
): Promise<LoginResult> {
    const user = await User.findOne({ id }).exec();
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

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
