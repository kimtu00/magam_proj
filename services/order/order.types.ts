/**
 * Order 도메인 타입 정의
 */

/**
 * 주문/예약 정보 타입
 */
export interface OrderData {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  preferred_pickup_time?: string | null; // 소비자가 선택한 희망 픽업 시간
  status: "RESERVED" | "COMPLETED" | "CANCELED";
  completed_at?: string | null;
  created_at: string;
}

/**
 * 예약 내역 정보 타입 (order + product + store)
 */
export interface OrderDetailData extends OrderData {
  product: {
    id: string;
    name: string;
    original_price: number;
    discount_price: number;
    image_url: string | null;
    is_instant: boolean;
    pickup_deadline: string;
  };
  store: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

/**
 * 사장님용 예약 내역 정보 타입 (order + product + buyer)
 */
export interface SellerOrderDetailData extends OrderData {
  product: {
    id: string;
    name: string;
    original_price: number;
    discount_price: number;
    image_url: string | null;
    is_instant: boolean;
    pickup_deadline: string;
  };
  buyer: {
    id: string;
    clerk_id: string;
    nickname: string | null;
    address: string | null;
  };
}

/**
 * 예약 결과 타입
 */
export type ReserveResult =
  | { success: true; order_id: string }
  | { success: false; message: string };

