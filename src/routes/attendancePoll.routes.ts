import { Router } from "express";
import { createAttendancePoll, voteAttendancePoll, getAttendancePollResults } from "../controllers/attendancePoll.controller";
import { asyncHandler, requireAuth } from '../middlewares/auth';

const router = Router();

router.post("/", asyncHandler(createAttendancePoll));         // 팀장이 투표 생성
router.post("/vote", asyncHandler(voteAttendancePoll));       // 팀원이 투표
router.get("/:pollId", asyncHandler(getAttendancePollResults)); // 결과 조회

export default router;
