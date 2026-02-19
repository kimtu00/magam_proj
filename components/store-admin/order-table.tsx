/**
 * @file components/store-admin/order-table.tsx
 * @description 주문 테이블 (픽업 확인 기능 포함)
 *
 * Client Component
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { StoreOrder } from "@/types/store-admin";

interface OrderTableProps {
  orders: StoreOrder[];
  onPickupConfirm: (orderId: string) => void;
}

const statusLabels = {
  RESERVED: "픽업대기",
  COMPLETED: "픽업완료",
  CANCELED: "취소",
};

const statusColors = {
  RESERVED: "bg-muted text-foreground",
  COMPLETED: "bg-secondary text-primary",
  CANCELED: "bg-destructive/10 text-destructive",
};

export function OrderTable({ orders, onPickupConfirm }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
        <p className="text-muted-foreground">주문이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>주문번호</TableHead>
            <TableHead>고객</TableHead>
            <TableHead>상품</TableHead>
            <TableHead className="text-center">수량</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead className="text-center">상태</TableHead>
            <TableHead>주문시간</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const orderDate = new Date(order.createdAt).toLocaleString(
              "ko-KR",
              {
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }
            );

            const completedDate = order.completedAt
              ? new Date(order.completedAt).toLocaleString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              : null;

            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.productName}</TableCell>
                <TableCell className="text-center">{order.quantity}개</TableCell>
                <TableCell className="text-right">
                  ₩{order.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{orderDate}</span>
                    {completedDate && (
                      <span className="text-xs text-muted-foreground">
                        완료: {completedDate}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {order.status === "RESERVED" && (
                    <Button
                      size="sm"
                      onClick={() => onPickupConfirm(order.id)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      픽업 확인
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
