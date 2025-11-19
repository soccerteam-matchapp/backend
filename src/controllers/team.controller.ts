import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { createTeam as createTeamService, findTeamByInviteCode, requestTeamJoin, findPendingRequests, processJoinRequests } from '../services/team.service';
import { ValidationError } from '../utils/errors';
import { CreateTeamDto, JoinTeamByInviteCodeDto, DecideJoinRequestsDto } from '../dto/team.dto';

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

export const decideJoinRequests = async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.params;
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const { accept = [], reject = [] } = req.body as DecideJoinRequestsDto;
    const result = await processJoinRequests(teamId, req.userId, accept || [], reject || []);
    return res.status(200).json({ status: 200, message: '처리 완료', data: result });
};
