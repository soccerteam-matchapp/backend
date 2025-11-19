import { Router } from 'express';
import { asyncHandler, requireAuth, requireLeader } from '../middlewares/auth';
import { createTeam, getTeamByInviteCode, joinTeamByInviteCode, getPendingRequests, decideJoinRequests } from '../controllers/team.controller';
import { rateTeam, getRatingSummary, getRatingList } from '../controllers/rating.controller';


const router = Router();

// 모든 경로 인증 필요
router.use(requireAuth);

// 팀 만들기 (리더=요청자)
router.post('/', asyncHandler(createTeam));

// 초대코드로 팀 조회(가입 전 정보)
router.get('/invite/:code', asyncHandler(getTeamByInviteCode));

// 초대코드로 가입 요청
router.post('/join', asyncHandler(joinTeamByInviteCode));

// 팀장만: 대기중 요청 조회/일괄 결정
router.get('/:teamId/requests', requireLeader, asyncHandler(getPendingRequests));
router.post('/:teamId/requests/decide', requireLeader, asyncHandler(decideJoinRequests));

// 팀 평점 API
router.post('/:teamId/ratings', asyncHandler(rateTeam));            // 생성/수정(upsert)
router.get('/:teamId/ratings/summary', asyncHandler(getRatingSummary));
router.get('/:teamId/ratings', asyncHandler(getRatingList));

export default router;
