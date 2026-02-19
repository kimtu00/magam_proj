/**
 * @file badge.service.ts
 * @description 사용자 배지 관리 서비스
 * 
 * 주요 기능:
 * 1. getUserBadges: 사용자가 보유한 배지 목록 조회
 * 
 * 핵심 로직:
 * - user_badge 테이블에서 사용자별 배지 조회
 * - 획득 일시 기준 정렬 (최신순)
 * 
 * @dependencies
 * - @/lib/supabase/server: Supabase 클라이언트
 * - ./badge.types: UserBadge 타입
 */

import { createClient } from "@/lib/supabase/server";
import type { UserBadge } from "./badge.types";

export class BadgeService {
  /**
   * 사용자가 보유한 배지 목록 조회
   * 
   * @param clerkId - Clerk User ID
   * @returns UserBadge[] (최신순 정렬)
   */
  static async getUserBadges(clerkId: string): Promise<UserBadge[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_badge")
      .select("*")
      .eq("user_id", clerkId)
      .order("earned_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * 특정 배지 보유 여부 확인
   * 
   * @param clerkId - Clerk User ID
   * @param badgeType - 배지 타입
   * @returns 보유 여부
   */
  static async hasBadge(
    clerkId: string,
    badgeType: UserBadge["badge_type"]
  ): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_badge")
      .select("id")
      .eq("user_id", clerkId)
      .eq("badge_type", badgeType)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return !!data;
  }
}
