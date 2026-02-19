- [x] `.cursor/` 디렉토리
  - [x] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정 (예시 파일은 .gitignore에 포함)
  - [x] `dir.md` 프로젝트 디렉토리 구조
- [x] `.github/` 디렉토리
  - [x] `workflows/ci.yml` CI/CD 워크플로우
- [x] `.husky/` 디렉토리
  - [x] `pre-commit` Git hook
  - [x] `pre-push` Git hook
- [x] `app/` 디렉토리
  - [x] `favicon.ico` 파일
  - [x] `not-found.tsx` 파일
  - [x] `robots.ts` 파일
  - [x] `sitemap.ts` 파일
  - [x] `manifest.ts` 파일
- [x] `supabase/` 디렉토리
- [x] `public/` 디렉토리
  - [x] `icons/` 디렉토리
  - [x] `logo.png` 파일
  - [x] `og-image.png` 파일
- [x] `tsconfig.json` 파일
- [x] `.cursorignore` 파일
- [x] `.gitignore` 파일
- [x] `.prettierignore` 파일
- [x] `.prettierrc` 파일
- [x] `eslint.config.mjs` 파일
- [x] `AGENTS.md` 파일

# 📝 [LastChance] 개발 TODO 리스트

## 🛠 Phase 1: 프로젝트 세팅 및 보안 (Foundation & Security)

> **목표:** 빈 껍데기를 만들고, **'사장님만 들어갈 수 있는 문'**을 튼튼하게 잠그는 단계입니다.

### 1-1. 개발 환경 구축

- [x] **Next.js 프로젝트 생성:**
  - 명령어: `pnpm create next-app@latest last-chance --typescript --tailwind --eslint`
  - 옵션 선택: App Router (Yes), Src directory (No), Turbopack (No), Import alias (Yes, `@/*`).
- [x] **필수 라이브러리 설치:**
  - 명령어: `pnpm add @clerk/nextjs @supabase/supabase-js lucide-react clsx tailwind-merge`
- [x] **모바일 뷰포트(Mobile-First) CSS 설정:**
  - `app/globals.css` 수정: `body` 태그에 `max-width: 430px`, `margin: auto`, 배경색(회색) 적용.

---

**추가 개발 사항**

- [x] **필수 메타데이터 파일 생성:**
  - `app/not-found.tsx`: 404 페이지 커스터마이징 (Mobile-First 디자인)
  - `app/robots.ts`: SEO를 위한 robots.txt 동적 생성
  - `app/sitemap.ts`: 동적 사이트맵 생성
  - `app/manifest.ts`: PWA 매니페스트 설정 (모바일 앱처럼 보이도록)
- [x] **개발 도구 설정 파일:**
  - `.prettierignore`: Prettier가 무시할 파일 지정
  - `.cursorignore`: Cursor AI가 무시할 파일 지정
- [x] **프로젝트 문서화:**
  - `.cursor/dir.md`: 프로젝트 디렉토리 구조 문서화
- [x] **Git 워크플로우 설정:**
  - `.github/workflows/ci.yml`: 기본 CI/CD 워크플로우 (린트 및 빌드 체크)
  - `.husky/pre-commit`: Prettier 및 ESLint 체크
  - `.husky/pre-push`: 빌드 체크

### 1-2. 인증(Auth) 및 데이터베이스 연결

- [x] **Clerk & Supabase 연동:**
  - Clerk 대시보드에서 애플리케이션 생성.
  - Supabase 프로젝트 생성 및 `SQL Editor`에서 테이블(`profiles`, `stores` 등) 생성.
  - `.env.local` 파일에 API Key 등 환경변수 저장.
- [x] **ClerkProvider 설정:** `app/layout.tsx` 전체 감싸기.

---

**추가 개발 사항**

- [x] **데이터베이스 스키마 마이그레이션:**
  - `supabase/migrations/20260106141956_create_lastchance_schema.sql` 생성
  - ENUM 타입 정의 (user_role, product_status, order_status)
  - 테이블 생성 (profiles, stores, products, orders)
  - 외래 키 제약 조건 및 인덱스 생성
  - `reserve_product` 함수 구현 (트랜잭션 처리)
  - RLS 정책 설정 (개발용 - 모든 접근 허용)
