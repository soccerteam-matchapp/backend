import { Request, Response } from "express";
import { createPoll, votePoll, getPollResults } from "../services/attendancePoll.service";
import { ValidationError } from "../utils/errors";

// 투표 생성
export const createAttendancePoll = async (req: Request, res: Response) => {
    const { teamId, matchId, question, expiresAt } = req.body;
    if (!teamId || !matchId || !question) {
        throw new ValidationError("teamId, matchId, question은 필수입니다.");
    }

    const poll = await createPoll(
        teamId,
        (req as any).userId,
        matchId,
        question,
        expiresAt
    );

    res.status(201).json({ status: 201, message: "투표 생성 성공", data: poll });
};

// 투표하기
export const voteAttendancePoll = async (req: Request, res: Response) => {
    const { pollId, choice } = req.body;
    if (!pollId || !choice) throw new ValidationError("pollId와 choice는 필수입니다.");

    const poll = await votePoll(pollId, (req as any).userId, choice);
    res.status(200).json({ status: 200, message: "투표 성공", data: poll });
};

// 투표 결과 조회
export const getAttendancePollResults = async (req: Request, res: Response) => {
    const { pollId } = req.params;
    const poll = await getPollResults(pollId);
    res.status(200).json({ status: 200, message: "투표 결과 조회 성공", data: poll });
};
