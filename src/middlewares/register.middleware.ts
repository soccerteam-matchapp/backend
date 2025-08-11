// middlewares/validateRegister.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    const { id, name, password } = req.body;

    console.log('미들웨어에서 register 진입'); // 이게 뜨는지 확인
    if (!id || !name || !password) {
        throw new ValidationError('모든 필드를 입력해주세요.');
    }
    next();
};
