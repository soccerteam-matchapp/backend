import { Request, Response } from 'express';
import { upsertTeamRating, getTeamRatingSummary, listTeamRatings } from '../services/rating.service';
import { ValidationError } from '../utils/errors';

export const rateTeam = async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { score, comment } = req.body as { score?: number; comment?: string };
    if (score === undefined) throw new ValidationError('score가 필요합니다.');
    const result = await upsertTeamRating(teamId, (req as any).userId, Number(score), comment);
    return res.status(200).json({ status: 200, message: '평점 저장', data: result });
};

export const getRatingSummary = async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const summary = await getTeamRatingSummary(teamId);
    return res.status(200).json({ status: 200, message: '평점 요약', data: summary });
};

export const getRatingList = async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const cursor = (req.query.cursor as string) || undefined;
    const result = await listTeamRatings(teamId, limit, cursor);
    return res.status(200).json({ status: 200, message: '평점 목록', data: result.data, nextCursor: result.nextCursor });
};
