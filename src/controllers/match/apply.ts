import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { applyToMatch as applyToMatchService } from "../../services/match.service";
import { ValidationError } from "../../utils/errors";
import { ApplyToMatchDto } from "../../dto/match.dto";

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

