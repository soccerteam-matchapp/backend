import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min, IsDateString } from 'class-validator';

/** 매칭 생성 요청 DTO */
export class CreateMatchDto {
    @IsString({ message: 'teamId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'teamId가 필요합니다.' })
    teamId!: string;

    @IsDateString({}, { message: 'date는 유효한 날짜 형식이어야 합니다.' })
    @IsNotEmpty({ message: 'date가 필요합니다.' })
    date!: string;

    @IsString({ message: 'location은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'location이 필요합니다.' })
    location!: string;

    @IsNumber({}, { message: 'players는 숫자여야 합니다.' })
    @Min(1, { message: 'players는 1 이상이어야 합니다.' })
    players!: number;

    @IsEnum(['beginner', 'intermediate', 'advanced'], {
        message: 'skill은 beginner, intermediate, advanced 중 하나여야 합니다.',
    })
    @IsNotEmpty({ message: 'skill이 필요합니다.' })
    skill!: 'beginner' | 'intermediate' | 'advanced';

    @IsNumber({}, { message: 'fieldCost는 숫자여야 합니다.' })
    @Min(0, { message: 'fieldCost는 0 이상이어야 합니다.' })
    fieldCost!: number;

    @IsNumber({}, { message: 'proCount는 숫자여야 합니다.' })
    @IsOptional()
    @Min(0, { message: 'proCount는 0 이상이어야 합니다.' })
    proCount?: number;
}

/** 매칭 신청 요청 DTO */
export class ApplyToMatchDto {
    @IsString({ message: 'teamId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'teamId가 필요합니다.' })
    teamId!: string;

    @IsString({ message: 'matchId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'matchId가 필요합니다.' })
    matchId!: string;

    @IsNumber({}, { message: 'players는 숫자여야 합니다.' })
    @Min(1, { message: 'players는 1 이상이어야 합니다.' })
    players!: number;
}

/** 매칭 팀 수락 요청 DTO */
export class AcceptMatchTeamDto {
    @IsString({ message: 'matchId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'matchId가 필요합니다.' })
    matchId!: string;

    @IsString({ message: 'teamId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'teamId가 필요합니다.' })
    teamId!: string;
}

