/**
 * @file app/store-admin/orders/page.tsx
 * @description 주문 관리 페이지
 *
 * 구성:
 * 1. 탭 필터 (픽업대기/픽업완료/취소/전체)
 * 2. 주문 테이블
 * 3. 픽업 확인 버튼 (이벤트 체인 트리거)
 * 4. 30초 폴링으로 새 주문 자동 갱신
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { OrderStatusTabs } from "@/components/store-admin/order-status-tabs";
import { OrderTable } from "@/components/store-admin/order-table";
import { useOrderPolling } from "@/hooks/use-order-polling";
import { RefreshCw } from "lucide-react";
import type { StoreOrder } from "@/types/store-admin";

export default function StoreAdminOrdersPage() {
  const [activeStatus, setActiveStatus] = useState<
    "all" | "reserved" | "completed" | "canceled"
  >("all");
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    reserved: 0,
    completed: 0,
    canceled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    try {
      setFetchError(false);
      const response = await fetch("/api/store/orders");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      const fetched: StoreOrder[] = result.orders ?? [];

      setOrders(fetched);
      setCounts({
        all: fetched.length,
        reserved: fetched.filter((o) => o.status === "RESERVED").length,
        completed: fetched.filter((o) => o.status === "COMPLETED").length,
        canceled: fetched.filter((o) => o.status === "CANCELED").length,
      });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 30초 폴링
  const { refresh } = useOrderPolling({
    interval: 30000, // 30초
    enabled: true,
    onPoll: fetchOrders,
  });

  // 상태별 필터링
  const filteredOrders = orders.filter((order) => {
    if (activeStatus === "all") return true;
    if (activeStatus === "reserved") return order.status === "RESERVED";
    if (activeStatus === "completed") return order.status === "COMPLETED";
    if (activeStatus === "canceled") return order.status === "CANCELED";
    return true;
  });

  // 픽업 확인 핸들러
  const handlePickupConfirm = async (orderId: string) => {
    if (!confirm("픽업을 확인하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/store/orders/${orderId}/pickup`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to confirm pickup");
      }

      const result = await response.json();

      // 성공 알림
      alert(
        `픽업이 완료되었습니다.${
          result.heroGradeUpdated ? "\n히어로 등급이 업데이트되었습니다." : ""
        }${
          result.carbonReduced
            ? `\n탄소 ${result.carbonReduced}g이 절감되었습니다.`
            : ""
        }`
      );

      // 목록 새로고침
      fetchOrders();
    } catch (error) {
      console.error("Failed to confirm pickup:", error);
      alert("픽업 확인에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="주문 관리"
          description="주문을 확인하고 픽업을 처리하세요."
          showBackButton={true}
          backButtonFallback="/store-admin/dashboard"
        />
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 상태별 탭 */}
      <OrderStatusTabs
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        counts={counts}
      />

      {/* 주문 테이블 */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : fetchError ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border bg-card">
          <p className="text-muted-foreground">주문 목록을 불러오지 못했습니다.</p>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      ) : (
        <OrderTable
          orders={filteredOrders}
          onPickupConfirm={handlePickupConfirm}
        />
      )}

      {/* 자동 갱신 안내 */}
      <div className="text-center text-sm text-muted-foreground">
        주문 목록은 30초마다 자동으로 갱신됩니다.
      </div>
    </div>
  );
}
