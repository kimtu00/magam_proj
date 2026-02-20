"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { Store, GraduationCap, Shield, Loader2 } from "lucide-react";
import { updateUserRole } from "./actions";
import { clearAllCaches } from "@/lib/auth/clear-cache";

/**
 * 온보딩 페이지 내부 컴포넌트
 */
function OnboardingContent() {
  const { isLoaded, user } = useUser();
  const { session, openSignIn } = useClerk();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<"SELLER" | "BUYER" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const isProcessingRef = useRef(false); // 중복 실행 방지

  /**
   * 사장님 역할 설정 (useCallback으로 안정화)
   */
  const handleSetSellerRole = useCallback(async () => {
    console.log("🏪 사장님 역할 설정 시작");
    setIsSubmitting("SELLER");
    setError(null);

    try {
      // 로그인 확인
      if (!user) {
        console.log("❌ 로그인되지 않음 -> 로그인 모달 열기");
        // localStorage에 선택한 역할 저장
        localStorage.setItem("pendingRole", "SELLER");
        console.log("✅ localStorage 저장 완료:", localStorage.getItem("pendingRole"));
        openSignIn({
          redirectUrl: "/onboarding",
        });
        setIsSubmitting(null);
        return;
      }

      console.log("✅ 로그인 확인됨 -> 역할 업데이트 진행");
      console.log("   현재 역할:", user.publicMetadata?.role);

      // 역할 업데이트 (Server Action)
      const result = await updateUserRole("SELLER");

      if (!result.success) {
        const failResult = result as { success: false; error: string; redirectTo: null };
        console.error("❌ 역할 업데이트 실패:", failResult.error);
        setError(failResult.error || "역할 설정에 실패했습니다.");
        setIsSubmitting(null);
        isProcessingRef.current = false; // 실패 시 플래그 초기화
        return;
      }

      console.log("✅ 역할 업데이트 성공 -> Clerk 세션 갱신");

      // pendingRole 정리 (성공 시 반드시 삭제하여 재트리거 방지)
      localStorage.removeItem("pendingRole");

      // Clerk 세션 갱신
      if (session) {
        console.log("🔄 Clerk 세션 갱신 중...");
        await session.reload();
        // Clerk JWT 전파 안정화 대기 (미들웨어가 새 role을 읽을 수 있도록)
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("✅ Clerk 세션 갱신 완료");
      }

      // ✅ 성공 시 플래그 초기화
      isProcessingRef.current = false;

      // 🧹 모든 캐시 정리 (이전 역할 데이터 제거)
      console.log("🧹 캐시 정리 시작...");
      clearAllCaches();

      const successResult = result as { success: true; role: string; redirectTo: string };
      console.log("🚀 하드 리프레시로 리다이렉트:", successResult.redirectTo);

      // ⚠️ 중요: window.location.href 사용으로 완전한 페이지 새로고침
      // 모든 메모리 캐시를 초기화하여 이전 역할 데이터 완전 제거
      window.location.href = successResult.redirectTo;
    } catch (err) {
      console.error("❌ 역할 설정 중 오류:", err);
      setError("역할 설정 중 오류가 발생했습니다.");
      setIsSubmitting(null);
      isProcessingRef.current = false; // 에러 시 플래그 초기화
    }
  }, [user, session, openSignIn, router]);

  /**
   * 소비자 역할 설정 (useCallback으로 안정화)
   */
  const handleSetBuyerRole = useCallback(async () => {
    console.log("🛒 소비자 역할 설정 시작");
    setIsSubmitting("BUYER");
    setError(null);

    try {
      // 로그인 확인
      if (!user) {
        console.log("❌ 로그인되지 않음 -> 로그인 모달 열기");
        // localStorage에 선택한 역할 저장
        localStorage.setItem("pendingRole", "BUYER");
        console.log("✅ localStorage 저장 완료:", localStorage.getItem("pendingRole"));
        openSignIn({
          redirectUrl: "/onboarding",
        });
        setIsSubmitting(null);
        return;
      }

      console.log("✅ 로그인 확인됨 -> 역할 업데이트 진행");
      console.log("   현재 역할:", user.publicMetadata?.role);

      // 역할 업데이트 (Server Action)
      const result = await updateUserRole("BUYER");

      if (!result.success) {
        const failResult = result as { success: false; error: string; redirectTo: null };
        console.error("❌ 역할 업데이트 실패:", failResult.error);
        setError(failResult.error || "역할 설정에 실패했습니다.");
        setIsSubmitting(null);
        isProcessingRef.current = false; // 실패 시 플래그 초기화
        return;
      }

      console.log("✅ 역할 업데이트 성공 -> Clerk 세션 갱신");

      // pendingRole 정리 (성공 시 반드시 삭제하여 재트리거 방지)
      localStorage.removeItem("pendingRole");

      // Clerk 세션 갱신
      if (session) {
        console.log("🔄 Clerk 세션 갱신 중...");
        await session.reload();
        // Clerk JWT 전파 안정화 대기 (미들웨어가 새 role을 읽을 수 있도록)
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("✅ Clerk 세션 갱신 완료");
      }

      // ✅ 성공 시 플래그 초기화
      isProcessingRef.current = false;

      // 🧹 모든 캐시 정리 (이전 역할 데이터 제거)
      console.log("🧹 캐시 정리 시작...");
      clearAllCaches();

      const successResult = result as { success: true; role: string; redirectTo: string };
      console.log("🚀 하드 리프레시로 리다이렉트:", successResult.redirectTo);

      // ⚠️ 중요: window.location.href 사용으로 완전한 페이지 새로고침
      // 모든 메모리 캐시를 초기화하여 이전 역할 데이터 완전 제거
      window.location.href = successResult.redirectTo;
    } catch (err) {
      console.error("❌ 역할 설정 중 오류:", err);
      setError("역할 설정 중 오류가 발생했습니다.");
      setIsSubmitting(null);
      isProcessingRef.current = false; // 에러 시 플래그 초기화
    }
  }, [user, session, openSignIn, router]);

  // 로그인 후 역할 설정 (localStorage 또는 쿼리 파라미터로 확인) - 기존 역할과 관계없이 강제 업데이트
  useEffect(() => {
    // 이미 처리 중이거나 제출 중이면 중복 실행 방지
    if (isProcessingRef.current || isSubmitting) {
      console.log("⚠️ 이미 처리 중이므로 useEffect 건너뜀");
      return;
    }

    const roleParam = searchParams.get("role");
    const pendingRole = typeof window !== "undefined" ? localStorage.getItem("pendingRole") : null;
    
    // 쿼리 파라미터 우선, 없으면 localStorage 확인
    const targetRole = roleParam || pendingRole;

    console.log("🔍 로그인 후 역할 설정 체크:", {
      roleParam,
      pendingRole,
      targetRole,
      isLoaded,
      hasUser: !!user,
      currentRole: user?.publicMetadata?.role,
      isProcessing: isProcessingRef.current,
      isSubmitting,
    });

    if (targetRole && isLoaded && user && !isProcessingRef.current) {
      // 처리 중 플래그 설정
      isProcessingRef.current = true;

      if (targetRole === "SELLER") {
        console.log("🚀 SELLER 역할로 강제 업데이트 시작 (source:", roleParam ? "query" : "localStorage", ")");
        handleSetSellerRole();
      } else if (targetRole === "BUYER") {
        console.log("🚀 BUYER 역할로 강제 업데이트 시작 (source:", roleParam ? "query" : "localStorage", ")");
        handleSetBuyerRole();
      }
    }
  }, [isLoaded, user, searchParams, isSubmitting, router, handleSetSellerRole, handleSetBuyerRole]);

  // 관리자 권한 확인
  useEffect(() => {
    if (user) {
      fetch("/api/auth/check-admin")
        .then((res) => res.json())
        .then((data) => setIsAdminUser(data.isAdmin))
        .catch(() => setIsAdminUser(false));
    } else {
      setIsAdminUser(false);
    }
  }, [user]);

  // 현재 역할 가져오기
  const currentRole = user?.publicMetadata?.role as string | undefined;
  
  // 로그인 필요 메시지 확인
  const needLogin = searchParams.get("needLogin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            오늘마감에 오신 것을 환영합니다
          </h1>
          <p className="text-muted-foreground">
            마감 할인 상품을 구매하거나 판매하세요
          </p>
        </div>

        {/* 로그인 필요 메시지 */}
        {needLogin === "true" && !user && (
          <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
              로그인이 필요합니다
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
              서비스를 이용하려면 역할을 선택하고 로그인해주세요
            </p>
          </div>
        )}

        {/* 현재 역할 표시 */}
        {user && currentRole && (
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              현재 역할: <span className="font-semibold text-foreground">
                {currentRole === "SELLER" ? "🏪 사장님" : "🛒 소비자"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              다른 역할로 변경하려면 아래 버튼을 클릭하세요
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 역할 선택 카드 */}
        <div className="grid gap-4">
          {/* 관리자 카드 (관리자 이메일로 로그인한 경우에만 표시) */}
          {isAdminUser && (
            <button
              onClick={() => router.push("/admin/hero-system")}
              disabled={isSubmitting !== null}
              className="group relative overflow-hidden rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 text-left transition-all hover:border-amber-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-amber-500/20 p-3 group-hover:bg-amber-500/30 transition-colors">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100">
                    관리자
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    히어로 시스템 및 전체 설정 관리
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* 사장님 카드 */}
          <button
            onClick={handleSetSellerRole}
            disabled={isSubmitting !== null}
            className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-lg">사장님</h3>
                <p className="text-sm text-muted-foreground">
                  마감 할인 상품을 등록하고 판매하세요
                </p>
              </div>
              {isSubmitting === "SELLER" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
          </button>

          {/* 소비자 카드 */}
          <button
            onClick={handleSetBuyerRole}
            disabled={isSubmitting !== null}
            className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-lg">소비자</h3>
                <p className="text-sm text-muted-foreground">
                  마감 할인 상품을 저렴하게 구매하세요
                </p>
              </div>
              {isSubmitting === "BUYER" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
          </button>
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-muted-foreground">
          {isAdminUser
            ? "관리자 페이지로 이동하거나 역할을 선택하세요"
            : "역할을 선택하면 로그인 화면으로 이동합니다"}
        </p>
      </div>
    </div>
  );
}

/**
 * 역할 선택 페이지 (Onboarding)
 *
 * 로그인 전 또는 로그인 후 역할이 설정되지 않은 사용자가
 * 역할을 선택하는 페이지입니다.
 * - 사장님(Seller): 로그인 모달 열기 → 로그인 후 SELLER 역할 설정
 * - 소비자(Buyer): 로그인 모달 열기 → 로그인 후 BUYER 역할 설정
 *
 * 중요: 역할 업데이트 후 Clerk 세션을 갱신하고 하드 리프레시를 수행해야
 * 서버 측에서 새 역할을 인식합니다.
 *
 * Mobile-First 디자인을 적용하여 모바일에서 최적화된 UI를 제공합니다.
 */
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
