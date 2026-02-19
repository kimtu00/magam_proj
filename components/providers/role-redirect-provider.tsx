"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { normalizeRole, ROLE_DEFAULT_ROUTES } from "@/types/roles";

/**
 * 역할 리다이렉트 프로바이더
 *
 * 루트 페이지("/")에서만 역할에 따라 리다이렉트합니다.
 * 다른 경로는 Middleware에서 보호합니다.
 *
 * ⚠️ 중요:
 * - Middleware에서 이미 역할 기반 접근 제어를 수행하므로
 * - 여기서는 루트 페이지("/")에서의 홈 화면 리다이렉트만 처리
 * - router.replace() 사용으로 히스토리에 남지 않음
 * - pendingRole이 있으면 역할 변경 중이므로 리다이렉트하지 않음
 * - 새 역할 체계(consumer, producer, admin, super_admin) 지원
 * - 레거시 역할(BUYER, SELLER)도 자동 매핑
 */
export function RoleRedirectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 이미 리다이렉트 했으면 무시
    if (hasRedirected.current) return;

    // 로딩 중이면 무시
    if (!isLoaded) return;

    // ✅ pendingRole 확인 (역할 변경 중인지 체크)
    const pendingRole =
      typeof window !== "undefined"
        ? localStorage.getItem("pendingRole")
        : null;

    if (pendingRole) {
      console.log(
        "🔄 pendingRole 감지 - 역할 변경 중이므로 리다이렉트 건너뜀:",
        pendingRole
      );
      // 온보딩 페이지가 아니면 온보딩으로 이동
      if (pathname !== "/onboarding") {
        console.log("→ /onboarding으로 이동하여 역할 업데이트 진행");
        hasRedirected.current = true;
        router.replace("/onboarding");
      }
      return;
    }

    // 루트 페이지에서만 역할 기반 리다이렉트
    if (pathname === "/" && user) {
      const rawRole = user.publicMetadata?.role as string | undefined;
      const role = normalizeRole(rawRole);

      console.log("🔄 RoleRedirect - rawRole:", rawRole, "normalizedRole:", role);

      if (!role) {
        console.log("→ 역할 없음, /onboarding으로 이동");
        hasRedirected.current = true;
        router.replace("/onboarding");
        return;
      }

      // 역할에 따른 기본 경로로 리다이렉트
      const defaultRoute = ROLE_DEFAULT_ROUTES[role];
      console.log(`→ ${role} 역할, ${defaultRoute}로 이동`);
      hasRedirected.current = true;
      router.replace(defaultRoute);
    }
  }, [isLoaded, user, pathname, router]);

  return <>{children}</>;
}


