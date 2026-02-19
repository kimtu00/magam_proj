# 위치 기반 서비스 구현 가이드

## 📍 개요

소비자와 사장님이 주소를 입력하고, 소비자는 자신의 주소 근처 가게의 상품만 볼 수 있는 위치 기반 서비스가 구현되었습니다.

---

## 🚀 설정 방법

### 1단계: 카카오 API 키 발급

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 우측 상단 "로그인" 클릭 → 카카오 계정으로 로그인
3. 상단 메뉴 **"내 애플리케이션"** 클릭
4. **"애플리케이션 추가하기"** 클릭
5. **앱 이름**: "LastChance" (또는 원하는 이름)
6. **사업자명**: 개인 또는 사업자명 입력
7. **저장** 클릭

### 2단계: REST API 키 복사

1. 생성된 애플리케이션 선택
2. **"앱 키"** 섹션에서 **"REST API 키"** 복사
3. `.env` 파일에 추가:

```bash
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

### 3단계: 플랫폼 등록 (필수!)

1. 왼쪽 메뉴 **"플랫폼"** 클릭
2. **"Web 플랫폼 등록"** 클릭
3. **사이트 도메인** 입력:
   - 개발: `http://localhost:3000`
   - 배포: `https://yourdomain.com`
4. **저장** 클릭

### 4단계: 데이터베이스 마이그레이션 실행

Supabase SQL Editor에서 다음 마이그레이션 파일을 실행:

```bash
supabase/migrations/20260123000100_add_location_support.sql
```

또는 Supabase CLI 사용:

```bash
npx supabase db push
```

---

## 🏪 사장님 - 가게 등록

### 변경 사항

1. **가게 주소 입력이 필수**로 변경되었습니다.
2. **카카오 주소 검색 API** 사용:
   - "주소 검색하기" 버튼 클릭
   - 주소 입력 후 검색
   - 원하는 주소 선택
3. 선택한 주소의 **좌표(위도/경도)도 자동으로 저장**됩니다.

### 화면 흐름

```
┌─────────────────────────────────┐
│ 가게 이름 *                      │
│ [맛있는 떡볶이집              ]  │
├─────────────────────────────────┤
│ 가게 주소 *                      │
│ [📍 주소 검색하기            ]  │ ← 클릭 시 주소 검색 다이얼로그
│   서울시 강남구 역삼동 123-45    │ ← 선택된 주소 표시
├─────────────────────────────────┤
│ 가게 전화번호                    │
│ [031-123-4567                ]  │
├─────────────────────────────────┤
│ [      가게 정보 등록        ]  │
└─────────────────────────────────┘
```

---

## 👤 소비자 - 주소 설정

### 첫 로그인 시

주소가 설정되지 않은 경우, **자동으로 주소 설정 다이얼로그가 표시**됩니다.
주소를 설정하지 않으면 서비스를 이용할 수 없습니다 (강제 설정).

### 주소 변경

소비자 메인 화면 상단의 주소 표시를 클릭하면 주소를 변경할 수 있습니다.

```
┌─────────────────────────────────┐
│ 📍 서울시 강남구 역삼동 123-45 ▼ │ ← 클릭 시 주소 변경
├─────────────────────────────────┤
│ 마감 할인 상품                    │
│ 반경 3km 내 가게의 상품           │
├─────────────────────────────────┤
│ ...                              │
└─────────────────────────────────┘
```

---

## 🎯 거리 기반 필터링

### 동작 방식

1. 소비자가 주소를 설정하면, **반경 3km 내 가게의 상품만 표시**됩니다.
2. 상품은 **거리순으로 정렬**됩니다 (가까운 가게 먼저).
3. 주소가 설정되지 않은 경우, 전체 상품이 표시됩니다.

### 검색 반경 변경 (개발자용)

`app/buyer/actions.ts` 파일에서 반경을 변경할 수 있습니다:

```typescript
// 현재: 3km
const radiusKm = buyerAddress ? 3 : undefined;

// 5km로 변경하려면:
const radiusKm = buyerAddress ? 5 : undefined;
```

향후 사용자가 직접 변경할 수 있도록 UI를 추가할 수 있습니다.

---

