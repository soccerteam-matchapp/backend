import { Schema, model, Types, Document } from 'mongoose';

export type NotificationType = 'team_join_request' | 'match_apply' | 'match_accepted';

export interface INotification extends Document {
    user: Types.ObjectId; // 알림을 받을 사용자
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    relatedTeam?: Types.ObjectId; // 관련 팀 (팀 가입 요청, 매칭 등)
    relatedMatch?: Types.ObjectId; // 관련 매칭
    relatedUser?: Types.ObjectId; // 관련 사용자 (예: 가입 요청한 사용자)
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['team_join_request', 'match_apply', 'match_accepted'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false, index: true },
        relatedTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
        relatedMatch: { type: Schema.Types.ObjectId, ref: 'Match' },
        relatedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// 읽지 않은 알림 조회를 위한 인덱스
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);

