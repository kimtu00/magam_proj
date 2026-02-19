# 프로젝트 디렉토리 구조

이 문서는 프로젝트의 디렉토리 구조와 각 디렉토리/파일의 역할을 설명합니다.

## 루트 디렉토리

```
.
├── app/                    # Next.js App Router (라우팅 전용)
├── components/             # 재사용 가능한 React 컴포넌트
├── lib/                    # 유틸리티 함수 및 클라이언트 설정
├── hooks/                  # 커스텀 React Hooks
├── supabase/               # Supabase 관련 파일
├── public/                 # 정적 파일
├── docs/                   # 프로젝트 문서
├── .cursor/                # Cursor AI 규칙 및 설정
└── [설정 파일들]           # package.json, tsconfig.json 등
```

## 주요 디렉토리 설명

### `app/` - Next.js App Router

Next.js 15 App Router를 사용합니다. 라우팅 전용으로 사용하며, 페이지와 레이아웃만 포함합니다.

- `layout.tsx`: Root Layout (ClerkProvider, SyncUserProvider 포함)
- `page.tsx`: 홈페이지
- `not-found.tsx`: 404 페이지
- `robots.ts`: SEO를 위한 robots.txt 생성
- `sitemap.ts`: 동적 사이트맵 생성
- `manifest.ts`: PWA 매니페스트 설정
- `globals.css`: 전역 스타일 (Tailwind CSS v4)
- `api/`: API Routes
  - `sync-user/`: Clerk → Supabase 사용자 동기화
- `(buyer)/`: 구매자 전용 라우트 그룹 (예정)
- `(seller)/`: 판매자 전용 라우트 그룹 (예정)

### `components/` - React 컴포넌트

재사용 가능한 컴포넌트를 저장합니다.

- `ui/`: shadcn/ui 컴포넌트 (자동 생성, 수정 금지)
  - `button.tsx`, `input.tsx`, `form.tsx` 등
- `providers/`: React Context 프로바이더
  - `sync-user-provider.tsx`: 사용자 동기화 프로바이더
- `Navbar.tsx`: 네비게이션 바

### `lib/` - 유틸리티 및 설정

공통 유틸리티 함수와 클라이언트 설정을 저장합니다.

- `supabase/`: Supabase 클라이언트 (환경별로 분리)
  - `clerk-client.ts`: Client Component용 (useClerkSupabaseClient)
  - `server.ts`: Server Component/Action용 (createClient)
  - `service-role.ts`: 관리자 권한용 (RLS 우회)
  - `client.ts`: 공개 데이터용 (인증 불필요)
- `clerk/`: Clerk 설정
  - `localization.ts`: 한국어 로컬라이제이션
- `utils.ts`: 공통 유틸리티 (cn 함수 등)

### `hooks/` - 커스텀 React Hooks

재사용 가능한 React Hooks를 저장합니다.

- `use-sync-user.ts`: Clerk 사용자를 Supabase에 동기화하는 훅

### `supabase/` - Supabase 관련 파일

데이터베이스 마이그레이션 및 설정 파일을 저장합니다.

- `migrations/`: SQL 마이그레이션 파일
  - `DB.sql`: 메인 데이터베이스 스키마 (profiles, stores, products, orders)
  - `setup_schema.sql`: 초기 스키마 설정
  - `setup_storage.sql`: Storage 버킷 및 정책 설정
- `config.toml`: Supabase 프로젝트 설정

### `public/` - 정적 파일

정적 파일을 저장합니다.

- `icons/`: PWA 아이콘 (192x192, 256x256, 384x384, 512x512)
- `logo.png`: 로고 이미지
- `og-image.png`: Open Graph 이미지
- `favicon.ico`: 파비콘

### `docs/` - 프로젝트 문서

프로젝트 관련 문서를 저장합니다.

- `PRD.md`: 제품 요구사항 문서
- `TODO.md`: 개발 TODO 리스트
- `DIR.md`: 디렉토리 구조 문서 (레거시)
- `clerk-localization.md`: Clerk 로컬라이제이션 가이드
- `clerk-supabase-integration.md`: Clerk + Supabase 통합 가이드
- `supabase-nextjs-setup.md`: Supabase + Next.js 설정 가이드
- `task/`: 작업 완료 문서

### `.cursor/` - Cursor AI 규칙

Cursor AI가 코드를 작성할 때 참고하는 규칙을 저장합니다.

- `rules/`: 개발 컨벤션 및 가이드
  - `common/`: 공통 규칙
  - `supabase/`: Supabase 관련 규칙
  - `web/`: 웹 개발 관련 규칙
- `dir.md`: 프로젝트 디렉토리 구조 문서 (이 파일)

## 설정 파일

### 루트 레벨 설정 파일

- `package.json`: 프로젝트 의존성 및 스크립트
- `tsconfig.json`: TypeScript 설정
- `next.config.ts`: Next.js 설정
- `eslint.config.mjs`: ESLint 설정
- `postcss.config.mjs`: PostCSS 설정
- `.prettierrc`: Prettier 설정
- `.prettierignore`: Prettier가 무시할 파일
- `.cursorignore`: Cursor AI가 무시할 파일
- `.gitignore`: Git이 무시할 파일
- `middleware.ts`: Next.js 미들웨어 (Clerk 인증)

## 예정된 디렉토리

다음 디렉토리들은 아직 생성되지 않았지만 필요 시 생성됩니다:

- `actions/`: Server Actions (API 대신 우선 사용)
- `types/`: TypeScript 타입 정의
- `constants/`: 상수 값들
- `states/`: 전역 상태 (jotai 사용, 최소화)

## 네이밍 컨벤션

- **파일명**: kebab-case (예: `use-sync-user.ts`, `sync-user-provider.tsx`)
- **컴포넌트**: PascalCase (파일명은 여전히 kebab-case)
- **함수/변수**: camelCase
- **타입/인터페이스**: PascalCase

## 참고 자료

- [AGENTS.md](../AGENTS.md): 프로젝트 아키텍처 가이드
- [PRD.md](../docs/PRD.md): 제품 요구사항 문서
- [TODO.md](../docs/TODO.md): 개발 TODO 리스트

