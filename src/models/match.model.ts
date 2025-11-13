import { Schema, model, Types, Document } from "mongoose";

export type MatchSkill = "beginner" | "intermediate" | "advanced";

export interface IMatch extends Document {
  team: Types.ObjectId;
  leader: Types.ObjectId;
  date: string;            // (기존 유지. 가능하면 Date로 바꾸는 걸 추천)
  location: string;
  players: number;
  skill: MatchSkill;       // 팀 실력
  fieldCost: number;       // 구장 비용
  proCount: number;        // 선출 인원 수
  status: "pending" | "accepted" | "rejected" | "done";
  createdAt: Date;
  updatedAt: Date;
  // 🔧 기존 인터페이스 불일치 수정
  participants: { team: Types.ObjectId; players: number }[];
  acceptedTeam?: Types.ObjectId;
}

const MatchSchema = new Schema<IMatch>(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    players: { type: Number, required: true, min: 1 },

    skill: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    fieldCost: { type: Number, required: true, min: 0 },
    proCount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "done"],
      default: "pending",
    },
    participants: [
      {
        team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
        players: { type: Number, required: true, min: 1 },
      },
    ],
    acceptedTeam: { type: Schema.Types.ObjectId, ref: "Team" },
  },
  { timestamps: true }
);

// (옵션) 날짜 정렬/검색용 인덱스
MatchSchema.index({ date: 1, status: 1 });

export const Match = model<IMatch>("Match", MatchSchema);
