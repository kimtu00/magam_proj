import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeConfigTab } from "@/components/admin/hero-system/grade-config-tab";
import { BenefitsConfigTab } from "@/components/admin/hero-system/benefits-config-tab";
import { DashboardTab } from "@/components/admin/hero-system/dashboard-tab";
import { ManualGradeTab } from "@/components/admin/hero-system/manual-grade-tab";
import { PageHeader } from "@/components/shared/page-header";

export default function HeroSystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="히어로 시스템 관리"
        description="등급 설정, 혜택 관리, 통계 및 사용자 등급 조정"
      />

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
          <TabsTrigger value="grade-config">등급 설정</TabsTrigger>
          <TabsTrigger value="benefits">혜택 설정</TabsTrigger>
          <TabsTrigger value="manual-grade">등급 조정</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="grade-config" className="mt-6">
          <GradeConfigTab />
        </TabsContent>

        <TabsContent value="benefits" className="mt-6">
          <BenefitsConfigTab />
        </TabsContent>

        <TabsContent value="manual-grade" className="mt-6">
          <ManualGradeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
