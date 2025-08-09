// controllers/register.controller.ts
import { Request, Response } from 'express';
import { registerUser } from '../services/register.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, name, password } = req.body;

    try {
        await registerUser(username, name, password);
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error: any) {
        if (error.message === '이미 존재하는 사용자입니다.') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: '서버 오류' });
        }
    }
};
