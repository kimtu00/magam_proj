/**
 * @file components/store-admin/product-status-tabs.tsx
 * @description 상품 상태별 필터 탭
 *
 * Client Component
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductStatusTabsProps {
  activeStatus: "all" | "active" | "closed";
  onStatusChange: (status: "all" | "active" | "closed") => void;
  counts: {
    all: number;
    active: number;
    closed: number;
  };
}

export function ProductStatusTabs({
  activeStatus,
  onStatusChange,
  counts,
}: ProductStatusTabsProps) {
  return (
    <Tabs value={activeStatus} onValueChange={(value) => onStatusChange(value as "all" | "active" | "closed")}>
      <TabsList>
        <TabsTrigger value="all">
          전체 ({counts.all})
        </TabsTrigger>
        <TabsTrigger value="active">
          판매중 ({counts.active})
        </TabsTrigger>
        <TabsTrigger value="closed">
          마감 ({counts.closed})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
