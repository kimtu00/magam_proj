/**
 * @file app/api/store/orders/[id]/pickup/route.ts
 * @description 주문 픽업 확인 API
 *
 * 이 API는 픽업 확인 버튼 클릭 시 호출되어 다음 이벤트 체인을 실행합니다:
 * 1. 주문 상태 -> COMPLETED 변경 + completed_at 기록
 * 2. complete_order RPC 호출 (히어로 등급 업데이트, 탄소 절감 누적)
 * 3. HeroGradeService 트리거 (자동)
 * 4. saved_food_log 기록 (자동)
 *
 * @method PATCH
 * @route /api/store/orders/:id/pickup
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { PickupConfirmResponse } from "@/types/store-admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 2. 가게 정보 조회
    const store = await StoreService.findByOwnerId(userId);

    if (!store) {
      return NextResponse.json(
        { success: false, error: "가게 정보가 없습니다." },
        { status: 404 }
      );
    }

    // 3. 주문 ID 추출
    const { id: orderId } = await context.params;

    const supabase = await createClerkSupabaseClient();

    // 4. 주문 정보 조회 (가게 소유 확인)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        buyer_id,
        product_id,
        quantity,
        status,
        coupon_id,
        products!inner(
          id,
          store_id,
          name,
          discount_price
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 5. 가게 소유 확인
    const product = order.products as unknown as {
      id: string;
      store_id: string;
      name: string;
      discount_price: number;
    };

    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 6. 이미 완료된 주문인지 확인
    if (order.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "이미 픽업 완료된 주문입니다.",
        },
        { status: 400 }
      );
    }

    // 7. 주문 완료 처리: complete_order RPC 호출
    // (이 RPC는 주문 상태 변경 + 히어로 등급 업데이트 + 탄소 절감 누적을 모두 처리)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "complete_order",
      {
        p_order_id: orderId,
      }
    );

    if (rpcError) {
      console.error("Failed to complete order via RPC:", rpcError);
      return NextResponse.json(
        {
          success: false,
          error: "주문 완료 처리 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 8. 업데이트된 주문 정보 재조회
    const { data: updatedOrder, error: refetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        buyer_id,
        quantity,
        status,
        completed_at,
        created_at,
        products!inner(
          id,
          name,
          discount_price
        ),
        profiles!orders_buyer_id_fkey(
          clerk_id,
          nickname
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (refetchError || !updatedOrder) {
      // RPC는 성공했지만 재조회 실패 (일관성 문제)
      console.error("Order completed but refetch failed:", refetchError);
      return NextResponse.json(
        {
          success: true,
          message: "주문이 완료되었습니다.",
        },
        { status: 200 }
      );
    }

    // 9. 응답 데이터 구성
    const updatedProduct = updatedOrder.products as unknown as {
      id: string;
      name: string;
      discount_price: number;
    };
    const profile = updatedOrder.profiles as unknown as {
      clerk_id: string;
      nickname: string | null;
    } | null;

    const response: PickupConfirmResponse = {
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.id.slice(0, 8).toUpperCase(),
        buyerId: profile?.clerk_id ?? updatedOrder.buyer_id,
        customerName: profile?.nickname ?? "익명",
        productId: updatedProduct.id,
        productName: updatedProduct.name,
        quantity: updatedOrder.quantity,
        totalAmount: updatedProduct.discount_price * updatedOrder.quantity,
        status: updatedOrder.status as "RESERVED" | "COMPLETED" | "CANCELED",
        completedAt: updatedOrder.completed_at || undefined,
        createdAt: updatedOrder.created_at,
      },
      heroGradeUpdated: rpcResult?.hero_updated || false, // RPC 결과에서 추출
      carbonReduced: rpcResult?.carbon_reduced || 0, // RPC 결과에서 추출
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Pickup confirm error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
