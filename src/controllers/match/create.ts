import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { createMatch as createMatchService } from "../../services/match.service";
import { ValidationError } from "../../utils/errors";
import { CreateMatchDto } from "../../dto/match.dto";

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

