import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { createTeam as createTeamService } from '../../services/team.service';
import { ValidationError } from '../../utils/errors';
import { CreateTeamDto } from '../../dto/team.dto';

export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const { teamName } = req.body as CreateTeamDto;
    const team = await createTeamService(req.userId, teamName);
    return res.status(201).json({
        status: 201,
        message: '팀 생성 성공',
        data: {
            id: String(team._id),
            teamName: team.teamName,
            inviteCode: team.inviteCode,
            leader: String(team.leader),
            memberNum: team.memberNum,
            canMatch: team.canMatch,
        },
    });
};

