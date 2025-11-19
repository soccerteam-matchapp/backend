import { IsString, IsNotEmpty, IsArray, IsOptional, ArrayMinSize, MinLength, IsEnum } from 'class-validator';

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

/** 가입 요청 결정 DTO (단일 처리) */
export class DecideJoinRequestDto {
    @IsString({ message: 'userId는 문자열이어야 합니다.' })
    @IsNotEmpty({ message: 'userId가 필요합니다.' })
    userId!: string;

    @IsEnum(['accept', 'reject'], {
        message: 'action은 accept 또는 reject여야 합니다.',
    })
    @IsNotEmpty({ message: 'action이 필요합니다.' })
    action!: 'accept' | 'reject';
}

