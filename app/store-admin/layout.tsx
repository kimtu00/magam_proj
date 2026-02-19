import { StoreAdminSidebar } from "@/components/navigation/store-admin-sidebar";
import { StoreAdminBottomNav } from "@/components/navigation/store-admin-bottom-nav";
import { StoreService } from "@/services/store";
import { auth } from "@clerk/nextjs/server";
import { getNotificationCounts } from "@/app/store-admin/actions";
import { NotificationBadges } from "@/components/store-admin/notification-badges";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

/**
 * 사장님(producer) 전용 관리 페이지 레이아웃
 *
 * `/store-admin/*` 경로의 모든 페이지에 적용되는 레이아웃입니다.
 *
 * ⚠️ 역할 체크는 middleware.ts에서 이미 수행됩니다.
 * Layout에서 추가 체크 시 Clerk API 중복 호출로 인한 깜박임이 발생합니다.
 *
 * 주요 기능:
 * - 데스크톱: 사이드바 네비게이션
 * - 모바일: 하단 탭바 + 햄버거 메뉴
 * - 상단 헤더: 가게명 + 알림 + 프로필
 * - producer, admin, super_admin 접근 가능
 */
export default async function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware에서 이미 producer 이상 역할을 확인했으므로
  // 여기서 추가 체크는 불필요 (중복 API 호출 방지)

  // 가게 정보 조회 (사이드바 및 헤더에 표시)
  const { userId } = await auth();
  let storeName = "내 가게";

  if (userId) {
    const store = await StoreService.findByOwnerId(userId);
    if (store) {
      storeName = store.name;
    }
  }

  // 알림 카운트 조회 (새 주문 / 새 리뷰 분리)
  const { newOrders, newReviews } = await getNotificationCounts();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (Desktop) */}
      <StoreAdminSidebar storeName={storeName} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        {/* Header Bar (Mobile & Desktop) */}
        <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold lg:text-xl">
                {storeName}
              </h2>
            </div>

            <NotificationBadges
              initialOrders={newOrders}
              initialReviews={newReviews}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="container mx-auto p-4 lg:p-8">{children}</div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <StoreAdminBottomNav />
    </div>
  );
}
