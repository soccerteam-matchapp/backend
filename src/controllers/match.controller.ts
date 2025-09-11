import { Request, Response } from "express";
import { createMatchRequest, applyMatchRequest } from "../services/match.service";
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
    const { teamId, matchId } = req.body;
    if (!teamId || !matchId) {
        throw new ValidationError("필수 값이 누락되었습니다.");
    }

    const match = await applyMatchRequest(
        teamId,
        (req as any).userId,
        matchId
    );

    return res.status(201).json({
        status: 201,
        message: "매칭 신청 성공",
        data: match,
    });
};