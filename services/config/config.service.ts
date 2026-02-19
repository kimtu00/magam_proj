/**
 * @file config.service.ts
 * @description 앱 설정값 관리 서비스
 * 
 * 주요 기능:
 * 1. get: 설정값 조회 (캐싱 고려)
 * 2. set: 설정값 변경 (향후 admin용)
 * 
 * 핵심 로직:
 * - app_config 테이블에서 설정값 조회
 * - 숫자 값은 parseInt/parseFloat 처리
 * 
 * @dependencies
 * - @/lib/supabase/server: Supabase 클라이언트
 * - ./config.types: AppConfig 타입
 */

import { createClient } from "@/lib/supabase/server";
import type { AppConfig, AppConfigKey } from "./config.types";

export class AppConfigService {
  /**
   * 설정값 조회
   * 
   * @param key - 설정 키 (예: "EARLY_ACCESS_MINUTES")
   * @returns 설정값 문자열 (없으면 null)
   */
  static async get(key: AppConfigKey): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 설정값이 없는 경우
        return null;
      }
      throw error;
    }

    return data?.value || null;
  }

  /**
   * 설정값을 숫자로 조회
   * 
   * @param key - 설정 키
   * @param defaultValue - 기본값 (설정값이 없거나 파싱 실패 시)
   * @returns 숫자 값
   */
  static async getNumber(
    key: AppConfigKey,
    defaultValue: number
  ): Promise<number> {
    const value = await this.get(key);
    if (!value) return defaultValue;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 설정값 변경 (향후 admin 패널용)
   * 
   * @param key - 설정 키
   * @param value - 새 설정값
   */
  static async set(key: AppConfigKey, value: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("app_config")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      throw error;
    }
  }

  /**
   * 모든 설정값 조회 (향후 admin 패널용)
   */
  static async getAll(): Promise<AppConfig[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("app_config")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
