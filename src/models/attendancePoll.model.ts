import { Schema, model, Types, Document } from "mongoose";

export interface IAttendancePoll extends Document {
  team: Types.ObjectId;            // 팀 ID
  leader: Types.ObjectId;          // 만든 사람(팀장)
  question: string;                // "이번주 경기 참여할 사람?"
  options: ("yes" | "no")[];       // ⬅️ maybe 제거
  votes: {
    user: Types.ObjectId;          // 투표한 팀원
    choice: "yes" | "no";          // ⬅️ maybe 제거
  }[];
  createdAt: Date;
  expiresAt?: Date;                // 투표 마감 시간(선택)

  canMatch: boolean;               // ✅ yes >= 11 이면 true
}

const AttendancePollSchema = new Schema<IAttendancePoll>(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },

    // ⬇️ maybe 제거
    options: { 
      type: [String], 
      enum: ["yes", "no"], 
      default: ["yes", "no"] 
    },

    votes: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        choice: { type: String, enum: ["yes", "no"], required: true }, // ⬅️ maybe 제거
      },
    ],

    expiresAt: { type: Date },

    // ✅ canMatch 필드 추가 (처음엔 false)
    canMatch: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AttendancePoll = model<IAttendancePoll>("AttendancePoll", AttendancePollSchema);
