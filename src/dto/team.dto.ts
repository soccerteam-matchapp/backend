import { IsString, IsNotEmpty, IsArray, IsOptional, ArrayMinSize, MinLength } from 'class-validator';

/** 팀 생성 요청 DTO */
export class CreateTeamDto {
    @IsString({ message: 'teamName은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'teamName이 필요합니다.' })
    @MinLength(1, { message: 'teamName은 최소 1자 이상이어야 합니다.' })
    teamName!: string;
}

/** 초대코드로 팀 가입 요청 DTO */
export class JoinTeamByInviteCodeDto {
    @IsString({ message: 'inviteCode는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'inviteCode가 필요합니다.' })
    inviteCode!: string;
}

/** 가입 요청 결정 DTO */
export class DecideJoinRequestsDto {
    @IsArray({ message: 'accept는 배열이어야 합니다.' })
    @IsOptional()
    @IsString({ each: true, message: 'accept 배열의 각 요소는 문자열이어야 합니다.' })
    accept?: string[];

    @IsArray({ message: 'reject는 배열이어야 합니다.' })
    @IsOptional()
    @IsString({ each: true, message: 'reject 배열의 각 요소는 문자열이어야 합니다.' })
    reject?: string[];
}

