/**
 * @file components/store-admin/order-status-tabs.tsx
 * @description 주문 상태별 필터 탭
 *
 * Client Component
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderStatusTabsProps {
  activeStatus: "all" | "reserved" | "completed" | "canceled";
  onStatusChange: (
    status: "all" | "reserved" | "completed" | "canceled"
  ) => void;
  counts: {
    all: number;
    reserved: number;
    completed: number;
    canceled: number;
  };
}

export function OrderStatusTabs({
  activeStatus,
  onStatusChange,
  counts,
}: OrderStatusTabsProps) {
  return (
    <Tabs
      value={activeStatus}
      onValueChange={(value) =>
        onStatusChange(
          value as "all" | "reserved" | "completed" | "canceled"
        )
      }
    >
      <TabsList>
        <TabsTrigger value="all">전체 ({counts.all})</TabsTrigger>
        <TabsTrigger value="reserved">
          픽업대기 ({counts.reserved})
        </TabsTrigger>
        <TabsTrigger value="completed">
          픽업완료 ({counts.completed})
        </TabsTrigger>
        <TabsTrigger value="canceled">
          취소 ({counts.canceled})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
