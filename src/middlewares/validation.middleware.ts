import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationError as AppValidationError } from '../utils/errors';

/**
 * DTO 검증 미들웨어
 * @param dtoClass - 검증할 DTO 클래스
 * @param skipMissingProperties - 선택적 속성 누락 시 검증 스킵 여부 (기본: false)
 */
export function validateDto<T extends object>(
    dtoClass: new () => T,
    skipMissingProperties = false
) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        // req.body를 DTO 인스턴스로 변환 (타입 자동 변환 활성화)
        const dto = plainToInstance(dtoClass, req.body, {
            enableImplicitConversion: true, // 문자열 -> 숫자 등 자동 변환
        });

        // 검증 수행
        const errors: ValidationError[] = await validate(dto, {
            skipMissingProperties,
            whitelist: true, // DTO에 정의되지 않은 속성 제거
            forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 에러
            transform: true, // 타입 자동 변환 (문자열 -> 숫자 등)
        });

        if (errors.length > 0) {
            // 검증 에러를 읽기 쉬운 형식으로 변환
            const errorMessages = errors.map((error) => {
                if (error.constraints) {
                    return Object.values(error.constraints).join(', ');
                }
                return `${error.property} 검증 실패`;
            });

            return next(new AppValidationError(errorMessages.join('; ')));
        }

        // 검증된 DTO를 req.body에 할당
        req.body = dto;
        next();
    };
}

