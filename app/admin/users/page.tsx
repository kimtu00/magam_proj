import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getConsumerList, getProducerList } from "./actions";

/**
 * 소비자 목록 테이블 컴포넌트
 */
async function ConsumerListTable({ page = 1 }: { page?: number }) {
  const result = await getConsumerList(page, 20);

  if (!result || result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <p className="text-muted-foreground">등록된 소비자가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>히어로 등급</TableHead>
              <TableHead className="text-right">구매 횟수</TableHead>
              <TableHead className="text-right">포인트</TableHead>
              <TableHead>가입일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {user.heroGrade} {user.heroTier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{user.purchaseCount}</TableCell>
                <TableCell className="text-right">
                  {user.points.toLocaleString()}P
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          총 {result.meta.total}명 (페이지 {result.meta.page} /{" "}
          {result.meta.totalPages})
        </div>
      </div>
    </div>
  );
}

/**
 * 사장님 목록 테이블 컴포넌트
 */
async function ProducerListTable({ page = 1 }: { page?: number }) {
  const result = await getProducerList(page, 20);

  if (!result || result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <p className="text-muted-foreground">등록된 사장님이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>가게명</TableHead>
              <TableHead>지역</TableHead>
              <TableHead className="text-right">상품 수</TableHead>
              <TableHead className="text-right">매출</TableHead>
              <TableHead>가입일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.storeName || "-"}</TableCell>
                <TableCell>{user.region || "-"}</TableCell>
                <TableCell className="text-right">{user.productCount}</TableCell>
                <TableCell className="text-right">
                  {user.totalSales.toLocaleString()}원
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          총 {result.meta.total}명 (페이지 {result.meta.page} /{" "}
          {result.meta.totalPages})
        </div>
      </div>
    </div>
  );
}

/**
 * 회원 관리 페이지 (소비자 + 사장님)
 */
export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="회원 관리"
        description="소비자와 사장님의 정보를 관리하세요."
        showBackButton={true}
        backButtonFallback="/admin/dashboard"
      />

      <Tabs defaultValue="consumers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumers">소비자</TabsTrigger>
          <TabsTrigger value="producers">사장님</TabsTrigger>
        </TabsList>

        <TabsContent value="consumers" className="space-y-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px]">
                <p className="text-muted-foreground">소비자 목록을 불러오는 중...</p>
              </div>
            }
          >
            <ConsumerListTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="producers" className="space-y-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px]">
                <p className="text-muted-foreground">사장님 목록을 불러오는 중...</p>
              </div>
            }
          >
            <ProducerListTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
