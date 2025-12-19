import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { findTeamByInviteCode } from '../../services/team.service';

export const getTeamByInviteCode = async (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.params;
    const team = await findTeamByInviteCode(code);
    return res.status(200).json({
        status: 200,
        message: '팀 조회 성공',
        data: {
            id: String(team._id),
            teamName: team.teamName,
            inviteCode: team.inviteCode,
            memberNum: team.memberNum,
            canMatch: team.canMatch,
        },
    });
};

