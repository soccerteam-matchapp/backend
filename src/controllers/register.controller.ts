// controllers/register.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerUser } from '../services/register.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    await registerUser(req.body.id, req.body.name, req.body.password);
    res.status(201).json({ message: '회원가입 성공' });
};