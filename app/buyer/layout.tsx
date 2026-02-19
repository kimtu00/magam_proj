import { ConsumerBottomNav } from "@/components/navigation/consumer-bottom-nav";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

/**
 * 사용자(소비자) 전용 레이아웃
 *
 * `(buyer)` 그룹 하위의 모든 페이지에 공통으로 적용됩니다.
 * - 하단에 소비자 통합 네비게이션 바 표시
 * 
 * ⚠️ 역할 체크는 middleware.ts에서 이미 수행됩니다.
 * Layout에서 추가 체크 시 Clerk API 중복 호출로 인한 깜박임이 발생합니다.
 */
export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware에서 이미 BUYER 역할을 확인했으므로
  // 여기서 추가 체크는 불필요 (중복 API 호출 방지)

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="pb-4">{children}</div>
      <ConsumerBottomNav />
    </div>
  );
}

