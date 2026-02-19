/**
 * @file hero.ts
 * @description 마감 히어로 시스템 Server Actions
 * 
 * 주요 액션:
 * 1. getHeroStatus: 현재 사용자의 히어로 등급 및 진행도 조회
 * 2. getHeroUpgradeHistory: 등급 상승 이력 조회
 * 
 * 핵심 로직:
 * - Clerk 인증 확인 후 HeroService 호출
 * - 에러 발생 시 적절한 메시지 반환
 * 
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 (auth)
 * - @/services/hero: 히어로 시스템 서비스
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { HeroService } from "@/services/hero";
import type { HeroStatus, HeroUpgradeLog } from "@/services/hero";

/**
 * 현재 사용자의 히어로 상태 조회
 * 
 * @returns 성공 시 { success: true, data: HeroStatus }
 *          실패 시 { success: false, error: string }
 */
export async function getHeroStatus(): Promise<
  | { success: true; data: HeroStatus }
  | { success: false; error: string }
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    const status = await HeroService.getHeroStatus(userId);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    console.error("[getHeroStatus] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "히어로 상태 조회에 실패했습니다.",
    };
  }
}

/**
 * 사용자의 등급 상승 이력 조회
 * 
 * @returns 성공 시 { success: true, data: HeroUpgradeLog[] }
 *          실패 시 { success: false, error: string }
 */
export async function getHeroUpgradeHistory(): Promise<
  | { success: true; data: HeroUpgradeLog[] }
  | { success: false; error: string }
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    const history = await HeroService.getUpgradeHistory(userId);

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    console.error("[getHeroUpgradeHistory] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "등급 상승 이력 조회에 실패했습니다.",
    };
  }
}
