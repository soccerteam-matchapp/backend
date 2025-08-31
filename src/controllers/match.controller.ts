import { Request, Response } from "express";
import { createMatchRequest } from "../services/match.service";
import { ValidationError } from "../utils/errors";

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
