/**
 * Cart 서비스
 * 
 * 장바구니 관련 비즈니스 로직을 처리합니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { ServiceResult } from "../common.types";
import type { CartItemData, CartItemWithProduct, AddCartItemInput } from "./cart.types";

export class CartService {
  /**
   * 사용자 장바구니 조회 (상품 + 가게 정보 포함)
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @returns 장바구니 항목 리스트
   */
  static async getCart(buyerId: string): Promise<CartItemWithProduct[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (
            id,
            name,
            original_price,
            discount_price,
            image_url,
            is_instant,
            pickup_deadline,
            quantity,
            status,
            stores (
              id,
              name,
              address
            )
          )
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching cart:", error);
        return [];
      }

      if (!data) return [];

      // 타입 변환 (products를 product로, stores를 store로)
      return data.map((item: any) => ({
        ...item,
        product: {
          ...item.products,
          store: Array.isArray(item.products.stores)
            ? item.products.stores[0]
            : item.products.stores,
        },
        products: undefined, // 원본 제거
      }));
    } catch (error) {
      console.error("Error in getCart:", error);
      return [];
    }
  }

  /**
   * 장바구니 총 수량 조회 (네비 뱃지용)
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @returns 장바구니 총 수량 (quantity 합계)
   */
  static async getCartCount(buyerId: string): Promise<number> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("buyer_id", buyerId);

      if (error) {
        console.error("Error fetching cart count:", error);
        return 0;
      }

      if (!data) return 0;

      // quantity의 합계 계산
      const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      return totalQuantity;
    } catch (error) {
      console.error("Error in getCartCount:", error);
      return 0;
    }
  }

  /**
   * 장바구니에 상품 추가
   * 이미 존재하면 수량 업데이트
   * 
   * @param input - 장바구니 항목 정보
   * @returns 성공 여부
   */
  static async addItem(input: AddCartItemInput): Promise<ServiceResult<CartItemData>> {
    try {
      const supabase = await createClient();

      // UPSERT: 이미 있으면 수량 업데이트, 없으면 추가
      const { data, error } = await supabase
        .from("cart_items")
        .upsert(
          {
            buyer_id: input.buyer_id,
            product_id: input.product_id,
            quantity: input.quantity,
            preferred_pickup_time: input.preferred_pickup_time || null,
          },
          {
            onConflict: "buyer_id,product_id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as CartItemData };
    } catch (error) {
      console.error("Error in addItem:", error);
      return { success: false, error: "장바구니 추가 중 오류가 발생했습니다." };
    }
  }

  /**
   * 장바구니 항목 수량 변경
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @param productId - 상품 ID
   * @param quantity - 변경할 수량
   * @returns 성공 여부
   */
  static async updateItemQuantity(
    buyerId: string,
    productId: string,
    quantity: number
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("buyer_id", buyerId)
        .eq("product_id", productId);

      if (error) {
        console.error("Error updating cart quantity:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in updateItemQuantity:", error);
      return { success: false, error: "수량 변경 중 오류가 발생했습니다." };
    }
  }

  /**
   * 장바구니 항목의 픽업 시간 변경
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @param productId - 상품 ID
   * @param pickupTime - 변경할 픽업 시간
   * @returns 성공 여부
   */
  static async updateItemPickupTime(
    buyerId: string,
    productId: string,
    pickupTime: string | null
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("cart_items")
        .update({ preferred_pickup_time: pickupTime })
        .eq("buyer_id", buyerId)
        .eq("product_id", productId);

      if (error) {
        console.error("Error updating cart pickup time:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in updateItemPickupTime:", error);
      return { success: false, error: "픽업 시간 변경 중 오류가 발생했습니다." };
    }
  }

  /**
   * 장바구니에서 상품 삭제
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @param productId - 상품 ID
   * @returns 성공 여부
   */
  static async removeItem(
    buyerId: string,
    productId: string
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("buyer_id", buyerId)
        .eq("product_id", productId);

      if (error) {
        console.error("Error removing from cart:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in removeItem:", error);
      return { success: false, error: "항목 삭제 중 오류가 발생했습니다." };
    }
  }

  /**
   * 장바구니 비우기
   * 
   * @param buyerId - 구매자 Clerk User ID
   * @returns 성공 여부
   */
  static async clearCart(buyerId: string): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("buyer_id", buyerId);

      if (error) {
        console.error("Error clearing cart:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error in clearCart:", error);
      return { success: false, error: "장바구니 비우기 중 오류가 발생했습니다." };
    }
  }
}
