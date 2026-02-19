import { ReactNode } from "react";
import { BackButton } from "./back-button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backButtonFallback?: string;
}

/**
 * 페이지 상단 헤더 컴포넌트
 *
 * 페이지 제목, 설명, 액션 버튼을 표시합니다.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="대시보드"
 *   description="매출 현황 및 주요 지표를 확인하세요."
 *   showBackButton={true}
 *   backButtonFallback="/mypage"
 *   actions={
 *     <Button>
 *       <Plus className="h-4 w-4 mr-2" />
 *       새 항목 추가
 *     </Button>
 *   }
 * />
 * ```
 */
export function PageHeader({ 
  title, 
  description, 
  actions,
  showBackButton = false,
  backButtonFallback
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {showBackButton && <BackButton fallbackUrl={backButtonFallback} />}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
