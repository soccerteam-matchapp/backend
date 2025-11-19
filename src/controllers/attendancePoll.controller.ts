import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { createPoll, votePoll, getPollResults } from "../services/attendancePoll.service";
import { ValidationError } from "../utils/errors";
import { CreateAttendancePollDto, VoteAttendancePollDto } from "../dto/attendancePoll.dto";

// 투표 생성
export const createAttendancePoll = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError("인증이 필요합니다.");
    const { teamId, question, expiresAt } = req.body as CreateAttendancePollDto;
    const poll = await createPoll(teamId, req.userId, question, expiresAt ? new Date(expiresAt) : undefined);
    res.status(201).json({ status: 201, message: "투표 생성 성공", data: poll });
};

// 투표하기
export const voteAttendancePoll = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) throw new ValidationError("인증이 필요합니다.");
    const { pollId, choice } = req.body as VoteAttendancePollDto;
    const poll = await votePoll(pollId, req.userId, choice);
    res.status(200).json({ status: 200, message: "투표 성공", data: poll });
};

// 투표 결과 조회
export const getAttendancePollResults = async (req: AuthenticatedRequest, res: Response) => {
    const { pollId } = req.params;
    const poll = await getPollResults(pollId);
    res.status(200).json({ status: 200, message: "투표 결과 조회 성공", data: poll });
};
