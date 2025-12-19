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
export async function findTeamByInviteCode(inviteCode: string): Promise<ITeam> {
    const team = await Team.findOne({ inviteCode }).exec();
    if (!team) throw new NotFoundError('해당 초대코드의 팀을 찾을 수 없습니다.');
    return team;
}

/** 초대코드로 가입 요청 추가 */
export async function requestTeamJoin(inviteCode: string, userId: string): Promise<ITeam> {
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
export async function findPendingRequests(teamId: string, leaderId: string) {
    const team = await Team.findById(teamId).populate('pending', '_id name id').exec();
    if (!team) throw new NotFoundError('팀을 찾을 수 없습니다.');
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError('팀장만 확인할 수 있습니다.');
    }
    return team.pending;
}

/** 리더만: 단일 가입 요청 수락/거절 */
export async function processJoinRequest(teamId: string, leaderId: string, userId: string, action: 'accept' | 'reject') {
    const team = await Team.findById(teamId).exec();
    if (!team) throw new NotFoundError('팀을 찾을 수 없습니다.');
    if (!team.leader.equals(new Types.ObjectId(leaderId))) {
        throw new ForbiddenError('팀장만 처리할 수 있습니다.');
    }

    const userIdObj = new Types.ObjectId(userId);

    // pending에 존재하는지 확인
    const isPending = team.pending.some((u) => u.equals(userIdObj));
    if (!isPending) {
        throw new NotFoundError('해당 사용자의 가입 요청을 찾을 수 없습니다.');
    }

    // action에 따라 처리
    if (action === 'accept') {
        // 멤버에 추가 (중복 방지)
        const isMember = team.members.some((m) => m.equals(userIdObj));
        if (!isMember) {
            team.members.push(userIdObj);
        }

        // pending에서 제거
        team.pending = team.pending.filter((u) => !u.equals(userIdObj));

        // 유저 문서 업데이트(소속팀 추가)
        await User.findByIdAndUpdate(
            userIdObj,
            { $addToSet: { belonging: team._id } }
        ).exec();
    } else {
        // pending에서 제거 (거절)
        team.pending = team.pending.filter((u) => !u.equals(userIdObj));
    }

    await team.save();

    return {
        teamId: String(team._id),
        userId,
        action,
        memberNum: team.members.length,
        canMatch: team.members.length >= 9,
        remainingPending: team.pending.length,
    };
}
