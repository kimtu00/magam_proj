/**
 * Cart 도메인 타입 정의
 */

/**
 * 장바구니 항목 기본 타입
 */
export interface CartItemData {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  preferred_pickup_time: string | null;
  created_at: string;
}

/**
 * 장바구니 조회 시 상품/가게 정보 포함
 */
export interface CartItemWithProduct extends CartItemData {
  product: {
    id: string;
    name: string;
    original_price: number;
    discount_price: number;
    image_url: string | null;
    is_instant: boolean;
    pickup_deadline: string;
    quantity: number; // 재고
    status: string;
    store: {
      id: string;
      name: string;
      address: string | null;
    };
  };
}

/**
 * 장바구니 추가 입력 타입
 */
export interface AddCartItemInput {
  buyer_id: string;
  product_id: string;
  quantity: number;
  preferred_pickup_time?: string | null;
}

/**
 * 일괄 예약 결과 타입
 */
export interface CheckoutResult {
  success: boolean;
  succeeded: string[]; // 성공한 주문 ID 목록
  failed: Array<{
    productId: string;
    productName: string;
    reason: string;
  }>;
}
