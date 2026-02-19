/**
 * @file app/store-admin/profile/page.tsx
 * @description 가게 정보 페이지
 *
 * 구성:
 * 1. 가게 기본 정보 수정 폼 (가게명, 주소, 전화번호, 이미지)
 * 2. 사업자 정보 (추후 구현)
 * 3. 정산 계좌 안내
 *
 * @dependencies
 * - StoreEditForm: 공용 가게 정보 수정 폼
 * - updateStoreProfile: store-admin 전용 서버 액션
 */

import { PageHeader } from "@/components/shared/page-header";
import { auth } from "@clerk/nextjs/server";
import { StoreService } from "@/services/store";
import { StoreEditForm } from "@/components/shared/store-edit-form";
import { updateStoreProfile } from "@/app/store-admin/profile/actions";

export default async function StoreAdminProfilePage() {
  const { userId } = await auth();

  let store = null;
  if (userId) {
    store = await StoreService.findByOwnerId(userId);
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="가게 정보"
          description="가게 정보를 관리하세요."
          showBackButton={true}
          backButtonFallback="/store-admin/dashboard"
        />
        <div className="rounded-lg border bg-card p-6">
          <p className="text-center text-muted-foreground">
            가게 정보를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="가게 정보"
        description="가게 기본 정보와 정산 계좌를 관리하세요."
        showBackButton={true}
        backButtonFallback="/store-admin/dashboard"
      />

      {/* 가게 기본 정보 수정 폼 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">가게 기본 정보</h3>
        <StoreEditForm store={store} onUpdate={updateStoreProfile} />
      </div>

      {/* 사업자 정보 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">사업자 정보</h3>
        <p className="text-center text-muted-foreground">
          사업자 정보 관리는 추후 업데이트 예정입니다.
        </p>
      </div>

      {/* 정산 계좌 */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">정산 계좌</h3>
        <p className="text-center text-muted-foreground">
          정산 계좌 관리는 정산 내역 페이지에서 확인하세요.
        </p>
      </div>
    </div>
  );
}
