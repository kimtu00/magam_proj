

# 📑 [최종] Product Requirements Document (PRD)
**Project Name:** 자취생 식비 구조대 (LastChance - Web MVP)
**Version:** 1.1 (Single App Strategy Applied)
**Date:** 2026. 01. 02
**Author:** Project Owner

---

## 1. 프로젝트 개요 (Executive Summary)

### 1.1. 제품 정의
지역 소상공인의 마감 임박 식품(떨이)과 저렴한 식사를 원하는 자취생/대학생을 연결하는 **하이퍼 로컬 마감 할인 중개 플랫폼**입니다.
*   **개발 전략:** **단일 웹 애플리케이션 (Single Web Application)**
    *   별도의 Admin/사장님 사이트를 구축하지 않습니다.
    *   하나의 도메인/앱 내에서 로그인한 유저의 **Role(Buyer vs Seller)**에 따라 UI와 접근 권한을 동적으로 분리합니다.

### 1.2. 핵심 가치 (Value Proposition)
*   **사용자(Students):** "만원으로 두 끼 해결" (식비 절감).
*   **판매자(Local Stores):** 폐기 비용 절감 및 추가 매출 확보.
*   **사회적 가치:** 음식물 쓰레기 감소.

### 1.3. 마케팅 컨셉
*   **슬로건:** "안산 자취생 식비 구조대"
*   **톤앤매너:** B급 감성, 솔직함 (예: "사장님이 미쳤어요", "잔고 3천원 구출").

---

## 2. 기술 스택 및 보안 (Tech & Security) - *AI 준수 사항*

*   **Framework:** **Next.js 14+ (App Router)**
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + `shadcn/ui`
*   **Package Manager:** **pnpm** (Strict enforcement)
*   **Authentication:** Clerk (`@clerk/nextjs`)
*   **Database:** Supabase (PostgreSQL)
*   **Security Architecture (RBAC):**
    *   **Middleware 필수 사용:** `middleware.ts`를 사용하여 서버 사이드에서 경로(Route) 접근을 제어합니다.
    *   **Clerk Metadata:** 유저의 `publicMetadata`에 `role` ('BUYER' | 'SELLER')을 저장하여 관리합니다.
    *   **Route Protection Rules:**
        *   `/seller/*`: 오직 `role === 'SELLER'`인 유저만 접근 가능. (위반 시 메인으로 리다이렉트)
        *   `/buyer/*` (또는 일반 기능): 누구나 혹은 로그인한 유저 접근 가능.

---

## 3. 기능 요구사항 및 라우팅 구조 (Functional Requirements)

**AI 지시사항:** Next.js의 **Route Groups** 기능을 사용하여 아래와 같이 폴더 구조를 잡으세요.

### 3.1. 라우팅 구조 (Folder Structure)
*   `app/(public)`: 랜딩 페이지, 로그인/회원가입, 서비스 소개 (접근 제한 없음).
*   `app/(buyer)`: 메인 피드, 상품 상세, 내 예약 내역 (구매자 위주 기능).
*   `app/(seller)`: **[보안]** 상품 등록, 내 상품 관리, 예약 승인 (사장님 전용).

### 3.2. 사용자 기능 (Buyer Mode)
1.  **상품 리스트 (Feed):**
    *   `products` 테이블에서 `AVAILABLE` 상품 조회.
    *   필터: '바로 섭취', '조리용', '만원의 행복'.
2.  **상품 상세 및 예약:**
    *   결제 모듈 없음 (현장 결제).
    *   [예약하기] 버튼 클릭 -> `orders` 테이블 Insert -> `products` 상태 `RESERVED` 변경 (트랜잭션 처리).

### 3.3. 사장님 기능 (Seller Mode)
1.  **접근 제어:**
    *   사장님이 아닌 유저가 URL로 강제 접근 시 차단.
