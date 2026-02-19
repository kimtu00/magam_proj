/**
 * @file types/roles.ts
 * @description 사용자 역할 타입 정의 및 역할 계층 관리
 *
 * 이 파일은 애플리케이션 전반에서 사용되는 역할 타입과 관련 유틸리티를 정의합니다.
 *
 * 주요 기능:
 * 1. 역할 타입 정의 (consumer, producer, admin, super_admin)
 * 2. 역할 계층 구조 (권한 레벨)
 * 3. 레거시 역할 매핑 (BUYER -> consumer, SELLER -> producer)
 *
 * 역할 계층:
 * - consumer (1): 소비자 - /buyer (가게 목록) + /mypage 접근
 * - producer (2): 사장님 - /store-admin + /mypage 접근
 * - admin (3): 플랫폼 관리자 - 전체 접근
 * - super_admin (4): 최고 관리자 - 전체 접근
 *
 * @see {@link lib/auth/role.ts} - 역할 확인 헬퍼 함수
 * @see {@link middleware.ts} - 역할 기반 라우트 보호
 */

/**
 * 사용자 역할 타입
 *
 * - consumer: 소비자 (구매자)
 * - producer: 사장님 (판매자)
 * - admin: 플랫폼 관리자
 * - super_admin: 최고 관리자
 */
export type UserRole = "consumer" | "producer" | "admin" | "super_admin";

/**
 * 역할 계층 구조
 *
 * 숫자가 높을수록 상위 권한을 가집니다.
 * 상위 역할은 하위 역할의 모든 권한을 포함합니다.
 *
 * @example
 * ```typescript
 * // producer는 consumer 권한을 포함
 * ROLE_HIERARCHY["producer"] > ROLE_HIERARCHY["consumer"] // true
 *
 * // admin은 모든 하위 권한을 포함
 * ROLE_HIERARCHY["admin"] > ROLE_HIERARCHY["producer"] // true
 * ```
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  consumer: 1,
  producer: 2,
  admin: 3,
  super_admin: 4,
};

/**
 * 레거시 역할 매핑
 *
 * 기존 BUYER, SELLER 역할을 새 역할 체계로 매핑합니다.
 * 점진적 전환을 위해 애플리케이션 레벨에서 자동 변환을 지원합니다.
 *
 * @example
 * ```typescript
 * const legacyRole = "BUYER";
 * const newRole = LEGACY_ROLE_MAP[legacyRole]; // "consumer"
 * ```
 */
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  BUYER: "consumer",
  SELLER: "producer",
};

/**
 * 역할 계층을 비교하여 최소 권한 레벨을 충족하는지 확인합니다.
 *
 * @param userRole - 확인할 사용자 역할
 * @param minRole - 최소 필요 역할
 * @returns 사용자 역할이 최소 역할 이상이면 true
 *
 * @example
 * ```typescript
 * hasMinRoleLevel("producer", "consumer"); // true (producer >= consumer)
 * hasMinRoleLevel("consumer", "producer"); // false (consumer < producer)
 * hasMinRoleLevel("admin", "consumer"); // true (admin >= consumer)
 * ```
 */
export function hasMinRoleLevel(
  userRole: UserRole,
  minRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * 레거시 역할을 새 역할로 변환합니다.
 *
 * @param role - 변환할 역할 (레거시 또는 새 역할)
 * @returns 새 역할 체계로 변환된 역할, 알 수 없는 역할이면 null
 *
 * @example
 * ```typescript
 * normalizeRole("BUYER"); // "consumer"
 * normalizeRole("consumer"); // "consumer"
 * normalizeRole("SELLER"); // "producer"
 * normalizeRole("admin"); // "admin"
 * normalizeRole("unknown"); // null
 * ```
 */
export function normalizeRole(role: string | undefined): UserRole | null {
  if (!role) return null;

  // 이미 새 역할 체계인지 확인
  if (
    role === "consumer" ||
    role === "producer" ||
    role === "admin" ||
    role === "super_admin"
  ) {
    return role as UserRole;
  }

  // 레거시 역할 매핑
  if (role in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[role];
  }

  // 알 수 없는 역할
  return null;
}

/**
 * 역할 표시명 매핑
 *
 * UI에서 표시할 역할명을 한국어로 제공합니다.
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  consumer: "소비자",
  producer: "사장님",
  admin: "관리자",
  super_admin: "최고 관리자",
};

/**
 * 역할별 기본 리다이렉트 경로
 *
 * 로그인 후 또는 루트 경로 접근 시 역할에 따른 기본 경로입니다.
 */
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  consumer: "/buyer",
  producer: "/store-admin",
  admin: "/admin",
  super_admin: "/admin",
};
