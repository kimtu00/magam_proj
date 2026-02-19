/**
 * @file config.types.ts
 * @description 앱 설정값 타입 정의
 */

/**
 * 앱 설정값 (DB: app_config)
 */
export interface AppConfig {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 설정 키 타입 (확장 가능)
 */
export type AppConfigKey = 
  | "EARLY_ACCESS_MINUTES"
  | "PRIORITY_DELAY_MINUTES"; // 향후 사용
