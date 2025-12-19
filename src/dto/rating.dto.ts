import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

/** 팀 평점 생성/수정 DTO */
export class RateTeamDto {
    @IsNumber({}, { message: 'score는 숫자여야 합니다.' })
    @IsNotEmpty({ message: 'score가 필요합니다.' })
    @Min(1, { message: 'score는 1 이상이어야 합니다.' })
    @Max(5, { message: 'score는 5 이하여야 합니다.' })
    score!: number;

    @IsString({ message: 'comment는 문자열이어야 합니다.' })
    @IsOptional()
    comment?: string;
}

