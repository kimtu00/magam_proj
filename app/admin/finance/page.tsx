import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartWrapper } from "@/components/shared/chart-wrapper";
import { DollarSign, TrendingUp, PiggyBank } from "lucide-react";

/**
 * 수익 현황 페이지 (현금흐름/재무/수익성)
 */
export default async function AdminFinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="수익 현황"
        description="플랫폼의 재무 현황과 수익성을 확인하세요."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="이번 달 수익"
          value="₩12,450,000"
          icon={DollarSign}
          trend={{ value: 15.2, isPositive: true }}
          description="지난달 대비"
        />
        <StatCard
          title="총 거래액"
          value="₩85,300,000"
          icon={TrendingUp}
          trend={{ value: 22.1, isPositive: true }}
          description="이번 달"
        />
        <StatCard
          title="운영 마진"
          value="14.6%"
          icon={PiggyBank}
          trend={{ value: 1.2, isPositive: true }}
          description="목표 15%"
        />
      </div>

      <ChartWrapper
        title="월별 수익 추이"
        description="최근 12개월 수익 변화"
      >
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          차트 영역 (추후 구현)
        </div>
      </ChartWrapper>
    </div>
  );
}
