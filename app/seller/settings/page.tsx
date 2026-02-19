import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getStore, updateStore } from "@/app/seller/actions";
import { StoreEditForm } from "@/components/shared/store-edit-form";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 사장님 설정 페이지
 *
 * 사장님 계정 및 가게 설정을 관리하는 페이지입니다.
 *
 * 현재 기능:
 * - 가게 정보 수정 (이름, 주소, 전화번호)
 *
 * 향후 구현 예정:
 * - 계정 설정
 * - 알림 설정 등
 */
export default async function SellerSettingsPage() {
  // 1. 인증 확인
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 2. 가게 정보 조회
  const store = await getStore();

  if (!store) {
    // 가게가 없으면 업로드 페이지로 이동
    redirect("/seller/upload");
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="설정"
        description="가게 정보 및 계정 설정을 관리할 수 있습니다."
      />

      {/* 가게 정보 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <h2 className="text-lg font-semibold">📍 가게 정보</h2>
        </div>
        <StoreEditForm store={store} onUpdate={updateStore} />
      </div>

      {/* 매출 분석 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <h2 className="text-lg font-semibold">📊 매출 분석</h2>
        </div>
        <Link href="/seller/analytics">
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              매출 현황 보기
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 리뷰 관리 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <h2 className="text-lg font-semibold">⭐ 리뷰 관리</h2>
        </div>
        <Link href="/seller/reviews">
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              내 가게 리뷰 보기
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 추후 구현 예정 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <h2 className="text-lg font-semibold">👤 계정 설정</h2>
        </div>
        <div className="text-center text-muted-foreground py-4">
          <p>계정 설정 기능은 향후 구현될 예정입니다.</p>
        </div>
      </div>
    </div>
  );
}

