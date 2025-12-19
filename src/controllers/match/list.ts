import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { NotFoundError } from "../../utils/errors";
import { Match } from "../../models/match.model";

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

