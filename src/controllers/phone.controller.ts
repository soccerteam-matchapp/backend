// src/controllers/phone.controller.ts
import { Request, Response } from 'express';
import { PhoneVerification } from '../models/PhoneVerification';
import { sendVerificationSMS } from '../utils/sms';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const requestSchema = z.object({
    phoneNumber: z.string().min(10).max(15),
});
const verifySchema = z.object({
    phoneNumber: z.string().min(10).max(15),
    code: z.string().length(6).regex(/^\d{6}$/),
});

// 설정값
const CODE_LENGTH = 6;
const CODE_TTL_MIN = 5;         // 5분 유효
const RESEND_COOLDOWN_SEC = 60;  // 60초 재전송 제한
const MAX_ATTEMPTS = 5;

function generateCode(len = CODE_LENGTH) {
    // 6자리 숫자
    return [...Array(len)]
        .map(() => Math.floor(Math.random() * 10))
        .join('');
}

export const requestCode = async (req: Request, res: Response) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'invalid phoneNumber' });

    const phoneNumber = parsed.data.phoneNumber.replace(/[^0-9]/g, '');
    const now = new Date();

    let doc = await PhoneVerification.findOne({ phoneNumber });

    // 쿨다운 체크
    if (doc && now.getTime() - doc.lastSentAt.getTime() < RESEND_COOLDOWN_SEC * 1000) {
        const remain = Math.ceil(
            (RESEND_COOLDOWN_SEC * 1000 - (now.getTime() - doc.lastSentAt.getTime())) / 1000
        );
        return res.status(429).json({ success: false, error: `재전송은 ${remain}초 후 가능` });
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now.getTime() + CODE_TTL_MIN * 60 * 1000);

    if (!doc) {
        doc = await PhoneVerification.create({
            phoneNumber,
            codeHash,
            expiresAt,
            attempts: 0,
            lastSentAt: now,
            verified: false,
        });
    } else {
        doc.codeHash = codeHash;
        doc.expiresAt = expiresAt;
        doc.attempts = 0;
        doc.lastSentAt = now;
        doc.verified = false;
        await doc.save();
    }

    await sendVerificationSMS(phoneNumber, code);
    // 보안상 코드 로그 금지

    return res.json({ success: true, message: '인증번호 전송 완료' });
};

export const verifyCode = async (req: Request, res: Response) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'invalid payload' });

    const phoneNumber = parsed.data.phoneNumber.replace(/[^0-9]/g, '');
    const code = parsed.data.code;

    const doc = await PhoneVerification.findOne({ phoneNumber });
    if (!doc) return res.status(400).json({ success: false, error: '인증 요청 이력 없음' });
    if (doc.verified) return res.json({ success: true, verified: true }); // 이미 인증됨
    if (doc.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ success: false, error: '코드 만료' });
    }
    if (doc.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, error: '시도 횟수 초과' });
    }

    const ok = await bcrypt.compare(code, doc.codeHash);
    doc.attempts += 1;

    if (!ok) {
        await doc.save();
        return res.status(400).json({ success: false, error: '코드 불일치' });
    }

    doc.verified = true;
    await doc.save();

    return res.json({ success: true, verified: true });
};
