import { ConsumerBottomNav } from "@/components/navigation/consumer-bottom-nav";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

/**
 * 소비자(consumer) 전용 마이페이지 레이아웃
 *
 * `/mypage/*` 경로의 모든 페이지에 적용되는 레이아웃입니다.
 *
 * ⚠️ 역할 체크는 middleware.ts에서 이미 수행됩니다.
 * Layout에서 추가 체크 시 Clerk API 중복 호출로 인한 깜박임이 발생합니다.
 *
 * 주요 기능:
 * - 하단 네비게이션 바 포함 (소비자 통합 네비게이션)
 * - Mobile-First 디자인 (하단 네비게이션 바 고정)
 * - consumer, producer, admin, super_admin 모두 접근 가능
 */
export default async function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware에서 이미 consumer 이상 역할을 확인했으므로
  // 여기서 추가 체크는 불필요 (중복 API 호출 방지)

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="pb-4">{children}</div>
      <ConsumerBottomNav />
    </div>
  );
}
