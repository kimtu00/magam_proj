/**
 * @file app/api/store/orders/route.ts
 * @description 사장님 주문 목록 조회 API
 *
 * 현재 로그인한 사용자의 가게에 속한 주문 목록을 반환합니다.
 * orders 테이블을 products(store_id 확인) + profiles(구매자 이름) 조인하여 조회.
 *
 * @method GET
 * @route /api/store/orders
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { StoreOrder } from "@/types/store-admin";

export async function GET() {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 2. 가게 정보 조회 (owner_id = Clerk userId)
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { success: false, error: "가게 정보가 없습니다." },
        { status: 404 }
      );
    }

    // 3. 이 가게의 상품 ID 목록 조회
    const { data: storeProducts, error: productError } = await supabase
      .from("products")
      .select("id, name, discount_price")
      .eq("store_id", store.id);

    if (productError) {
      console.error("Failed to fetch store products:", productError);
      return NextResponse.json(
        { success: false, error: "상품 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!storeProducts || storeProducts.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const productMap = new Map(
      storeProducts.map((p) => [p.id, { name: p.name, discount_price: p.discount_price }])
    );
    const productIds = storeProducts.map((p) => p.id);

    // 4. 해당 상품에 속한 주문 목록 조회 (profiles 조인 없이 buyer_id만)
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        buyer_id,
        product_id,
        quantity,
        status,
        preferred_pickup_time,
        completed_at,
        created_at
      `
      )
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders:", error);
      return NextResponse.json(
        { success: false, error: "주문 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 5. 구매자 닉네임 조회 (buyer_id 목록으로 한 번에 조회)
    const buyerIds = [...new Set((orders ?? []).map((o) => o.buyer_id))];
    let nicknameMap = new Map<string, string>();

    if (buyerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("clerk_id, nickname")
        .in("clerk_id", buyerIds);

      nicknameMap = new Map(
        (profiles ?? []).map((p) => [p.clerk_id, p.nickname ?? "익명"])
      );
    }

    // 6. UI 타입으로 매핑
    const storeOrders: StoreOrder[] = (orders ?? []).map((order) => {
      const product = productMap.get(order.product_id) ?? {
        name: "알 수 없는 상품",
        discount_price: 0,
      };

      return {
        id: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        buyerId: order.buyer_id,
        customerName: nicknameMap.get(order.buyer_id) ?? "익명",
        productId: order.product_id,
        productName: product.name,
        quantity: order.quantity,
        totalAmount: product.discount_price * order.quantity,
        status: order.status as "RESERVED" | "COMPLETED" | "CANCELED",
        pickupTime: order.preferred_pickup_time ?? undefined,
        completedAt: order.completed_at ?? undefined,
        createdAt: order.created_at,
      };
    });

    return NextResponse.json({ success: true, orders: storeOrders });
  } catch (error) {
    console.error("Store orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
