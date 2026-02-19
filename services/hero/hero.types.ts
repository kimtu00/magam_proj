/**
 * @file hero.types.ts
 * @description 마감 히어로 시스템 타입 정의
 * 
 * 주요 타입:
 * - HeroGradeConfig: 등급 설정 (DB hero_grade_config 테이블)
 * - UserHero: 사용자 히어로 상태 (DB user_hero 테이블)
 * - HeroUpgradeLog: 승급 이력 (DB hero_upgrade_log 테이블)
 * - HeroStatus: 프론트엔드에 반환되는 종합 상태
 * - NextGradeInfo: 다음 등급 정보 및 진행도
 */

/**
 * 히어로 등급 설정 (DB: hero_grade_config)
 */
export interface HeroGradeConfig {
  id: number;
  grade_level: number;
  grade_name: string;
  grade_emoji: string;
  required_pickups: number;
  required_weight_kg: number;
  condition_type: "OR" | "AND";
  benefits_json: string[];
  tree_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 사용자 히어로 상태 (DB: user_hero)
 */
export interface UserHero {
  id: string;
  user_id: string;
  grade_level: number;
  total_pickup_count: number;
  total_saved_weight_g: number;
  upgraded_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 히어로 등급 상승 이력 (DB: hero_upgrade_log)
 */
export interface HeroUpgradeLog {
  id: string;
  user_id: string;
  from_level: number;
  to_level: number;
  trigger_type: "pickup_count" | "weight" | "both" | "manual";
  trigger_value: string | null;
  created_at: string;
}

/**
 * 다음 등급 정보 및 진행도
 */
export interface NextGradeInfo {
  name: string;
  emoji: string;
  level: number;
  required_pickups: number;
  required_weight_kg: number;
  remaining_pickups: number;
  remaining_weight_kg: number;
  progress_pickups_percent: number;
  progress_weight_percent: number;
}

/**
 * 프론트엔드에 반환되는 종합 히어로 상태
 */
export interface HeroStatus {
  grade_level: number;
  grade_name: string;
  grade_emoji: string;
  tree_image_url: string | null;
  total_pickup_count: number;
  total_saved_weight_kg: number;
  benefits: string[];
  upgraded_at: string | null;
  next_grade: NextGradeInfo | null;
}
