/**
 * Product 도메인 타입 정의
 */

/**
 * 상품 정보 타입
 */
export interface ProductData {
  id: string;
  store_id: string;
  name: string;
  original_price: number;
  discount_price: number;
  image_url: string | null;
  is_instant: boolean;
  pickup_deadline: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "SOLD_OUT";
  quantity: number;
  weight_value: number | null;
  weight_unit: "g" | "kg" | null;
  category: string | null;
  template_id: string | null;
  early_access_from: string | null; // 선공개 시작 시각
  visible_from: string | null; // 전체 공개 시각
  is_early_access?: boolean; // 현재 선공개 기간인지 (computed)
  reserved_quantity?: number; // 예약된 수량
  created_at: string;
  store?: StoreInfo; // 가게 정보 (optional, 목록 조회 시 포함)
}

/**
 * 가게 정보 타입 (간소화 버전)
 */
export interface StoreInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
}

/**
 * 상품 상세 정보 타입 (가게 정보 포함)
 */
export interface ProductDetailData extends ProductData {
  store: StoreInfo;
}

/**
 * 필터 옵션 타입
 */
export interface FilterOptions {
  is_instant?: boolean; // 바로 섭취 필터
  max_price?: number; // 최대 가격 필터
}

/**
 * 상품 생성 입력 타입
 */
export interface CreateProductInput {
  name: string;
  original_price: number;
  discount_price: number;
  image_url: string | null;
  is_instant: boolean;
  pickup_deadline: string;
  quantity: number;
  weight_value?: number;
  weight_unit?: "g" | "kg";
  category?: string;
  template_id?: string;
  description?: string;
}

/**
 * 상품 수정 입력 타입
 */
export interface UpdateProductInput {
  name?: string;
  original_price?: number;
  discount_price?: number;
  image_url?: string | null;
  is_instant?: boolean;
  pickup_deadline?: string;
  quantity?: number;
  weight_value?: number | null;
  weight_unit?: "g" | "kg";
}

