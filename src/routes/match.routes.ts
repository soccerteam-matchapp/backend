import { Router } from "express";
import { asyncHandler, requireAuth, requireLeader } from "../middlewares/auth";
import { create, list, apply, participants, acceptTeam, confirmed } from "../controllers/match.controller";

const router = Router();

router.use(requireAuth);

// 매칭 요청 생성 (팀장만 가능)
router.post("/", requireLeader, asyncHandler(create));

router.get("/list", asyncHandler(list));

// 매칭 신청 (팀장만 가능)
router.post("/apply", requireLeader, asyncHandler(apply));

// 참가팀 조회 (매칭 호스트 팀장만 가능 - 서비스 레벨에서 추가 검증)
router.get("/:matchId/participants", requireLeader, asyncHandler(participants));

// 팀 매칭 수락 (매칭 호스트 팀장만 가능 - 서비스 레벨에서 추가 검증)
router.post("/acceptteam", requireLeader, asyncHandler(acceptTeam));

router.get("/confirmed", asyncHandler(confirmed));

export default router;
