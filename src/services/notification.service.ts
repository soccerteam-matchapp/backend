import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/notification.model';
import { Team } from '../models/team.model';
import { User } from '../models/user.model';
import { Match } from '../models/match.model';

/**
 * 알림 생성
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedTeam?: string,
    relatedMatch?: string,
    relatedUser?: string
) {
    const notification = await Notification.create({
        user: new Types.ObjectId(userId),
        type,
        title,
        message,
        relatedTeam: relatedTeam ? new Types.ObjectId(relatedTeam) : undefined,
        relatedMatch: relatedMatch ? new Types.ObjectId(relatedMatch) : undefined,
        relatedUser: relatedUser ? new Types.ObjectId(relatedUser) : undefined,
    });

    return notification;
}

/**
 * 팀 가입 요청 알림 생성 (팀장에게)
 */
export async function createTeamJoinNotification(teamId: string, requesterUserId: string) {
    const team = await Team.findById(teamId).populate('leader', 'name').exec();
    if (!team) throw new Error('팀을 찾을 수 없습니다.');

    const requester = await User.findById(requesterUserId).exec();
    if (!requester) throw new Error('사용자를 찾을 수 없습니다.');

    const title = '팀 가입 요청';
    const message = `${requester.name}님이 ${team.teamName} 팀에 가입을 요청했습니다.`;

    return await createNotification(
        String(team.leader._id),
        'team_join_request',
        title,
        message,
        teamId,
        undefined,
        requesterUserId
    );
}

/**
 * 매칭 신청 알림 생성 (호스트 팀장에게)
 */
export async function createMatchApplyNotification(matchId: string, guestTeamId: string) {
    const match = await Match.findById(matchId).populate('team', 'teamName leader').exec();
    if (!match) throw new Error('매칭을 찾을 수 없습니다.');

    const guestTeam = await Team.findById(guestTeamId).exec();
    if (!guestTeam) throw new Error('팀을 찾을 수 없습니다.');

    const title = '매칭 신청';
    const message = `${guestTeam.teamName} 팀이 매칭을 신청했습니다.`;

    return await createNotification(
        String(match.leader),
        'match_apply',
        title,
        message,
        guestTeamId,
        matchId
    );
}

/**
 * 매칭 수락 알림 생성 (게스트 팀장에게)
 */
export async function createMatchAcceptedNotification(matchId: string, guestTeamId: string) {
    const match = await Match.findById(matchId).populate('team', 'teamName leader').exec();
    if (!match) throw new Error('매칭을 찾을 수 없습니다.');

    const guestTeam = await Team.findById(guestTeamId).populate('leader', '_id').exec();
    if (!guestTeam) throw new Error('팀을 찾을 수 없습니다.');

    const hostTeam = match.team as any;
    const title = '매칭 수락';
    const message = `${hostTeam.teamName} 팀이 매칭을 수락했습니다.`;

    return await createNotification(
        String(guestTeam.leader._id),
        'match_accepted',
        title,
        message,
        String(hostTeam._id),
        matchId
    );
}

/**
 * 사용자의 알림 목록 조회
 */
export async function getUserNotifications(userId: string, limit: number = 20, read?: boolean) {
    const query: any = { user: new Types.ObjectId(userId) };
    if (read !== undefined) {
        query.read = read;
    }

    const notifications = await Notification.find(query)
        .populate('relatedTeam', 'teamName')
        .populate('relatedMatch', 'date location')
        .populate('relatedUser', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

    return notifications;
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
        user: new Types.ObjectId(userId),
        read: false,
    }).exec();
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOne({
        _id: new Types.ObjectId(notificationId),
        user: new Types.ObjectId(userId),
    }).exec();

    if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
    }

    notification.read = true;
    await notification.save();

    return notification;
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
        { user: new Types.ObjectId(userId), read: false },
        { read: true }
    ).exec();

    return result.modifiedCount;
}

