import { Types } from 'mongoose';
import { Team } from '../models/team.model';
import { TeamRating } from '../models/teamRating.model';
import { ValidationError } from '../utils/errors';

const toObjectId = (id: string) => {
    if (!Types.ObjectId.isValid(id)) throw new ValidationError('잘못된 ObjectId');
    return new Types.ObjectId(id);
};

/** 팀 평점 upsert (신규면 count+1, 수정이면 delta 반영) */
export async function upsertTeamRating(teamId: string, raterId: string, score: number, comment?: string) {
    if (typeof score !== 'number' || score < 0 || score > 5) {
        throw new ValidationError('score는 0~5 사이여야 합니다.');
    }

    const _teamId = toObjectId(teamId);
    const _raterId = toObjectId(raterId);

    const team = await Team.findById(_teamId);
    if (!team) throw new ValidationError('존재하지 않는 팀입니다.');

    //본인 소속팀 평점 금지
    if (team.members?.some((m) => String(m) === String(_raterId))) {
        throw new ValidationError('자기 팀은 평가할 수 없습니다.');
    }

    const existing = await TeamRating.findOne({ team: _teamId, rater: _raterId });

    if (!existing) {
        await TeamRating.create({ team: _teamId, rater: _raterId, score, comment });
        team.ratingSum += score;
        team.ratingCount += 1;
        await team.save();
    } else {
        const delta = score - existing.score;
        existing.score = score;
        if (typeof comment === 'string') existing.comment = comment;
        await existing.save();

        if (delta !== 0) {
            team.ratingSum += delta;
            await team.save();
        }
    }

    const ratingAvg = team.ratingCount ? Number((team.ratingSum / team.ratingCount).toFixed(2)) : 0;
    return { ratingAvg, ratingCount: team.ratingCount };
}

/** 팀 평점 요약 */
export async function getTeamRatingSummary(teamId: string) {
    const team = await Team.findById(teamId).select('ratingSum ratingCount').lean();
    if (!team) throw new ValidationError('존재하지 않는 팀입니다.');
    const ratingAvg = team.ratingCount ? Number((team.ratingSum / team.ratingCount).toFixed(2)) : 0;
    return { ratingAvg, ratingCount: team.ratingCount };
}

/** 팀 평점 리스트 (간단 커서 페이지네이션) */
export async function listTeamRatings(teamId: string, limit = 10, cursor?: string) {
    const _teamId = toObjectId(teamId);
    const q: any = { team: _teamId };
    const pageSize = Math.min(Number(limit) || 10, 50);

    if (cursor && Types.ObjectId.isValid(cursor)) q._id = { $lt: new Types.ObjectId(cursor) };

    const rows = await TeamRating.find(q)
        .sort({ _id: -1 })
        .limit(pageSize + 1)
        .select('score comment rater createdAt');

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? String(data[data.length - 1]._id) : null;

    return { data, nextCursor };
}
