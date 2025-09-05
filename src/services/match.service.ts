import { Types } from "mongoose";
import { Match } from "../models/match.model";
import { Team } from "../models/team.model";
import { ForbiddenError, NotFoundError, ConflictError } from "../utils/errors";

export async function createMatchRequest(
    teamId: string,
    leaderId: string,
    date: string,
    location: string,
    players: number
) {
    const team = await Team.findById(teamId);
    if (!team) throw new NotFoundError("팀을 찾을 수 없습니다.");

    // 팀장 권한 확인
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError("팀장만 매칭을 신청할 수 있습니다.");
    }

    // 매칭 가능 여부 확인
    if (!team.canMatch) {
        throw new ForbiddenError("팀원 수가 부족하여 매칭을 신청할 수 없습니다. (최소 9명 필요)");
    }

    const match = await Match.create({
        team: team._id,
        leader: leaderId,
        date,
        location,
        players,
        status: "pending",
    });

    return match;
}

export async function applyMatchRequest(
    teamId: string,
    leaderId: string,
    matchId: string // 신청할 매칭 ID
) {
    const team = await Team.findById(teamId);
    if (!team) throw new NotFoundError("팀을 찾을 수 없습니다.");

    // 팀장 권한 확인
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError("팀장만 매칭을 신청할 수 있습니다.");
    }

    // 매칭 가능 여부 확인
    if (!team.canMatch) {
        throw new ForbiddenError("팀원 수가 부족하여 매칭을 신청할 수 없습니다. (최소 9명 필요)");
    }

    // 매칭 조회
    const match = await Match.findById(matchId);
    if (!match) throw new NotFoundError("매칭을 찾을 수 없습니다.");

    // 자기 팀 매칭 신청 방지
    if (match.team.equals(teamId)) {
        throw new ForbiddenError("자기 팀 매칭에는 신청할 수 없습니다.");
    }

    // 이미 신청했는지 확인
    if (match.participants?.some(p => p.equals(teamId))) {
        throw new ConflictError("이미 신청한 매칭입니다.");
    }

    // 신청 추가
    if (!match.participants) {
        match.participants = [];
    }

    match.participants.push(team._id as Types.ObjectId);
    await match.save();

    return match;
}