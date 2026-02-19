"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ProductService } from "@/services/product";
import { OrderService } from "@/services/order";
import type {
  ProductData as ServiceProductData,
  ProductDetailData as ServiceProductDetailData,
  FilterOptions as ServiceFilterOptions,
} from "@/services/product";
import type {
  OrderDetailData as ServiceOrderDetailData,
  ReserveResult as ServiceReserveResult,
} from "@/services/order";
import type { BuyerAddress } from "@/actions/address";

/**
 * 상품 정보 타입 (재export)
 */
export type ProductData = ServiceProductData;

/**
 * 상품 상세 정보 타입 (재export)
 */
export type ProductDetailData = ServiceProductDetailData;

/**
 * 필터 옵션 타입 (재export)
 */
export type FilterOptions = ServiceFilterOptions;

/**
 * 예약 결과 타입 (재export)
 */
export type ReserveProductResult = ServiceReserveResult;

/**
 * 예약 내역 정보 타입 (재export)
 */
export type OrderData = ServiceOrderDetailData;

/**
 * 판매 가능한 상품 리스트를 조회합니다.
 *
 * @param filter - 필터 옵션 (선택)
 * @param buyerAddress - 소비자 주소 (거리 필터링용)
 * @param radiusKm - 검색 반경 (km, 선택, 기본값: 3km)
 * @param favoriteStoreIds - 즐겨찾기 가게 ID 목록 (우선 정렬용)
 * @returns 판매 가능한 상품 리스트 (즐겨찾기 우선 + 거리순 정렬)
 */
export async function getAvailableProducts(
  filter?: FilterOptions,
  buyerAddress?: BuyerAddress | null,
  radiusKm?: number,
  favoriteStoreIds?: string[]
): Promise<ProductData[]> {
  // radiusKm이 제공되면 사용, 아니면 기본값 3km
  const radius = radiusKm ?? (buyerAddress ? 3 : undefined);
  
  // 사용자의 히어로 등급 조회 (선공개 필터링용)
  let buyerGradeLevel: number | undefined = undefined;
  try {
    const { userId } = await auth();
    if (userId) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: userHero } = await supabase
        .from("user_hero")
        .select("grade_level")
        .eq("user_id", userId)
        .single();
      
      if (userHero) {
        buyerGradeLevel = userHero.grade_level;
      }
    }
  } catch (error) {
    console.error("[getAvailableProducts] Error fetching grade level:", error);
    // 에러 발생 시 등급 없음으로 처리 (일반 사용자로 간주)
  }
  
  // Service 호출
  return await ProductService.findAvailable(
    filter, 
    buyerAddress, 
    radius, 
    favoriteStoreIds,
    buyerGradeLevel
  );
}

/**
 * 상품 ID로 상품 상세 정보를 조회합니다.
 *
 * @param productId - 상품 ID
 * @returns 상품 상세 정보 (가게 정보 포함) 또는 null
 */
export async function getProductById(
  productId: string
): Promise<ProductDetailData | null> {
  // Service 호출
  return await ProductService.findById(productId);
}

/**
 * 상품을 예약합니다.
 *
 * @param productId - 예약할 상품 ID
 * @param quantity - 예약 수량 (기본값: 1)
 * @param preferredPickupTime - 소비자가 선택한 희망 픽업 시간 (선택)
 * @returns 예약 결과
 */
export async function reserveProduct(
  productId: string,
  quantity: number = 1,
  preferredPickupTime?: string
): Promise<ReserveProductResult> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "로그인이 필요합니다.",
    };
  }

  // 2. Service 호출
  const result = await OrderService.reserve(productId, userId, quantity, preferredPickupTime);

  // 3. 캐시 무효화 (Next.js 특화 기능)
  if (result.success) {
    revalidatePath("/buyer");
    revalidatePath(`/buyer/product/${productId}`);
  }

  // 4. 결과 반환
  return result;
}

/**
 * 현재 사용자의 예약 내역을 조회합니다.
 *
 * @param dateRange - 날짜 범위 필터 (선택)
 * @returns 예약 내역 리스트 (order + product + store 정보 포함)
 */
export async function getMyOrders(dateRange?: {
  from?: string;
  to?: string;
}): Promise<OrderData[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  // 날짜 문자열을 Date 객체로 변환
  const parsedDateRange = dateRange
    ? {
        from: dateRange.from ? new Date(dateRange.from) : undefined,
        to: dateRange.to ? new Date(dateRange.to) : undefined,
      }
    : undefined;

  // Service 호출
  return await OrderService.findByBuyerId(userId, parsedDateRange);
}

/**
 * 예약을 취소합니다.
 *
 * @param orderId - 취소할 예약 ID
 * @returns 취소 결과
 */
export async function cancelOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "로그인이 필요합니다.",
    };
  }

  // 2. Service 호출
  const result = await OrderService.cancel(orderId, userId);

  // 3. 실패 시 에러 반환
  if (!result.success) {
    return {
      success: false,
      error: (result as { success: false; error: string }).error,
    };
  }

  // 4. 성공 시 캐시 무효화
  revalidatePath("/buyer/reservations");
  revalidatePath("/buyer");
  return { success: true };
}