- [x] **사용자 동기화 로직 업데이트:**
  - `app/api/sync-user/route.ts`: `users` 테이블 → `profiles` 테이블로 변경
  - Clerk `publicMetadata.role` 지원 추가
  - 필드 매핑 업데이트 (name → nickname, role 기본값 'BUYER')
- [x] **환경 변수 문서화:**
  - `.env.example` 파일 생성 (Clerk 및 Supabase 환경 변수 예시)
  - `docs/environment-setup.md` 가이드 문서 작성
- [x] **Clerk-Supabase 통합 상태 확인:**
  - `docs/clerk-supabase-integration-status.md` 문서 작성
  - 통합 아키텍처 다이어그램 및 체크리스트 제공
  - 테스트 방법 및 문제 해결 가이드 포함

### 1-3. [핵심] 역할 기반 보안 (RBAC Middleware)

- [x] **역할 선택 페이지 구현 (`/onboarding`):**
  - 회원가입 직후 리다이렉트 될 페이지.
  - "사장님(Seller)" vs "학생(Buyer)" 선택 버튼.
  - 선택 시 Clerk `publicMetadata` 업데이트 및 Supabase `profiles` 테이블에 Insert.
- [x] **미들웨어(`middleware.ts`) 작성:**
  - Clerk 미들웨어를 사용하여 경로 보호.
  - **로직:** `/seller`로 시작하는 주소에 접근 시, 유저의 metadata가 `seller`가 아니면 메인 화면으로 강제 이동(Redirect).

---

**추가 개발 사항**

- [x] **역할 업데이트 Server Action 구현:**
  - `app/onboarding/actions.ts`: 역할 업데이트 Server Action
  - Clerk `publicMetadata.role` 업데이트
  - Supabase `profiles.role` 업데이트
  - 트랜잭션 처리 및 에러 처리
  - 역할에 따른 자동 리다이렉트 (SELLER → `/seller`, BUYER → `/`)
- [x] **역할 선택 페이지 UI 구현:**
  - `app/onboarding/page.tsx`: Mobile-First 디자인
  - 큰 선택 버튼 2개 (사장님 / 학생)
  - 아이콘 및 설명 텍스트 포함
  - Server Action 호출 및 리다이렉트 처리
- [x] **Middleware RBAC 로직 구현:**
  - `middleware.ts`: `/seller/*` 경로 보호
  - `createRouteMatcher`를 사용한 경로 매칭
  - `sessionClaims.publicMetadata.role` 확인
  - SELLER가 아니면 `/`로 리다이렉트
  - `/onboarding`, `/api/*` 경로는 보호하지 않음
- [x] **회원가입 후 자동 리다이렉트:**
  - `components/providers/role-redirect-provider.tsx`: 역할 리다이렉트 프로바이더
  - 역할이 설정되지 않은 사용자를 `/onboarding`으로 자동 리다이렉트
  - `app/layout.tsx`에 프로바이더 추가
- [x] **역할 확인 유틸리티 함수:**
  - `lib/auth/role.ts`: 역할 확인 유틸리티 함수
  - `getUserRole()`: 현재 사용자의 역할 반환
  - `isSeller()`, `isBuyer()`, `hasRole()`: 역할 확인 함수

---

## 🛠 Phase 2: 사장님 기능 개발 (Supply Side)

> **목표:** 사장님이 로그인해서 상품을 올리고, DB에 잘 저장되는지 확인합니다.

### 2-1. 사장님 전용 레이아웃

- [x] **폴더 구조 생성:** `app/seller/layout.tsx`
- [x] **사장님용 네비게이션 바:** 하단에 [내 상품 관리], [등록하기], [설정] 메뉴 배치.

---

**추가 개발 사항**

- [x] **사장님 경로 디렉토리 구조 생성:**
  - `app/seller/` 디렉토리 생성
  - `/seller/*` URL로 접근 가능
