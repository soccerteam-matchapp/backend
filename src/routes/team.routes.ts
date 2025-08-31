import { Router } from 'express';
import { asyncHandler, requireAuth } from '../middlewares/auth';
import { create, findByInvite, joinByInvite, getPending, decide } from '../controllers/team.controller';

const router = Router();

// 모든 경로 인증 필요
router.use(requireAuth);

// 팀 만들기 (리더=요청자)
router.post('/', asyncHandler(create));

// 초대코드로 팀 조회(가입 전 정보)
router.get('/invite/:code', asyncHandler(findByInvite));

// 초대코드로 가입 요청
router.post('/join', asyncHandler(joinByInvite));

// 팀장만: 대기중 요청 조회/일괄 결정
router.get('/:teamId/requests', asyncHandler(getPending));
router.post('/:teamId/requests/decide', asyncHandler(decide));

export default router;
