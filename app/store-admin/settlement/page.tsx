/**
 * @file app/store-admin/settlement/page.tsx
 * @description 정산 관리 페이지
 *
 * 구성:
 * 1. 이번 달 요약 카드 (총 매출, 수수료, 정산 예정, 정산일)
 * 2. 월별 정산 이력 테이블
 * 3. 일별 매출 상세 테이블
 * 4. 정산 계좌 정보 카드
 */

import { PageHeader } from "@/components/shared/page-header";
import {
  getSettlementSummary,
  getSettlementHistory,
  getDailySettlement,
  getStoreBank,
} from "@/app/store-admin/settlement/actions";
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign, TrendingUp, Calendar, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StoreAdminSettlementPage() {
  // 데이터 병렬 로드
  const [summary, history, dailySettlement, bankAccount] = await Promise.all([
    getSettlementSummary(),
    getSettlementHistory(12),
    getDailySettlement(),
    getStoreBank(),
  ]);

  const statusLabels = {
    pending: "대기중",
    processing: "처리중",
    completed: "완료",
    failed: "실패",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="정산 관리"
        description="매출 정산 내역을 확인하고 정산 계좌를 관리하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/dashboard"
      />

      {/* 1. 이번 달 정산 요약 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="총 매출"
            value={`₩${summary.totalSales.toLocaleString()}`}
            icon={DollarSign}
            description={`${summary.totalOrders}건 주문`}
          />
          <StatCard
            title="수수료"
            value={`₩${summary.commissionAmount.toLocaleString()}`}
            icon={TrendingUp}
            description={`${summary.commissionRate}% 적용`}
          />
          <StatCard
            title="정산 예정"
            value={`₩${summary.settlementAmount.toLocaleString()}`}
            icon={DollarSign}
            description="실제 입금 금액"
          />
          <StatCard
            title="정산일"
            value={new Date(summary.settlementDate).toLocaleDateString(
              "ko-KR"
            )}
            icon={Calendar}
            description="매월 5일 정산"
          />
        </div>
      )}

      {/* 2. 월별 정산 이력 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">월별 정산 이력</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>정산 기간</TableHead>
              <TableHead className="text-right">총 매출</TableHead>
              <TableHead className="text-center">주문 건수</TableHead>
              <TableHead className="text-right">수수료</TableHead>
              <TableHead className="text-right">정산 금액</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead>정산일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((settlement) => (
              <TableRow key={settlement.id}>
                <TableCell>
                  {new Date(settlement.periodStart).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(settlement.periodEnd).toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell className="text-right">
                  ₩{settlement.totalSales.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {settlement.totalOrders}건
                </TableCell>
                <TableCell className="text-right">
                  ₩{settlement.commissionAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₩{settlement.settlementAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      settlement.status === "completed"
                        ? "bg-secondary text-primary"
                        : settlement.status === "pending"
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabels[settlement.status]}
                  </span>
                </TableCell>
                <TableCell>
                  {settlement.settledAt
                    ? new Date(settlement.settledAt).toLocaleDateString("ko-KR")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 3. 일별 매출 상세 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">일별 매출 상세 (이번 달)</h3>
        {dailySettlement.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead className="text-center">주문 건수</TableHead>
                <TableHead className="text-right">매출</TableHead>
                <TableHead className="text-right">수수료</TableHead>
                <TableHead className="text-right">정산 금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySettlement.map((daily) => (
                <TableRow key={daily.saleDate}>
                  <TableCell>
                    {new Date(daily.saleDate).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-center">
                    {daily.ordersCount}건
                  </TableCell>
                  <TableCell className="text-right">
                    ₩{daily.totalSales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₩{daily.commissionAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₩{daily.settlementAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">
            이번 달 매출 내역이 없습니다.
          </p>
        )}
      </div>

      {/* 4. 정산 계좌 정보 */}
      {bankAccount && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">정산 계좌</h3>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">은행</span>
              <span className="font-medium">{bankAccount.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">계좌번호</span>
              <span className="font-medium">{bankAccount.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">예금주</span>
              <span className="font-medium">{bankAccount.accountHolder}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
