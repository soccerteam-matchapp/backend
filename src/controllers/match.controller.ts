import { Request, Response } from "express";
import { createMatchRequest, applyMatchRequest, getAppliedTeams, acceptMatchTeam, getConfirmedMatches } from "../services/match.service";
import { ValidationError, NotFoundError } from "../utils/errors";
import { Match } from "../models/match.model";


export const create = async (req: Request, res: Response) => {
    const { teamId, date, location, players } = req.body;
    if (!teamId || !date || !location || !players) {
        throw new ValidationError("필수 값이 누락되었습니다.");
    }

    const match = await createMatchRequest(
        teamId,
        (req as any).userId, // 로그인 유저
        date,
        location,
        players,
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 요청 생성 성공",
        data: match,
    });
};

export const list = async (req: Request, res: Response) => {
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

export const apply = async (req: Request, res: Response) => {
    const { teamId, matchId, players } = req.body;
    if (!teamId || !matchId || !players) {
        throw new ValidationError("필수 값이 누락되었습니다.");
    }

    const match = await applyMatchRequest(
        teamId,
        (req as any).userId,
        matchId,
        players
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 신청 성공",
        data: match,
    });
};


export const participants = async (req: Request, res: Response) => {
    const { matchId } = req.params;
    if (!matchId) {
        throw new ValidationError("matchId가 필요합니다.");
    }

    const participants = await getAppliedTeams(matchId, (req as any).userId);

    return res.status(200).json({
        status: 200,
        message: "매칭 참가팀 조회 성공",
        data: participants,
    });
};

export const acceptTeam = async (req: Request, res: Response) => {
    const { matchId, teamId } = req.body;
    if (!matchId || !teamId) {
        throw new ValidationError("matchId와 teamId가 필요합니다.");
    }

    const match = await acceptMatchTeam(matchId, (req as any).userId, teamId);

    return res.status(200).json({
        status: 200,
        message: "팀 매칭 수락 완료",
        data: match,
    });
};

export const confirmed = async (req: Request, res: Response) => {
    const matches = await getConfirmedMatches();

    return res.status(200).json({
        status: 200,
        message: "성사된 매칭 조회 성공",
        data: matches,
    });
};