// middlewares/validateRegister.ts
import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    const { username, name, password } = req.body;
    if (!username || !name || !password) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }
    next();
};
