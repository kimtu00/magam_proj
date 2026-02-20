/**
 * @file app/admin/payback/page.tsx
 * @description 관리자 페이백 심사 페이지
 *
 * 서버 컴포넌트: getPendingReceipts / getPaybackHistory 호출 후
 * PaybackReceiptList 클라이언트 컴포넌트에 데이터 전달.
 */

import { PageHeader } from "@/components/shared/page-header";
import { PaybackReceiptList } from "@/components/admin/payback-receipt-list";
import { getPendingReceipts, getPaybackHistory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPaybackPage() {
  const [pending, history] = await Promise.all([
    getPendingReceipts("pending"),
    getPaybackHistory(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="페이백 심사"
        description="제출된 영수증을 심사하고 페이백을 승인하세요."
      />

      <PaybackReceiptList pending={pending} history={history} />
    </div>
  );
}
