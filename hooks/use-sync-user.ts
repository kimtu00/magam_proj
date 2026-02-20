"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { clearAppCache } from "@/lib/auth/clear-cache";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase profiles 테이블에 사용자 정보를 저장합니다.
 *
 * 성능 최적화:
 * - localStorage에 userId + 타임스탬프를 저장하여 페이지 재로드 시 중복 sync 방지
 * - 동일 사용자는 SYNC_TTL(5분) 이내 재로드 시 sync 호출 생략
 * - 다른 사용자로 로그인하거나 TTL 만료 시 재동기화
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

/** sync 결과를 localStorage에 캐시하는 키 */
const SYNC_CACHE_KEY = "user_sync_cache";
/** sync 유효 시간: 5분 (역할 변경 시 updateUserRole이 직접 DB를 업데이트하므로 충분) */
const SYNC_TTL = 5 * 60 * 1000;

interface SyncCache {
  userId: string;
  syncedAt: number;
}

function getSyncCache(): SyncCache | null {
  try {
    const raw = localStorage.getItem(SYNC_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SyncCache) : null;
  } catch {
    return null;
  }
}

function setSyncCache(userId: string): void {
  try {
    const cache: SyncCache = { userId, syncedAt: Date.now() };
    localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 접근 불가한 환경은 무시
  }
}

function clearSyncCache(): void {
  try {
    localStorage.removeItem(SYNC_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 로딩 중이거나 로그인하지 않은 경우 무시
    if (!isLoaded || !userId) {
      return;
    }

    // 다른 사용자로 로그인 감지 → 이전 사용자 캐시 정리
    if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
      console.log("🔄 다른 사용자로 로그인 감지 - 캐시 정리");
      clearAppCache();
      clearSyncCache();
    }
    lastUserIdRef.current = userId;

    // localStorage 캐시 확인: 동일 사용자이고 TTL 이내이면 sync 생략
    const cache = getSyncCache();
    if (cache && cache.userId === userId && Date.now() - cache.syncedAt < SYNC_TTL) {
      console.log("⚡ 사용자 동기화 생략 (캐시 유효) - userId:", userId);
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
        setSyncCache(userId);
      } catch (error) {
        console.error("❌ 사용자 동기화 중 오류:", error);
      }
    };

    syncUser();
  }, [isLoaded, userId]);
}
