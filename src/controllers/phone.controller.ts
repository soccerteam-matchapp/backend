// src/controllers/phone.controller.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import PhoneVerificationModel from '../models/phoneVerification.model'; // ✅ 핵심

// 6자리 코드 생성
function generateCode(): string {
    const n = crypto.randomInt(0, 1000000);
    return n.toString().padStart(6, '0');
}

const requestSchema = z.object({
    phone: z.string().min(8, 'invalid phone'),
});

const verifySchema = z.object({
    phone: z.string().min(8),
    code: z.string().length(6),
});

// 코드 요청
export async function requestCode(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone } = requestSchema.parse(req.body);
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분

        await PhoneVerificationModel.findOneAndUpdate(
            { phone },
            { $set: { code, verified: false, attempts: 0, expiresAt } },
            { upsert: true, new: true }
        );

        // 문자 전송은 선택(환경변수 없으면 콘솔만)
        try {
            const apiKey = process.env.SOLAPI_API_KEY;
            const apiSecret = process.env.SOLAPI_API_SECRET;
            const sender = process.env.SMS_SENDER;
            if (apiKey && apiSecret && sender) {
                const { SolapiMessageService } = await import('solapi');
                const messageService = new SolapiMessageService(apiKey, apiSecret);
                await messageService.sendOne({
                    to: phone,
                    from: sender,
                    text: `[인증번호] ${code} (5분 내 유효)`,
                });
            } else {
                console.log(`[DEV] phone=${phone}, code=${code} (SOLAPI env 미설정)`);
            }
        } catch (e) {
            console.warn('문자 전송 실패(무시):', (e as Error).message);
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

// 코드 검증
export async function verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, code } = verifySchema.parse(req.body);

        const doc = await PhoneVerificationModel.findOne({ phone });
        if (!doc) return res.status(400).json({ success: false, message: '코드가 없습니다.' });

        if (doc.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: '코드가 만료되었습니다.' });
        }

        const attempts = (doc.attempts ?? 0) + 1;
        if (attempts > 5) {
            return res.status(429).json({ success: false, message: '시도 횟수 초과' });
        }

        if (doc.code !== code) {
            await PhoneVerificationModel.updateOne({ _id: doc._id }, { $set: { attempts } });
            return res.status(400).json({ success: false, message: '코드가 올바르지 않습니다.' });
        }

        await PhoneVerificationModel.updateOne(
            { _id: doc._id },
            { $set: { verified: true }, $inc: { attempts: 1 } }
        );

        res.json({ success: true, verified: true });
    } catch (err) {
        next(err);
    }
}
