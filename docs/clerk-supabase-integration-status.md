# Clerk + Supabase 네이티브 통합 상태 확인

이 문서는 프로젝트의 Clerk와 Supabase 네이티브 통합 상태를 확인하고 문서화합니다.

## 통합 상태

### ✅ 완료된 항목

1. **Supabase 클라이언트 설정**
   - `lib/supabase/server.ts`: Server Component/Action용 클라이언트
   - `lib/supabase/clerk-client.ts`: Client Component용 클라이언트
   - `lib/supabase/service-role.ts`: 관리자 권한용 클라이언트
   - 모든 클라이언트가 Clerk 세션 토큰을 올바르게 사용

2. **ClerkProvider 설정**
   - `app/layout.tsx`에서 ClerkProvider로 전체 앱 감싸기
   - 한국어 로컬라이제이션 적용

3. **사용자 동기화**
   - `app/api/sync-user/route.ts`: Clerk 사용자를 Supabase `profiles` 테이블에 동기화
   - `hooks/use-sync-user.ts`: 자동 동기화 훅
   - `components/providers/sync-user-provider.tsx`: 전역 동기화 프로바이더

4. **데이터베이스 스키마**
   - `supabase/migrations/20260106141956_create_lastchance_schema.sql`: 메인 스키마 마이그레이션
   - `profiles`, `stores`, `products`, `orders` 테이블 생성
   - `reserve_product` 함수 구현

## 통합 아키텍처

```
┌─────────────┐
│   Client    │
│  Component  │
└──────┬──────┘
       │ useSession().getToken()
       ▼
┌─────────────┐
│   Clerk     │
│   Session   │
└──────┬──────┘
       │ Session Token
       ▼
┌─────────────┐      ┌──────────────┐
│  Supabase   │◄─────│   Clerk      │
│   Client    │      │  Integration │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
│  (profiles) │
└─────────────┘
```

## 설정 확인 체크리스트

### Clerk Dashboard 설정

- [ ] Clerk 프로젝트 생성 완료
- [ ] Supabase 통합 활성화
  - Clerk Dashboard → **Setup** → **Integrations** → **Supabase**
  - **"Activate Supabase integration"** 클릭
  - Clerk domain 복사

### Supabase Dashboard 설정

- [ ] Supabase 프로젝트 생성 완료
- [ ] Clerk를 Third-Party Auth Provider로 추가
  - Supabase Dashboard → **Authentication** → **Providers**
  - **"Third-Party Auth"** → **"Add provider"** → **"Clerk"**
  - Clerk domain 입력

### 환경 변수 설정

- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정
- [ ] `CLERK_SECRET_KEY` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정

### 데이터베이스 마이그레이션

- [ ] 마이그레이션 파일 실행
  - `supabase/migrations/20260106141956_create_lastchance_schema.sql`
- [ ] 테이블 생성 확인
  - `profiles`, `stores`, `products`, `orders`
- [ ] ENUM 타입 생성 확인
  - `user_role`, `product_status`, `order_status`
- [ ] `reserve_product` 함수 생성 확인

## 테스트 방법

### 1. 로그인 테스트

1. 개발 서버 시작:
```bash
pnpm dev
```

2. 브라우저에서 로그인 페이지 접속
3. Clerk 로그인 페이지가 한국어로 표시되는지 확인
4. 로그인 성공 후 홈으로 리다이렉트되는지 확인

### 2. 사용자 동기화 테스트

1. 로그인 후 브라우저 개발자 도구 콘솔 확인
2. 에러 메시지가 없는지 확인
3. Supabase Dashboard → **Table Editor** → **profiles** 테이블 확인
4. 새로 생성된 사용자 레코드 확인

### 3. Supabase 클라이언트 테스트

**Server Component 테스트**:
```tsx
import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*");
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

**Client Component 테스트**:
```tsx
'use client';

import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function TestPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const { data, error } = await supabase.from("profiles").select("*");
      if (!error) setData(data);
    }

    loadData();
  }, [user, supabase]);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

## 문제 해결

### "Unauthorized" 오류

**원인**: Clerk와 Supabase 통합이 올바르게 설정되지 않음

**해결 방법**:
1. Clerk Dashboard에서 Supabase 통합이 활성화되어 있는지 확인
2. Supabase Dashboard에서 Clerk가 third-party auth provider로 설정되어 있는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. 개발 서버 재시작

### "Table does not exist" 오류

**원인**: 마이그레이션이 적용되지 않음

**해결 방법**:
1. Supabase Dashboard → **SQL Editor**에서 마이그레이션 파일 실행
2. 또는 Supabase CLI를 사용하여 `supabase db push` 실행

### "Missing environment variables" 오류

**원인**: 환경 변수가 설정되지 않음

**해결 방법**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 모든 필수 환경 변수가 설정되었는지 확인
3. 개발 서버 재시작

## 참고 자료

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 가이드](https://supabase.com/docs/guides/auth/third-party/clerk)
- [프로젝트 통합 가이드](./clerk-supabase-integration.md)
- [환경 변수 설정 가이드](./environment-setup.md)

