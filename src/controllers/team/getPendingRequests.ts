import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { findPendingRequests } from '../../services/team.service';
import { ValidationError } from '../../utils/errors';

export const getPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const list = await findPendingRequests(teamId, req.userId);
    return res.status(200).json({
        status: 200,
        message: '가입 대기 목록',
        data: list.map((u: any) => ({ _id: String(u._id), name: u.name, id: u.id })),
    });
};