- [x] **사장님용 하단 네비게이션 바 구현:**
  - `components/navigation/seller-bottom-nav.tsx`: 하단 고정 네비게이션 바
  - Mobile-First 디자인 (max-width: 430px)
  - 현재 활성화된 메뉴 강조 표시
  - 아이콘 + 텍스트 레이블 (Package, Plus, Settings)
  - `usePathname` 훅으로 현재 경로 확인
- [x] **사장님 전용 레이아웃 구현:**
  - `app/seller/layout.tsx`: 사장님 전용 레이아웃
  - `isSeller()` 함수로 추가 보안 레이어 (이중 보안)
  - 하단 네비게이션 바 통합
  - 하단 네비게이션 바를 위한 padding-bottom 적용
- [x] **임시 페이지 구현:**
  - `app/seller/page.tsx`: `/seller/dashboard`로 리다이렉트
  - `app/seller/dashboard/page.tsx`: 내 상품 관리 임시 페이지
  - `app/seller/upload/page.tsx`: 상품 등록 임시 페이지
  - `app/seller/settings/page.tsx`: 설정 임시 페이지

### 2-2. 상품 등록 기능

- [x] **가게 정보 등록:** (최초 1회) 가게 이름, 위치 입력받아 `stores` 테이블 저장.
- [x] **상품 등록 페이지 (`/seller/upload`):**
  - 파일 업로드 UI (`input type="file"`) 구현.
  - 메뉴명, 정가, 할인가, 픽업 시간 입력 폼.
- [x] **이미지 업로드 로직:**
  - Supabase Storage에 `products` 버킷 생성 및 정책(Policy) 설정 (누구나 읽기 가능, 인증된 유저만 쓰기 가능).
  - 이미지 업로드 -> URL 획득 -> `products` 테이블에 데이터 저장.

---

**추가 개발 사항**

- [x] **Supabase Storage products 버킷 생성:**
  - `supabase/migrations/20260106150000_create_products_storage.sql` 생성
  - 공개 버킷 설정 (누구나 읽기 가능)
  - 인증된 사용자만 업로드/삭제/업데이트 가능
  - 이미지 파일만 허용 (JPEG, PNG, WebP)
  - 파일 크기 제한: 5MB
- [x] **가게 정보 조회 및 생성 Server Action:**
  - `app/(seller)/actions.ts`: `getStore()`, `createStore()` 함수 구현
  - 가게 정보 조회 및 생성 로직
  - 에러 처리 및 검증
- [x] **이미지 업로드 유틸리티 함수:**
  - `lib/storage/upload-product-image.ts`: 이미지 업로드 및 삭제 함수
  - 파일 검증 (크기, 형식)
  - Supabase Storage 업로드 및 Public URL 반환
- [x] **상품 등록 폼 Zod 스키마:**
  - `app/(seller)/upload/schema.ts`: 폼 검증 스키마 정의
  - 메뉴명, 정가, 할인가, 픽업 시간, 바로 섭취 여부 검증
  - 할인가가 정가보다 작은지 확인
  - 픽업 마감 시간이 현재 시간보다 미래인지 확인
- [x] **상품 등록 폼 UI 구현:**
  - `app/(seller)/upload/page.tsx`: react-hook-form과 shadcn/ui Form 컴포넌트 사용
  - 이미지 업로드 및 미리보기 기능
  - 모든 입력 필드 구현 (메뉴명, 정가, 할인가, 바로 섭취 여부, 픽업 마감 시간)
  - Mobile-First 디자인
- [x] **상품 등록 Server Action:**
  - `app/(seller)/upload/actions.ts`: `createProduct()` 함수 구현
  - 가게 정보 확인
  - 이미지 업로드 통합
  - 상품 데이터를 `products` 테이블에 저장
  - 성공 시 대시보드로 리다이렉트
- [x] **가게 정보 등록 플로우:**
  - `components/product/store-setup-form.tsx`: 가게 정보 등록 폼 컴포넌트
  - 상품 등록 페이지에서 가게 정보 없을 때 자동으로 가게 정보 등록 폼 표시
  - 가게 정보 등록 후 상품 등록 폼으로 전환

### 2-3. 내 상품 관리 (Dashboard)

