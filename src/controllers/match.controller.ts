import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { createMatch as createMatchService, applyToMatch as applyToMatchService, findAppliedTeams, acceptTeamForMatch, findConfirmedMatches } from "../services/match.service";
import { ValidationError, NotFoundError } from "../utils/errors";
import { Match } from "../models/match.model";
import { CreateMatchDto, ApplyToMatchDto, AcceptMatchTeamDto } from "../dto/match.dto";


export const createMatch = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const { teamId, date, location, players, skill, fieldCost, proCount } = req.body as CreateMatchDto;

    const match = await createMatchService(
        teamId,
        req.userId,
        date,
        location,
        players,
        skill,
        fieldCost,
        proCount ?? 0
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 요청 생성 성공",
        data: match,
    });
};


export const getMatches = async (req: AuthenticatedRequest, res: Response) => {
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

export const applyToMatch = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const { teamId, matchId, players } = req.body as ApplyToMatchDto;

    const match = await applyToMatchService(
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


export const getMatchParticipants = async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;
    if (!matchId) {
        throw new ValidationError("matchId가 필요합니다.");
    }

    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const participants = await findAppliedTeams(matchId, req.userId);

    return res.status(200).json({
        status: 200,
        message: "매칭 참가팀 조회 성공",
        data: participants,
    });
};

export const acceptMatchTeam = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        throw new ValidationError("인증이 필요합니다.");
    }

    const { matchId, teamId } = req.body as AcceptMatchTeamDto;

    const match = await acceptTeamForMatch(matchId, req.userId, teamId);

    return res.status(200).json({
        status: 200,
        message: "팀 매칭 수락 완료",
        data: match,
    });
};

export const getConfirmedMatches = async (req: AuthenticatedRequest, res: Response) => {
    const matches = await findConfirmedMatches();

    return res.status(200).json({
        status: 200,
        message: "성사된 매칭 조회 성공",
        data: matches,
    });
};