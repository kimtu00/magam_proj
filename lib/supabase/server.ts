import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Supabase 클라이언트 생성 (Server Component/Server Action용)
 *
 * Supabase 공식 문서 패턴을 따르면서 Clerk 통합을 지원합니다.
 * 이 함수는 Supabase 공식 문서의 예시와 호환됩니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 *
 * @example
 * ```tsx
 * // Server Component (Supabase 공식 문서 패턴)
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from('table').select('*');
 *
 *   if (error) {
 *     throw error;
 *   }
 *
 *   return <div>{/* render data *\/}</div>;
 * }
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const { getToken } = await auth();
  const token = await getToken();

  // 디버깅: 토큰 확인
  if (process.env.NODE_ENV === "development") {
    if (!token) {
      console.warn("⚠️ Clerk token is missing. RLS policies may fail.");
      console.warn("⚠️ This will cause PGRST301 errors.");
      console.warn("⚠️ Check if user is logged in and Clerk is properly configured.");
    } else {
      console.log("✅ Clerk token received:", token.substring(0, 20) + "...");
    }
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      // Clerk 세션 토큰을 Supabase에 전달
      // Supabase가 Clerk를 third-party auth provider로 설정되어 있으면 자동 검증됨
      return token;
    },
  });
}

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요 (Supabase JWT 템플릿 deprecated)
 * - Clerk 세션 토큰을 Supabase가 직접 검증
 * - auth().getToken()으로 현재 세션 토큰 사용
 *
 * @deprecated Supabase 공식 문서 패턴에 맞춰 `createClient()`를 사용하세요.
 * 이 함수는 하위 호환성을 위해 유지됩니다.
 *
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 * @see https://supabase.com/docs/guides/auth/third-party/clerk
 */
export function createClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
