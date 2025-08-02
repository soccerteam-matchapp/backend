import { Request, Response } from 'express';
import {
    loginService,
    refreshTokenService,
    LoginResult,
} from '../services/auth.service';

// 기존 login 컨트롤러
export const login = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({ message: 'ID and password are required.' });
    }
    try {
        const result: LoginResult = await loginService(id, password);
        return res.status(200).json(result);
    } catch (err: any) {
        const msg = err.message === 'Invalid credentials'
            ? 'Invalid credentials.'
            : 'Server error.';
        const status = err.message === 'Invalid credentials' ? 401 : 500;
        return res.status(status).json({ message: msg });
    }
};

// 새로 추가: /api/auth/refresh
export const refresh = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
    }
    try {
        const tokens = await refreshTokenService(refreshToken);
        return res.status(200).json(tokens);
    } catch (err: any) {
        const msg =
            err.message === 'Invalid refresh token' ||
                err.message === 'Refresh token not recognized'
                ? 'Unauthorized'
                : 'Server error.';
        const status =
            msg === 'Unauthorized' ? 401 : 500;
        return res.status(status).json({ message: msg });
    }
};
