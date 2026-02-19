"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * 홈 페이지
 * 
 * 로그인하지 않은 사용자를 역할 선택 페이지(/onboarding)로 리다이렉트합니다.
 * 로그인한 사용자는 역할에 따라 적절한 페이지로 이동합니다.
 */
export default function Home() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const role = user?.publicMetadata?.role as string | undefined;

  useEffect(() => {
    if (!isLoaded) return;

    // localStorage의 pendingRole 확인 (최우선)
    const pendingRole = typeof window !== "undefined" 
      ? localStorage.getItem("pendingRole") 
      : null;

    console.log("🏠 Home 페이지 - 리다이렉트 체크:", {
      isLoaded,
      hasUser: !!user,
      role,
      pendingRole,
    });

    // pendingRole이 있으면 온보딩으로 이동
    if (pendingRole) {
      console.log("⏸️ pendingRole 감지 → /onboarding으로 이동");
      router.push("/onboarding");
      return;
    }

    // 로그인한 사용자는 역할에 따라 리다이렉트
    if (user) {
      if (role === "producer" || role === "SELLER") {
        console.log("✅ SELLER/producer 역할 → /store-admin으로 이동");
        router.push("/store-admin");
      } else if (role === "consumer" || role === "BUYER") {
        console.log("✅ BUYER/consumer 역할 → /buyer로 이동");
        router.push("/buyer");
      } else if (role === "admin" || role === "super_admin") {
        console.log("✅ admin 역할 → /admin으로 이동");
        router.push("/admin");
      } else {
        console.log("⚠️ 역할 없음 → /onboarding으로 이동");
        router.push("/onboarding");
      }
    } else {
      // 로그인하지 않은 사용자는 온보딩으로
      console.log("🔓 로그인 안 됨 → /onboarding으로 이동");
      router.push("/onboarding");
    }
  }, [isLoaded, user, role, router]);

  // 로딩 중 표시
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
