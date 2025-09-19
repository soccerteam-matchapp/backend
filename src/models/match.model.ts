import { Schema, model, Types, Document } from "mongoose";

export interface IMatch extends Document {
    team: Types.ObjectId;      // 생성한 팀
    leader: Types.ObjectId;    // 팀장 (User)
    date: Date;                // 경기 날짜
    location: string;          // 경기 장소
    players: number;           // 필요한 인원
    status: "pending" | "accepted";
    createdAt: Date;
    updatedAt: Date;
    participants: Types.ObjectId[]; // 신청한 팀 리스트
    acceptedTeam?: Types.ObjectId;
    expireAt: Date;
}

const MatchSchema = new Schema<IMatch>(
    {
        team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
        leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: Date, required: true },
        location: { type: String, required: true },
        players: { type: Number, required: true },
        status: { type: String, enum: ["pending", "accepted", "rejected", "done"], default: "pending" },
        participants: [{ type: Types.ObjectId, ref: "Team", default: [] }],
        acceptedTeam: { type: Schema.Types.ObjectId, ref: "Team" }, // 여기 추가
        expireAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export const Match = model<IMatch>("Match", MatchSchema);
