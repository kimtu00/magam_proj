/**
 * Cart Server Actions
 * 
 * 장바구니 관련 Server Actions
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { CartService } from "@/services/cart";
import { OrderService } from "@/services/order";
import type { CartItemWithProduct, CheckoutResult } from "@/services/cart";

/**
 * 장바구니에 상품 추가
 * 
 * @param productId - 상품 ID
 * @param quantity - 수량 (기본값: 1)
 * @param preferredPickupTime - 희망 픽업 시간 (선택)
 * @returns 성공 여부
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  preferredPickupTime?: string
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await CartService.addItem({
    buyer_id: userId,
    product_id: productId,
    quantity,
    preferred_pickup_time: preferredPickupTime,
  });

  if (result.success) {
    revalidatePath("/buyer/cart");
  }

  return result;
}

/**
 * 장바구니 조회
 * 
 * @returns 장바구니 항목 리스트
 */
export async function getCartItems(): Promise<CartItemWithProduct[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return await CartService.getCart(userId);
}

/**
 * 장바구니 항목 수 조회 (네비 뱃지용)
 * 
 * @returns 장바구니 항목 수
 */
export async function getCartCount(): Promise<number> {
  const { userId } = await auth();

  if (!userId) {
    return 0;
  }

  return await CartService.getCartCount(userId);
}

/**
 * 장바구니 항목 수량 변경
 * 
 * @param productId - 상품 ID
 * @param quantity - 변경할 수량
 * @returns 성공 여부
 */
export async function updateCartQuantity(productId: string, quantity: number) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await CartService.updateItemQuantity(userId, productId, quantity);

  if (result.success) {
    revalidatePath("/buyer/cart");
  }

  return result;
}

/**
 * 장바구니 항목 픽업 시간 변경
 * 
 * @param productId - 상품 ID
 * @param pickupTime - 변경할 픽업 시간 (ISO string)
 * @returns 성공 여부
 */
export async function updateCartPickupTime(productId: string, pickupTime: string | null) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await CartService.updateItemPickupTime(userId, productId, pickupTime);

  if (result.success) {
    revalidatePath("/buyer/cart");
  }

  return result;
}

/**
 * 장바구니에서 상품 삭제
 * 
 * @param productId - 상품 ID
 * @returns 성공 여부
 */
export async function removeFromCart(productId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await CartService.removeItem(userId, productId);

  if (result.success) {
    revalidatePath("/buyer/cart");
  }

  return result;
}

/**
 * 장바구니 비우기
 * 
 * @returns 성공 여부
 */
export async function clearCart() {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const result = await CartService.clearCart(userId);

  if (result.success) {
    revalidatePath("/buyer/cart");
  }

  return result;
}

/**
 * 장바구니 선택 예약 (체크아웃)
 * 
 * @param selectedProductIds - 예약할 상품 ID 배열
 * @returns 예약 결과
 */
export async function checkoutFromCart(selectedProductIds?: string[]): Promise<CheckoutResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      succeeded: [],
      failed: [{ productId: "", productName: "", reason: "로그인이 필요합니다." }],
    };
  }

  // 장바구니 조회
  const allCartItems = await CartService.getCart(userId);

  if (allCartItems.length === 0) {
    return {
      success: false,
      succeeded: [],
      failed: [{ productId: "", productName: "", reason: "장바구니가 비어 있습니다." }],
    };
  }

  // 선택된 항목만 필터링 (선택되지 않았으면 전체)
  const cartItems = selectedProductIds && selectedProductIds.length > 0
    ? allCartItems.filter(item => selectedProductIds.includes(item.product_id))
    : allCartItems;

  if (cartItems.length === 0) {
    return {
      success: false,
      succeeded: [],
      failed: [{ productId: "", productName: "", reason: "예약할 상품을 선택해 주세요." }],
    };
  }

  const succeeded: string[] = [];
  const failed: Array<{ productId: string; productName: string; reason: string }> = [];

  // 각 항목에 대해 예약 시도
  for (const item of cartItems) {
    const result = await OrderService.reserve(
      item.product_id,
      userId,
      item.quantity,
      item.preferred_pickup_time || undefined
    );

    if (result.success) {
      succeeded.push(result.order_id);
      // 성공한 항목은 장바구니에서 제거
      await CartService.removeItem(userId, item.product_id);
    } else {
      const failResult = result as { success: false; message: string };
      failed.push({
        productId: item.product_id,
        productName: item.product.name,
        reason: failResult.message,
      });
    }
  }

  // 페이지 재검증
  revalidatePath("/buyer/cart");
  revalidatePath("/buyer/reservations");

  return {
    success: succeeded.length > 0,
    succeeded,
    failed,
  };
}
