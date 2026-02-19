# 아키텍처 검토 가이드

> **목적**: 기능 단위로 UI → API → Service → DB 연결 구조를 점검하는 아키텍처 검토 문서
> **대상**: 개발자, Cursor AI
> **프로젝트**: LastChance (자취생 식비 구조대)

---

## 목차

1. [개요](#1-개요)
2. [아키텍처 다이어그램](#2-아키텍처-다이어그램)
3. [레이어별 상세 가이드](#3-레이어별-상세-가이드)
   - [3.1 UI Layer](#31-ui-layer-page--component)
   - [3.2 API Layer](#32-api-layer-server-actions--route)
   - [3.3 Service Layer](#33-service-layer-비즈니스-로직)
   - [3.4 DB Layer](#34-db-layer-repository--supabase-client)
4. [권장 디렉토리 구조](#4-권장-디렉토리-구조)
5. [리팩토링 가이드](#5-리팩토링-가이드)
6. [Cursor 구현 가이드](#6-cursor-구현-가이드)
7. [기능별 점검 체크리스트](#7-기능별-점검-체크리스트)

---

## 1. 개요

### 1.1 설계 원칙

| 원칙 | 설명 |
|-----|------|
| **비즈니스 로직의 Service 집중** | 핵심 비즈니스 로직은 Service Layer에만 존재 |
| **UI와 API의 책임 최소화** | UI는 렌더링만, API는 요청/응답 처리만 담당 |
| **확장성과 유지보수성 확보** | 레이어 분리로 변경 영향 범위 최소화 |
| **테스트 용이성** | 각 레이어를 독립적으로 테스트 가능 |

### 1.2 핵심 규칙

```
✅ DO:
- Service에서 비즈니스 로직 처리
- Action에서 인증/검증 후 Service 호출
- UI에서 데이터 표시만 담당

❌ DON'T:
- Action에서 직접 복잡한 비즈니스 로직 처리
- UI에서 DB 직접 접근
- Service에서 Next.js 특화 기능(revalidatePath 등) 사용
```

---

## 2. 아키텍처 다이어그램

### 2.1 현재 구조 (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  page.tsx   │    │ component/  │    │   layout    │      │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘      │
│         │                  │                                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    actions.ts                        │    │
│  │  - 인증 확인                                         │    │
│  │  - 비즈니스 로직 (❌ 문제: 여기에 집중됨)            │    │
│  │  - DB 직접 접근 (❌ 문제)                            │    │
│  │  - revalidatePath                                    │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DB Layer                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ lib/supabase│    │ migrations/ │    │    RLS      │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 권장 구조 (After)

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  page.tsx   │    │ component/  │    │   layout    │      │
│  │  (렌더링만) │    │ (표시만)    │    │             │      │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘      │
│         │                  │                                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    actions.ts                        │    │
│  │  - 인증 확인 (auth())                               │    │
│  │  - 입력 검증 (Zod)                                  │    │
│  │  - Service 호출 ✅                                   │    │
│  │  - revalidatePath                                    │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer (신규)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   services/*.ts                      │    │
│  │  - 비즈니스 로직 집중 ✅                             │    │
│  │  - 트랜잭션 관리                                     │    │
│  │  - 도메인 규칙 적용                                  │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DB Layer                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ lib/supabase│    │ migrations/ │    │    RLS      │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 레이어별 상세 가이드

### 3.1 UI Layer (Page / Component)

#### 역할 (Role)

| 책임 | 설명 |
|-----|------|
| 사용자 인터페이스 렌더링 | HTML/JSX 생성 및 표시 |
| 이벤트 핸들링 | 클릭, 입력 등 사용자 상호작용 처리 |
| 상태 표시 | 로딩, 에러, 성공 상태 시각화 |
| 라우팅 | 페이지 간 네비게이션 |

```typescript
// ✅ UI Layer의 올바른 책임
// app/buyer/page.tsx

export default async function BuyerHomePage() {
  // 데이터 가져오기 (Action 호출)
  const products = await getAvailableProducts();

  // 렌더링만 담당
  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### 설계 의도 및 분석 (Analysis)

**왜 UI는 렌더링만 담당해야 하는가?**

1. **관심사 분리**: UI 변경이 비즈니스 로직에 영향을 주지 않음
2. **재사용성**: 동일한 컴포넌트를 다양한 데이터와 함께 사용 가능
3. **테스트 용이성**: 컴포넌트 단위 테스트가 간단해짐
4. **성능 최적화**: Server Component를 최대한 활용 가능

**Next.js 15에서의 고려사항:**

```typescript
// Server Component (기본값) - 비동기 데이터 페칭 가능
async function ProductList() {
  const products = await getProducts(); // Server Action 호출
  return <>{products.map(...)}</>;
}

// Client Component - 상호작용 필요 시에만
'use client';
function ProductFilter({ onFilter }) {
  const [filter, setFilter] = useState('all');
  return <button onClick={() => onFilter(filter)}>필터</button>;
}
```

#### 추천 구조 (Recommendation)

```
app/
├── buyer/
│   ├── page.tsx              # Server Component (데이터 페칭)
│   ├── layout.tsx            # 레이아웃
│   └── product/
│       └── [id]/
│           └── page.tsx      # 상품 상세 페이지
│
components/
├── product/
│   ├── product-card.tsx      # 프레젠테이션 컴포넌트
│   ├── product-list.tsx      # 리스트 컴포넌트
│   └── product-filter.tsx    # 필터 (Client Component)
└── ui/
    └── button.tsx            # 공통 UI 컴포넌트
```

#### 구현 시 고려사항 (Consideration)

| 항목 | 가이드 |
|-----|-------|
| **Server Component 우선** | `'use client'`는 필요한 경우에만 사용 |
| **Props 타입 명시** | 모든 컴포넌트에 TypeScript 타입 정의 |
| **Suspense 활용** | 비동기 데이터 로딩 시 fallback UI 제공 |
| **Error Boundary** | 에러 상황에 대한 UI 대응 |
| **접근성** | ARIA 속성, 키보드 네비게이션 지원 |

```typescript
// ✅ 좋은 예시: Props 타입과 Suspense 사용
interface ProductCardProps {
  product: ProductData;
  showActions?: boolean;
}

export function ProductCard({ product, showActions = true }: ProductCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3>{product.name}</h3>
      <p>{product.discount_price}원</p>
      {showActions && <ReserveButton productId={product.id} />}
    </div>
  );
}

// ✅ Suspense로 로딩 상태 처리
<Suspense fallback={<ProductSkeleton />}>
  <ProductList />
</Suspense>
```

---

### 3.2 API Layer (Server Actions / Route)

#### 역할 (Role)

| 책임 | 설명 |
|-----|------|
| 요청 수신 | 클라이언트로부터 요청 받기 |
| 인증/인가 확인 | `auth()`로 사용자 확인 |
| 입력 검증 | Zod 스키마로 데이터 유효성 검사 |
| Service 호출 | 비즈니스 로직 위임 |
| 응답 반환 | 결과를 클라이언트에 전달 |
| 캐시 무효화 | `revalidatePath()` 호출 |

```typescript
// ✅ API Layer의 올바른 구조
// app/seller/actions.ts

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { StoreService } from "@/services/store/store.service";

export async function createStore(name: string, address?: string) {
  // 1. 인증 확인
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "인증되지 않은 사용자입니다." };
  }

  // 2. 입력 검증 (간단한 검증은 여기서)
  if (!name || name.trim().length === 0) {
    return { success: false, error: "가게 이름을 입력해주세요." };
  }

  // 3. Service 호출 (비즈니스 로직 위임)
  const result = await StoreService.create(userId, {
    name: name.trim(),
    address: address?.trim(),
  });

  // 4. 캐시 무효화 (Next.js 특화 기능은 Action에서)
  if (result.success) {
    revalidatePath("/seller");
    revalidatePath("/seller/dashboard");
  }

  // 5. 응답 반환
  return result;
}
```

#### 설계 의도 및 분석 (Analysis)

**왜 API Layer는 얇아야 하는가?**

1. **단일 책임**: 요청/응답 처리에만 집중
2. **프레임워크 의존성 격리**: Next.js 특화 기능(`revalidatePath`, `cookies` 등)을 이 계층에 격리
3. **테스트 용이성**: Service를 모킹하여 Action 테스트 가능
4. **재사용성**: 동일한 Service를 여러 Action에서 호출 가능

**Server Actions vs API Routes:**

```typescript
// ✅ Server Actions 사용 (권장)
// - 타입 안전성
// - 코드 최적화
// - Progressive Enhancement

// app/seller/actions.ts
"use server";
export async function createProduct(formData: ProductFormData) {
  // ...
}

// ❌ API Routes 사용 (불가피한 경우에만)
// - 웹훅 수신
// - 외부 서비스 연동
// - 파일 스트리밍

// app/api/webhook/route.ts
export async function POST(req: Request) {
  // 웹훅 처리
}
```

#### 추천 구조 (Recommendation)

```
app/
├── seller/
│   ├── actions.ts            # 사장님 관련 Server Actions
│   ├── upload/
│   │   ├── actions.ts        # 상품 등록 Actions
│   │   └── schema.ts         # Zod 스키마 (입력 검증)
│   └── dashboard/
│       └── actions.ts        # 대시보드 Actions
│
├── buyer/
│   ├── actions.ts            # 구매자 관련 Server Actions
│   └── product/
│       └── actions.ts        # 상품 관련 Actions
│
└── api/
    └── sync-user/
        └── route.ts          # API Route (외부 연동용)
```

#### 구현 시 고려사항 (Consideration)

| 항목 | 가이드 |
|-----|-------|
| **에러 핸들링** | try-catch로 감싸고 일관된 에러 응답 반환 |
| **타입 안전성** | 입력/출력 타입 명시 |
| **검증 순서** | 인증 → 권한 → 입력 검증 → Service 호출 |
| **revalidatePath 위치** | Service가 아닌 Action에서 호출 |
| **로깅** | 에러 발생 시 console.error로 기록 |

```typescript
// ✅ 표준 에러 핸들링 패턴
export async function someAction(input: Input): Promise<ActionResult> {
  try {
    // 1. 인증
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    // 2. 권한 확인 (필요시)
    const hasPermission = await checkPermission(userId);
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다." };
    }

    // 3. 입력 검증
    const validationResult = inputSchema.safeParse(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.message };
    }

    // 4. Service 호출
    const result = await SomeService.doSomething(validationResult.data);

    // 5. 캐시 무효화
    if (result.success) {
      revalidatePath("/some-path");
    }

    return result;
  } catch (error) {
    console.error("Error in someAction:", error);
    return { success: false, error: "시스템 오류가 발생했습니다." };
  }
}
```

---

### 3.3 Service Layer (비즈니스 로직)

#### 역할 (Role)

| 책임 | 설명 |
|-----|------|
| 비즈니스 로직 | 도메인 규칙 적용 및 처리 |
| 트랜잭션 관리 | 여러 DB 작업의 원자성 보장 |
| 데이터 변환 | 엔티티 ↔ DTO 변환 |
| 유효성 검사 | 비즈니스 규칙 기반 검증 |
| 외부 서비스 연동 | 이메일, 알림 등 호출 |

```typescript
// ✅ Service Layer 예시
// services/store/store.service.ts

import { createClient } from "@/lib/supabase/server";
import type { StoreData, CreateStoreInput } from "./store.types";

export class StoreService {
  /**
   * 가게 생성
   * 
   * 비즈니스 규칙:
   * - 한 사용자당 하나의 가게만 등록 가능
   * - 가게 이름은 2자 이상이어야 함
   */
  static async create(
    userId: string,
    input: CreateStoreInput
  ): Promise<{ success: true; store: StoreData } | { success: false; error: string }> {
    // 비즈니스 규칙 검증
    if (input.name.length < 2) {
      return { success: false, error: "가게 이름은 2자 이상이어야 합니다." };
    }

    // 기존 가게 확인 (비즈니스 규칙: 1인 1가게)
    const existingStore = await this.findByOwnerId(userId);
    if (existingStore) {
      return { success: false, error: "이미 가게가 등록되어 있습니다." };
    }

    // DB 작업
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .insert({
        owner_id: userId,
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating store:", error);
      return { success: false, error: "가게 등록에 실패했습니다." };
    }

    return { success: true, store: data as StoreData };
  }

  /**
   * 소유자 ID로 가게 조회
   */
  static async findByOwnerId(userId: string): Promise<StoreData | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error finding store:", error);
      return null;
    }

    return data as StoreData;
  }
}
```

#### 설계 의도 및 분석 (Analysis)

**왜 Service Layer가 필요한가?**

1. **비즈니스 로직 집중**: 핵심 도메인 규칙을 한 곳에서 관리
2. **재사용성**: 여러 Action에서 동일한 Service 메서드 호출 가능
3. **테스트 용이성**: 프레임워크 의존성 없이 비즈니스 로직 테스트
4. **유지보수성**: 비즈니스 규칙 변경 시 Service만 수정

**Service Layer의 핵심 원칙:**

```typescript
// ✅ Service는 프레임워크에 의존하지 않음
// - revalidatePath 사용 ❌
// - cookies() 사용 ❌
// - redirect() 사용 ❌

// ✅ Service는 순수한 비즈니스 로직만 처리
class ProductService {
  static async reserve(productId: string, buyerId: string) {
    // 비즈니스 규칙 검증
    const product = await this.findById(productId);
    
    if (!product) {
      return { success: false, error: "상품이 존재하지 않습니다." };
    }
    
    if (product.status !== "AVAILABLE") {
      return { success: false, error: "이미 예약된 상품입니다." };
    }
    
    if (new Date(product.pickup_deadline) < new Date()) {
      return { success: false, error: "픽업 마감 시간이 지났습니다." };
    }

    // 트랜잭션 처리 (Supabase RPC 함수 호출)
    const result = await this.executeReservation(productId, buyerId);
    
    return result;
  }
}
```

#### 추천 구조 (Recommendation)

```
services/
├── store/
│   ├── store.service.ts      # 가게 관련 비즈니스 로직
│   ├── store.types.ts        # 타입 정의
│   └── index.ts              # 배럴 파일
│
├── product/
│   ├── product.service.ts    # 상품 관련 비즈니스 로직
│   ├── product.types.ts      # 타입 정의
│   └── index.ts
│
├── order/
│   ├── order.service.ts      # 주문/예약 관련 비즈니스 로직
│   ├── order.types.ts        # 타입 정의
│   └── index.ts
│
└── index.ts                  # 전체 배럴 파일
```

**타입 파일 예시:**

```typescript
// services/store/store.types.ts

export interface StoreData {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface CreateStoreInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  address?: string;
  phone?: string;
}
```

#### 구현 시 고려사항 (Consideration)

| 항목 | 가이드 |
|-----|-------|
| **프레임워크 독립성** | Next.js 특화 기능 사용 금지 |
| **순수 함수 지향** | 동일 입력 → 동일 출력 |
| **에러 타입화** | 명시적인 에러 타입 반환 |
| **트랜잭션** | Supabase RPC 함수 활용 |
| **로깅** | 비즈니스 로직 흐름 로깅 |

```typescript
// ✅ 트랜잭션 처리 예시 (Supabase RPC 활용)
static async reserveProduct(productId: string, buyerId: string) {
  const supabase = await createClient();
  
  // DB에서 트랜잭션 처리 (reserve_product 함수)
  const { data, error } = await supabase.rpc("reserve_product", {
    p_product_id: productId,
    p_buyer_id: buyerId,
  });

  if (error) {
    console.error("Reserve product error:", error);
    return { success: false, error: "예약 처리 중 오류가 발생했습니다." };
  }

  return data as { success: boolean; message?: string; order_id?: string };
}
```

---

### 3.4 DB Layer (Repository / Supabase Client)

#### 역할 (Role)

| 책임 | 설명 |
|-----|------|
| 데이터 접근 | CRUD 작업 수행 |
| 쿼리 추상화 | SQL/Supabase 쿼리 캡슐화 |
| 연결 관리 | DB 클라이언트 생성 및 관리 |
| 타입 매핑 | DB 결과를 TypeScript 타입으로 변환 |

```typescript
// ✅ DB Layer 구조
// lib/supabase/server.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
```

#### 설계 의도 및 분석 (Analysis)

**왜 DB 접근을 추상화해야 하는가?**

1. **구현 세부사항 숨김**: Supabase 특정 문법이 상위 레이어에 노출되지 않음
2. **교체 용이성**: DB 변경 시 이 계층만 수정
3. **일관성**: 모든 DB 접근이 동일한 패턴 사용
4. **보안**: RLS 정책과 연계된 접근 제어

**Supabase 클라이언트 구분:**

```typescript
// 1. Server Component/Action용 (Clerk 인증 연동)
// lib/supabase/server.ts
export async function createClient() { ... }

// 2. Client Component용 (훅 형태)
// lib/supabase/clerk-client.ts
export function useClerkSupabaseClient() { ... }

// 3. 관리자용 (RLS 우회)
// lib/supabase/service-role.ts
export function getServiceRoleClient() { ... }

// 4. 공개 데이터용 (인증 불필요)
// lib/supabase/client.ts
export const supabase = createClient(...);
```

#### 추천 구조 (Recommendation)

```
lib/
├── supabase/
│   ├── server.ts             # Server Component/Action용
│   ├── clerk-client.ts       # Client Component용 (훅)
│   ├── service-role.ts       # 관리자 권한용
│   └── client.ts             # 공개 데이터용
│
└── database.types.ts         # Supabase 자동 생성 타입
```

**선택적: Repository 패턴 적용 시**

```
repositories/
├── store.repository.ts       # 가게 테이블 접근
├── product.repository.ts     # 상품 테이블 접근
└── order.repository.ts       # 주문 테이블 접근
```

```typescript
// repositories/product.repository.ts (선택적)

import { createClient } from "@/lib/supabase/server";
import type { ProductData } from "@/services/product/product.types";

export class ProductRepository {
  static async findById(id: string): Promise<ProductData | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as ProductData;
  }

  static async findAvailable(): Promise<ProductData[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "AVAILABLE")
      .gt("pickup_deadline", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ProductData[];
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  }
}
```

#### 구현 시 고려사항 (Consideration)

| 항목 | 가이드 |
|-----|-------|
| **타입 안전성** | Supabase CLI로 타입 자동 생성 |
| **RLS 정책** | 테이블별 보안 정책 설정 |
| **에러 코드** | PGRST116 (not found) 등 표준 처리 |
| **쿼리 최적화** | select 필드 명시, 인덱스 활용 |
| **연결 재사용** | 클라이언트 인스턴스 관리 |

```typescript
// ✅ Supabase 타입 생성 명령어
// package.json scripts에 추가
{
  "scripts": {
    "gen:types": "npx supabase gen types typescript --project-id \"YOUR_PROJECT_ID\" --schema public > lib/database.types.ts"
  }
}

// ✅ 타입 적용
import type { Database } from "@/lib/database.types";

const supabase = createClient<Database>(...);

// 자동 완성 및 타입 체크 지원
const { data } = await supabase
  .from("products")  // 테이블명 자동완성
  .select("*")
  .eq("status", "AVAILABLE");  // 컬럼명 자동완성
```

---

## 4. 권장 디렉토리 구조

### 4.1 전체 프로젝트 구조

```
프로젝트/
├── app/                        # Next.js App Router (UI + API Layer)
│   ├── buyer/
│   │   ├── page.tsx           # 구매자 메인 페이지
│   │   ├── layout.tsx         # 레이아웃
│   │   ├── actions.ts         # Server Actions
│   │   └── product/
│   │       └── [id]/
│   │           ├── page.tsx   # 상품 상세
│   │           └── actions.ts # 상품 관련 Actions
│   │
│   ├── seller/
│   │   ├── page.tsx           # 사장님 메인
│   │   ├── actions.ts         # Server Actions
│   │   ├── upload/
│   │   │   ├── page.tsx       # 상품 등록
│   │   │   ├── actions.ts     # 등록 Actions
│   │   │   └── schema.ts      # Zod 스키마
│   │   └── dashboard/
│   │       └── page.tsx       # 대시보드
│   │
│   ├── api/                   # API Routes (불가피한 경우만)
│   │   └── webhook/
│   │       └── route.ts
│   │
│   ├── layout.tsx             # Root 레이아웃
│   ├── page.tsx               # 홈페이지
│   └── globals.css            # 전역 스타일
│
├── components/                 # 공유 컴포넌트 (UI Layer)
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-list.tsx
│   │   └── product-filter.tsx
│   ├── navigation/
│   │   └── navbar.tsx
│   ├── providers/
│   │   └── sync-user-provider.tsx
│   └── ui/                    # shadcn/ui 컴포넌트
│       ├── button.tsx
│       └── input.tsx
│
├── services/                   # Service Layer (신규)
│   ├── store/
│   │   ├── store.service.ts
│   │   ├── store.types.ts
│   │   └── index.ts
│   ├── product/
│   │   ├── product.service.ts
│   │   ├── product.types.ts
│   │   └── index.ts
│   ├── order/
│   │   ├── order.service.ts
│   │   ├── order.types.ts
│   │   └── index.ts
│   └── index.ts               # 배럴 파일
│
├── lib/                        # DB Layer + 유틸리티
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── clerk-client.ts
│   │   ├── service-role.ts
│   │   └── client.ts
│   ├── database.types.ts      # Supabase 자동 생성 타입
│   └── utils.ts
│
├── hooks/                      # 커스텀 훅
│   └── use-sync-user.ts
│
├── types/                      # 공유 타입 정의
│   └── common.ts
│
├── supabase/                   # DB 마이그레이션
│   ├── migrations/
│   │   └── *.sql
│   └── config.toml
│
└── docs/                       # 문서
    ├── PRD.md
    └── architecture-review.md
```

### 4.2 기능별 파일 배치 가이드

| 파일 유형 | 위치 | 예시 |
|----------|------|------|
| 페이지 컴포넌트 | `app/[domain]/page.tsx` | `app/buyer/page.tsx` |
| 레이아웃 | `app/[domain]/layout.tsx` | `app/seller/layout.tsx` |
| Server Actions | `app/[domain]/actions.ts` | `app/seller/actions.ts` |
| 입력 스키마 | `app/[domain]/[feature]/schema.ts` | `app/seller/upload/schema.ts` |
| 공유 컴포넌트 | `components/[domain]/` | `components/product/product-card.tsx` |
| UI 컴포넌트 | `components/ui/` | `components/ui/button.tsx` |
| Service | `services/[domain]/[domain].service.ts` | `services/product/product.service.ts` |
| Service 타입 | `services/[domain]/[domain].types.ts` | `services/product/product.types.ts` |
| DB 클라이언트 | `lib/supabase/` | `lib/supabase/server.ts` |
| 공유 타입 | `types/` | `types/common.ts` |

---

## 5. 리팩토링 가이드

### 5.1 리팩토링 전후 비교

**기존 코드 (Before):**

```typescript
// app/seller/actions.ts - 모든 로직이 Action에 집중됨

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStore(name: string, address?: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    // ❌ 비즈니스 로직이 Action에 있음
    if (!name || name.trim().length === 0) {
      return { success: false, error: "가게 이름을 입력해주세요." };
    }

    // ❌ DB 접근이 Action에서 직접 이루어짐
    const supabase = await createClient();
    
    // ❌ 기존 가게 확인 로직도 여기에
    const { data: existing } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (existing) {
      return { success: false, error: "이미 가게 정보가 등록되어 있습니다." };
    }

    // ❌ Insert 로직도 여기에
    const { data, error } = await supabase
      .from("stores")
      .insert({
        owner_id: userId,
        name: name.trim(),
        address: address?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating store:", error);
      return { success: false, error: "가게 정보 등록에 실패했습니다." };
    }

    revalidatePath("/seller");
    return { success: true, store: data };
  } catch (error) {
    console.error("Error in createStore:", error);
    return { success: false, error: "시스템 오류가 발생했습니다." };
  }
}
```

**개선된 코드 (After):**

```typescript
// services/store/store.service.ts - 비즈니스 로직 분리

import { createClient } from "@/lib/supabase/server";
import type { StoreData, CreateStoreInput, ServiceResult } from "./store.types";

export class StoreService {
  /**
   * 소유자 ID로 가게 조회
   */
  static async findByOwnerId(userId: string): Promise<StoreData | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error finding store:", error);
      return null;
    }

    return data as StoreData;
  }

  /**
   * 가게 생성
   * 
   * 비즈니스 규칙:
   * - 가게 이름은 필수이며 빈 문자열 불가
   * - 한 사용자당 하나의 가게만 등록 가능
   */
  static async create(
    userId: string,
    input: CreateStoreInput
  ): Promise<ServiceResult<StoreData>> {
    // 비즈니스 규칙: 이름 필수
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "가게 이름을 입력해주세요." };
    }

    // 비즈니스 규칙: 1인 1가게
    const existingStore = await this.findByOwnerId(userId);
    if (existingStore) {
      return { success: false, error: "이미 가게 정보가 등록되어 있습니다." };
    }

    // DB 작업
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .insert({
        owner_id: userId,
        name: input.name.trim(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating store:", error);
      return { success: false, error: "가게 정보 등록에 실패했습니다." };
    }

    return { success: true, data: data as StoreData };
  }
}
```

```typescript
// services/store/store.types.ts - 타입 정의

export interface StoreData {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface CreateStoreInput {
  name: string;
  address?: string;
  phone?: string;
}

// 공통 결과 타입
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

```typescript
// app/seller/actions.ts - Action은 얇게 유지

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { StoreService } from "@/services/store";

export async function createStore(name: string, address?: string, phone?: string) {
  // 1. 인증 확인
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "인증되지 않은 사용자입니다." };
  }

  // 2. Service 호출 (비즈니스 로직 위임)
  const result = await StoreService.create(userId, { name, address, phone });

  // 3. 캐시 무효화 (Next.js 특화 기능)
  if (result.success) {
    revalidatePath("/seller");
    revalidatePath("/seller/dashboard");
  }

  // 4. 결과 반환
  if (result.success) {
    return { success: true, store: result.data };
  }
  return { success: false, error: result.error };
}

export async function getStore() {
  const { userId } = await auth();
  if (!userId) return null;

  return await StoreService.findByOwnerId(userId);
}
```

### 5.2 리팩토링 체크리스트

**Action 리팩토링:**

- [ ] 비즈니스 로직을 Service로 이동
- [ ] Action은 인증/검증/Service호출/캐시무효화만 수행
- [ ] 에러 핸들링 패턴 일관성 유지

**Service 생성:**

- [ ] 도메인별 Service 클래스 생성
- [ ] 타입 파일 분리
- [ ] 배럴 파일(index.ts) 생성
- [ ] 프레임워크 의존성 제거 확인

---

## 6. Cursor 구현 가이드

### 6.1 Phase별 마이그레이션 계획

#### Phase 1: Service Layer 기반 구조 생성

```bash
# 디렉토리 생성
mkdir -p services/store services/product services/order
```

**생성할 파일:**

```
services/
├── store/
│   ├── store.service.ts
│   ├── store.types.ts
│   └── index.ts
├── product/
│   ├── product.service.ts
│   ├── product.types.ts
│   └── index.ts
├── order/
│   ├── order.service.ts
│   ├── order.types.ts
│   └── index.ts
└── index.ts
```

#### Phase 2: Store 도메인 리팩토링

**대상 파일:**
- `app/seller/actions.ts` → `services/store/store.service.ts`

**순서:**
1. `store.types.ts` 타입 정의
2. `store.service.ts` 비즈니스 로직 이동
3. `app/seller/actions.ts` 리팩토링 (Service 호출)
4. 테스트 및 검증

#### Phase 3: Product 도메인 리팩토링

**대상 파일:**
- `app/buyer/actions.ts` (상품 조회)
- `app/seller/upload/actions.ts` (상품 등록)

**순서:**
1. `product.types.ts` 타입 정의
2. `product.service.ts` 비즈니스 로직 이동
3. Actions 리팩토링
4. 테스트 및 검증

#### Phase 4: Order 도메인 리팩토링

**대상 파일:**
- `app/buyer/actions.ts` (예약 기능)

**순서:**
1. `order.types.ts` 타입 정의
2. `order.service.ts` 비즈니스 로직 이동
3. Actions 리팩토링
4. 테스트 및 검증

### 6.2 Cursor AI 프롬프트 템플릿

**Service 생성 시:**

```
다음 도메인의 Service Layer를 생성해줘:
- 도메인: [store/product/order]
- 기존 Action 파일: app/[path]/actions.ts

요구사항:
1. services/[도메인]/[도메인].types.ts에 타입 정의
2. services/[도메인]/[도메인].service.ts에 비즈니스 로직 분리
3. 기존 Action 파일에서 Service 호출하도록 수정
4. Next.js 특화 기능(revalidatePath 등)은 Action에 유지
```

**Action 리팩토링 시:**

```
app/[path]/actions.ts 파일을 리팩토링해줘:
- Service: services/[도메인]/[도메인].service.ts 사용
- Action은 얇게: 인증 확인 → Service 호출 → 캐시 무효화
- 에러 핸들링 패턴 유지
```

---

## 7. 기능별 점검 체크리스트

### 7.1 기능 구현 시 점검 항목

**UI Layer 점검:**

- [ ] Server Component로 구현 가능한가?
- [ ] Client Component가 필요한 경우 최소 범위로 분리했는가?
- [ ] Props 타입이 명시되어 있는가?
- [ ] Suspense로 로딩 상태를 처리했는가?
- [ ] 에러 상태를 UI로 표시하는가?

**API Layer 점검:**

- [ ] 인증 확인(`auth()`)이 최상단에 있는가?
- [ ] 입력 검증이 Service 호출 전에 수행되는가?
- [ ] Service를 호출하여 비즈니스 로직을 위임했는가?
- [ ] `revalidatePath`가 성공 시에만 호출되는가?
- [ ] 일관된 응답 형식을 사용하는가?

**Service Layer 점검:**

- [ ] 비즈니스 규칙이 명시적으로 정의되어 있는가?
- [ ] 프레임워크 의존성이 없는가?
- [ ] 타입이 별도 파일로 분리되어 있는가?
- [ ] 에러 상황별 명시적 메시지를 반환하는가?
- [ ] 트랜잭션이 필요한 경우 처리되었는가?

**DB Layer 점검:**

- [ ] 적절한 Supabase 클라이언트를 사용했는가?
- [ ] RLS 정책이 설정되어 있는가?
- [ ] 에러 코드(PGRST116 등)를 적절히 처리했는가?
- [ ] 필요한 필드만 select 했는가?

### 7.2 코드 리뷰 체크리스트

```markdown
## 코드 리뷰 점검표

### 아키텍처
- [ ] 비즈니스 로직이 Service에 있는가?
- [ ] Action이 얇게 유지되는가?
- [ ] 프레임워크 의존성이 적절히 격리되는가?

### 타입 안전성
- [ ] 모든 함수에 입출력 타입이 명시되는가?
- [ ] any 타입 사용을 피했는가?

### 에러 처리
- [ ] try-catch로 적절히 감싸져 있는가?
- [ ] 사용자 친화적 에러 메시지를 반환하는가?
- [ ] 에러 로깅이 되어 있는가?

### 보안
- [ ] 인증 확인이 누락되지 않았는가?
- [ ] 권한 검사가 필요한 곳에 있는가?
- [ ] 입력 값이 검증되는가?
```

---

## 부록: 표준 코드 템플릿

### A. Service 템플릿

```typescript
// services/[domain]/[domain].service.ts

import { createClient } from "@/lib/supabase/server";
import type { 
  [Domain]Data, 
  Create[Domain]Input, 
  ServiceResult 
} from "./[domain].types";

export class [Domain]Service {
  /**
   * ID로 조회
   */
  static async findById(id: string): Promise<[Domain]Data | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("[table]")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error finding [domain]:", error);
      return null;
    }

    return data as [Domain]Data;
  }

  /**
   * 생성
   * 
   * 비즈니스 규칙:
   * - [규칙 1]
   * - [규칙 2]
   */
  static async create(
    input: Create[Domain]Input
  ): Promise<ServiceResult<[Domain]Data>> {
    // 비즈니스 규칙 검증
    // ...

    // DB 작업
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("[table]")
      .insert({ ... })
      .select()
      .single();

    if (error) {
      console.error("Error creating [domain]:", error);
      return { success: false, error: "[domain] 생성에 실패했습니다." };
    }

    return { success: true, data: data as [Domain]Data };
  }
}
```

### B. Action 템플릿

```typescript
// app/[route]/actions.ts

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { [Domain]Service } from "@/services/[domain]";

export async function create[Domain](input: Input) {
  // 1. 인증 확인
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "인증되지 않은 사용자입니다." };
  }

  // 2. 입력 검증 (선택적)
  // const validationResult = schema.safeParse(input);
  // if (!validationResult.success) { ... }

  // 3. Service 호출
  const result = await [Domain]Service.create(input);

  // 4. 캐시 무효화
  if (result.success) {
    revalidatePath("/[path]");
  }

  // 5. 결과 반환
  return result;
}
```

### C. 타입 템플릿

```typescript
// services/[domain]/[domain].types.ts

export interface [Domain]Data {
  id: string;
  // ... 필드들
  created_at: string;
}

export interface Create[Domain]Input {
  // ... 입력 필드들
}

export interface Update[Domain]Input {
  // ... 업데이트 필드들 (Partial)
}

// 공통 서비스 결과 타입
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

> **문서 버전**: 1.0
> **작성일**: 2026-01-21
> **마지막 수정**: 2026-01-21