- [x] **상품 리스트 조회:** `store_id`가 내 가게인 상품만 `SELECT`.
- [x] **상태 변경 기능:** [판매 완료] 버튼 클릭 시 `status`를 `SOLD`로 변경 (`UPDATE`).

---

**추가 개발 사항**

- [x] **사장님 상품 조회 Server Action 구현:**
  - `app/seller/actions.ts`: `ProductData` 타입 정의
  - `getMyProducts()` 추가 (내 가게(store_id) 기준 상품 리스트 조회)
- [x] **상품 상태 변경 Server Action 구현:**
  - `app/seller/actions.ts`: `updateProductStatus()` 추가
  - 현재 로그인한 사장님의 가게에 속한 상품만 `SOLD`로 업데이트
  - `/seller/dashboard` 경로 revalidate 처리
- [x] **Dashboard 페이지 실제 기능 구현:**
  - `app/seller/dashboard/page.tsx`: Server Component로 변환
  - 가게 정보 유무에 따른 분기 처리
    - 가게 정보 없음: 가게 등록 안내 + `/seller/upload` 버튼
    - 가게 정보 있음: 상품 리스트 + 개수 표시
- [x] **상품 카드 컴포넌트 구현:**
  - `components/product/product-card.tsx`
  - 이미지, 상품명, 정가/할인가, 할인율, 상태 뱃지, 픽업 마감 시간, 바로 섭취 뱃지 표시
  - 카드 하단에 [판매 완료] 버튼 배치
- [x] **판매 완료 버튼 컴포넌트 구현:**
  - `components/product/mark-as-sold-button.tsx`
  - 클라이언트 컴포넌트에서 `updateProductStatus` Server Action 호출
  - 로딩 상태와 비활성화 상태 처리
- [x] **빈 상태 컴포넌트 구현:**
  - `components/product/empty-products.tsx`
  - 등록된 상품이 없을 때 안내 문구 및 `/seller/upload` 버튼 표시

## 🛠 Phase 3: 사용자(학생) 기능 개발 (Demand Side)

> **목표:** 학생들이 들어와서 상품을 보고 '예약' 버튼을 누르게 합니다.

### 3-1. 사용자 전용 레이아웃

- [x] **폴더 구조 생성:** `app/buyer/layout.tsx`
- [x] **사용자용 네비게이션 바:** 하단에 [홈], [내 예약], [마이페이지] 메뉴 배치.

---

**추가 개발 사항**

- [x] **Buyer 하단 네비게이션 컴포넌트 구현:**
  - `components/navigation/buyer-bottom-nav.tsx`
  - [홈](`/buyer`), [내 예약](`/buyer/reservations`), [마이페이지](`/buyer/me`) 메뉴 구성
  - `usePathname`를 사용한 활성 메뉴 강조, Mobile-First 하단 고정 레이아웃
- [x] **사용자 전용 레이아웃 구현:**
  - `app/buyer/layout.tsx`
  - 하단에 `BuyerBottomNav` 포함, 본문 영역에 `children` 렌더링
  - 하단 네비게이션 높이만큼 `pb-20` 패딩 적용
- [x] **Buyer 기본 라우트 생성:**
  - `app/(buyer)/page.tsx`: "학생용 메인 피드 (추후 구현 예정)" 안내
  - `app/(buyer)/reservations/page.tsx`: "내 예약 내역 (추후 구현 예정)" 안내
  - `app/(buyer)/me/page.tsx`: "마이페이지 (추후 구현 예정)" 안내

### 3-2. 메인 피드 (Feed)

- [x] **상품 리스트 조회:** `status`가 `AVAILABLE`인 모든 상품 조회.
- [x] **필터 UI 구현:** 상단 탭 (전체 / 😋바로섭취 / 🍳조리용 / 💸만원이하) 클릭 시 쿼리 조건 변경.
- [x] **카드 UI 디자인:** 사진, 할인율(빨간색), 가격 표시.

---

**추가 개발 사항**

