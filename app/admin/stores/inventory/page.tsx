/**
 * @file app/admin/stores/inventory/page.tsx
 * @description 전체 재고 통합 목록 페이지 (관리자)
 *
 * 모든 가게의 상품(재고) 현황을 한눈에 확인하는 페이지입니다.
 *
 * 주요 기능:
 * - 전체 상품 목록 테이블 (상품명, 가게명, 카테고리, 가격, 재고, 상태, 마감시간)
 * - 상태별 Badge 표시 (판매중 / 품절 / 예약중 / 판매완료)
 * - 페이지네이션 정보 표시
 *
 * @dependencies
 * - app/admin/stores/actions.ts: getInventoryList
 * - types/admin.ts: InventoryItem
 */

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getInventoryList } from "../actions";

function isExpired(status: string, deadline: string): boolean {
  if (status === "SOLD_OUT" || status === "SOLD") return false;
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function getStatusLabel(status: string, deadline: string): string {
  if (isExpired(status, deadline)) return "마감";
  switch (status) {
    case "AVAILABLE":
      return "판매중";
    case "SOLD_OUT":
      return "품절";
    case "RESERVED":
      return "예약중";
    case "SOLD":
      return "판매완료";
    default:
      return status;
  }
}

function getStatusVariant(
  status: string,
  deadline: string
): "default" | "secondary" | "destructive" | "outline" {
  if (isExpired(status, deadline)) return "destructive";
  switch (status) {
    case "AVAILABLE":
      return "default";
    case "SOLD_OUT":
      return "destructive";
    case "RESERVED":
      return "secondary";
    case "SOLD":
      return "outline";
    default:
      return "outline";
  }
}

async function InventoryListTable({ page = 1 }: { page?: number }) {
  const result = await getInventoryList(page, 50);

  if (!result || result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-muted-foreground">등록된 재고가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상품명</TableHead>
              <TableHead>가게명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">원가</TableHead>
              <TableHead className="text-right">할인가</TableHead>
              <TableHead className="text-right">등록 수량</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>마감시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.storeName}</TableCell>
                <TableCell>{item.category || "-"}</TableCell>
                <TableCell className="text-right">
                  {item.originalPrice.toLocaleString()}원
                </TableCell>
                <TableCell className="text-right">
                  {item.discountPrice.toLocaleString()}원
                </TableCell>
                <TableCell className="text-right">{item.quantity}개</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(item.status, item.deadline)}>
                    {getStatusLabel(item.status, item.deadline)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.deadline
                    ? new Date(item.deadline).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          총 {result.meta.total}개 상품 (페이지 {result.meta.page} /{" "}
          {result.meta.totalPages})
        </div>
      </div>
    </div>
  );
}

export default async function AdminInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="재고 목록"
        description="전체 가게의 상품 재고 현황을 확인하세요."
        showBackButton={true}
        backButtonFallback="/admin/dashboard"
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">재고 목록을 불러오는 중...</p>
          </div>
        }
      >
        <InventoryListTable />
      </Suspense>
    </div>
  );
}
