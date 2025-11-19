import { Types } from 'mongoose';
import { Team, ITeam } from '../models/team.model';
import { User } from '../models/user.model';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';
import { createTeamJoinNotification } from './notification.service';

// 6자리 초대코드 생성(유니크 보장 시도)
async function generateInviteCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const exists = await Team.exists({ inviteCode: code });
        if (!exists) return code;
    }
    throw new Error('초대코드 생성 실패');
}

/** 팀 생성 (리더=요청자, 멤버 목록에 리더 포함) */
export async function createTeam(leaderId: string, teamName: string): Promise<ITeam> {
    const code = await generateInviteCode();
    const leader = new Types.ObjectId(leaderId);

    const team = await Team.create({
        teamName,
        inviteCode: code,
        leader,
        members: [leader],
        pending: [],
    });

    // 리더 유저 문서 갱신 (리더도 멤버로 취급)
    await User.findByIdAndUpdate(
        leader,
        { $addToSet: { myTeams: team._id, belonging: team._id } },
        { new: true }
    );

    return team;
}

/** 초대코드로 팀 조회(가입 전 미리보기 등) */
export async function getTeamByInvite(inviteCode: string): Promise<ITeam> {
    const team = await Team.findOne({ inviteCode }).exec();
    if (!team) throw new NotFoundError('해당 초대코드의 팀을 찾을 수 없습니다.');
    return team;
}

/** 초대코드로 가입 요청 추가 */
export async function requestJoin(inviteCode: string, userId: string): Promise<ITeam> {
    const team = await Team.findOne({ inviteCode }).exec();
    if (!team) throw new NotFoundError('해당 초대코드의 팀을 찾을 수 없습니다.');

    const uid = new Types.ObjectId(userId);
    const isMember = team.members.some((m) => m.equals(uid));
    if (isMember) throw new ConflictError('이미 팀에 소속되어 있습니다.');
    const isPending = team.pending.some((m) => m.equals(uid));
    if (isPending) throw new ConflictError('이미 가입 요청이 접수되었습니다.');

    team.pending.push(uid);
    await team.save();

    // 팀장에게 알림 생성
    try {
        await createTeamJoinNotification(String(team._id), userId);
    } catch (err) {
        // 알림 생성 실패해도 가입 요청은 성공 처리
        console.warn('알림 생성 실패:', err);
    }

    return team;
}

/** 리더만: 대기중 요청 목록 조회(간단 정보 포함) */
export async function listPending(teamId: string, leaderId: string) {
    const team = await Team.findById(teamId).populate('pending', '_id name id').exec();
    if (!team) throw new NotFoundError('팀을 찾을 수 없습니다.');
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError('팀장만 확인할 수 있습니다.');
    }
    return team.pending;
}

/** 리더만: 일괄 수락/거절 */
export async function decideJoin(teamId: string, leaderId: string, acceptIds: string[], rejectIds: string[]) {
    const team = await Team.findById(teamId).exec();
    if (!team) throw new NotFoundError('팀을 찾을 수 없습니다.');
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError('팀장만 처리할 수 있습니다.');
    }

    const acceptSet = new Set(acceptIds || []);
    const rejectSet = new Set(rejectIds || []);

    // pending에 존재하는 대상만 필터
    const pendings = team.pending.map(String);
    const accepts = pendings.filter((u) => acceptSet.has(u));
    const rejects = pendings.filter((u) => rejectSet.has(u));

    // 팀 업데이트
    if (accepts.length) {
        team.members = Array.from(new Set([...team.members.map(String), ...accepts])).map((id) => new Types.ObjectId(id));
        team.pending = team.pending.filter((u) => !acceptSet.has(String(u)));
    }
    if (rejects.length) {
        team.pending = team.pending.filter((u) => !rejectSet.has(String(u)));
    }
    await team.save();

    // 수락된 유저 문서 업데이트(소속팀 추가)
    if (accepts.length) {
        await User.updateMany(
            { _id: { $in: accepts } },
            { $addToSet: { belonging: team._id } }
        ).exec();
    }

    return {
        teamId: String(team._id),
        memberNum: team.members.length,
        canMatch: team.members.length >= 11,
        accepted: accepts.length,
        rejected: rejects.length,
        remainingPending: team.pending.length,
    };
}
