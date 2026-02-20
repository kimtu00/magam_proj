"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요 (Supabase JWT 템플릿 deprecated)
 * - Clerk 세션 토큰을 Supabase가 직접 검증
 * - useSession().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 * @see https://supabase.com/docs/guides/auth/third-party/clerk
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 * import { useUser } from '@clerk/nextjs';
 * import { useEffect, useState } from 'react';
 *
 * export default function MyComponent() {
 *   const { user } = useUser();
 *   const supabase = useClerkSupabaseClient();
 *   const [data, setData] = useState([]);
 *
 *   useEffect(() => {
 *     if (!user) return;
 *
 *     async function loadData() {
 *       const { data, error } = await supabase.from('table').select('*');
 *       if (!error) setData(data);
 *     }
 *
 *     loadData();
 *   }, [user, supabase]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        return (await session?.getToken()) ?? null;
      },
    });
  }, [session]);

  return supabase;
}
