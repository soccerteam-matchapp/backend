// services/authService.ts
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';

export const registerUser = async (username: string, name: string, password: string) => {

    console.log('레지스터유저 함수에 진입'); // 이게 뜨는지 확인
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
        throw new Error('이미 존재하는 사용자입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, name, password: hashedPassword });
    await newUser.save();

};
