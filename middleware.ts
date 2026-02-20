import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeRole, hasMinRoleLevel, UserRole } from "@/types/roles";

/**
 * RBAC (Role-Based Access Control) 미들웨어
 *
 * 역할 기반 경로 보호를 구현합니다 (계층 구조 지원):
 * - `/admin/*`: admin 이상 (admin, super_admin)
 * - `/store-admin/*`: producer 이상 (producer, admin, super_admin)
 * - `/mypage/*`: consumer 이상 (모든 역할)
 * - 레거시 라우트 유지: `/buyer/*`, `/seller/*`
 * - 위반 시 `/onboarding` 또는 `/`으로 리다이렉트
 *
 * @see https://clerk.com/docs/references/nextjs/clerk-middleware
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 보호할 경로 패턴
  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
  const isStoreAdminRoute = createRouteMatcher(["/store-admin(.*)"]);
  const isMypageRoute = createRouteMatcher(["/mypage(.*)"]);
  // 레거시 라우트 (하위 호환)
  const isSellerRoute = createRouteMatcher(["/seller(.*)"]);
  const isBuyerRoute = createRouteMatcher(["/buyer(.*)"]);

  /**
   * 역할 기반 접근 제어 헬퍼 함수
   */
  async function checkRoleAccess(
    minRole: UserRole,
    routeName: string
  ): Promise<NextResponse | undefined> {
    if (!userId) {
      console.log(`🚫 ${routeName} 접근 - 로그인 필요 -> /onboarding으로 리다이렉트`);
      const onboardingUrl = new URL("/onboarding?needLogin=true", req.url);
      return NextResponse.redirect(onboardingUrl);
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const rawRole = user.publicMetadata?.role as string | undefined;
      const role = normalizeRole(rawRole);

      console.log(`🔐 Middleware (${routeName}) - userId:`, userId, "rawRole:", rawRole, "normalizedRole:", role);

      if (!role) {
        console.log(`🚫 ${routeName} - 역할 없음, /onboarding으로 리다이렉트`);
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
      }

      // 역할 계층 확인
      if (!hasMinRoleLevel(role, minRole)) {
        console.log(
          `🚫 ${routeName} - 권한 부족 (필요: ${minRole}, 현재: ${role}), /onboarding으로 리다이렉트`
        );
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
      }

      console.log(`✅ ${routeName} 접근 허용 - role:`, role);
      return undefined; // 접근 허용
    } catch (error) {
      console.error(`❌ ${routeName} middleware error:`, error);
      const onboardingUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // `/admin/*` 경로 접근 시 관리자 권한 확인
  if (isAdminRoute(req)) {
    if (!userId) {
      console.log("🚫 Admin 접근 - 로그인 필요 -> /로 리다이렉트");
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const rawRole = user.publicMetadata?.role as string | undefined;
      const role = normalizeRole(rawRole);

      // 1. 역할 기반 체크 (우선순위)
      if (role === "admin" || role === "super_admin") {
        console.log("✅ Admin 접근 허용 - role:", role);
        return undefined;
      }

      // 2. 이메일 기반 체크 (하위 호환)
      const adminEmails = process.env.ADMIN_EMAILS;
      if (!adminEmails) {
        console.warn("⚠️ ADMIN_EMAILS 환경변수가 설정되지 않았습니다.");
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }

      const userEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress;

      if (!userEmail) {
        console.log("🚫 Admin 접근 - 이메일 없음 -> /로 리다이렉트");
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }

      const adminEmailList = adminEmails
        .split(",")
        .map((email) => email.trim().toLowerCase());
      const isUserAdmin = adminEmailList.includes(userEmail.toLowerCase());

      if (!isUserAdmin) {
        console.log(
          "🚫 Admin 접근 거부 - userId:",
          userId,
          "email:",
          userEmail,
          "role:",
          role,
          "-> /로 리다이렉트"
        );
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }

      console.log("✅ Admin 접근 허용 - email:", userEmail, "(legacy)");
      return NextResponse.next(); // 명시적으로 요청 허용
    } catch (error) {
      console.error("❌ Admin middleware error:", error);
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // `/store-admin/*` 경로: producer 이상 필요
  if (isStoreAdminRoute(req)) {
    const response = await checkRoleAccess("producer", "STORE_ADMIN");
    if (response) return response;
  }

  // `/mypage/*` 경로: consumer 이상 필요 (모든 역할 접근 가능)
  if (isMypageRoute(req)) {
    const response = await checkRoleAccess("consumer", "MYPAGE");
    if (response) return response;
  }

  // 레거시 `/seller/*` 경로: producer 권한으로 매핑
  if (isSellerRoute(req)) {
    const response = await checkRoleAccess("producer", "SELLER (legacy)");
    if (response) return response;
  }

  // 레거시 `/buyer/*` 경로: consumer 권한으로 매핑
  if (isBuyerRoute(req)) {
    const response = await checkRoleAccess("consumer", "BUYER (legacy)");
    if (response) return response;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
