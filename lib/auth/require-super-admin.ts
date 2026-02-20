/**
 * @file lib/auth/require-super-admin.ts
 * @description Super Admin 전용 접근 제어
 *
 * 이 모듈은 Super Admin 권한이 필요한 기능에 대한 접근을 제어합니다.
 *
 * 주요 기능:
 * - isSuperAdmin: Super Admin 권한 확인
 * - requireSuperAdmin: Super Admin 권한 강제 (에러 throw)
 *
 * 사용 예시:
 * ```typescript
 * // Server Action에서
 * export async function getSensitiveData() {
 *   await requireSuperAdmin();
 *   // ... super admin 전용 로직
 * }
 *
 * // Client Component에서
 * const isSuperAdmin = await isSuperAdmin();
 * if (isSuperAdmin) {
 *   // ... super admin 전용 UI
 * }
 * ```
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "./role";

/**
 * 현재 사용자가 Super Admin인지 확인합니다.
 *
 * @returns Super Admin이면 true, 아니면 false
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return false;
    }

    // 역할 기반 체크
    const role = await getUserRole();
    if (role === "super_admin") {
      console.log(
        "✅ Super Admin check - userId:",
        userId,
        "role:",
        role,
        "isSuperAdmin: true"
      );
      return true;
    }

    console.log(
      "❌ Super Admin check - userId:",
      userId,
      "role:",
      role,
      "isSuperAdmin: false"
    );
    return false;
  } catch (error) {
    console.error("❌ Super Admin check error:", error);
    return false;
  }
}

/**
 * Server Actions/API에서 Super Admin 권한을 강제합니다.
 * Super Admin이 아니면 에러를 throw합니다.
 *
 * @throws {Error} Super Admin이 아닌 경우
 */
export async function requireSuperAdmin(): Promise<void> {
  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    throw new Error("Unauthorized: Super Admin access required");
  }
}

/**
 * Super Admin 전용 UI 표시 여부를 반환합니다.
 * Client Component에서 사용하기 위한 헬퍼 함수입니다.
 *
 * @returns Super Admin이면 true, 아니면 false
 */
export async function canAccessSuperAdminFeatures(): Promise<boolean> {
  return await isSuperAdmin();
}
