// controllers/register.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerUser } from '../services/register.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await registerUser(req.body.id, req.body.name, req.body.password);
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        next(error); // 여기서 미들웨어로 넘김
    }
};