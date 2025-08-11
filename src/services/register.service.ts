// services/authService.ts
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import { ValidationError } from '../utils/errors';

export const registerUser = async (id: string, name: string, password: string) => {

    const existingUser = await User.findOne({ id });
    if (existingUser) {
        throw new ValidationError('이미 존재하는 사용자입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ id, name, password: hashedPassword });
    await newUser.save();

};
