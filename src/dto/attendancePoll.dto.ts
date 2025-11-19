import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';

/** 출석 투표 생성 DTO */
export class CreateAttendancePollDto {
    @IsString({ message: 'teamId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'teamId가 필요합니다.' })
    teamId!: string;

    @IsString({ message: 'question은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'question이 필요합니다.' })
    question!: string;

    @IsDateString({}, { message: 'expiresAt는 유효한 날짜 형식이어야 합니다.' })
    @IsOptional()
    expiresAt?: string;
}

/** 출석 투표하기 DTO */
export class VoteAttendancePollDto {
    @IsString({ message: 'pollId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'pollId가 필요합니다.' })
    pollId!: string;

    @IsEnum(['yes', 'no', 'maybe'], {
        message: 'choice는 yes, no, maybe 중 하나여야 합니다.',
    })
    @IsNotEmpty({ message: 'choice가 필요합니다.' })
    choice!: 'yes' | 'no' | 'maybe';
}

