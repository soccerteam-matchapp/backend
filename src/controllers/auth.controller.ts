import { Request, Response } from 'express';
import {
    loginService,
    refreshTokenService,
    LoginResult,
} from '../services/auth.service';

export const login = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({
            status: 400,
            message: 'ID and password are required.',
            data: null,
        });
    }
    try {
        const result: LoginResult = await loginService(id, password);
        return res.status(200).json({
            status: 200,
            message: '로그인 성공',
            data: result,
        });
    } catch (err: any) {
        const isAuthError = err.message === 'Invalid credentials';
        const status = isAuthError ? 401 : 500;
        const message = isAuthError
            ? 'Invalid credentials.'
            : 'Server error.';
        return res.status(status).json({
            status,
            message,
            data: null,
        });
    }
};

export const refresh = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            status: 400,
            message: 'Refresh token is required.',
            data: null,
        });
    }
    try {
        const tokens = await refreshTokenService(refreshToken);
        return res.status(200).json({
            status: 200,
            message: '토큰 재발급 성공',
            data: tokens,
        });
    } catch (err: any) {
        const unauthorizedMessages = [
            'Invalid refresh token',
            'Refresh token not recognized',
        ];
        const isAuthError = unauthorizedMessages.includes(err.message);
        const status = isAuthError ? 401 : 500;
        const message = isAuthError ? 'Unauthorized' : 'Server error.';
        return res.status(status).json({
            status,
            message,
            data: null,
        });
    }
};