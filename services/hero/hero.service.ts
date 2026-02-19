/**
 * @file hero.service.ts
 * @description 마감 히어로 시스템 서비스 레이어
 * 
 * 주요 기능:
 * 1. getHeroStatus: 현재 사용자의 히어로 등급 및 진행도 조회
 * 2. getUpgradeHistory: 등급 상승 이력 조회
 * 
 * 핵심 로직:
 * - 등급 판정 및 업데이트는 DB 트리거에서 자동 처리
 * - 서비스는 읽기 전용 (조회만 수행)
 * - 다음 등급까지 진행도 계산 (픽업 횟수, 무게)
 * 
 * @dependencies
 * - @/lib/supabase/server: 인증된 사용자의 Supabase 클라이언트
 * - ./hero.types: 히어로 시스템 타입 정의
 */

import { createClient } from "@/lib/supabase/server";
import type {
  HeroGradeConfig,
  UserHero,
  HeroUpgradeLog,
  HeroStatus,
  NextGradeInfo,
} from "./hero.types";

export class HeroService {
  /**
   * 현재 사용자의 히어로 상태 조회
   * 
   * @param clerkId - Clerk User ID
   * @returns HeroStatus (현재 등급, 진행도, 다음 등급 정보)
   */
  static async getHeroStatus(clerkId: string): Promise<HeroStatus> {
    const supabase = await createClient();

    // 1. 사용자 히어로 상태 조회
    const { data: userHero, error: userHeroError } = await supabase
      .from("user_hero")
      .select("*")
      .eq("user_id", clerkId)
      .single();

    if (userHeroError) {
      // 아직 픽업 이력이 없는 경우 (초기 상태)
      if (userHeroError.code === "PGRST116") {
        const { data: firstGrade } = await supabase
          .from("hero_grade_config")
          .select("*")
          .eq("is_active", true)
          .order("grade_level", { ascending: true })
          .limit(1)
          .single();

        return {
          grade_level: 0,
          grade_name: "준비 중",
          grade_emoji: "⏳",
          tree_image_url: null,
          total_pickup_count: 0,
          total_saved_weight_kg: 0,
          benefits: [],
          upgraded_at: null,
          next_grade: firstGrade
            ? {
                name: firstGrade.grade_name,
                emoji: firstGrade.grade_emoji,
                level: firstGrade.grade_level,
                required_pickups: firstGrade.required_pickups,
                required_weight_kg: firstGrade.required_weight_kg,
                remaining_pickups: firstGrade.required_pickups,
                remaining_weight_kg: firstGrade.required_weight_kg,
                progress_pickups_percent: 0,
                progress_weight_percent: 0,
              }
            : null,
        };
      }
      throw userHeroError;
    }

    // 2. 현재 등급 설정 조회
    const { data: currentGradeConfig, error: gradeConfigError } =
      await supabase
        .from("hero_grade_config")
        .select("*")
        .eq("grade_level", userHero.grade_level)
        .eq("is_active", true)
        .single();

    if (gradeConfigError && gradeConfigError.code !== "PGRST116") {
      throw gradeConfigError;
    }

    // 3. 다음 등급 정보 조회
    const { data: nextGradeConfig } = await supabase
      .from("hero_grade_config")
      .select("*")
      .eq("is_active", true)
      .gt("grade_level", userHero.grade_level)
      .order("grade_level", { ascending: true })
      .limit(1)
      .single();

    // 4. 다음 등급 진행도 계산
    let nextGrade: NextGradeInfo | null = null;
    if (nextGradeConfig) {
      const currentWeightKg = userHero.total_saved_weight_g / 1000;
      const remainingPickups = Math.max(
        0,
        nextGradeConfig.required_pickups - userHero.total_pickup_count
      );
      const remainingWeightKg = Math.max(
        0,
        nextGradeConfig.required_weight_kg - currentWeightKg
      );

      const progressPickups =
        nextGradeConfig.required_pickups > 0
          ? (userHero.total_pickup_count / nextGradeConfig.required_pickups) *
            100
          : 100;
      const progressWeight =
        nextGradeConfig.required_weight_kg > 0
          ? (currentWeightKg / nextGradeConfig.required_weight_kg) * 100
          : 100;

      nextGrade = {
        name: nextGradeConfig.grade_name,
        emoji: nextGradeConfig.grade_emoji,
        level: nextGradeConfig.grade_level,
        required_pickups: nextGradeConfig.required_pickups,
        required_weight_kg: nextGradeConfig.required_weight_kg,
        remaining_pickups: remainingPickups,
        remaining_weight_kg: Math.round(remainingWeightKg * 10) / 10,
        progress_pickups_percent: Math.min(100, Math.round(progressPickups)),
        progress_weight_percent: Math.min(100, Math.round(progressWeight)),
      };
    }

    // 5. 종합 상태 반환
    return {
      grade_level: userHero.grade_level,
      grade_name: currentGradeConfig?.grade_name || "준비 중",
      grade_emoji: currentGradeConfig?.grade_emoji || "⏳",
      tree_image_url: currentGradeConfig?.tree_image_url || null,
      total_pickup_count: userHero.total_pickup_count,
      total_saved_weight_kg:
        Math.round((userHero.total_saved_weight_g / 1000) * 10) / 10,
      benefits: currentGradeConfig?.benefits_json || [],
      upgraded_at: userHero.upgraded_at,
      next_grade: nextGrade,
    };
  }

  /**
   * 사용자의 등급 상승 이력 조회
   * 
   * @param clerkId - Clerk User ID
   * @returns HeroUpgradeLog[] (최신순 정렬)
   */
  static async getUpgradeHistory(
    clerkId: string
  ): Promise<HeroUpgradeLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("hero_upgrade_log")
      .select("*")
      .eq("user_id", clerkId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
