// src/utils/sms.ts
import 'dotenv/config';
import { SolapiMessageService } from 'solapi';

let client: SolapiMessageService | null = null;
function getClient() {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    if (!apiKey || !apiSecret) throw new Error('SOLAPI_API_KEY / SOLAPI_API_SECRET 환경변수 필요');
    if (!client) client = new SolapiMessageService(apiKey, apiSecret);
    return client!;
}

export async function sendVerificationSMS(to: string, code: string) {
    const sender = (process.env.SMS_SENDER ?? '').trim();
    if (!sender) throw new Error('SMS_SENDER 환경변수 필요');

    const normalized = to.replace(/[^0-9]/g, '');      // 숫자만
    const from = sender.replace(/[^0-9]/g, '');        // 숫자만
    const text = `[나중에정하기] 인증번호 ${code} (5분 내 입력)`;

    // ✅ 올바른 호출
    await getClient().sendOne({ to: normalized, from, text });
}
