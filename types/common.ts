/**
 * @file types/common.ts
 * @description 공통 타입 정의 (3개 도메인 타입 파일에서 공유)
 *
 * 이 파일은 store-admin, admin, consumer 타입 파일에서 공통으로 사용하는
 * 유틸리티 타입들을 중앙화합니다.
 */

// --------------------------------------------------------
// Receipt Status (영수증 심사 상태)
// --------------------------------------------------------

/**
 * 영수증 심사 상태 - DB CHECK: ('pending', 'approved', 'rejected')
 */
export type ReceiptStatus = "pending" | "approved" | "rejected";

// --------------------------------------------------------
// API Response Types
// --------------------------------------------------------

/**
 * 공통 API 성공 응답
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * 공통 API 에러 응답
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

/**
 * API 응답 타입 (유니온)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// --------------------------------------------------------
// Pagination Types
// --------------------------------------------------------

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 페이지네이션 응답 (admin 기준 구조)
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// --------------------------------------------------------
// Helper Types
// --------------------------------------------------------

/**
 * 날짜 범위
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// --------------------------------------------------------
// Type Guards
// --------------------------------------------------------

/**
 * API 응답이 성공인지 확인
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * API 응답이 에러인지 확인
 */
export function isApiError(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}
