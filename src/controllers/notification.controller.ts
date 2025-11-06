import { Request, Response } from 'express';
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
export const getNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;

    const notifications = await getUserNotifications(userId, limit, read);

    return res.status(200).json({
        status: 200,
        message: '알림 목록 조회 성공',
        data: notifications,
    });
};

/**
 * 읽지 않은 알림 개수 조회
 */
export const getUnreadNotificationCount = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
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
export const markNotificationAsRead = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
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
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const count = await markAllAsRead(userId);

    return res.status(200).json({
        status: 200,
        message: '모든 알림 읽음 처리 완료',
        data: { count },
    });
};

