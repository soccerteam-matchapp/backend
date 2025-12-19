// src/utils/phone.ts
// 전화번호 정규화 유틸리티

/**
 * 다양한 형식의 한국 전화번호를 E.164 형식(+821012345678)으로 정규화
 * 
 * 지원 형식:
 * - 01012345678
 * - 010-1234-5678
 * - +821012345678
 * - 821012345678
 * - +82-10-1234-5678
 * - 82 10 1234 5678
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';

    // 숫자와 + 기호만 남기기 (하이픈, 공백, 괄호 등 제거)
    let cleaned = phone.replace(/[^0-9+]/g, '');

    // 이미 +82로 시작하면 그대로 반환
    if (cleaned.startsWith('+82')) {
        return cleaned;
    }

    // +없이 82로 시작하면 +82 추가
    if (cleaned.startsWith('82')) {
        return '+' + cleaned;
    }

    // 0으로 시작하면 (국내 형식) → +82로 변환
    if (cleaned.startsWith('0')) {
        return '+82' + cleaned.slice(1);
    }

    // 그 외의 경우 (이미 국가코드 없는 번호) → +82 추가
    return '+82' + cleaned;
}

/**
 * 전화번호가 유효한 한국 휴대폰 번호인지 검증
 * (정규화 후 기준)
 */
export function isValidKoreanMobile(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone);
    // +82 + 10/11 + 8자리 = 총 13자리
    // 예: +821012345678 (13자리)
    return /^\+8210\d{8}$/.test(normalized) || /^\+8211\d{8}$/.test(normalized);
}

