import { PageHeader } from "@/components/shared/page-header";

/**
 * 페이백/영수증 심사 페이지
 */
export default async function AdminPaybackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="페이백 심사"
        description="제출된 영수증을 심사하고 페이백을 승인하세요."
      />

      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-muted-foreground">
          심사 대기 중인 영수증이 없습니다.
        </p>
      </div>
    </div>
  );
}
