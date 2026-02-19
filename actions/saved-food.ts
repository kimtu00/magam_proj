/**
 * @file actions/saved-food.ts
 * @description 구한 음식(Saved Food) 관련 Server Actions
 * 
 * 주요 기능:
 * - 현재 로그인한 사용자의 오늘/전체 누적 무게 조회
 * 
 * @dependencies
 * - @clerk/nextjs/server: 인증된 사용자 정보
 * - @/services/saved-food: SavedFoodService
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { SavedFoodService, type SavedFoodSummary, type GlobalStats } from "@/services/saved-food";

/**
 * 현재 로그인한 사용자의 구한 음식 요약 조회
 * 
 * @returns 오늘/전체 누적 무게 (g)
 * 
 * @example
 * ```tsx
 * const summary = await getSavedFood();
 * console.log(`오늘: ${summary.today_saved_g}g`);
 * ```
 */
export async function getSavedFood(): Promise<SavedFoodSummary> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      // 로그인하지 않은 경우 0 반환
      return {
        today_saved_g: 0,
        total_saved_g: 0,
        today_co2_saved_g: 0,
        total_co2_saved_g: 0,
        last_saved_at: null,
      };
    }

    // 2. Service 호출
    const summary = await SavedFoodService.getSummary(userId);

    return summary;
  } catch (error) {
    console.error("[getSavedFood] 오류:", error);
    
      // 에러 발생 시 기본값 반환
      return {
        today_saved_g: 0,
        total_saved_g: 0,
        today_co2_saved_g: 0,
        total_co2_saved_g: 0,
        last_saved_at: null,
      };
  }
}

/**
 * 특정 기간의 구한 음식 조회
 * 
 * @param startDate - 시작 날짜 (ISO string)
 * @param endDate - 종료 날짜 (ISO string)
 * @returns 총 무게 (g)
 */
export async function getSavedFoodByDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return 0;
    }

    return await SavedFoodService.getByDateRange(userId, startDate, endDate);
  } catch (error) {
    console.error("[getSavedFoodByDateRange] 오류:", error);
    return 0;
  }
}

/**
 * 전체 서비스 통계 조회 (모든 사용자 합산)
 * 
 * 인증 불필요 - 공개 통계
 * 
 * @returns 전체 누적 음식/CO2, 참여 멤버 수
 * 
 * @example
 * ```tsx
 * const stats = await getGlobalStats();
 * console.log(`전체 누적 CO2 절감: ${stats.total_co2_saved_g}g`);
 * console.log(`참여 멤버: ${stats.total_members}명`);
 * ```
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    return await SavedFoodService.getGlobalStats();
  } catch (error) {
    console.error("[getGlobalStats] 오류:", error);
    
    // 에러 발생 시 기본값 반환
    return {
      total_saved_g: 0,
      total_co2_saved_g: 0,
      total_members: 0,
    };
  }
}
