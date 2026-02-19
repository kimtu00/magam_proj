# Supabase + Next.js 통합 작업

**작업 일시**: 2025-01-01  
**작업 내용**: Supabase 공식 문서 패턴에 맞게 Next.js 프로젝트에 Supabase 연결

## 작업 개요

Supabase 공식 문서([Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs))를 기반으로 Next.js 프로젝트에 Supabase를 연결했습니다. Supabase 공식 템플릿의 패턴을 따르면서도 기존 Clerk 통합을 유지했습니다.

## 주요 변경 사항

### 1. Supabase Server 클라이언트 개선

**파일**: `lib/supabase/server.ts`

- Supabase 공식 문서 패턴에 맞게 `createClient()` 함수 추가 (async)
- 기존 `createClerkSupabaseClient()` 함수는 하위 호환성을 위해 유지
- Supabase 공식 문서 예시와 호환되는 API 제공

**변경 사항**:
```typescript
// Supabase 공식 문서 패턴
export async function createClient() {
  // ...
}

// 기존 함수 (하위 호환성)
export function createClerkSupabaseClient() {
  // ...
}
```

**사용 예시** (Supabase 공식 문서 패턴):
```tsx
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('table').select();
  // ...
}
```

### 2. 예제 마이그레이션 추가

**파일**: `supabase/migrations/20250101000001_create_instruments_example.sql`

Supabase 공식 문서의 `instruments` 테이블 예시를 기반으로 한 마이그레이션을 추가했습니다:

- 테이블 생성 (id, name)
- 샘플 데이터 삽입 (violin, viola, cello)
- RLS 활성화
- 공개 읽기 정책 (anon, authenticated)

### 3. 예제 페이지 생성

**파일**: `app/instruments/page.tsx`

Supabase 공식 문서의 예시를 기반으로 한 완전한 예제 페이지를 생성했습니다:

- Server Component 사용
- Suspense를 사용한 로딩 상태 처리
- 에러 처리
- Tailwind CSS 스타일링

### 4. 환경 변수 예시 파일 생성

**파일**: `.env.example`

프로젝트 설정을 위한 환경 변수 예시 파일을 생성했습니다:

- Clerk 환경 변수
- Supabase 환경 변수 (URL, Anon Key, Service Role Key)
- 주석 및 설명 포함

### 5. 문서 작성

**파일**: `docs/supabase-nextjs-setup.md`

완전한 설정 가이드를 작성했습니다:

- Supabase 프로젝트 생성 가이드
- 환경 변수 설정
- 클라이언트 사용법 (Server/Client Component, Server Action)
- 예제 페이지 설명
- Clerk 통합 정보
- 문제 해결 가이드

## Supabase 공식 문서 패턴 준수

### 주요 특징

1. **`createClient()` 함수**: Supabase 공식 문서의 패턴을 따름
2. **Async 함수**: Next.js 15의 async Server Component와 호환
3. **Clerk 통합 유지**: 기존 Clerk 통합을 유지하면서 Supabase 공식 패턴 지원
4. **하위 호환성**: 기존 코드와의 호환성 유지

### 사용 방법

**Supabase 공식 문서 패턴**:
```tsx
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

**기존 Clerk 통합 패턴** (여전히 지원):
```tsx
import { createClerkSupabaseClient } from "@/lib/supabase/server";

const supabase = createClerkSupabaseClient();
```

## 테스트 방법

1. **환경 변수 설정**:
   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 Supabase 값 입력
   ```

2. **마이그레이션 적용**:
   ```bash
   # Supabase CLI 사용
   supabase db push
   
   # 또는 Supabase Dashboard의 SQL Editor에서
   # supabase/migrations/20250101000001_create_instruments_example.sql 실행
   ```

3. **개발 서버 시작**:
   ```bash
   pnpm dev
   ```

4. **예제 페이지 확인**:
   - 브라우저에서 `http://localhost:3000/instruments` 접속
   - instruments 목록이 표시되는지 확인

## 관련 파일

- `lib/supabase/server.ts` - Supabase Server 클라이언트 (개선됨)
- `app/instruments/page.tsx` - 예제 페이지 (새로 생성)
- `supabase/migrations/20250101000001_create_instruments_example.sql` - 예제 마이그레이션 (새로 생성)
- `.env.example` - 환경 변수 예시 (새로 생성)
- `docs/supabase-nextjs-setup.md` - 설정 가이드 (새로 생성)

## 참고 자료

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/initializing)
- [Clerk + Supabase 통합 가이드](./clerk-supabase-integration.md)

## 다음 단계

1. **환경 변수 설정**: `.env.local` 파일에 실제 Supabase 값 입력
2. **마이그레이션 적용**: Supabase Dashboard에서 마이그레이션 실행
3. **테스트**: `/instruments` 페이지에서 데이터 확인
4. **커스터마이징**: 프로젝트에 맞게 테이블 및 정책 수정

