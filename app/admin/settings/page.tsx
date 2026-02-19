import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

/**
 * 시스템 설정 페이지
 */
export default async function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 설정"
        description="플랫폼 전체 설정을 관리하세요."
        showBackButton={true}
        backButtonFallback="/admin/dashboard"
        actions={
          <Button>
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        }
      />

      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <p className="text-muted-foreground">
          수수료율, 정산 주기, 시스템 메시지 등을 관리할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
