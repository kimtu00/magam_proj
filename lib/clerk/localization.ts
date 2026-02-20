import { koKR } from "@clerk/localizations";

/**
 * Clerk 한국어 로컬라이제이션 설정
 *
 * 기본 koKR 로컬라이제이션을 확장하여 커스텀 메시지를 추가할 수 있습니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 *
 * @example
 * ```tsx
 * // 커스텀 에러 메시지 추가
 * export const koreanLocalization = {
 *   ...koKR,
 *   unstable__errors: {
 *     ...koKR.unstable__errors,
 *     not_allowed_access: "접근이 허용되지 않은 이메일 도메인입니다. 지원팀에 문의하세요.",
 *   },
 * };
 * ```
 */
export const koreanLocalization = {
  ...koKR,
  // 커스텀 에러 메시지 추가 (필요시)
  // unstable__errors: {
  //   ...koKR.unstable__errors,
  //   // 예시: 접근이 허용되지 않은 이메일 도메인에 대한 커스텀 메시지
  //   // not_allowed_access: "접근이 허용되지 않은 이메일 도메인입니다. 지원팀에 문의하세요.",
  // },
} as typeof koKR;

