import { Router } from 'express';
import { asyncHandler, requireAuth } from '../middlewares/auth';
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../controllers/notification.controller';

const router = Router();

// 모든 경로 인증 필요
router.use(requireAuth);

// 알림 목록 조회
router.get('/', asyncHandler(getNotifications));

// 읽지 않은 알림 개수
router.get('/unread/count', asyncHandler(getUnreadNotificationCount));

// 알림 읽음 처리
router.patch('/:notificationId/read', asyncHandler(markNotificationAsRead));

// 모든 알림 읽음 처리
router.patch('/read/all', asyncHandler(markAllNotificationsAsRead));

export default router;

