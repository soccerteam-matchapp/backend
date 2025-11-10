import { Request, Response } from 'express';
import { createTeam, getTeamByInvite, requestJoin, listPending, decideJoin } from '../services/team.service';
import { ValidationError } from '../utils/errors';

export const create = async (req: Request, res: Response) => {
    const { teamName } = req.body;
    if (!teamName) throw new ValidationError('teamName이 필요합니다.');
    const team = await createTeam((req as any).userId, teamName);
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

export const findByInvite = async (req: Request, res: Response) => {
    const { code } = req.params;
    const team = await getTeamByInvite(code);
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

export const joinByInvite = async (req: Request, res: Response) => {
    const { inviteCode } = req.body;
    if (!inviteCode) throw new ValidationError('inviteCode가 필요합니다.');
    const team = await requestJoin(inviteCode, (req as any).userId);
    return res.status(200).json({
        status: 200,
        message: '가입 요청 접수',
        data: {
            teamId: String(team._id),
            pendingCount: team.pending.length,
        },
    });
};

export const getPending = async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const list = await listPending(teamId, (req as any).userId);
    return res.status(200).json({
        status: 200,
        message: '가입 대기 목록',
        data: list.map((u: any) => ({ _id: String(u._id), name: u.name, id: u.id })),
    });
};

export const decide = async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { accept = [], reject = [] } = req.body as { accept?: string[]; reject?: string[] };
    const result = await decideJoin(teamId, (req as any).userId, accept, reject);
    return res.status(200).json({ status: 200, message: '처리 완료', data: result });
};
