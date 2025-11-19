import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { acceptTeamForMatch } from "../../services/match.service";
import { ValidationError } from "../../utils/errors";
import { AcceptMatchTeamDto } from "../../dto/match.dto";

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

