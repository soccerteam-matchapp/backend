import { Schema, model, Types, Document } from "mongoose";

export interface IAttendancePoll extends Document {
  team: Types.ObjectId;            // 팀 ID
  match: Types.ObjectId;           // 🔥 어떤 매치에 대한 투표인지
  leader: Types.ObjectId;          // 만든 사람(팀장)
  question: string;                // "이번주 경기 참여할 사람?"
  options: ("yes" | "no")[];       // maybe 제거
  votes: {
    user: Types.ObjectId;          // 투표한 팀원
    choice: "yes" | "no";          // yes / no
  }[];
  createdAt: Date;
  expiresAt?: Date;                // 투표 마감 시간(선택)

  canMatch: boolean;               // ✅ yes >= 11 이면 true
}

const AttendancePollSchema = new Schema<IAttendancePoll>(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true }, // ⬅️ 추가
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },

    options: { 
      type: [String], 
      enum: ["yes", "no"], 
      default: ["yes", "no"] 
    },

    votes: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        choice: { type: String, enum: ["yes", "no"], required: true },
      },
    ],

    expiresAt: { type: Date },

    canMatch: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔥 팀 + 매치 별로 투표 하나만 존재하게 하고 싶다면 인덱스 추가
AttendancePollSchema.index({ team: 1, match: 1 }, { unique: true });

export const AttendancePoll = model<IAttendancePoll>("AttendancePoll", AttendancePollSchema);
