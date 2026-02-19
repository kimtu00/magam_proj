/**
 * @file badge.ts
 * @description 사용자 배지 관리 Server Actions
 * 
 * 주요 액션:
 * 1. getUserBadges: 현재 사용자의 보유 배지 목록 조회
 * 
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 (auth)
 * - @/services/badge: BadgeService
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { BadgeService } from "@/services/badge";
import type { UserBadge } from "@/services/badge";

/**
 * 현재 사용자의 보유 배지 목록 조회
 * 
 * @returns 성공 시 { success: true, data: UserBadge[] }
 *          실패 시 { success: false, error: string }
 */
export async function getUserBadges(): Promise<
  | { success: true; data: UserBadge[] }
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

    const badges = await BadgeService.getUserBadges(userId);

    return {
      success: true,
      data: badges,
    };
  } catch (error) {
    console.error("[getUserBadges] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "배지 목록 조회에 실패했습니다.",
    };
  }
}
