import { Types } from "mongoose";
import { Match } from "../models/match.model";
import { Team } from "../models/team.model";
import { ForbiddenError, NotFoundError, ConflictError } from "../utils/errors";
import { createMatchApplyNotification, createMatchAcceptedNotification } from "./notification.service";

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
    matchId: string, // 신청할 매칭 ID
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

    // 매칭 조회
    const match = await Match.findById(matchId);
    if (!match) throw new NotFoundError("매칭을 찾을 수 없습니다.");

    // 자기 팀 매칭 신청 방지
    if (match.team.equals(teamId)) {
        throw new ForbiddenError("자기 팀 매칭에는 신청할 수 없습니다.");
    }

    // 이미 신청했는지 확인
    if (match.participants?.some((p: any) => p.team && p.team.equals(team._id))) {
        throw new ConflictError("이미 신청한 매칭입니다.");
    }

    // 신청 추가
    if (!match.participants) {
        match.participants = [];
    }

    match.participants.push({
        team: team._id as Types.ObjectId,
        players
    } as any);

    await match.save();

    // 호스트 팀장에게 알림 생성
    try {
        await createMatchApplyNotification(matchId, teamId);
    } catch (err) {
        // 알림 생성 실패해도 매칭 신청은 성공 처리
        console.warn('알림 생성 실패:', err);
    }

    return match;
}

export async function getAppliedTeams(matchId: string, userId: string) {
    const match = await Match.findById(matchId)
        .populate({
            path: "participants",
            select: "teamName leader members canMatch",
        })
        .exec();

    if (!match) {
        throw new NotFoundError("매칭을 찾을 수 없습니다.");
    }

    // 팀장 권한 확인
    if (!match.leader.equals(new Types.ObjectId(userId))) {
        throw new ForbiddenError("해당 매칭의 팀장만 참가팀을 조회할 수 있습니다.");
    }

    if (match.participants.length === 0) {
        return {
            message: "아직 신청한 팀이 없습니다.",
            participants: [],
        };
    }
    return match.participants;
}

export async function acceptMatchTeam(matchId: string, userId: string, acceptedTeamId: string) {
    const match = await Match.findById(matchId).populate("participants").exec();
    if (!match) throw new NotFoundError("매칭을 찾을 수 없습니다.");

    // 팀장 권한 확인
    if (!match.leader.equals(new Types.ObjectId(userId))) {
        throw new ForbiddenError("해당 매칭의 팀장만 팀을 수락할 수 있습니다.");
    }

    // 신청 팀 확인
    if (!match.participants.some((p: any) => p.team && p.team.equals(acceptedTeamId))) {
        throw new ConflictError("해당 팀은 매칭 신청을 하지 않았습니다.");
    }

    // 매칭 수락 처리
    match.status = "accepted";
    match.acceptedTeam = new Types.ObjectId(acceptedTeamId);
    await match.save();

    // 게스트 팀장에게 알림 생성
    try {
        await createMatchAcceptedNotification(matchId, acceptedTeamId);
    } catch (err) {
        // 알림 생성 실패해도 매칭 수락은 성공 처리
        console.warn('알림 생성 실패:', err);
    }

    return match;
}

export async function getConfirmedMatches() {
    const matches = await Match.find({
        status: "accepted",       // 수락된 매칭만
        acceptedTeam: { $exists: true }  // acceptedTeam이 있는 매칭
    })
        .populate({
            path: "team",
            select: "teamName leader members",
        })
        .populate({
            path: "acceptedTeam",
            select: "teamName leader members",
        })
        .sort({ createdAt: -1 })
        .exec();

    if (!matches || matches.length === 0) {
        throw new NotFoundError("성사된 매칭이 없습니다.");
    }

    return matches;
}