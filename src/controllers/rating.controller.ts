import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { upsertTeamRating, getTeamRatingSummary, listTeamRatings } from '../services/rating.service';
import { ValidationError } from '../utils/errors';
import { RateTeamDto } from '../dto/rating.dto';

export const rateTeam = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const { score, comment } = req.body as RateTeamDto;
    const result = await upsertTeamRating(teamId, req.userId, score, comment);
    return res.status(200).json({ status: 200, message: '평점 저장', data: result });
};

export const getRatingSummary = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    const summary = await getTeamRatingSummary(teamId);
    return res.status(200).json({ status: 200, message: '평점 요약', data: summary });
};

export const getRatingList = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const cursor = (req.query.cursor as string) || undefined;
    const result = await listTeamRatings(teamId, limit, cursor);
    return res.status(200).json({ status: 200, message: '평점 목록', data: result.data, nextCursor: result.nextCursor });
};
