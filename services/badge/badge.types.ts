/**
 * @file badge.types.ts
 * @description 사용자 배지 타입 정의
 */

/**
 * 사용자 배지 (DB: user_badge)
 */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: "welcome" | "grade_1" | "grade_2" | "grade_3" | "grade_4";
  badge_name: string;
  badge_emoji: string | null;
  badge_image_url: string | null;
  earned_at: string;
}
