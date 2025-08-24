// src/utils/errors.ts
export class AppError extends Error {
    statusCode: number;
    status: 'fail' | 'error';
    isOperational: boolean;
    error?: string;

    // 친구 코드 형태 유지: (message, statusCode)
    constructor(message: string, statusCode: number, error?: string) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.error = error;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = '요청 형식이 올바르지 않습니다.') { super(message, 400, 'validation_error'); }
}
export class AuthError extends AppError {
    constructor(message = 'Unauthorized') { super(message, 401, 'unauthorized'); }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') { super(message, 403, 'forbidden'); }
}
export class NotFoundError extends AppError {
    constructor(message = 'Not Found') { super(message, 404, 'not_found'); }
}
export class ConflictError extends AppError {
    constructor(message = 'Conflict') { super(message, 409, 'conflict'); }
}
