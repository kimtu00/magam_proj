/**
 * Order 서비스
 * 
 * 주문/예약 관련 비즈니스 로직을 처리합니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { ServiceResult } from "../common.types";
import type { OrderDetailData, ReserveResult, SellerOrderDetailData } from "./order.types";

export class OrderService {
  /**
   * 상품을 예약합니다.
   * 
   * 비즈니스 규칙:
   * - Supabase RPC 함수를 사용하여 트랜잭션 처리
   * - 재고 확인, 상품 수량 차감, 주문 생성을 원자적으로 처리
   * 
   * @param productId - 예약할 상품 ID
   * @param userId - 구매자 Clerk User ID
   * @param quantity - 예약 수량 (기본값: 1)
   * @param preferredPickupTime - 소비자가 선택한 희망 픽업 시간 (선택)
   * @returns 예약 결과
   */
  static async reserve(
    productId: string,
    userId: string,
    quantity: number = 1,
    preferredPickupTime?: string
  ): Promise<ReserveResult> {
    try {
      const supabase = await createClient();

      // Supabase RPC 함수 호출
      const { data, error } = await supabase.rpc("reserve_product", {
        p_product_id: productId,
        p_buyer_id: userId,
        p_quantity: quantity,
        p_preferred_pickup_time: preferredPickupTime || null,
      });

      if (error) {
        console.error("Error reserving product:", error);
        return {
          success: false,
          message: "예약 처리 중 오류가 발생했습니다.",
        };
      }

      // RPC 함수는 JSON을 반환하므로 파싱 필요
      const result = data as {
        success: boolean;
        message?: string;
        order_id?: string;
      };

      if (!result.success) {
        return {
          success: false,
          message: result.message || "예약에 실패했습니다.",
        };
      }

      return {
        success: true,
        order_id: result.order_id || "",
      };
    } catch (error) {
      console.error("Error in reserve:", error);
      return {
        success: false,
        message: "시스템 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 구매자 ID로 예약 내역을 조회합니다.
   * 
   * @param userId - 구매자 Clerk User ID
   * @param dateRange - 날짜 범위 필터 (선택)
   * @returns 예약 내역 리스트 (order + product + store 정보 포함)
   */
  static async findByBuyerId(
    userId: string,
    dateRange?: { from?: Date; to?: Date }
  ): Promise<OrderDetailData[]> {
    try {
      const supabase = await createClient();

      // 쿼리 빌더 시작
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          products (
            id,
            name,
            original_price,
            discount_price,
            image_url,
            is_instant,
            pickup_deadline,
            stores (
              id,
              name,
              address,
              phone,
              latitude,
              longitude
            )
          )
        `
        )
        .eq("buyer_id", userId);

      // 날짜 범위 필터 적용
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        // 종료일의 23:59:59까지 포함
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // 타입 변환 (products와 stores가 배열로 반환될 수 있으므로 처리)
      return data
        .map((order: any) => {
          const product = Array.isArray(order.products)
            ? order.products[0]
            : order.products;
          const store = product?.stores
            ? Array.isArray(product.stores)
              ? product.stores[0]
              : product.stores
            : null;

          if (!product || !store) {
            console.error("Product or store not found for order:", order.id);
            return null;
          }

          return {
            id: order.id,
            buyer_id: order.buyer_id,
            product_id: order.product_id,
            quantity: order.quantity,
            preferred_pickup_time: order.preferred_pickup_time,
            status: order.status,
            created_at: order.created_at,
            product: {
              id: product.id,
              name: product.name,
              original_price: product.original_price,
              discount_price: product.discount_price,
              image_url: product.image_url,
              is_instant: product.is_instant,
              pickup_deadline: product.pickup_deadline,
            },
            store: {
              id: store.id,
              name: store.name,
              address: store.address,
              phone: store.phone,
              latitude: store.latitude,
              longitude: store.longitude,
            },
          } as OrderDetailData;
        })
        .filter((order): order is OrderDetailData => order !== null);
    } catch (error) {
      console.error("Error in findByBuyerId:", error);
      return [];
    }
  }

  /**
   * 사장님의 가게에 대한 모든 예약 내역을 조회합니다.
   * 
   * @param storeId - 가게 ID
   * @param statusFilter - 예약 상태 필터 (선택)
   * @returns 예약 내역 리스트 (order + product + buyer 정보 포함)
   */
  static async findByStoreId(
    storeId: string,
    statusFilter?: "RESERVED" | "COMPLETED" | "CANCELED" | "ALL"
  ): Promise<SellerOrderDetailData[]> {
    try {
      const supabase = await createClient();

      // 먼저 해당 가게의 상품들을 조회
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", storeId);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        return [];
      }

      if (!products || products.length === 0) {
        return [];
      }

      const productIds = products.map((p) => p.id);

      // 해당 상품들에 대한 예약 내역 조회 (buyer 정보 포함)
      // profiles 테이블: orders.buyer_id = profiles.clerk_id
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          products (
            id,
            name,
            original_price,
            discount_price,
            image_url,
            is_instant,
            pickup_deadline
          ),
          profiles!buyer_id (
            id,
            clerk_id,
            nickname,
            address
          )
        `
        )
        .in("product_id", productIds);

      // 상태 필터 적용
      if (statusFilter && statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching orders - Full error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        return [];
      }

      if (!data || data.length === 0) {
        console.log("No orders found for store:", storeId);
        return [];
      }

      console.log(`Found ${data.length} orders for store:`, storeId);

      // 타입 변환
      return data
        .map((order: any) => {
          const product = Array.isArray(order.products)
            ? order.products[0]
            : order.products;
          const buyer = Array.isArray(order.profiles)
            ? order.profiles[0]
            : order.profiles;

          if (!product || !buyer) {
            console.error("Product or buyer not found for order:", order.id);
            return null;
          }

          return {
            id: order.id,
            buyer_id: order.buyer_id,
            product_id: order.product_id,
            quantity: order.quantity,
            preferred_pickup_time: order.preferred_pickup_time,
            status: order.status,
            created_at: order.created_at,
            product: {
              id: product.id,
              name: product.name,
              original_price: product.original_price,
              discount_price: product.discount_price,
              image_url: product.image_url,
              is_instant: product.is_instant,
              pickup_deadline: product.pickup_deadline,
            },
            buyer: {
              id: buyer.id,
              clerk_id: buyer.clerk_id,
              nickname: buyer.nickname,
              address: buyer.address,
            },
          } as SellerOrderDetailData;
        })
        .filter((order): order is SellerOrderDetailData => order !== null);
    } catch (error) {
      console.error("Error in findByStoreId:", error);
      return [];
    }
  }

  /**
   * 예약을 취소합니다.
   * 
   * 비즈니스 규칙:
   * - Supabase RPC 함수를 사용하여 트랜잭션 처리
   * - 예약 상태를 CANCELED로 변경하고 상품 상태를 AVAILABLE로 복원
   * - 본인의 RESERVED 상태 예약만 취소 가능
   * 
   * @param orderId - 취소할 예약 ID
   * @param userId - 구매자 Clerk User ID
   * @returns 취소 결과
   */
  static async cancel(
    orderId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      const supabase = await createClient();

      // Supabase RPC 함수 호출
      const { data, error } = await supabase.rpc("cancel_order", {
        p_order_id: orderId,
        p_buyer_id: userId,
      });

      if (error) {
        console.error("Error canceling order:", error);
        return {
          success: false,
          error: "예약 취소 중 오류가 발생했습니다.",
        };
      }

      // RPC 함수는 JSON을 반환하므로 파싱 필요
      const result = data as {
        success: boolean;
        message?: string;
      };

      if (!result.success) {
        return {
          success: false,
          error: result.message || "예약 취소에 실패했습니다.",
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error("Error in cancel:", error);
      return {
        success: false,
        error: "시스템 오류가 발생했습니다.",
      };
    }
  }
}

