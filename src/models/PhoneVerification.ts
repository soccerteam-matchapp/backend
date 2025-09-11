// src/models/PhoneVerification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoneVerification extends Document {
    phoneNumber: string;
    codeHash: string;          // bcrypt 해시
    expiresAt: Date;           // TTL 인덱스 대상
    attempts: number;          // 검증 시도 횟수
    lastSentAt: Date;          // 재전송 쿨다운
    verified: boolean;         // 검증 완료 플래그
}

const PhoneVerificationSchema = new Schema<IPhoneVerification>({
    phoneNumber: { type: String, required: true, index: true, unique: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, required: true, default: 0 },
    lastSentAt: { type: Date, required: true, default: () => new Date(0) },
    verified: { type: Boolean, required: true, default: false },
});

// TTL 인덱스: expiresAt 지나면 문서 자동 삭제
PhoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneVerification =
    mongoose.models.PhoneVerification ||
    mongoose.model<IPhoneVerification>('PhoneVerification', PhoneVerificationSchema);
