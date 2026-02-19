/**
 * @file components/store-admin/recent-orders.tsx
 * @description 최근 주문 리스트 (대시보드용)
 *
 * Client Component
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Package } from "lucide-react";
import type { RecentOrder } from "@/types/store-admin";

interface RecentOrdersProps {
  orders: RecentOrder[];
}

const statusLabels = {
  RESERVED: "픽업대기",
  COMPLETED: "완료",
  CANCELED: "취소",
};

const statusColors = {
  RESERVED: "bg-muted text-foreground",
  COMPLETED: "bg-secondary text-primary",
  CANCELED: "bg-destructive/10 text-destructive",
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">최근 주문</h3>
          <Link href="/store-admin/orders">
            <Button variant="outline" size="sm">
              전체 주문 보기
            </Button>
          </Link>
        </div>
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <p>최근 주문이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">최근 주문 ({orders.length})</h3>
        <Link href="/store-admin/orders">
          <Button variant="outline" size="sm">
            전체 주문 보기
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleString("ko-KR", {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          });

          return (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">{order.orderNumber}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.customerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {order.productName} × {order.quantity}
                  </span>
                  <span>₩{order.totalAmount.toLocaleString()}</span>
                  <span>{orderDate}</span>
                </div>
              </div>

              {order.status === "RESERVED" && (
                <Link href="/store-admin/orders">
                  <Button size="sm">픽업 확인</Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
