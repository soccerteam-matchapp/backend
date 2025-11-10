// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import PhoneVerificationModel from '../models/phoneVerification.model';

import {
    registerUser,
    loginService,
    refreshTokenService,
    type LoginResult,
} from '../services/auth.service';
import { ValidationError } from '../utils/errors';

/** 회원가입 */
export const register = async (req: Request, res: Response) => {
    const { id, name, password } = req.body;
    await registerUser(id, name, password);
    await assertPhoneVerified(req.body.phoneNumber);
    return res.status(201).json({ status: 201, message: '회원가입 성공', data: null });
};

/** 로그인 */
export const login = async (req: Request, res: Response) => {
    const { id, password } = req.body;
    if (!id || !password) throw new ValidationError('ID and password are required.');

    const result: LoginResult = await loginService(id, password);
    return res.status(200).json({ status: 200, message: '로그인 성공', data: result });
};

/** 리프레시 */
export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ValidationError('Refresh token is required.');

    const tokens = await refreshTokenService(refreshToken);
    return res.status(200).json({ status: 200, message: '토큰 재발급 성공', data: tokens });
};

/** 전화번호 인증 확인 */
async function assertPhoneVerified(phoneNumber?: string) {
    if (!phoneNumber) {
        throw new ValidationError('전화번호가 필요합니다.');
    }

    // 모델명: PhoneVerificationModel
    // 필드명: phone (모델 스키마에 맞춤)
    const pv = await PhoneVerificationModel.findOne({ phone: phoneNumber });
    if (!pv || !pv.verified) {
        throw new ValidationError('전화번호 미인증');
    }
    // 필요하면: await PhoneVerificationModel.deleteOne({ _id: pv._id });
}
