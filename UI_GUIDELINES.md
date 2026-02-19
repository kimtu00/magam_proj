# UI 지침서 (UI Guidelines)

> **기준일**: 2026-02-13 (컬러/폰트 확정 적용: 2026-02-13)  
> **서비스명**: 오늘마감 (지역 소상공인 마감 임박 식품 플랫폼)  
> **CSS 체계**: Tailwind CSS v4 + shadcn/ui New York 스타일  
> **디자인 철학**: Mobile-First, 최대 너비 430px 기준, 하단 네비게이션 중심  
> **브랜드 컬러**: Primary 에코 그린 `#4CAF50` · Accent 소프트 블루 `#4FC3F7` · Destructive 코랄 레드 `#EF5350`  
> **브랜드 폰트**: Noto Sans KR (한국어) + Geist Sans (영문/숫자) + Geist Mono (코드)

---

## 목차

- [1. Color System](#1-color-system-색상-시스템)
- [2. Typography](#2-typography-타이포그래피)
- [3. Spacing & Layout](#3-spacing--layout-간격과-레이아웃)
- [4. Components](#4-components-컴포넌트-가이드)
- [5. Branding](#5-branding-브랜딩)
- [6. External React Libraries](#6-external-react-libraries-외부-라이브러리)

---

## 1. Color System (색상 시스템)

> 모든 색상은 **OKLCH 색공간** 기반 CSS 변수로 정의됩니다.  
> `app/globals.css`의 `:root`(라이트)와 `.dark`(다크) 블록에서 관리합니다.  
> Tailwind CSS v4의 `@theme inline` 블록을 통해 `bg-primary`, `text-foreground` 등의 유틸리티 클래스로 사용합니다.

### 1.1 색상 토큰 아키텍처

```
CSS 변수 (--primary) 
  → @theme inline 매핑 (--color-primary: var(--primary))
    → Tailwind 유틸리티 클래스 (bg-primary, text-primary 등)
```

### 1.2 브랜드 팔레트 (확정)

> 이미지 분석 기반으로 결정된 **확정 브랜드 컬러**입니다.  
> `app/globals.css` `:root` 블록에 적용 완료되었습니다.

| 역할 | CSS 변수 | OKLCH | HEX (근사값) | 용도 |
|------|---------|-------|-------------|------|
| **Primary** | `--primary` | `oklch(0.627 0.194 145)` | `#4CAF50` 에코 그린 | CTA 버튼, 활성 상태, 강조 |
| Primary Foreground | `--primary-foreground` | `oklch(1 0 0)` | `#FFFFFF` | Primary 위 흰색 텍스트 |
| **Accent** | `--accent` | `oklch(0.74 0.14 230)` | `#4FC3F7` 소프트 블루 | 아이콘 강조, 뱃지, 인포 |
| Accent Foreground | `--accent-foreground` | `oklch(1 0 0)` | `#FFFFFF` | Accent 위 흰색 텍스트 |
| **Destructive** | `--destructive` | `oklch(0.577 0.245 27.325)` | `#EF5350` 코랄 레드 | 삭제, 오류, 수량 뱃지 |
| Background | `--background` | `oklch(0.969 0 0)` | `#F5F5F5` | 페이지 배경 |
| Card | `--card` | `oklch(1 0 0)` | `#FFFFFF` | 카드 배경 |
| Muted Text | `--muted-foreground` | `oklch(0.556 0 0)` | `#9E9E9E` | 보조 텍스트 |

### 1.3 Semantic Color Tokens (의미론적 색상 토큰)

#### 라이트 모드 (`:root`) / 다크 모드 (`.dark`) 대조표

| 토큰 | Tailwind 클래스 | 라이트 | 다크 | 용도 |
|------|---------------|--------|------|------|
| `--background` | `bg-background` | `oklch(0.969 0 0)` #F5F5F5 | `oklch(0.145 0 0)` 거의 검정 | 페이지 배경 |
| `--foreground` | `text-foreground` | `oklch(0.2 0 0)` 거의 검정 | `oklch(0.985 0 0)` 거의 흰색 | 기본 텍스트 |
| `--primary` | `bg-primary` / `text-primary` | `oklch(0.627 0.194 145)` **에코 그린** | `oklch(0.7 0.18 145)` 밝은 그린 | 주요 액션, CTA 버튼 |
| `--primary-foreground` | `text-primary-foreground` | `oklch(1 0 0)` 흰색 | `oklch(0.1 0 0)` 어두운 색 | primary 위의 텍스트 |
| `--secondary` | `bg-secondary` | `oklch(0.945 0.04 145)` 연한 그린 | `oklch(0.269 0 0)` 어두운 회색 | 보조 UI 요소 |
| `--secondary-foreground` | `text-secondary-foreground` | `oklch(0.35 0.12 145)` 진한 그린 | `oklch(0.985 0 0)` | secondary 위의 텍스트 |
| `--muted` | `bg-muted` | `oklch(0.945 0 0)` | `oklch(0.269 0 0)` | 비활성 배경, 힌트 영역 |
| `--muted-foreground` | `text-muted-foreground` | `oklch(0.556 0 0)` #9E9E9E | `oklch(0.708 0 0)` 밝은 회색 | 보조 텍스트, 플레이스홀더 |
| `--accent` | `bg-accent` | `oklch(0.74 0.14 230)` **소프트 블루** | `oklch(0.55 0.14 230)` 어두운 블루 | 강조 배경, 아이콘 |
| `--accent-foreground` | `text-accent-foreground` | `oklch(1 0 0)` 흰색 | `oklch(0.985 0 0)` | accent 위의 텍스트 |
| `--destructive` | `bg-destructive` / `text-destructive` | `oklch(0.577 0.245 27.325)` **코랄 레드** | `oklch(0.704 0.191 22.216)` 밝은 레드 | 삭제, 오류, 경고 |
| `--border` | `border-border` | `oklch(0.9 0 0)` 밝은 회색 | `oklch(1 0 0 / 10%)` 10% 흰색 | 테두리 |
| `--input` | `border-input` | `oklch(0.9 0 0)` | `oklch(1 0 0 / 15%)` 15% 흰색 | 인풋 테두리 |
| `--ring` | `ring-ring` | `oklch(0.627 0.194 145)` 에코 그린 | `oklch(0.7 0.18 145)` 밝은 그린 | 포커스 링 |

> **핵심 특징**: Primary를 **에코 그린**으로 변경 — 친환경 식품 플랫폼의 브랜드 아이덴티티 반영  
> Accent는 **소프트 블루** — 정보/네비게이션 아이콘용 보조 컬러

### 1.3 Component Color Tokens

#### 카드 / 팝오버

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `--card` | `oklch(1 0 0)` 흰색 | `oklch(0.205 0 0)` 어두운 회색 | Card 컴포넌트 배경 |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Card 내부 텍스트 |
| `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Popover/Dropdown 배경 |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Popover 내부 텍스트 |

#### 사이드바

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `--sidebar` | `oklch(1 0 0)` 흰색 | `oklch(0.205 0 0)` | 사이드바 배경 |
| `--sidebar-foreground` | `oklch(0.2 0 0)` | `oklch(0.985 0 0)` | 사이드바 텍스트 |
| `--sidebar-primary` | `oklch(0.627 0.194 145)` **에코 그린** | `oklch(0.7 0.18 145)` 밝은 그린 | 사이드바 활성 아이템 |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` 흰색 | `oklch(0.1 0 0)` | 사이드바 활성 텍스트 |
| `--sidebar-accent` | `oklch(0.945 0.04 145)` 연한 그린 | `oklch(0.269 0 0)` | 사이드바 호버 |
| `--sidebar-border` | `oklch(0.9 0 0)` | `oklch(1 0 0 / 10%)` | 사이드바 테두리 |

### 1.4 Chart Colors (차트 색상)

recharts 차트에서 사용하는 5가지 색상입니다.

| 토큰 | Tailwind | 라이트 | 다크 | 계열 |
|------|---------|--------|------|------|
| `--chart-1` | `bg-chart-1` | `oklch(0.627 0.194 145)` **에코 그린** | `oklch(0.7 0.18 145)` | 그린 → 밝은 그린 |
| `--chart-2` | `bg-chart-2` | `oklch(0.74 0.14 230)` **소프트 블루** | `oklch(0.696 0.17 162.48)` | 블루 → 청록 |
| `--chart-3` | `bg-chart-3` | `oklch(0.78 0.15 165)` **민트** | `oklch(0.769 0.188 70.08)` | 민트 → 노랑 |
| `--chart-4` | `bg-chart-4` | `oklch(0.828 0.189 84.429)` 노랑 | `oklch(0.627 0.265 303.9)` | 노랑 → 보라 |
| `--chart-5` | `bg-chart-5` | `oklch(0.577 0.245 27.325)` **코랄 레드** | `oklch(0.645 0.246 16.439)` | 코랄 → 빨강 |

**사용 예시 (recharts):**
```tsx
import { Bar, BarChart } from "recharts";

// globals.css에 정의된 CSS 변수를 직접 참조
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)", 
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
```

### 1.5 상태(Trend) 색상

shadcn/ui 토큰 외에 코드베이스에서 직접 하드코딩된 상태 색상입니다.

| 상태 | 클래스 | 용도 |
|------|--------|------|
| 증가/긍정 | `text-green-600` | 매출 증가, 긍정적 트렌드 (`StatCard`) |
| 감소/부정 | `text-red-600` | 매출 감소, 오류 상태 (`StatCard`) |

> **개선 필요**: 상태 색상은 현재 Tailwind 기본 색상(`green-600`, `red-600`)을 직접 사용 중입니다. 향후 `--color-success`, `--color-warning` 등의 CSS 변수로 통합하는 것을 권장합니다.

### 1.6 알려진 문제점

```css
/* app/globals.css - @layer base */
body {
  @apply bg-background text-foreground; /* CSS 변수 사용 — 하드코딩 제거됨 */
}
```

> **✅ 수정 완료**: 기존에 `background-color: #f5f5f5`가 하드코딩되어 있던 문제를 해결했습니다.  
> 이제 `--background` CSS 변수(`oklch(0.969 0 0)`, #F5F5F5)로 통일 제어됩니다.

---

## 2. Typography (타이포그래피)

### 2.1 폰트 패밀리 (확정)

| 변수 | 폰트 | 용도 | Tailwind 클래스 |
|------|------|------|----------------|
| `--font-noto-kr` | **Noto Sans KR** | 한국어 본문, 제목 (최우선) | `font-sans` |
| `--font-geist-sans` | **Geist Sans** | 영문, 숫자 (폴백) | `font-sans` |
| `--font-geist-mono` | **Geist Mono** | 코드, 숫자 데이터 | `font-mono` |

**`font-sans` 우선순위**: Noto Sans KR → Geist Sans → system sans-serif

**로드 방식** (`app/layout.tsx`):
```tsx
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

**`globals.css` `@theme inline` 설정**:
```css
--font-sans: var(--font-noto-kr), var(--font-geist-sans), sans-serif;
--font-mono: var(--font-geist-mono);
```

> **`display: "swap"`**: 폰트 로드 전 시스템 폰트로 즉시 렌더링 → FOUT 최소화, CLS 방지

### 2.2 텍스트 스케일

현재 Tailwind CSS의 기본 스케일을 사용합니다. 코드베이스에서 실제로 사용되는 주요 클래스입니다.

| 클래스 | 크기 | 사용처 |
|--------|------|--------|
| `text-2xl md:text-3xl font-bold` | 24px / 30px | PageHeader 제목 (`h1`) |
| `text-2xl font-bold` | 24px | Navbar 브랜드명, StatCard 수치 |
| `text-xl font-semibold` | 20px | 섹션 제목 |
| `text-sm font-medium` | 14px | StatCard 레이블, 버튼 기본 |
| `text-sm` | 14px | 본문 텍스트, 설명 |
| `text-xs font-medium` | 12px | 하단 네비 라벨, 배지, 보조 정보 |
| `text-xs` | 12px | 메타 정보, 타임스탬프 |

### 2.3 폰트 굵기 가이드

| 클래스 | 사용처 |
|--------|--------|
| `font-bold` | 페이지 제목, 중요 수치, 브랜드명 |
| `font-semibold` | 카드 제목, 섹션 헤더 |
| `font-medium` | 버튼, 네비 라벨, 레이블 |
| `font-normal` | 일반 본문 텍스트 |

---

## 3. Spacing & Layout (간격과 레이아웃)

### 3.1 모바일 퍼스트 레이아웃

```
최대 너비: 430px (max-w-[430px] mx-auto)
페이지 하단 여백: pb-20 (하단 네비게이션 80px 확보)
상단 여백: pt-16 (상단 Navbar 64px 확보)
기본 수평 패딩: px-4 (16px)
```

**페이지 컨테이너 표준 패턴:**
```tsx
// 소비자/마이페이지 레이아웃
<div className="min-h-screen bg-background pb-20">
  <div className="max-w-[430px] mx-auto p-4 space-y-6">
    {/* 컨텐츠 */}
  </div>
</div>
```

### 3.2 Border Radius 스케일

기준값 `--radius: 0.625rem (10px)`에서 파생됩니다.

| 변수 | 계산값 | Tailwind | 용도 |
|------|--------|---------|------|
| `--radius-sm` | `calc(0.625rem - 4px)` = ~6px | `rounded-sm` | 작은 요소 (Badge 등) |
| `--radius-md` | `calc(0.625rem - 2px)` = ~8px | `rounded-md` | 버튼, 인풋 |
| `--radius-lg` | `0.625rem` = 10px | `rounded-lg` | 카드, 팝오버 |
| `--radius-xl` | `calc(0.625rem + 4px)` = ~14px | `rounded-xl` | 시트, 큰 카드 |

### 3.3 그리드 시스템

| 패턴 | 클래스 | 용도 |
|------|--------|------|
| 2열 그리드 | `grid grid-cols-2 gap-4` | 통계 카드 (모바일) |
| 4열 그리드 | `grid grid-cols-2 lg:grid-cols-4 gap-4` | 대시보드 통계 (반응형) |
| 1열 세로 스택 | `space-y-4` / `space-y-6` | 페이지 섹션 구분 |
| 수평 배치 | `flex items-center gap-2` / `gap-4` | 인라인 요소들 |

---

## 4. Components (컴포넌트 가이드)

### 4.1 shadcn/ui 컴포넌트 현황

> 스타일: **New York**, 베이스 컬러: **neutral**, CSS 변수 사용  
> 설치 명령어: `pnpx shadcn@latest add [component-name]`  
> 위치: `components/ui/`

#### 설치된 컴포넌트 목록 (26개)

**폼 관련 (7개)**

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| Button | `button.tsx` | 모든 액션 버튼 |
| Input | `input.tsx` | 텍스트 입력 |
| Textarea | `textarea.tsx` | 멀티라인 텍스트 |
| Form | `form.tsx` | react-hook-form 통합 래퍼 |
| Label | `label.tsx` | 폼 레이블 |
| Checkbox | `checkbox.tsx` | 체크박스 |
| Select | `select.tsx` | 드롭다운 선택 |

**레이아웃/표시 (8개)**

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| Card | `card.tsx` | 콘텐츠 컨테이너 (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) |
| Badge | `badge.tsx` | 상태 태그, 카운트 |
| Avatar | `avatar.tsx` | 사용자 프로필 이미지 |
| Skeleton | `skeleton.tsx` | 로딩 플레이스홀더 |
| Progress | `progress.tsx` | 진행률 표시 |
| Table | `table.tsx` | 데이터 테이블 |
| Tabs | `tabs.tsx` | 탭 네비게이션 |
| Separator | `separator.tsx` | 구분선 |

**오버레이 (5개)**

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| Dialog | `dialog.tsx` | 모달 다이얼로그 |
| AlertDialog | `alert-dialog.tsx` | 확인/취소 다이얼로그 |
| Sheet | `sheet.tsx` | 사이드에서 슬라이드인 패널 |
| Popover | `popover.tsx` | 앵커 기반 팝오버 |
| DropdownMenu | `dropdown-menu.tsx` | 드롭다운 메뉴 |

**기타 (6개)**

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| Accordion | `accordion.tsx` | 접기/펼치기 |
| Calendar | `calendar.tsx` | 날짜 선택 달력 |
| DatetimePicker | `datetime-picker.tsx` | 날짜+시간 선택 (커스텀) |
| Toast | `toast.tsx` | 토스트 알림 |
| Toaster | `toaster.tsx` | 토스트 컨테이너 |
| Switch | `switch.tsx` | 토글 스위치 |

---

### 4.2 Button 컴포넌트 가이드

#### Variants

| variant | 배경 | 텍스트 | 용도 |
|---------|------|--------|------|
| `default` | `bg-primary` | `text-primary-foreground` | 주요 CTA, 제출 버튼 |
| `destructive` | `bg-destructive` | 흰색 | 삭제, 취소 등 위험 액션 |
| `outline` | `bg-background` | 기본 | 보조 액션, 테두리 강조 |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | 덜 중요한 액션 |
| `ghost` | 투명 | 기본 | 아이콘 버튼, 텍스트 버튼 |
| `link` | 투명 | `text-primary` + 밑줄 | 내비게이션, 텍스트 링크 |

#### Sizes

| size | 높이 | 패딩 | 용도 |
|------|------|------|------|
| `default` | `h-9` (36px) | `px-4 py-2` | 일반 버튼 |
| `sm` | `h-8` (32px) | `px-3` | 작은 버튼, 테이블 내 액션 |
| `lg` | `h-10` (40px) | `px-6` | 큰 CTA 버튼 |
| `icon` | `size-9` (36x36) | - | 아이콘만 있는 버튼 |

**사용 예시:**
```tsx
import { Button } from "@/components/ui/button";

// 기본 CTA
<Button>확인</Button>

// 삭제
<Button variant="destructive">삭제</Button>

// 아이콘 버튼
<Button variant="ghost" size="icon">
  <Plus className="h-4 w-4" />
</Button>

// asChild 패턴 (Link와 결합)
<Button asChild>
  <Link href="/page">이동</Link>
</Button>
```

---

### 4.3 공통(Shared) 컴포넌트 가이드

#### PageHeader (`components/shared/page-header.tsx`)

페이지 최상단에 사용하는 표준 헤더 컴포넌트입니다.

```tsx
import { PageHeader } from "@/components/shared/page-header";

<PageHeader
  title="페이지 제목"
  description="페이지 설명 텍스트 (선택)"
  showBackButton={true}
  backButtonFallback="/previous-page"
  actions={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      추가
    </Button>
  }
/>
```

| prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | 필수 | 페이지 제목 (`h1`, `text-2xl md:text-3xl font-bold`) |
| `description` | `string` | 선택 | 부제목 (`text-sm text-muted-foreground`) |
| `showBackButton` | `boolean` | 선택 | 뒤로가기 버튼 표시 (기본: false) |
| `backButtonFallback` | `string` | 선택 | 히스토리 없을 때 fallback URL |
| `actions` | `ReactNode` | 선택 | 우측 액션 버튼 영역 |

#### StatCard (`components/shared/stat-card.tsx`)

대시보드 통계 카드 컴포넌트입니다.

```tsx
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign } from "lucide-react";

<StatCard
  title="총 매출"
  value="₩1,234,567"
  icon={DollarSign}
  description="이번 달"
  trend={{ value: 12.5, isPositive: true }}
/>
```

| prop | 타입 | 설명 |
|------|------|------|
| `title` | `string` | 카드 제목 (`text-sm font-medium text-muted-foreground`) |
| `value` | `string \| number` | 핵심 수치 (`text-2xl font-bold`) |
| `icon` | `LucideIcon` | lucide-react 아이콘 (`h-4 w-4 text-muted-foreground`) |
| `description` | `string` | 보조 설명 (`text-xs text-muted-foreground`) |
| `trend` | `{ value: number, isPositive: boolean }` | 증감률 (양수: `text-green-600`, 음수: `text-red-600`) |

---

### 4.4 Navigation 컴포넌트 가이드

#### 역할별 네비게이션 구조

```
Navbar.tsx (공통 상단 바, h-16)
  ├── ConsumerBottomNav  → /buyer/*, /mypage/* 
  ├── StoreAdminBottomNav + StoreAdminSidebar → /store-admin/*
  └── AdminSidebar → /admin/*
```

#### ConsumerBottomNav 메뉴 구성

| 아이콘 | 라벨 | 경로 | 활성 조건 |
|--------|------|------|-----------|
| `Home` | 홈 | `/buyer` | `/buyer`, `/buyer/store/*`, `/buyer/product/*` |
| `CartIcon` | 장바구니 | `/buyer/cart` | `/buyer/cart/*` |
| `ShoppingBag` | 주문내역 | `/buyer/orders` | `/buyer/orders/*`, `/buyer/reservations/*` |
| `UserRound` | 내정보 | `/mypage` | `/mypage/*` |

**활성/비활성 색상 패턴:**
```tsx
// 활성: text-primary
// 비활성: text-muted-foreground hover:text-foreground
className={cn(
  "flex flex-col items-center ...",
  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
)}
```

---

### 4.5 Form 패턴 (react-hook-form + zod)

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
});

export function ExampleForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="이름 입력" {...field} />
              </FormControl>
              <FormMessage /> {/* zod 오류 메시지 자동 표시 */}
            </FormItem>
          )}
        />
        <Button type="submit">저장</Button>
      </form>
    </Form>
  );
}
```

---

### 4.6 Toast 알림 패턴

> **주의**: 프로젝트에 두 가지 토스트 시스템이 공존합니다. 새로운 코드에서는 `sonner`를 사용하세요.

| 시스템 | import | 용도 |
|--------|--------|------|
| **sonner** (권장) | `import { toast } from "sonner"` | 새로운 코드에서 사용 |
| shadcn toast (레거시) | `import { useToast } from "@/components/ui/use-toast"` | 기존 컴포넌트 |

**sonner 사용 예시:**
```tsx
import { toast } from "sonner";

// 성공
toast.success("저장되었습니다.");

// 오류
toast.error("오류가 발생했습니다.");

// 정보
toast.info("처리 중입니다.");
```

---

### 4.7 Skeleton 로딩 패턴

각 도메인 폴더 내 `skeletons/` 서브폴더에 위치합니다.

```
components/
  store-admin/skeletons/    # 대시보드, 주문, 상품, 정산
  mypage/skeletons/         # 마이페이지, 주문, 쿠폰, 포인트
```

**기본 사용 패턴:**
```tsx
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/store-admin/skeletons/dashboard-skeleton";

<Suspense fallback={<DashboardSkeleton />}>
  <AsyncDataComponent />
</Suspense>
```

---

## 5. Branding (브랜딩)

### 5.1 서비스 정보

| 항목 | 값 |
|------|-----|
| 서비스명 | 오늘마감 |
| 태그라인 | 지역 소상공인의 마감 임박 식품과 소비자를 연결하는 플랫폼 |
| 메타 title | `오늘마감` |
| 기본 언어 | 한국어 (`<html lang="ko">`) |

### 5.2 브랜드 컬러

현재 shadcn/ui의 **neutral(무채색) 팔레트**를 그대로 사용합니다. 별도 브랜드 컬러가 미지정된 상태입니다.

```
Primary: 검정 (라이트) ↔ 밝은 회색 (다크)
배경: 흰색 (라이트) ↔ 거의 검정 (다크)
```

> **개선 권장**: 서비스 아이덴티티를 위한 브랜드 컬러(예: 주황/초록 계열) 적용을 검토하세요. `globals.css`의 `--primary`와 `--accent` 변수값을 수정하면 전체에 일괄 적용됩니다.

### 5.3 로고

현재 `components/Navbar.tsx`에 텍스트로만 구현됩니다.

```tsx
<Link href="/" className="text-2xl font-bold">
  오늘마감
</Link>
```

> **개선 권장**: `components/shared/logo.tsx`로 분리하고, SVG 로고 또는 이미지 로고를 추가하는 것을 권장합니다.

### 5.4 다크모드

- **전환 방식**: CSS 클래스 기반 (최상위 요소에 `.dark` 클래스 부여)
- **선언**: `@custom-variant dark (&:is(.dark *))` (`globals.css` 4행)
- **현재 상태**: CSS 변수는 완전히 정의되어 있으나, 전환 UI(토글 버튼)가 구현되지 않음
- **주의**: `body`의 `background-color: #f5f5f5` 하드코딩으로 인해 다크모드가 완전히 동작하지 않음

### 5.5 아이콘 가이드

**주요 아이콘 라이브러리**: `lucide-react` (일관성을 위해 `react-icons`보다 우선 사용)

| 용도 | 아이콘 | import |
|------|--------|--------|
| 홈 | `Home` | `lucide-react` |
| 장바구니 | `ShoppingCart` | `lucide-react` |
| 주문 | `ShoppingBag` | `lucide-react` |
| 사용자 | `UserRound` | `lucide-react` |
| 뒤로가기 | `ArrowLeft` | `lucide-react` |
| 추가 | `Plus` | `lucide-react` |
| 설정 | `Settings` | `lucide-react` |
| 메뉴 | `Menu` | `lucide-react` |
| 닫기 | `X` | `lucide-react` |
| 매출 | `DollarSign` | `lucide-react` |
| 트렌드 | `TrendingUp` | `lucide-react` |
| 별점 | `Star` | `lucide-react` |
| 쿠폰 | `Ticket` | `lucide-react` |
| 포인트 | `Coins` | `lucide-react` |
| 패키지 | `Package` | `lucide-react` |

**표준 크기:**
```tsx
// 네비게이션 아이콘
<Icon className="w-5 h-5" />

// 버튼 내부 아이콘 (shadcn 자동 처리: size-4)
<Button><Plus /></Button>

// StatCard, 목록 아이콘
<Icon className="h-4 w-4 text-muted-foreground" />
```

---

## 6. External React Libraries (외부 라이브러리)

### 6.1 코어 프레임워크

| 패키지 | 버전 | 용도 | 공식 문서 |
|--------|------|------|----------|
| `next` | 15.5.7 | Next.js (App Router) | [nextjs.org](https://nextjs.org) |
| `react` / `react-dom` | ^19.0.0 | React 19 | [react.dev](https://react.dev) |

### 6.2 스타일링

| 패키지 | 버전 | 용도 | 비고 |
|--------|------|------|------|
| `tailwindcss` | ^4 | CSS 유틸리티 프레임워크 | v4 방식 (config 파일 없음) |
| `tw-animate-css` | ^1.3.0 | 애니메이션 유틸리티 | shadcn/ui 호환 |

**Tailwind CSS v4 주요 차이점:**
- `tailwind.config.js` 파일 없음 → `globals.css`의 `@theme inline` 블록으로 대체
- `@tailwind base/components/utilities` 대신 `@import "tailwindcss"` 사용

### 6.3 UI 컴포넌트 (shadcn/ui + Radix UI)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `radix-ui` | ^1.4.3 | Radix UI 전체 패키지 |
| `@radix-ui/react-accordion` | ^1.2.11 | Accordion 프리미티브 |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | AlertDialog 프리미티브 |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkbox 프리미티브 |
| `@radix-ui/react-dialog` | ^1.1.14 | Dialog 프리미티브 |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | DropdownMenu 프리미티브 |
| `@radix-ui/react-label` | ^2.1.7 | Label 프리미티브 |
| `@radix-ui/react-popover` | ^1.1.15 | Popover 프리미티브 |
| `@radix-ui/react-select` | ^2.2.6 | Select 프리미티브 |
| `@radix-ui/react-slot` | ^1.2.3 | Slot 패턴 (`asChild`) |
| `@radix-ui/react-toast` | ^1.2.15 | Toast 프리미티브 |
| `class-variance-authority` | ^0.7.1 | 컴포넌트 variant 정의 (`cva`) |
| `clsx` | ^2.1.1 | 조건부 클래스 결합 |
| `tailwind-merge` | ^3.3.0 | Tailwind 클래스 병합 (`twMerge`) |

**`cn()` 유틸리티 사용 패턴:**
```tsx
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 사용
<div className={cn("base-class", condition && "conditional-class", className)} />
```

### 6.4 아이콘

| 패키지 | 버전 | 용도 | 우선순위 |
|--------|------|------|---------|
| `lucide-react` | ^0.511.0 | 주요 UI 아이콘 | **1순위** (권장) |
| `react-icons` | ^5.5.0 | 보조 아이콘 (소셜, 특수) | 2순위 (lucide에 없을 때만) |

### 6.5 폼 & 검증

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react-hook-form` | ^7.56.4 | 폼 상태 관리, 검증 트리거 |
| `@hookform/resolvers` | ^5.0.1 | zod 스키마 연결 브릿지 |
| `zod` | ^3.25.32 | 스키마 기반 타입 검증 |

### 6.6 알림(Toast)

| 패키지 | 버전 | 권장 여부 | 용도 |
|--------|------|---------|------|
| `sonner` | ^2.0.7 | **권장** | 새로운 코드에서 사용 |
| `@radix-ui/react-toast` (shadcn) | ^1.2.15 | 레거시 | 기존 컴포넌트 유지 |

> **정책**: 새로운 컴포넌트에서는 `sonner`를 사용합니다. 향후 shadcn toast를 sonner로 점진적으로 마이그레이션하는 것을 권장합니다.

### 6.7 데이터 시각화

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `recharts` | ^3.7.0 | 바 차트, 라인 차트 (관리자 대시보드) |

**recharts 색상 사용 패턴:**
```tsx
// CSS 변수를 직접 참조해 테마 일관성 유지
fill="var(--chart-1)"
stroke="var(--chart-2)"
```

### 6.8 날짜 처리

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react-day-picker` | ^9.13.0 | Calendar 컴포넌트의 날짜 선택 UI |
| `date-fns` | ^4.1.0 | 날짜 포매팅, 계산 유틸리티 |

### 6.9 인증

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@clerk/nextjs` | ^6.20.0 | Clerk 인증 (Client/Server 통합) |
| `@clerk/backend` | ^1.33.1 | 서버사이드 Clerk API |
| `@clerk/localizations` | ^3.26.3 | 한국어 UI 로컬라이제이션 |

---

## 부록: 자주 쓰이는 Tailwind 패턴 모음

### 카드형 UI

```tsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 본문 */}
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">취소</Button>
    <Button>확인</Button>
  </CardFooter>
</Card>
```

### 섹션 구분 패턴

```tsx
<div className="space-y-6">
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">섹션 제목</h2>
    {/* 내용 */}
  </section>
  <Separator />
  <section className="space-y-4">
    {/* 다음 섹션 */}
  </section>
</div>
```

### 로딩 상태 스켈레톤

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[125px] w-full rounded-xl" />
  </CardContent>
</Card>
```

### 반응형 그리드 (대시보드)

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="매출" value="₩123,000" icon={DollarSign} />
  <StatCard title="주문" value="42" icon={ShoppingBag} />
  {/* ... */}
</div>
```
