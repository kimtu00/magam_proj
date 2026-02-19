# Supabase + Next.js 설정 가이드

이 문서는 Supabase 공식 문서를 기반으로 Next.js 프로젝트에 Supabase를 연결하는 방법을 설명합니다.

## 목차

1. [Supabase 프로젝트 생성](#supabase-프로젝트-생성)
2. [환경 변수 설정](#환경-변수-설정)
3. [Supabase 클라이언트 사용](#supabase-클라이언트-사용)
4. [예제: instruments 페이지](#예제-instruments-페이지)
5. [Clerk 통합](#clerk-통합)

## Supabase 프로젝트 생성

### 1. Supabase 프로젝트 생성

1. [database.new](https://database.new)에 접속하여 새 Supabase 프로젝트를 생성합니다.
2. 또는 [Supabase Dashboard](https://supabase.com/dashboard)에서 **"New Project"** 클릭

### 2. 샘플 데이터 생성

Supabase Dashboard의 **SQL Editor**에서 다음 SQL을 실행하여 `instruments` 테이블을 생성합니다:

```sql
-- 테이블 생성
CREATE TABLE instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- 샘플 데이터 삽입
INSERT INTO instruments (name)
VALUES
  ('violin'),
  ('viola'),
  ('cello');

-- RLS 활성화
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "public can read instruments"
ON public.instruments
FOR SELECT
TO anon
USING (true);
```

또는 프로젝트의 마이그레이션 파일을 사용할 수 있습니다:

```bash
# Supabase CLI를 사용하여 마이그레이션 적용
supabase db push
```

마이그레이션 파일: `supabase/migrations/20250101000001_create_instruments_example.sql`

## 환경 변수 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Supabase Dashboard에서 값 확인

1. Supabase Dashboard → 프로젝트 선택
2. **Settings** → **API** 이동
3. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)

> **참고**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용하며, 클라이언트에 노출하면 안 됩니다.

## Supabase 클라이언트 사용

### Server Component에서 사용

Supabase 공식 문서 패턴을 따릅니다:

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    throw error;
  }

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function loadData() {
      const { data, error } = await supabase
        .from('table')
        .select('*');

      if (!error) {
        setData(data || []);
      }
    }

    loadData();
  }, [isLoaded, user, supabase]);

  return <div>{/* render data */}</div>;
}
```

### Server Action에서 사용

```ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function addItem(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('items')
    .insert({ name });

  if (error) {
    throw new Error('Failed to add item');
  }

  return data;
}
```

## 예제: instruments 페이지

프로젝트에 `app/instruments/page.tsx` 파일이 포함되어 있습니다. 이 페이지는 Supabase 공식 문서의 예시를 기반으로 작성되었습니다.

### 실행 방법

1. 개발 서버 시작:
```bash
pnpm dev
```

2. 브라우저에서 `http://localhost:3000/instruments` 접속

3. instruments 목록이 표시됩니다:
   - violin
   - viola
   - cello

### 코드 구조

```tsx
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <pre>{JSON.stringify(instruments, null, 2)}</pre>
  );
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
```

## Clerk 통합

이 프로젝트는 Clerk와 Supabase의 네이티브 통합을 사용합니다.

### 통합 설정

1. **Clerk Dashboard에서 Supabase 통합 활성화**
   - Clerk Dashboard → **Setup** → **Integrations** → **Supabase**
   - **"Activate Supabase integration"** 클릭
   - **Clerk domain** 복사

2. **Supabase에서 Clerk 인증 제공자 추가**
   - Supabase Dashboard → **Authentication** → **Providers**
   - **"Third-Party Auth"** → **"Add provider"** → **"Clerk"** 선택
   - Clerk domain 입력

### Clerk 통합의 장점

- ✅ JWT 템플릿 불필요 (2025년 4월부터 deprecated)
- ✅ Clerk 세션 토큰을 Supabase가 직접 검증
- ✅ 간단한 설정
- ✅ 보안 강화

자세한 내용은 [Clerk + Supabase 통합 가이드](./clerk-supabase-integration.md)를 참고하세요.

## 프로젝트 구조

```
lib/supabase/
├── server.ts          # Server Component/Action용 (Supabase 공식 패턴)
├── clerk-client.ts    # Client Component용 (Clerk 통합)
├── client.ts          # 공개 데이터용 (인증 불필요)
└── service-role.ts    # 관리자 권한용 (RLS 우회)
```

### 사용 가이드

- **Server Component**: `createClient()` from `@/lib/supabase/server`
- **Client Component**: `useClerkSupabaseClient()` from `@/lib/supabase/clerk-client`
- **Server Action**: `createClient()` from `@/lib/supabase/server`
- **관리자 작업**: `getServiceRoleClient()` from `@/lib/supabase/service-role`

## 참고 자료

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/initializing)
- [Clerk + Supabase 통합 가이드](./clerk-supabase-integration.md)

## 문제 해결

### "Missing Supabase environment variables" 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 포함)
- 개발 서버를 재시작

### "Unauthorized" 오류

- Supabase에서 Clerk 통합이 올바르게 설정되었는지 확인
- Clerk 세션이 유효한지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 데이터가 표시되지 않음

- Supabase Dashboard에서 테이블에 데이터가 있는지 확인
- RLS 정책이 데이터 접근을 허용하는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

