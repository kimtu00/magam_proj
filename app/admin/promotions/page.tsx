import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * 혜택/프로모션 관리 페이지
 */
export default async function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="프로모션 관리"
        description="쿠폰, 할인 이벤트 등을 관리하세요."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            프로모션 생성
          </Button>
        }
      />

      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🎁</div>
        <p className="text-muted-foreground">
          진행 중인 프로모션과 예정된 이벤트를 관리할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
