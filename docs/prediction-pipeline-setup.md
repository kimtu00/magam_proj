# 마감 소진율 예측 데이터 파이프라인 구축 완료

## 📊 개요

마감 시점의 상품 소진율을 예측하는 ML 모델 학습을 위한 데이터 파이프라인이 구축되었습니다.

### 예측 목표 (Target Y)
- **소진율 (sell_through_rate)**: 0.0 ~ 1.0 (연속형)
- 계산식: `판매된 수량 / 등록된 총 수량`
- 예시: 빵 10개 등록 → 8개 판매 → 소진율 0.8 (80%)

---

## 🗂️ 구현된 파일 목록

### 1. 데이터베이스 마이그레이션

#### `supabase/migrations/20260209010000_add_product_category.sql`
- `product_category` ENUM 타입 생성 (10개 카테고리)
- `products` 테이블에 `category` 컬럼 추가
- 기본값: `'기타'`
- 인덱스 추가: `idx_products_category`

#### `supabase/migrations/20260209020000_create_prediction_training.sql`
- `prediction_training_data` 테이블 생성
- **타겟 변수**: `sell_through_rate` (0~1, CHECK 제약)
- **연속형 피처 (12개)**:
  - 등록 시각 (hour, minute)
  - 가격 정보 (original/discount price, rate)
  - 수량, 마감까지 남은 시간
  - 가게 통계 (평점, 리뷰 수, 누적 판매 건수)
  - 선택 피처 (기온, 역까지 거리)
- **범주형 피처 (6개)**:
  - 카테고리, 요일, 지역, 시간대, 공휴일 여부, 주말 여부
- **메타 정보**: product_id, store_id, recorded_at
- **중복 방지**: UNIQUE(product_id)
- 5개 인덱스 생성 (product_id, store_id, recorded_at, category, time_slot)

#### `supabase/migrations/20260209030000_create_collect_training_function.sql`
- **헬퍼 함수**:
  - `get_time_slot(hour)`: 시각 → 시간대 변환 (아침/점심/오후/저녁/심야)
  - `extract_region(address)`: 주소 → 구/시 단위 지역명 추출
- **핵심 함수**:
  - `collect_training_data_for_product(product_id)`: 단일 상품 데이터 수집
    - 마감 지난 상품만 처리
    - 소진율 계산 (판매 수량 / 등록 수량)
    - 모든 피처 계산 및 저장
    - 중복 방지 (ON CONFLICT DO NOTHING)
  - `collect_training_data_batch()`: 일괄 수집 (최대 1000건)
    - 마감된 미수집 상품 대상
    - 수집/스킵/에러 건수 반환
- **RLS 정책**: 읽기는 인증된 사용자 전체, 쓰기는 service_role만

---

### 2. 서비스 레이어

#### `services/prediction/prediction.types.ts`
- `PredictionTrainingData`: 학습 데이터 인터페이스
- `CollectionBatchResult`: 일괄 수집 결과
- `TrainingDataStats`: 학습 데이터 통계

#### `services/prediction/prediction.service.ts`
- `PredictionService` 클래스:
  - `collectForProduct(productId)`: 단일 상품 수집
  - `collectBatch()`: 마감된 상품 일괄 수집
  - `getStats()`: 학습 데이터 통계 조회
    - 전체 레코드 수, 평균 소진율
    - 카테고리별/시간대별 분포
    - 날짜 범위
  - `getAllTrainingData(limit)`: 전체 데이터 조회 (CSV 내보내기용)

#### `services/prediction/index.ts`
- 서비스 export

---

### 3. API 라우트

#### `app/api/cron/collect-training/route.ts`
- **GET**: 학습 데이터 일괄 수집 크론잡
- 실행 주기: **매일 새벽 2시** (vercel.json 설정)
- 보안: `CRON_SECRET` 환경변수로 인증
- 반환: 수집/스킵/에러 건수

#### `app/api/admin/prediction/migrate/route.ts`
- **POST**: 과거 데이터 마이그레이션 (1회성 실행)
- 기존 완료된 상품들의 데이터를 학습 데이터로 변환
- 보안: `requireAdmin()` (관리자 전용)
- 최대 1000건씩 일괄 처리

#### `app/api/admin/prediction/stats/route.ts`
- **GET**: 학습 데이터 통계 조회
- 보안: `requireAdmin()` (관리자 전용)
- 반환: 전체 레코드 수, 평균 소진율, 카테고리별/시간대별 분포, 날짜 범위

