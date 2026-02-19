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
import { Star } from "lucide-react";
import { getStoreList } from "./actions";

/**
 * 가게 목록 테이블 컴포넌트
 */
async function StoreListTable({ page = 1 }: { page?: number }) {
  const result = await getStoreList(page, 20);

  if (!result || result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🏪</div>
        <p className="text-muted-foreground">등록된 가게가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>가게명</TableHead>
              <TableHead>사장님</TableHead>
              <TableHead>지역</TableHead>
              <TableHead className="text-right">상품 수</TableHead>
              <TableHead className="text-right">평점</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.ownerName}</TableCell>
                <TableCell>{store.region || "-"}</TableCell>
                <TableCell className="text-right">{store.productCount}</TableCell>
                <TableCell className="text-right">
                  {store.averageRating > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span>{store.averageRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      store.status === "approved"
                        ? "default"
                        : store.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {store.status === "approved"
                      ? "승인됨"
                      : store.status === "pending"
                      ? "대기중"
                      : store.status === "rejected"
                      ? "거절됨"
                      : store.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(store.createdAt).toLocaleDateString("ko-KR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          총 {result.meta.total}개 가게 (페이지 {result.meta.page} /{" "}
          {result.meta.totalPages})
        </div>
      </div>
    </div>
  );
}

/**
 * 가게/재고 관리 페이지
 */
export default async function AdminStoresPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="가게 관리"
        description="가입된 가게와 재고를 관리하세요."
        showBackButton={true}
        backButtonFallback="/admin/dashboard"
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">가게 목록을 불러오는 중...</p>
          </div>
        }
      >
        <StoreListTable />
      </Suspense>
    </div>
  );
}
