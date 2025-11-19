import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../services/notification.service';
import { ValidationError } from '../utils/errors';

/**
 * 알림 목록 조회
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const userId = req.userId;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;

    const notifications = await getUserNotifications(userId, limit, read);

    // 프론트엔드에서 사용하기 쉬운 형태로 변환
    const formattedNotifications = notifications.map((notif: any) => ({
        id: String(notif._id),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        createdAt: notif.createdAt,
        relatedTeam: notif.relatedTeam ? {
            id: String(notif.relatedTeam._id),
            teamName: notif.relatedTeam.teamName,
        } : null,
        relatedMatch: notif.relatedMatch ? {
            id: String(notif.relatedMatch._id),
            date: notif.relatedMatch.date,
            location: notif.relatedMatch.location,
        } : null,
        relatedUser: notif.relatedUser ? {
            id: String(notif.relatedUser._id),
            name: notif.relatedUser.name,
        } : null,
    }));

    return res.status(200).json({
        status: 200,
        message: '알림 목록 조회 성공',
        data: formattedNotifications,
    });
};

/**
 * 읽지 않은 알림 개수 조회
 */
export const getUnreadNotificationCount = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const userId = req.userId;
    const count = await getUnreadCount(userId);

    return res.status(200).json({
        status: 200,
        message: '읽지 않은 알림 개수 조회 성공',
        data: { count },
    });
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const userId = req.userId;
    const { notificationId } = req.params;

    if (!notificationId) {
        throw new ValidationError('notificationId가 필요합니다.');
    }

    const notification = await markAsRead(notificationId, userId);

    return res.status(200).json({
        status: 200,
        message: '알림 읽음 처리 완료',
        data: notification,
    });
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError('인증이 필요합니다.');
    const userId = req.userId;
    const count = await markAllAsRead(userId);

    return res.status(200).json({
        status: 200,
        message: '모든 알림 읽음 처리 완료',
        data: { count },
    });
};

