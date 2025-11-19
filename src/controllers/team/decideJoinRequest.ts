import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { processJoinRequest } from '../../services/team.service';
import { ValidationError } from '../../utils/errors';
import { DecideJoinRequestDto } from '../../dto/team.dto';

export const decideJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const { userId, action } = req.body as DecideJoinRequestDto;
    const result = await processJoinRequest(teamId, req.userId, userId, action);
    return res.status(200).json({ status: 200, message: '처리 완료', data: result });
};

