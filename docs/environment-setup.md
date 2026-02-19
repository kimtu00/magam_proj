# 환경 변수 설정 가이드

이 문서는 LastChance 프로젝트의 환경 변수를 설정하는 방법을 설명합니다.

## 빠른 시작

1. 프로젝트 루트에 `.env.local` 파일 생성
2. `.env.example` 파일을 참고하여 필요한 환경 변수 입력
3. 아래 가이드를 따라 각 서비스의 API 키를 가져오세요

## Clerk 설정

### 1. Clerk 프로젝트 생성

1. [Clerk Dashboard](https://dashboard.clerk.com/)에 로그인
2. **"Create application"** 클릭
3. 애플리케이션 정보 입력:
   - **Application name**: `LastChance` (또는 원하는 이름)
   - **Sign-in options**: Email, Google 등 원하는 인증 방식 선택
4. **"Create application"** 클릭

### 2. Clerk API 키 가져오기

1. Clerk Dashboard → **API Keys** 메뉴
2. 다음 키들을 복사:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

### 3. Clerk + Supabase 통합 설정

> **중요**: 2025년 4월부터 Clerk의 네이티브 Supabase 통합을 사용합니다. JWT Template은 더 이상 필요하지 않습니다.

1. Clerk Dashboard → **Setup** → **Integrations** → **Supabase**
2. **"Activate Supabase integration"** 클릭
3. 표시된 **Clerk domain** 복사 (예: `your-app-12.clerk.accounts.dev`)
4. Supabase Dashboard로 이동하여 다음 단계 진행

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속하여 로그인
2. **"New Project"** 클릭
3. Organization 선택 (없으면 새로 생성)
4. 프로젝트 정보 입력:
   - **Name**: `LastChance` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서비스용)
   - **Pricing Plan**: Free 또는 Pro 선택
5. **"Create new project"** 클릭하고 프로젝트가 준비될 때까지 대기 (~2분)

### 2. Supabase API 키 가져오기

1. Supabase Dashboard → 프로젝트 선택
2. **Settings** → **API** 이동
3. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)

> **⚠️ 보안 주의사항**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용하며, 클라이언트에 노출하면 안 됩니다. 이 키는 RLS를 우회할 수 있으므로 매우 중요합니다.

### 3. Supabase에서 Clerk 인증 제공자 설정

1. Supabase Dashboard → 프로젝트 선택
2. **Authentication** → **Providers** 이동
3. 페이지 하단으로 스크롤하여 **"Third-Party Auth"** 섹션 찾기
4. **"Add provider"** 클릭
5. **"Clerk"** 선택
6. Clerk Dashboard에서 복사한 **Clerk domain** 입력
7. **"Save"** 클릭

### 4. 데이터베이스 스키마 적용

Supabase Dashboard의 **SQL Editor**에서 마이그레이션 파일을 실행하세요:

1. Supabase Dashboard → **SQL Editor** 이동
2. **New query** 클릭
3. 다음 마이그레이션 파일 내용을 복사하여 실행:
   - `supabase/migrations/20260106141956_create_lastchance_schema.sql`

또는 Supabase CLI를 사용:

```bash
# Supabase CLI 설치 (필요시)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

## 환경 변수 파일 생성

1. 프로젝트 루트에 `.env.local` 파일 생성
2. `.env.example` 파일을 참고하여 다음 형식으로 입력:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키입력
CLERK_SECRET_KEY=sk_test_실제키입력
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://실제프로젝트ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제키입력
SUPABASE_SERVICE_ROLE_KEY=실제키입력
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

## 환경 변수 확인

설정이 올바른지 확인하려면:

1. 개발 서버 시작:
```bash
pnpm dev
```

2. 브라우저 콘솔에서 에러 확인:
   - 환경 변수가 누락되면 에러 메시지가 표시됩니다
   - Clerk 로그인 페이지가 정상적으로 표시되는지 확인
   - Supabase 연결이 정상인지 확인

## 문제 해결

### "Missing Supabase environment variables" 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 포함)
- 개발 서버를 재시작

### "Unauthorized" 오류

- Supabase에서 Clerk 통합이 올바르게 설정되었는지 확인
- Clerk 세션이 유효한지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 데이터베이스 연결 오류

- Supabase 프로젝트가 활성화되어 있는지 확인
- API 키가 올바른지 확인
- 네트워크 연결 확인

## 보안 모범 사례

1. **절대 커밋하지 마세요**: `.env.local` 파일은 Git에 커밋하지 마세요
2. **서버 전용 키 보호**: `CLERK_SECRET_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용
3. **환경별 분리**: 개발/스테이징/프로덕션 환경별로 다른 키 사용
4. **정기적 로테이션**: 보안을 위해 API 키를 정기적으로 로테이션

## Supabase 타입 생성 (선택적)

TypeScript 타입 안전성을 위해 Supabase 타입을 생성할 수 있습니다:

```bash
# package.json의 gen:types 스크립트 실행
pnpm gen:types
```

이 명령어는 `database.types.ts` 파일을 생성하며, 프로젝트의 Supabase 스키마에 대한 TypeScript 타입을 제공합니다.

> **참고**: 타입 생성 전에 마이그레이션이 Supabase에 적용되어 있어야 합니다.

## 참고 자료

- [Clerk 환경 변수 설정](https://clerk.com/docs/quickstarts/nextjs)
- [Supabase 환경 변수 설정](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Clerk + Supabase 통합 가이드](./clerk-supabase-integration.md)

