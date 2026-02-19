import { PageHeader } from "@/components/shared/page-header";
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats";

/**
 * 관리자 대시보드
 *
 * 플랫폼 전체의 주요 지표를 확인하는 페이지입니다.
 */
export default async function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="관리자 대시보드"
        description="플랫폼 전체의 주요 지표를 한눈에 확인하세요."
      />

      {/* 8칸 통계 */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">오늘 현황</h2>
        <AdminDashboardStats />
      </section>

      {/* 차트 및 최근 데이터 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주간 매출 차트 */}
        <section className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">주간 매출 추이</h3>
          <div className="text-center text-muted-foreground py-12">
            차트 구현 예정 (Recharts)
          </div>
        </section>

        {/* 등급 분포 차트 */}
        <section className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">히어로 등급 분포</h3>
          <div className="text-center text-muted-foreground py-12">
            차트 구현 예정 (Recharts)
          </div>
        </section>
      </div>

      {/* 최근 주문 및 가입 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 주문 */}
        <section className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">최근 주문 (10건)</h3>
          <div className="text-center text-muted-foreground py-12">
            테이블 구현 예정
          </div>
        </section>

        {/* 최근 가입 */}
        <section className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">최근 가입 (5명)</h3>
          <div className="text-center text-muted-foreground py-12">
            테이블 구현 예정
          </div>
        </section>
      </div>
    </div>
  );
}
