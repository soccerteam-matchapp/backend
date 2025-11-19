import { Router } from "express";
import { createAttendancePoll, voteAttendancePoll, getAttendancePollResults } from "../controllers/attendancePoll.controller";
import { asyncHandler, requireAuth } from '../middlewares/auth';
import { validateDto } from '../middlewares/validation.middleware';
import { CreateAttendancePollDto, VoteAttendancePollDto } from '../dto/attendancePoll.dto';

const router = Router();

router.post("/", validateDto(CreateAttendancePollDto), asyncHandler(createAttendancePoll));         // 팀장이 투표 생성
router.post("/vote", validateDto(VoteAttendancePollDto), asyncHandler(voteAttendancePoll));       // 팀원이 투표
router.get("/:pollId", asyncHandler(getAttendancePollResults)); // 결과 조회

export default router;
