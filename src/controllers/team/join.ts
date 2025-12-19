import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { requestTeamJoin } from '../../services/team.service';
import { ValidationError } from '../../utils/errors';
import { JoinTeamByInviteCodeDto } from '../../dto/team.dto';

export const joinTeamByInviteCode = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const { inviteCode } = req.body as JoinTeamByInviteCodeDto;
    const team = await requestTeamJoin(inviteCode, req.userId);
    return res.status(200).json({
        status: 200,
        message: '가입 요청 접수',
        data: {
            teamId: String(team._id),
            pendingCount: team.pending.length,
        },
    });
};

