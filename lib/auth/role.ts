import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  UserRole,
  normalizeRole,
  hasMinRoleLevel,
  ROLE_HIERARCHY,
} from "@/types/roles";

/**
 * 현재 사용자의 역할을 가져옵니다.
 *
 * 레거시 역할(BUYER, SELLER)도 자동으로 새 역할로 매핑하여 반환합니다.
 *
 * @returns 사용자의 역할 또는 null
 *
 * @example
 * ```typescript
 * const role = await getUserRole();
 * if (role === "consumer") {
 *   // 소비자 전용 로직
 * }
 * ```
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const rawRole = user.publicMetadata?.role as string | undefined;

    // 레거시 역할 포함 정규화
    return normalizeRole(rawRole);
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * 현재 사용자가 최소 역할 레벨을 충족하는지 확인합니다.
 *
 * 역할 계층을 고려하여 상위 역할은 하위 역할의 권한을 포함합니다.
 *
 * @param minRole - 최소 필요 역할
 * @returns 최소 역할 이상이면 true
 *
 * @example
 * ```typescript
 * // producer는 consumer 권한을 포함하므로 true
 * await hasMinRole("consumer"); // producer 사용자도 true
 *
 * // admin은 모든 하위 권한을 포함
 * await hasMinRole("producer"); // admin 사용자도 true
 * ```
 */
export async function hasMinRole(minRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  if (!userRole) return false;
  return hasMinRoleLevel(userRole, minRole);
}

/**
 * 현재 사용자가 특정 역할을 정확히 가지고 있는지 확인합니다.
 *
 * 계층을 고려하지 않고 정확한 역할만 확인합니다.
 *
 * @param targetRole - 확인할 역할
 * @returns 해당 역할이면 true, 아니면 false
 */
export async function hasRole(targetRole: UserRole): Promise<boolean> {
  const role = await getUserRole();
  return role === targetRole;
}

/**
 * 현재 사용자가 consumer 역할인지 확인합니다.
 *
 * @returns consumer 역할이면 true, 아니면 false
 */
export async function isConsumer(): Promise<boolean> {
  const role = await getUserRole();
  return role === "consumer";
}

/**
 * 현재 사용자가 producer 역할인지 확인합니다.
 *
 * @returns producer 역할이면 true, 아니면 false
 */
export async function isProducer(): Promise<boolean> {
  const role = await getUserRole();
  return role === "producer";
}

/**
 * 현재 사용자가 admin 역할인지 확인합니다.
 *
 * @returns admin 역할이면 true, 아니면 false
 */
export async function isAdminRole(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

/**
 * 현재 사용자가 super_admin 역할인지 확인합니다.
 *
 * @returns super_admin 역할이면 true, 아니면 false
 */
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "super_admin";
}

// --------------------------------------------------------
// 레거시 함수 (하위 호환성 유지)
// --------------------------------------------------------

/**
 * @deprecated 대신 isProducer()를 사용하세요.
 * 현재 사용자가 SELLER(producer) 역할인지 확인합니다.
 */
export async function isSeller(): Promise<boolean> {
  return isProducer();
}

/**
 * @deprecated 대신 isConsumer()를 사용하세요.
 * 현재 사용자가 BUYER(consumer) 역할인지 확인합니다.
 */
export async function isBuyer(): Promise<boolean> {
  return isConsumer();
}