---

### 4. UI/UX

#### `app/seller/upload/schema.ts`
- `productFormSchema`에 `category` 필드 추가
- ENUM 검증: 10개 카테고리
- 기본값: `'기타'`

#### `app/seller/upload/product-upload-form.tsx`
- 카테고리 선택 필드 추가
- Select 컴포넌트 사용
- 이모지 아이콘 포함 (🍞 빵, 🍱 도시락, ...)
- defaultValues에 `category: "기타"` 추가

#### `app/seller/upload/actions.ts`
- FormData에서 `category` 추출
- `ProductService.create()` 호출 시 `category` 전달

#### `services/product/product.types.ts`
- `CreateProductInput`에 `category?: string` 추가

#### `services/product/product.service.ts`
- `create()` 메서드: `category` 필드 insert에 포함
- 기본값: `"기타"`

---

### 5. 설정 파일

#### `vercel.json`
- 크론잡 추가:
  ```json
  {
    "path": "/api/cron/collect-training",
    "schedule": "0 2 * * *"
  }
  ```
  - 스케줄: 매일 새벽 2시 (KST 기준: 11시)

#### `.env.example`
- `ADMIN_EMAILS` 추가 (관리자 이메일 화이트리스트)
- `CRON_SECRET` 이미 존재 (크론잡 인증용)

---

## 📋 데이터 수집 프로세스

### 자동 수집
1. **매일 새벽 2시**: 크론잡 실행 (`/api/cron/collect-training`)
2. 마감 지난 상품 중 미수집 상품 조회 (최대 1000건)
3. 각 상품의 소진율 및 피처 계산
4. `prediction_training_data` 테이블에 INSERT

### 수동 수집
1. **과거 데이터 마이그레이션**: `/api/admin/prediction/migrate` (POST)
   - 관리자만 실행 가능
   - 기존 완료 상품 데이터 일괄 수집
2. **개별 상품 수집**: `PredictionService.collectForProduct(productId)` 호출
   - 마감 완료 시점에 호출 가능 (향후 연동)

---

## 🔑 피처 상세

### 연속형 피처 (12개)
| 피처명 | 타입 | 설명 |
|--------|------|------|
| `product_register_hour` | INT | 상품 등록 시각 (0~23) |
| `product_register_minute` | INT | 등록 분 (0~59) |
| `original_price` | INT | 원래 가격 |
| `discount_price` | INT | 할인 가격 |
| `discount_rate` | DECIMAL(5,2) | 할인율 (%) |
| `product_quantity` | INT | 등록 수량 |
| `deadline_hours_remaining` | DECIMAL(6,2) | 마감까지 남은 시간 (시간 단위) |
| `store_avg_rating` | DECIMAL(3,2) | 가게 평균 평점 (0~5) |
| `store_total_reviews` | INT | 가게 총 리뷰 수 |
| `store_total_sales` | INT | 가게 누적 판매 건수 (등록 시점 기준) |
| `weather_temperature` | DECIMAL(5,2) | 기온 (°C) - 선택 |
| `distance_from_station` | DECIMAL(8,2) | 역까지 거리 (m) - 선택 |

### 범주형 피처 (6개)
| 피처명 | 타입 | 값 범위 |
|--------|------|---------|
| `product_category` | TEXT | 빵, 도시락, 음료, 디저트, 과일, 채소, 정육, 수산물, 반찬, 기타 |
| `register_day_of_week` | TEXT | 월, 화, 수, 목, 금, 토, 일 |
| `store_region` | TEXT | 구/시 단위 (예: 강남구, 성남시 분당구) |
| `time_slot` | TEXT | 아침(6~11), 점심(11~14), 오후(14~17), 저녁(17~21), 심야(21~06) |
| `is_holiday` | BOOLEAN | 공휴일 여부 (향후 확장) |
| `is_weekend` | BOOLEAN | 주말 여부 (토/일) |

---

## 🚀 사용 방법

### 1. 마이그레이션 실행
```bash
# Supabase 마이그레이션 적용
cd supabase
supabase db push

# 또는 Supabase CLI로 개별 마이그레이션 실행
psql $DATABASE_URL -f migrations/20260209010000_add_product_category.sql
psql $DATABASE_URL -f migrations/20260209020000_create_prediction_training.sql
psql $DATABASE_URL -f migrations/20260209030000_create_collect_training_function.sql
```