- [x] **Buyer 상품 조회 Server Action 구현:**
  - `app/buyer/actions.ts`: `getAvailableProducts()` 함수 구현
  - `status = 'AVAILABLE'`인 모든 상품 조회
  - 필터 옵션 지원:
    - `is_instant: true` - 바로 섭취 필터 (😋바로섭취)
    - `is_instant: false` - 조리용 필터 (🍳조리용)
    - `max_price: 10000` - 만원 이하 필터 (💸만원이하)
  - `ProductData` 타입 정의 (seller와 동일하게 재사용)
  - 픽업 마감 시간이 현재 시간보다 미래인 상품만 조회
  - 최신순 정렬 (`created_at DESC`)
- [x] **필터 탭 컴포넌트 구현:**
  - `components/product/feed-filter-tabs.tsx`: 필터 탭 UI 컴포넌트
  - 클라이언트 컴포넌트로 구현
  - 필터 탭 구성: [전체], [😋바로섭취], [🍳조리용], [💸만원이하]
  - 활성화된 필터 강조 표시
  - 필터 변경 시 URL 쿼리 파라미터 업데이트 또는 상태 관리
  - Mobile-First 디자인 (가로 스크롤 가능한 탭)
- [x] **피드용 상품 카드 컴포넌트 구현:**
  - `components/product/feed-product-card.tsx`: 피드용 상품 카드
  - 사진 (이미지 없을 때 플레이스홀더)
  - 할인율 표시 (빨간색 강조, 큰 폰트)
  - 가격 표시 (할인가 / 정가 취소선)
  - 바로 섭취 뱃지 표시 (`is_instant`)
  - 픽업 마감 시간 표시
  - 상품 클릭 시 `/buyer/product/[id]` 경로로 이동 (Link)
  - Mobile-First 디자인 (세로 카드 레이아웃)
- [x] **메인 피드 페이지 구현:**
  - `app/buyer/page.tsx`: Server Component로 구현
  - URL 쿼리 파라미터에서 필터 옵션 읽기 (`searchParams`)
  - 필터에 따른 상품 조회 (`getAvailableProducts()`)
  - 필터 탭 + 상품 리스트 그리드 렌더링
  - 빈 상태 처리 (상품이 없을 때 안내 문구)
  - 로딩 상태 처리 (Suspense 사용 고려)
- [x] **빈 상태 컴포넌트 구현:**
  - `components/product/empty-feed.tsx`: 피드 빈 상태 컴포넌트
  - 등록된 상품이 없을 때 안내 문구 표시
  - "지금 등록된 상품이 없습니다" 메시지

### 3-3. 예약 시스템 (Reservation)

- [x] **상세 페이지:** 상품 클릭 시 `/buyer/product/[id]` 로 이동.
- [x] **예약 액션 (Server Action):**
  - [예약하기] 버튼 클릭.
  - **트랜잭션:** (1) 재고 확인 -> (2) `orders` 테이블 Insert -> (3) `products` 상태 `RESERVED`로 변경.
  - 성공 시 "예약 성공" 팝업 띄우기.

---

**추가 개발 사항**

- [x] **상품 상세 조회 Server Action 구현:**
  - `app/buyer/actions.ts`: `getProductById(productId)` 함수 구현
  - products 테이블과 stores 테이블 조인하여 가게 정보 포함
  - 반환 타입: `ProductDetailData` (ProductData + store 정보)
  - 에러 처리 (상품 없을 때 null 반환)
- [x] **예약 Server Action 구현:**
  - `app/buyer/actions.ts`: `reserveProduct(productId)` 함수 구현
  - Clerk 인증 확인 (`auth().userId`)
  - Supabase RPC 호출: `supabase.rpc('reserve_product', { p_product_id, p_buyer_id })`
  - 반환 타입: `ReserveProductResult` (`{ success: boolean; message?: string; order_id?: string }`)
  - 에러 처리 및 검증
  - 경로 revalidate 처리 (`revalidatePath('/buyer')`, `revalidatePath('/buyer/product/[id]')`)
- [x] **예약 버튼 컴포넌트 구현:**
  - `components/product/reserve-button.tsx`: 예약 버튼 클라이언트 컴포넌트
  - `reserveProduct` Server Action 호출
  - 로딩 상태 관리 (버튼 비활성화, 로딩 스피너)
  - 예약 성공 시 성공 팝업 표시
  - 예약 실패 시 에러 메시지 표시
