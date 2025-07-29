import bcrypt from 'bcrypt';

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