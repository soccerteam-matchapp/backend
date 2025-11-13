import { Types } from "mongoose";
import { AttendancePoll } from "../models/attendancePoll.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors";

// 투표 생성 (팀장 전용)
export async function createPoll(teamId: string, leaderId: string, question: string, expiresAt?: Date) {
    const poll = await AttendancePoll.create({
        team: new Types.ObjectId(teamId),
        leader: new Types.ObjectId(leaderId),
        question,
        expiresAt
    });
    return poll;
}

// 투표하기
export async function votePoll(pollId: string, userId: string, choice: "yes" | "no" | "maybe") {
    const poll = await AttendancePoll.findById(pollId);
    if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");

    // 이미 투표했는지 확인
    const existingVote = poll.votes.find(v => v.user.equals(userId));
    if (existingVote) {
        existingVote.choice = choice; // 수정 가능
    } else {
        poll.votes.push({ user: new Types.ObjectId(userId), choice });
    }

    await poll.save();
    return poll;
}

// 투표 현황 조회
export async function getPollResults(pollId: string) {
    const poll = await AttendancePoll.findById(pollId)
        .populate("votes.user", "username"); // 투표자 이름 표시
    if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");
    return poll;
}
