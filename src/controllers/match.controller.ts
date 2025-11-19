import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { createMatchRequest, applyMatchRequest, getAppliedTeams, acceptMatchTeam, getConfirmedMatches } from "../services/match.service";
import { ValidationError, NotFoundError } from "../utils/errors";
import { Match } from "../models/match.model";


export const create = async (req: AuthenticatedRequest, res: Response) => {
    const {
        teamId,
        date,
        location,
        players,
        // ⬇️ 새 필드
        skill,       // "beginner" | "intermediate" | "advanced"
        fieldCost,   // number
        proCount,    // number (optional)
    } = req.body;

    if (!teamId || !date || !location || !players || !skill || fieldCost === undefined) {
        throw new ValidationError("필수 값이 누락되었습니다. (teamId, date, location, players, skill, fieldCost)");
    }

    // 가벼운 값 검증 (선택)
    if (!["beginner", "intermediate", "advanced"].includes(skill)) {
        throw new ValidationError("skill은 beginner|intermediate|advanced 중 하나여야 합니다.");
    }
    if (typeof fieldCost !== "number" || fieldCost < 0) {
        throw new ValidationError("fieldCost는 0 이상의 숫자여야 합니다.");
    }
    if (proCount !== undefined && (typeof proCount !== "number" || proCount < 0)) {
        throw new ValidationError("proCount는 0 이상의 숫자여야 합니다.");
    }

    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const match = await createMatchRequest(
        teamId,
        req.userId,
        date,
        location,
        Number(players),
        skill,
        Number(fieldCost),
        proCount !== undefined ? Number(proCount) : 0
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 요청 생성 성공",
        data: match,
    });
};


export const list = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const matches = await Match.find()
            .sort({ createdAt: -1 }) // 최신순
            .populate({
                path: "team",
                select: "teamName", // 팀 이름만 가져옴
            })
            .populate({
                path: "leader",
                select: "username", // 팀장 아이디(유저네임)
            });

        return res.status(200).json({
            status: 200,
            message: "매칭 목록 조회 성공",
            data: matches,
        });
    } catch (error) {
        throw new NotFoundError("조회할 매칭이 없습니다.");
    }
};

export const apply = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId, matchId, players } = req.body;
    if (!teamId || !matchId || !players) {
        throw new ValidationError("필수 값이 누락되었습니다.");
    }

    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const match = await applyMatchRequest(
        teamId,
        req.userId,
        matchId,
        players
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 신청 성공",
        data: match,
    });
};


export const participants = async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;
    if (!matchId) {
        throw new ValidationError("matchId가 필요합니다.");
    }

    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const participants = await getAppliedTeams(matchId, req.userId);

    return res.status(200).json({
        status: 200,
        message: "매칭 참가팀 조회 성공",
        data: participants,
    });
};

export const acceptTeam = async (req: AuthenticatedRequest, res: Response) => {
    const { matchId, teamId } = req.body;
    if (!matchId || !teamId) {
        throw new ValidationError("matchId와 teamId가 필요합니다.");
    }

    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const match = await acceptMatchTeam(matchId, req.userId, teamId);

    return res.status(200).json({
        status: 200,
        message: "팀 매칭 수락 완료",
        data: match,
    });
};

export const confirmed = async (req: AuthenticatedRequest, res: Response) => {
    const matches = await getConfirmedMatches();

    return res.status(200).json({
        status: 200,
        message: "성사된 매칭 조회 성공",
        data: matches,
    });
};