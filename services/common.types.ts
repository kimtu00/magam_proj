/**
 * 서비스 레이어 공통 타입 정의
 */

/**
 * 서비스 결과 타입
 * 
 * 성공 시 data를 포함하고, 실패 시 error 메시지를 포함합니다.
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 서비스 결과 타입 (데이터 없는 버전)
 * 
 * 성공/실패 상태만 반환하는 경우 사용합니다.
 */
export type ServiceResultVoid =
  | { success: true }
  | { success: false; error: string };


