import { Schema, model, Types, Document } from 'mongoose';

export interface ITeamRating extends Document {
    team: Types.ObjectId;
    rater: Types.ObjectId;     // User _id
    score: number;             // 0~5
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TeamRatingSchema = new Schema<ITeamRating>(
    {
        team: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
        rater: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true, min: 0, max: 5 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

// 동일 사용자가 동일 팀에 중복 평가 금지
TeamRatingSchema.index({ team: 1, rater: 1 }, { unique: true });

export const TeamRating = model<ITeamRating>('TeamRating', TeamRatingSchema);
