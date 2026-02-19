import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrderService } from "@/services/order";
import { ReviewService } from "@/services/review";
import { OrderCard } from "@/components/product/order-card";
import { EmptyOrders } from "@/components/product/empty-orders";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

/**
 * 주문 내역 리스트 컴포넌트 (Server Component)
 */
async function OrderList({ status }: { status: string }) {
  const { userId } = await auth();

  if (!userId) {
    return <EmptyOrders />;
  }

  // 전체 주문 내역 조회
  const allOrders = await OrderService.findByBuyerId(userId);

  // 상태별 필터링
  let orders = allOrders;
  if (status !== "all") {
    orders = allOrders.filter((order) => order.status === status);
  }

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  // 각 주문에 대한 리뷰 존재 여부 확인
  const reviewChecks = await Promise.all(
    orders.map((order) => ReviewService.getReviewByOrderId(order.id))
  );

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        총 {orders.length}건
      </div>
      {orders.map((order, index) => (
        <OrderCard
          key={order.id}
          order={order}
          hasReview={!!reviewChecks[index]}
        />
      ))}
    </div>
  );
}

/**
 * 주문 상태 탭 컴포넌트
 */
function OrderStatusTabs({ currentStatus }: { currentStatus: string }) {
  return (
    <Tabs value={currentStatus}>
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="all" asChild>
          <Link href="/buyer/orders?status=all">전체</Link>
        </TabsTrigger>
        <TabsTrigger value="RESERVED" asChild>
          <Link href="/buyer/orders?status=RESERVED">예약중</Link>
        </TabsTrigger>
        <TabsTrigger value="COMPLETED" asChild>
          <Link href="/buyer/orders?status=COMPLETED">픽업완료</Link>
        </TabsTrigger>
        <TabsTrigger value="CANCELED" asChild>
          <Link href="/buyer/orders?status=CANCELED">취소환불</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/**
 * 주문 목록 스켈레톤
 */
function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 animate-pulse space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * 통합 주문내역 페이지
 *
 * 예약 내역 + 주문 내역을 통합하여 상태별로 필터링할 수 있습니다.
 */
export default async function BuyerOrdersPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const status = searchParams.status || "all";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="주문내역"
          description="내가 예약한 마감 할인 상품의 내역을 확인할 수 있습니다"
          showBackButton={true}
          backButtonFallback="/buyer"
        />

        {/* 상태별 탭 */}
        <OrderStatusTabs currentStatus={status} />

        {/* 주문 목록 */}
        <Suspense key={status} fallback={<OrdersSkeleton />}>
          <OrderList status={status} />
        </Suspense>
      </div>
    </div>
  );
}
