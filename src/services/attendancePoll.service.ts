import { Types } from "mongoose";
import { AttendancePoll } from "../models/attendancePoll.model";
import { Team } from "../models/team.model";
import { Match } from "../models/match.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors";


// 투표 생성 (팀장 전용)
// 투표 생성 (팀장 전용, 특정 매치 기준)
export async function createPoll(
  teamId: string,
  leaderId: string,
  matchId: string,
  question: string,
  expiresAt?: Date
) {
  // 팀 조회
  const team = await Team.findById(teamId).exec();
  if (!team) throw new NotFoundError("팀을 찾을 수 없습니다.");

  // 팀장 권한 확인
  if (!team.leader.equals(new Types.ObjectId(leaderId))) {
    throw new ForbiddenError("팀장만 출석 투표를 생성할 수 있습니다.");
  }

  // 매치 존재 여부 확인
  const match = await Match.findById(matchId).exec();
  if (!match) throw new NotFoundError("매칭을 찾을 수 없습니다.");

  // 이미 이 매치에 대한 출석 투표가 있으면 막기 (선택)
  const existing = await AttendancePoll.findOne({
    team: team._id,
    match: match._id,
  }).exec();

  if (existing) {
    throw new ConflictError("이미 이 매치에 대한 출석 투표가 존재합니다.");
  }

  const poll = await AttendancePoll.create({
    team: team._id,
    match: match._id,
    leader: new Types.ObjectId(leaderId),
    question,
    expiresAt,
    // canMatch는 default(false)
  });

  return poll;
}


// 투표하기
export async function votePoll(
  pollId: string, 
  userId: string, 
  choice: "yes" | "no"               // ⬅️ maybe 제거
) {
  const poll = await AttendancePoll.findById(pollId);
  if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");

  // 이미 투표했는지 확인
  const existingVote = poll.votes.find((v) => v.user.equals(userId));
  if (existingVote) {
    existingVote.choice = choice; // 수정 가능
  } else {
    poll.votes.push({ user: new Types.ObjectId(userId), choice });
  }

  // ✅ 여기서 yes 개수 기반으로 canMatch 갱신
  const yesCount = poll.votes.filter((v) => v.choice === "yes").length;
  poll.canMatch = yesCount >= 11;   // yes 인원이 11명 이상이면 true

  await poll.save();
  return poll;
}

// 투표 현황 조회
export async function getPollResults(pollId: string) {
  const poll = await AttendancePoll.findById(pollId)
    .populate("votes.user", "username"); // 투표자 이름 표시
  if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");
  return poll; // 여기서도 canMatch 포함된 상태로 나감
}
