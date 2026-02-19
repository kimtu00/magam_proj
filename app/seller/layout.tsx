import { SellerBottomNav } from "@/components/navigation/seller-bottom-nav";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

/**
 * 사장님 전용 레이아웃
 *
 * `/seller/*` 경로의 모든 페이지에 적용되는 레이아웃입니다.
 * 
 * ⚠️ 역할 체크는 middleware.ts에서 이미 수행됩니다.
 * Layout에서 추가 체크 시 Clerk API 중복 호출로 인한 깜박임이 발생합니다.
 *
 * 주요 기능:
 * - 하단 네비게이션 바 포함
 * - Mobile-First 디자인 (하단 네비게이션 바 고정)
 */
export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware에서 이미 SELLER 역할을 확인했으므로
  // 여기서 추가 체크는 불필요 (중복 API 호출 방지)

  return (
    <div className="min-h-screen pb-16 bg-background">
      {/* 전체 화면 사용 */}
      <div className="mx-auto">
        {children}
      </div>

      {/* 하단 네비게이션 바 */}
      <SellerBottomNav />
    </div>
  );
}

