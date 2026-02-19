/**
 * @file config.ts
 * @description 앱 설정값 관리 Server Actions
 * 
 * 주요 액션:
 * 1. getAppConfig: 설정값 조회
 * 2. getAppConfigNumber: 설정값을 숫자로 조회
 * 
 * @dependencies
 * - @/services/config: AppConfigService
 */

"use server";

import { AppConfigService } from "@/services/config";
import type { AppConfigKey } from "@/services/config";

/**
 * 앱 설정값 조회
 * 
 * @param key - 설정 키
 * @returns 성공 시 { success: true, value: string | null }
 *          실패 시 { success: false, error: string }
 */
export async function getAppConfig(
  key: AppConfigKey
): Promise<
  { success: true; value: string | null } | { success: false; error: string }
> {
  try {
    const value = await AppConfigService.get(key);
    return { success: true, value };
  } catch (error) {
    console.error("[getAppConfig] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "설정값 조회에 실패했습니다.",
    };
  }
}

/**
 * 앱 설정값을 숫자로 조회
 * 
 * @param key - 설정 키
 * @param defaultValue - 기본값
 * @returns 성공 시 { success: true, value: number }
 *          실패 시 { success: false, error: string }
 */
export async function getAppConfigNumber(
  key: AppConfigKey,
  defaultValue: number
): Promise<{ success: true; value: number } | { success: false; error: string }> {
  try {
    const value = await AppConfigService.getNumber(key, defaultValue);
    return { success: true, value };
  } catch (error) {
    console.error("[getAppConfigNumber] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "설정값 조회에 실패했습니다.",
    };
  }
}