- [x] **예약 성공 팝업 구현:**
  - `components/product/reservation-success-dialog.tsx`: 예약 성공 다이얼로그
  - shadcn/ui Dialog 컴포넌트 사용
  - 예약 성공 메시지 표시
  - 주문 ID 표시 (선택)
  - "내 예약 확인하기" 버튼 클릭 시 `/buyer/reservations`로 리다이렉트
  - Mobile-First 디자인
- [x] **상품 상세 페이지 구현:**
  - `app/buyer/product/[id]/page.tsx`: 상품 상세 페이지 (Server Component)
  - Next.js 15 async `params` 패턴 사용
  - 상품 정보 표시:
    - 이미지 (큰 사이즈, 전체 너비)
    - 상품명
    - 가격 정보 (정가/할인가, 할인율 배지)
    - 바로 섭취 뱃지
    - 픽업 마감 시간
    - 가게 정보 (가게명, 주소, 전화번호)
  - 상품 상태 표시 (AVAILABLE/RESERVED/SOLD)
  - 예약 버튼 (하단 고정, 상태가 AVAILABLE일 때만 활성화)
  - 빈 상태 처리 (상품 없을 때 `notFound()` 호출)
  - Mobile-First 디자인

### 3-4. 내 예약 확인

- [x] **예약 내역 리스트:** `orders` 테이블에서 내 아이디로 조회.
- [x] **상태 표시:** 예약중(초록색) / 픽업완료(회색) / 취소됨(빨간색) 뱃지 표시.

---

**추가 개발 사항**

- [x] **예약 내역 조회 Server Action 구현:**
  - `app/buyer/actions.ts`: `getMyOrders()` 함수 구현
  - Clerk 인증 확인 (`auth().userId`)
  - orders 테이블에서 `buyer_id`로 조회
  - products 테이블과 조인하여 상품 정보 포함
  - stores 테이블과 조인하여 가게 정보 포함 (중첩 조인)
  - 최신순 정렬 (`created_at DESC`)
  - 반환 타입: `OrderData[]` (order 정보 + product 정보 + store 정보)
  - 타입 정의: `OrderData` 타입 추가
- [x] **예약 내역 카드 컴포넌트 구현:**
  - `components/product/order-card.tsx`: 예약 내역 카드 컴포넌트
  - 상품 이미지, 상품명, 가격 정보 (할인가)
  - 가게 정보 (가게명)
  - 예약 날짜 표시
  - 픽업 마감 시간 표시
  - 상태 뱃지 표시:
    - 예약중 (RESERVED): 초록색 뱃지 (`bg-emerald-100 text-emerald-700`)
    - 픽업완료 (COMPLETED): 회색 뱃지 (`bg-gray-200 text-gray-600`)
    - 취소됨 (CANCELED): 빨간색 뱃지 (`bg-red-100 text-red-700`)
  - 상품 클릭 시 `/buyer/product/[id]` 경로로 이동 (Link)
  - Mobile-First 디자인
- [x] **빈 상태 컴포넌트 구현:**
  - `components/product/empty-orders.tsx`: 예약 내역 빈 상태 컴포넌트
  - "아직 예약한 상품이 없습니다" 메시지 표시
  - "마감 할인 상품 둘러보기" 버튼으로 메인 피드로 이동 유도
  - Mobile-First 디자인
- [x] **예약 내역 페이지 구현:**
  - `app/buyer/reservations/page.tsx`: 예약 내역 페이지 (Server Component)
  - `getMyOrders()` Server Action 호출
  - 예약 내역 리스트 렌더링 (`OrderCard` 컴포넌트)
  - 빈 상태 처리 (`EmptyOrders` 컴포넌트)
  - 로딩 상태 처리 (Suspense 사용)
  - 페이지 제목 및 설명
  - Mobile-First 디자인

---

## 🛠 Phase 4: 배포 및 테스트