## 📁 주요 파일 구조

```
프로젝트/
├── supabase/migrations/
│   └── 20260123000100_add_location_support.sql  # DB 마이그레이션
├── app/api/address/search/
│   └── route.ts                                 # 카카오 API 프록시
├── components/address/
│   ├── address-search-input.tsx                 # 공용 주소 검색 컴포넌트
│   └── buyer-address-header.tsx                 # 소비자 주소 표시 헤더
├── actions/
│   └── address.ts                               # 소비자 주소 Server Actions
├── app/buyer/
│   ├── page.tsx                                 # 소비자 메인 (주소 헤더 추가됨)
│   ├── actions.ts                               # 거리 기반 필터링 추가
│   └── product-list-view.tsx                    # 상품 리스트 (buyerAddress prop 추가)
├── services/product/
│   └── product.service.ts                       # 거리 계산 로직 추가
└── components/product/
    └── store-setup-form.tsx                     # 가게 등록 폼 (주소 검색 적용)
```

---

## 🔍 데이터베이스 스키마

### profiles 테이블

```sql
ALTER TABLE profiles ADD COLUMN address TEXT;
ALTER TABLE profiles ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN longitude DOUBLE PRECISION;
```

### stores 테이블

```sql
ALTER TABLE stores ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE stores ADD COLUMN longitude DOUBLE PRECISION;
```

### 거리 계산 함수

```sql
CREATE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION
```

Haversine 공식을 사용하여 두 지점 간의 직선 거리를 km 단위로 계산합니다.

---

## ✅ 테스트 가이드

### 1. 사장님 가게 등록 테스트

1. 사장님 계정으로 로그인
2. 상품 등록 페이지로 이동
3. "가게 정보 등록하러 가기" 클릭
4. 주소 검색 버튼 클릭
5. "서울시 강남구 역삼동" 검색
6. 원하는 주소 선택
7. 가게 정보 등록 완료

### 2. 소비자 주소 설정 테스트

1. 소비자 계정으로 로그인
2. 자동으로 주소 설정 다이얼로그 표시 확인
3. 주소 검색 및 선택
4. "저장" 클릭
5. 메인 화면 상단에 주소 표시 확인

### 3. 거리 기반 필터링 테스트

1. 소비자 계정으로 로그인 (주소 설정 완료)
2. 메인 화면에서 상품 목록 확인
3. "반경 3km 내 가게의 상품" 메시지 확인
4. 상단 주소를 클릭하여 다른 지역으로 변경
5. 상품 목록이 변경되는지 확인

---

## 🐛 문제 해결

### 카카오 API 에러

**증상**: "주소 검색에 실패했습니다" 메시지

**해결 방법**:
1. `.env` 파일에 `NEXT_PUBLIC_KAKAO_REST_API_KEY` 확인
2. 카카오 개발자 콘솔에서 플랫폼 도메인 등록 확인
3. API 키가 유효한지 확인

### 주소 검색 결과 없음

**증상**: 검색해도 결과가 없음

**해결 방법**:
1. 더 구체적인 주소 입력 (예: "서울시 강남구 역삼동")
2. 도로명 주소 또는 지번 주소로 검색

### 거리 필터링 안 됨

**증상**: 모든 상품이 표시됨

**해결 방법**:
1. 소비자 주소가 설정되어 있는지 확인
2. 데이터베이스 마이그레이션이 실행되었는지 확인
3. 가게 주소에 좌표가 저장되어 있는지 확인

---

## 📝 향후 개선 사항

### 1. 검색 반경 사용자 설정

소비자가 직접 검색 반경을 변경할 수 있는 UI 추가:
- 1km, 3km, 5km, 10km 옵션

### 2. 지도 표시

카카오 지도 API를 사용하여 가게 위치를 지도에 표시

### 3. 거리 표시

상품 카드에 가게까지의 거리 표시 (예: "1.2km")

### 4. 경로 안내

선택한 가게까지의 경로 안내 기능

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [카카오 개발자 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
2. [Supabase 문서](https://supabase.com/docs)
3. 프로젝트 GitHub Issues

---

**마지막 업데이트**: 2026-01-23
**버전**: 1.0.0


