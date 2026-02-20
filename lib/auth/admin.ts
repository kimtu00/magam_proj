import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "./role";

/**
 * Admin 권한 확인 헬퍼 함수
 *
 * 다음 조건 중 하나를 만족하면 관리자로 인정합니다:
 * 1. 사용자 역할이 'admin' 또는 'super_admin'
 * 2. 환경변수 ADMIN_EMAILS에 등록된 이메일 (하위 호환)
 *
 * @example
 * ```typescript
 * // 페이지에서 사용
 * const admin = await isAdmin();
 * if (!admin) redirect('/');
 *
 * // API 라우트에서 사용
 * await requireAdmin(); // 관리자가 아니면 401 에러
 * ```
 */

/**
 * 현재 사용자가 관리자인지 확인합니다.
 *
 * @returns 관리자이면 true, 아니면 false
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    console.log("🔐 isAdmin() - userId:", userId);

    if (!userId) {
      console.log("🔐 isAdmin() - 로그인되지 않음 → false");
      return false;
    }

    // 1. 역할 기반 체크 (우선순위 높음)
    const role = await getUserRole();
    console.log("🔐 isAdmin() - role:", role);

    if (role === "admin" || role === "super_admin") {
      console.log("✅ Admin check - userId:", userId, "role:", role, "isAdmin: true (role-based)");
      return true;
    }

    // 2. 이메일 기반 체크 (하위 호환성)
    const adminEmails = process.env.ADMIN_EMAILS;
    console.log("🔐 isAdmin() - ADMIN_EMAILS 설정 여부:", !!adminEmails);

    if (!adminEmails) {
      console.warn("⚠️ ADMIN_EMAILS 환경변수가 설정되지 않았습니다.");
      return false;
    }

    // Clerk에서 사용자 정보 조회
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // 사용자의 이메일 주소 가져오기
    const userEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    console.log("🔐 isAdmin() - userEmail:", userEmail);

    if (!userEmail) {
      console.log("🔐 isAdmin() - 이메일 없음 → false");
      return false;
    }

    // 관리자 이메일 목록과 비교
    const adminEmailList = adminEmails
      .split(",")
      .map((email) => email.trim().toLowerCase());
    const isUserAdmin = adminEmailList.includes(userEmail.toLowerCase());

    console.log("🔐 isAdmin() - adminEmailList:", adminEmailList, "→ isUserAdmin:", isUserAdmin);

    if (isUserAdmin) {
      console.log(
        "✅ Admin check - userId:",
        userId,
        "email:",
        userEmail,
        "isAdmin: true (email-based)"
      );
    } else {
      console.log(
        "❌ Admin check - userId:",
        userId,
        "email:",
        userEmail,
        "role:",
        role,
        "isAdmin: false"
      );
    }

    return isUserAdmin;
  } catch (error) {
    console.error("❌ Admin check error:", error);
    return false;
  }
}

/**
 * API 라우트에서 관리자 권한을 강제합니다.
 * 관리자가 아니면 에러를 throw합니다.
 *
 * @throws {Error} 관리자가 아닌 경우
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
}
