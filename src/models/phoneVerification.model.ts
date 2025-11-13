import { Schema, model, type Document, type Model } from 'mongoose';

export interface IPhoneVerification extends Document {
    phone: string;
    code: string;
    verified: boolean;
    attempts: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const schema = new Schema<IPhoneVerification>(
    {
        phone: { type: String, required: true, index: true },
        code: { type: String, required: true },
        verified: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        // 날짜 기반 TTL (만료되면 자동 삭제)
        expiresAt: { type: Date, required: true, index: { expires: 0 } }
    },
    { timestamps: true }
);

// ⚠️ 단 하나의 default export만! (다른 이름 export 금지)
const PhoneVerificationModel: Model<IPhoneVerification> =
    model<IPhoneVerification>('PhoneVerification', schema);

export default PhoneVerificationModel;
