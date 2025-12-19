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
import { normalizePhoneNumber } from '../utils/phone';

/** 회원가입 (전화번호 인증 + 회원가입 한 번에 처리) */
export const register = async (req: Request, res: Response) => {
    const { id, name, password, phoneNumber, verificationCode, phone, code } = req.body;
    
    // 전화번호 정규화 (phoneNumber 또는 phone 둘 다 허용)
    const rawPhone = phoneNumber || phone;
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    
    // 인증번호 (verificationCode 또는 code 둘 다 허용)
    const verifyCode = verificationCode || code;
    
    // 인증번호 검증
    await verifyPhoneCode(normalizedPhone, verifyCode);
    
    // 유저 저장
    await registerUser(id, name, password);
    
    // 인증 데이터 삭제 (회원가입 완료 후)
    await PhoneVerificationModel.deleteOne({ phone: normalizedPhone });
    
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

/** 전화번호 인증번호 검증 */
async function verifyPhoneCode(phoneNumber: string, code: string) {
    if (!phoneNumber) {
        throw new ValidationError('전화번호가 필요합니다.');
    }
    if (!code) {
        throw new ValidationError('인증번호가 필요합니다.');
    }

    const pv = await PhoneVerificationModel.findOne({ phone: phoneNumber });
    
    if (!pv) {
        throw new ValidationError('인증번호를 먼저 요청해주세요.');
    }
    
    // 만료 확인
    if (pv.expiresAt.getTime() < Date.now()) {
        throw new ValidationError('인증번호가 만료되었습니다. 다시 요청해주세요.');
    }
    
    // 시도 횟수 확인
    if ((pv.attempts ?? 0) >= 5) {
        throw new ValidationError('시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.');
    }
    
    // 코드 일치 확인
    if (pv.code !== code) {
        await PhoneVerificationModel.updateOne(
            { _id: pv._id }, 
            { $inc: { attempts: 1 } }
        );
        throw new ValidationError('인증번호가 올바르지 않습니다.');
    }
    
    // 인증 성공 - verified 상태로 변경
    await PhoneVerificationModel.updateOne(
        { _id: pv._id },
        { $set: { verified: true } }
    );
}