- [ ] **최종 테스트:**
  - 크롬 시크릿 모드 2개를 켜서 하나는 '사장님', 하나는 '학생'으로 로그인.
  - 학생이 `/seller/upload` 주소를 쳤을 때 튕겨 나가는지 확인.
  - 사장님이 올린 물건이 학생 화면에 뜨는지 확인.
- [ ] **배포 (Vercel):** GitHub 레포지토리 연결 후 Deploy.

---

## 💡 Cursor AI와 개발할 때 팁 (단계별 프롬프트)

개발이 막힐 때 아래 문구를 **복사해서** 사용하세요.

**[Phase 1: 보안 설정할 때]**

> "지금 `middleware.ts`를 작성하려고 해.
> Clerk를 사용 중이고, `/seller` 경로는 오직 `publicMetadata.role`이 'SELLER'인 사람만 접근할 수 있게 보호해줘.
> 권한이 없으면 `/` (홈)으로 리다이렉트 시키는 코드를 작성해줘."

**[Phase 2: 이미지 업로드 할 때]**

> "Supabase Storage에 이미지를 올리는 함수를 `lib/storage.ts`에 만들어줘.
> 브라우저에서 선택한 파일을 받아서 `products` 버킷에 올리고, 업로드된 이미지의 Public URL을 반환하는 함수여야 해."

**[Phase 3: 예약 버튼 만들 때]**

> "예약 버튼을 누르면 실행될 Server Action을 만들어줘.
> 동시에 여러 사람이 누를 수 있으니까, 반드시 DB에서 현재 상태가 'AVAILABLE'인지 먼저 확인하고 업데이트하는 로직이 필요해."

---

## 🐛 버그 수정 내역 (2026-01-06)

> **문제:** 역할 선택 후 `/seller` 페이지로 이동해도 홈으로 리다이렉트되고, 하단 네비게이션 바가 표시되지 않음

### 수정된 파일들:

- [x] **Route Group 폴더명 변경:**

  - `app/(seller)/` → `app/seller/`로 변경
  - Next.js Route Groups `(seller)`는 URL에 포함되지 않아 `/seller` 경로가 404 반환
  - 괄호 없이 `seller` 폴더로 변경하여 `/seller/*` URL 정상 작동

- [x] **역할 업데이트 Server Action 수정 (`app/onboarding/actions.ts`):**

  - `redirect()` 대신 리다이렉트 경로를 반환하도록 변경
  - 클라이언트에서 세션 갱신 후 하드 리프레시 수행
  - Clerk `publicMetadata` 업데이트 후 세션 토큰 갱신 필요

- [x] **Onboarding 페이지 클라이언트 컴포넌트로 변경 (`app/onboarding/page.tsx`):**

  - 서버 컴포넌트 → 클라이언트 컴포넌트로 변경
  - `useClerk().session.reload()`로 세션 토큰 갱신
  - `window.location.href`로 하드 리프레시 수행

- [x] **RoleRedirectProvider 수정 (`components/providers/role-redirect-provider.tsx`):**

  - `router.push()` → `window.location.href`로 변경 (하드 리프레시)
  - 중복 리다이렉트 방지를 위한 `useRef` 추가

- [x] **Middleware RBAC 로직 개선 (`middleware.ts`):**

  - `sessionClaims` 대신 직접 Clerk API 호출
  - `sessionClaims`는 JWT 토큰에서 읽어 업데이트가 늦게 반영됨
  - `clerkClient().users.getUser()`로 최신 역할 확인

- [x] **Import 경로 수정 (`components/product/store-setup-form.tsx`):**
  - `@/app/(seller)/actions` → `@/app/seller/actions`로 변경

### 근본 원인:

1. **Route Group 오해:** Next.js Route Groups `(folder)`는 URL에 포함되지 않음
2. **세션 토큰 갱신:** Clerk `publicMetadata` 업데이트 후 JWT 토큰이 즉시 갱신되지 않아 서버 측에서 이전 역할이 반환됨

### 해결 방법:

1. Route Group을 일반 폴더로 변경하여 `/seller/*` URL 정상 작동
2. 역할 업데이트 후 클라이언트에서 세션 갱신 및 하드 리프레시 수행
3. 미들웨어에서 직접 Clerk API 호출하여 최신 역할 확인