2.  **상품 등록 (Upload):**
    *   이미지 업로드 (Supabase Storage), 메뉴명, 가격, 픽업 시간 입력.
3.  **내 가게 관리 (Dashboard):**
    *   본인이 등록한 상품 리스트 조회.
    *   판매 완료 처리 (`SOLD` 상태 변경).

---

## 4. 데이터베이스 스키마 (Database Schema)

**Cursor AI에게 다음 SQL 구조를 생성하도록 요청:**

1.  **`profiles`**
    *   `id`: UUID (PK)
    *   `clerk_id`: Text (Unique, Index)
    *   `role`: Text **('BUYER' | 'SELLER')** -> *이 필드가 권한 관리의 핵심*
    *   `nickname`: Text

2.  **`stores`** (사장님 정보)
    *   `id`: UUID
    *   `owner_id`: Text (FK -> profiles.clerk_id)
    *   `name`: Text
    *   `address`: Text

3.  **`products`** (매물)
    *   `id`: UUID
    *   `store_id`: UUID (FK -> stores.id)
    *   `name`: Text
    *   `original_price`: Integer
    *   `discount_price`: Integer
    *   `image_url`: Text
    *   `is_instant`: Boolean
    *   `status`: Text ('AVAILABLE', 'RESERVED', 'SOLD')

4.  **`orders`** (예약 내역)
    *   `id`: UUID
    *   `buyer_id`: Text (FK -> profiles.clerk_id)
    *   `product_id`: UUID (FK -> products.id)
    *   `status`: Text ('RESERVED', 'COMPLETED', 'CANCELED')

---

## 5. 개발 로드맵 (Development Roadmap)

### Phase 1: 환경 설정 및 보안 기초 (Security First)
*   **목표:** 프로젝트 생성 및 **역할 기반 보안(RBAC)** 구현.
*   **Tasks:**
    1.  Next.js + Tailwind + pnpm 프로젝트 생성.
    2.  Clerk 연동 및 Supabase 클라이언트 설정.
    3.  **[핵심]** `middleware.ts` 작성: `/seller` 경로 보호 로직 구현.
    4.  회원가입 후 역할(Role) 선택 페이지 및 `profiles` 저장 로직 구현.

### Phase 2: 사장님 기능 구현 (Supply Side)
*   **목표:** 상품을 등록하고 DB에 저장되는지 확인.
*   **Tasks:**
    1.  `(seller)/upload/page.tsx`: 이미지 업로드 및 상품 등록 폼.
    2.  `(seller)/dashboard/page.tsx`: 내 상품 조회 및 삭제/마감 기능.

### Phase 3: 사용자 기능 구현 (Demand Side)
*   **목표:** 상품을 조회하고 예약하는 흐름 완성.
*   **Tasks:**
    1.  `(buyer)/page.tsx`: 메인 피드 및 필터 UI.
    2.  상품 상세 페이지 및 예약 액션(Server Action) 구현.

---

## 6. UI/UX 가이드라인 (Design Specs)

*   **View Environment:** **Mobile-First Web**
    *   Global CSS에서 `max-width: 430px`, `margin: 0 auto` 적용하여 데스크탑에서도 앱처럼 보이게 강제함.
*   **Navigation:**
    *   유저의 `role`을 감지하여 하단 네비게이션 바의 메뉴 구성을 다르게 보여줌.
    *   (예: 사장님은 '등록하기' 버튼 노출 / 학생은 '내 주변' 버튼 노출)

---

### 💡 Cursor AI 프롬프트 (시작용)

> "이 PRD를 바탕으로 프로젝트를 시작할 거야.
> 특히 **'Single Web App' 전략**에 맞춰서 관리자 페이지를 따로 만들지 않고, **Middleware를 이용해 `/seller` 경로를 보호하는 보안 로직**을 Phase 1에서 가장 먼저, 그리고 확실하게 구현해줘. pnpm create next-app 부터 시작해."