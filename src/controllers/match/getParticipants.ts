import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { findAppliedTeams } from "../../services/match.service";
import { ValidationError } from "../../utils/errors";

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

