/**
 * @file services/saved-food/saved-food.service.ts
 * @description 구한 음식(Saved Food) 관련 비즈니스 로직
 * 
 * 주요 기능:
 * - 사용자별 오늘/전체 누적 무게 조회
 * - saved_food_log 테이블에서 실시간 집계
 * 
 * @dependencies
 * - @/lib/supabase/server: Supabase 서버 클라이언트
 */

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { SavedFoodSummary, GlobalStats } from "./saved-food.types";

export class SavedFoodService {
  /**
   * 사용자별 구한 음식 요약 조회 (오늘/전체 누적)
   * 
   * @param clerkId - Clerk User ID
   * @returns 오늘 누적, 전체 누적 무게 (g)
   * 
   * @example
   * ```typescript
   * const summary = await SavedFoodService.getSummary('user_2xyz...');
   * console.log(`오늘: ${summary.today_saved_g}g`);
   * console.log(`전체: ${summary.total_saved_g}g`);
   * ```
   */
  static async getSummary(clerkId: string): Promise<SavedFoodSummary> {
    try {
      const supabase = await createClient();

      // saved_food_log에서 사용자별 집계
      const { data, error } = await supabase
        .from("saved_food_log")
        .select("saved_weight_g, co2_saved_g, created_at")
        .eq("user_id", clerkId);

      if (error) {
        console.error("[SavedFoodService] 조회 실패:", error);
        throw new Error("구한 음식 조회에 실패했습니다.");
      }

      // 오늘 날짜 계산 (한국 시간 기준)
      const today = new Date();
      const todayDateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // 클라이언트에서 집계
      let today_saved_g = 0;
      let total_saved_g = 0;
      let today_co2_saved_g = 0;
      let total_co2_saved_g = 0;
      let last_saved_at: string | null = null;

      if (data && data.length > 0) {
        data.forEach((log) => {
          const weight = Number(log.saved_weight_g) || 0;
          const co2 = Number(log.co2_saved_g) || 0;
          
          total_saved_g += weight;
          total_co2_saved_g += co2;

          // 오늘 날짜인지 확인
          const logDateStr = log.created_at.split("T")[0];
          if (logDateStr === todayDateStr) {
            today_saved_g += weight;
            today_co2_saved_g += co2;
          }

          // 최근 기록 시점 업데이트
          if (!last_saved_at || log.created_at > last_saved_at) {
            last_saved_at = log.created_at;
          }
        });
      }

      return {
        today_saved_g: Math.round(today_saved_g * 100) / 100, // 소수점 2자리
        total_saved_g: Math.round(total_saved_g * 100) / 100,
        today_co2_saved_g: Math.round(today_co2_saved_g * 100) / 100,
        total_co2_saved_g: Math.round(total_co2_saved_g * 100) / 100,
        last_saved_at,
      };
    } catch (error) {
      console.error("[SavedFoodService.getSummary] 오류:", error);
      
      // 에러 발생 시 기본값 반환 (0g)
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
   * @param clerkId - Clerk User ID
   * @param startDate - 시작 날짜 (ISO string)
   * @param endDate - 종료 날짜 (ISO string)
   * @returns 총 무게 (g)
   */
  static async getByDateRange(
    clerkId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("saved_food_log")
        .select("saved_weight_g")
        .eq("user_id", clerkId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
        console.error("[SavedFoodService] 기간별 조회 실패:", error);
        throw new Error("기간별 구한 음식 조회에 실패했습니다.");
      }

      // 합계 계산
      const total = data?.reduce((sum, log) => {
        return sum + (Number(log.saved_weight_g) || 0);
      }, 0) || 0;

      return Math.round(total * 100) / 100;
    } catch (error) {
      console.error("[SavedFoodService.getByDateRange] 오류:", error);
      return 0;
    }
  }

  /**
   * 전체 서비스 통계 조회 (모든 사용자 합산)
   * 
   * @returns 전체 누적 음식/CO2, 참여 멤버 수
   * 
   * @example
   * ```typescript
   * const stats = await SavedFoodService.getGlobalStats();
   * console.log(`전체 누적 CO2 절감: ${stats.total_co2_saved_g}g`);
   * console.log(`참여 멤버: ${stats.total_members}명`);
   * ```
   */
  static async getGlobalStats(): Promise<GlobalStats> {
    try {
      // Service Role 클라이언트 사용 (RLS 우회)
      const supabase = getServiceRoleClient();

      // 1. saved_food_log 전체 합산
      const { data: logData, error: logError } = await supabase
        .from("saved_food_log")
        .select("saved_weight_g, co2_saved_g");

      if (logError) {
        console.error("[SavedFoodService] 전체 통계 조회 실패:", logError);
        throw new Error("전체 통계 조회에 실패했습니다.");
      }

      // 2. 음식 및 CO2 합산
      let total_saved_g = 0;
      let total_co2_saved_g = 0;

      if (logData && logData.length > 0) {
        logData.forEach((log) => {
          total_saved_g += Number(log.saved_weight_g) || 0;
          total_co2_saved_g += Number(log.co2_saved_g) || 0;
        });
      }

      // 3. 소비자(admin/super_admin 제외) 사용자 수 조회
      const { count: memberCount, error: memberError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("role", "in", '("admin","super_admin")');

      if (memberError) {
        console.error("[SavedFoodService] 멤버 수 조회 실패:", memberError);
        // 멤버 수만 실패해도 나머지는 반환
      }

      return {
        total_saved_g: Math.round(total_saved_g * 100) / 100,
        total_co2_saved_g: Math.round(total_co2_saved_g * 100) / 100,
        total_members: memberCount || 0,
      };
    } catch (error) {
      console.error("[SavedFoodService.getGlobalStats] 오류:", error);
      
      // 에러 발생 시 기본값 반환
      return {
        total_saved_g: 0,
        total_co2_saved_g: 0,
        total_members: 0,
      };
    }
  }
}
