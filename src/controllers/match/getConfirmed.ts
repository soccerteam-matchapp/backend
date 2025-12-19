import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { findConfirmedMatches } from "../../services/match.service";

export const getConfirmedMatches = async (req: AuthenticatedRequest, res: Response) => {
    const matches = await findConfirmedMatches();

    return res.status(200).json({
        status: 200,
        message: "성사된 매칭 조회 성공",
        data: matches,
    });
};