### 2. 환경변수 설정
```bash
# .env 파일에 추가
CRON_SECRET="your-secure-random-string-here"
ADMIN_EMAILS="admin@example.com,manager@example.com"
```

### 3. Vercel 환경변수 설정
- Vercel 대시보드 → Settings → Environment Variables
- `CRON_SECRET` 추가 (로컬 .env와 동일한 값)
- `ADMIN_EMAILS` 추가

### 4. 크론잡 동작 확인
- Vercel 대시보드 → Settings → Crons
- `/api/cron/collect-training` 크론잡 확인
- 스케줄: `0 2 * * *` (매일 새벽 2시)

### 5. 과거 데이터 마이그레이션 (최초 1회)
```bash
# 관리자 계정으로 로그인 후
curl -X POST https://your-domain.com/api/admin/prediction/migrate \
  -H "Cookie: __clerk_db_jwt=..."
```

### 6. 학습 데이터 통계 확인
```bash
# 관리자 계정으로 로그인 후
curl https://your-domain.com/api/admin/prediction/stats \
  -H "Cookie: __clerk_db_jwt=..."
```

---

## 📊 데이터 활용

### CSV 내보내기 (Python 예시)
```python
import pandas as pd
from services.prediction import PredictionService

# 학습 데이터 조회
data = PredictionService.getAllTrainingData(limit=10000)

# DataFrame 변환
df = pd.DataFrame(data)

# CSV 저장
df.to_csv('training_data.csv', index=False)
```

### 학습 데이터 구조
```python
# 타겟 변수
y = df['sell_through_rate']

# 연속형 피처
X_continuous = df[[
    'product_register_hour', 'product_register_minute',
    'original_price', 'discount_price', 'discount_rate',
    'product_quantity', 'deadline_hours_remaining',
    'store_avg_rating', 'store_total_reviews', 'store_total_sales'
]]

# 범주형 피처 (원-핫 인코딩 필요)
X_categorical = df[[
    'product_category', 'register_day_of_week',
    'store_region', 'time_slot',
    'is_holiday', 'is_weekend'
]]
```

---

## 🔍 주의사항

### 데이터 품질
- **소진율 0 또는 1**: 정상 데이터 (전부 안 팔림 / 전부 팔림)
- **NULL 피처**: 허용하되, 모델 학습 시 적절히 처리 필요
  - 선택 피처 (weather_temperature, distance_from_station)는 대부분 NULL 가능
  - 필수 피처는 NULL이 없어야 함 (DB 제약 또는 기본값)

### 중복 방지
- `UNIQUE(product_id)` 제약으로 같은 상품 중복 수집 방지
- `ON CONFLICT DO NOTHING`으로 무시 처리

### 성능
- 일괄 수집은 한 번에 최대 1000건 처리
- 더 많은 데이터가 필요하면 여러 번 실행 또는 LIMIT 조정

### 확장 가능성
- **공휴일 여부**: 향후 공휴일 API 연동 시 `is_holiday` 업데이트
- **날씨 정보**: 날씨 API 연동 시 `weather_temperature` 업데이트
- **역까지 거리**: Google Maps/Kakao Maps API 연동 시 `distance_from_station` 업데이트

---

## 🎯 다음 단계

1. **데이터 수집 안정화**
   - 크론잡 동작 모니터링
   - 에러 로그 확인 (Vercel Logs)
   - 최소 1000건 이상 데이터 확보

2. **ML 모델 개발**
   - 학습 데이터 EDA (탐색적 데이터 분석)
   - 피처 엔지니어링 (원-핫 인코딩, 스케일링 등)
   - 모델 선택 (Regression, Gradient Boosting, Neural Network)
   - 모델 학습 및 평가 (MAE, RMSE, R²)

3. **예측 API 구축**
   - 학습된 모델 저장 (pkl, onnx, tensorflow 등)
   - 예측 API 엔드포인트 구현 (`/api/predict/sell-through`)
   - 상품 등록 시 소진율 예측 표시 (사장님 전용)

4. **UI/UX 개선**
   - 상품 등록 폼에 예측 소진율 표시
   - 예측 근거 시각화 (피처 중요도, 유사 상품 비교)
   - A/B 테스트 (예측 표시 유무에 따른 소진율 비교)

---

## 📞 문의 및 지원

구현 완료! 추가 질문이나 개선 사항이 있으면 알려주세요.
