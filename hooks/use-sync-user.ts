"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { clearAppCache } from "@/lib/auth/clear-cache";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 * 
 * 추가 기능:
 * - 다른 사용자로 로그인 시 이전 사용자 캐시 자동 정리
 * - 역할 불일치 문제 방지
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 로딩 중이거나 로그인하지 않은 경우 무시
    if (!isLoaded || !userId) {
      return;
    }

    // 🔄 다른 사용자로 로그인 감지
    if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
      console.log("🔄 다른 사용자로 로그인 감지 - 캐시 정리");
      console.log("  이전 사용자 ID:", lastUserIdRef.current);
      console.log("  현재 사용자 ID:", userId);
      
      // 이전 사용자의 앱 데이터 정리 (Clerk 인증 토큰은 유지)
      clearAppCache();
      
      // syncedRef 초기화 (새 사용자 동기화 필요)
      syncedRef.current = false;
    }

    // 현재 사용자 ID 저장
    lastUserIdRef.current = userId;

    // 이미 동기화했으면 무시
    if (syncedRef.current) {
      return;
    }

    // 동기화 실행
    const syncUser = async () => {
      try {
        console.log("🔄 사용자 동기화 시작 - userId:", userId);
        
        const response = await fetch("/api/sync-user", {
          method: "POST",
        });

        if (!response.ok) {
          console.error("❌ 사용자 동기화 실패:", await response.text());
          return;
        }

        console.log("✅ 사용자 동기화 완료");
        syncedRef.current = true;
      } catch (error) {
        console.error("❌ 사용자 동기화 중 오류:", error);
      }
    };

    syncUser();
  }, [isLoaded, userId]);
}
