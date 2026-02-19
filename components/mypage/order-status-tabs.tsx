/**
 * @file components/mypage/order-status-tabs.tsx
 * @description 주문 상태별 탭 필터 컴포넌트
 * 
 * 전체 / 픽업완료 / 취소환불 탭
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OrderStatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";

  const handleTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`/mypage/orders?${params.toString()}`);
  };

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange}>
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="completed">픽업완료</TabsTrigger>
        <TabsTrigger value="cancelled">취소환불</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
