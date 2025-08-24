import { Schema, model, Types, Document } from 'mongoose';

export interface ITeam extends Document {
    teamName: string;
    inviteCode: string;              // 6자리 숫자 문자열 (유니크)
    leader: Types.ObjectId;          // User _id
    members: Types.ObjectId[];       // User _id[]
    pending: Types.ObjectId[];       // 가입 대기 User _id[]
    createdAt: Date;
    updatedAt: Date;
    memberNum: number;               // virtual
    canMatch: boolean;               // virtual (멤버 9명 이상)
}

const TeamSchema = new Schema<ITeam>(
    {
        teamName: { type: String, required: true, unique: true, trim: true },
        inviteCode: { type: String, required: true, unique: true, index: true },
        leader: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
        pending: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TeamSchema.virtual('memberNum').get(function (this: ITeam) {
    return this.members?.length ?? 0;
});
TeamSchema.virtual('canMatch').get(function (this: ITeam) {
    return (this.members?.length ?? 0) >= 9;
});

export const Team = model<ITeam>('Team', TeamSchema);
