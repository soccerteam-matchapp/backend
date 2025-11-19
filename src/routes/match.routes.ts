import { Router } from "express";
import { asyncHandler, requireAuth, requireLeader } from "../middlewares/auth";
import { validateDto } from "../middlewares/validation.middleware";
import { CreateMatchDto, ApplyToMatchDto, AcceptMatchTeamDto } from "../dto/match.dto";
import { createMatch, getMatches, applyToMatch, getMatchParticipants, acceptMatchTeam, getConfirmedMatches } from "../controllers/match";

const router = Router();

router.use(requireAuth);

// 매칭 요청 생성 (팀장만 가능)
router.post("/", requireLeader, validateDto(CreateMatchDto), asyncHandler(createMatch));

router.get("/list", asyncHandler(getMatches));

// 매칭 신청 (팀장만 가능)
router.post("/apply", requireLeader, validateDto(ApplyToMatchDto), asyncHandler(applyToMatch));

// 참가팀 조회 (매칭 호스트 팀장만 가능 - 서비스 레벨에서 추가 검증)
router.get("/:matchId/participants", requireLeader, asyncHandler(getMatchParticipants));

// 팀 매칭 수락 (매칭 호스트 팀장만 가능 - 서비스 레벨에서 추가 검증)
router.post("/acceptteam", requireLeader, validateDto(AcceptMatchTeamDto), asyncHandler(acceptMatchTeam));

router.get("/confirmed", asyncHandler(getConfirmedMatches));

export default router;
