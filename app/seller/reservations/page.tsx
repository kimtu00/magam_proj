import { getStoreReservations } from "./actions";
import { ReservationListView } from "./reservation-list-view";
import { PageHeader } from "@/components/shared/page-header";

/**
 * 사장님 예약 관리 페이지
 * 
 * 가게에 등록된 상품들의 모든 예약 내역을 조회하고 관리할 수 있습니다.
 */
export default async function SellerReservationsPage() {
  // 초기 데이터 로드 (전체 예약)
  const initialReservations = await getStoreReservations("ALL");

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="예약 관리"
        description="고객의 예약 내역을 확인하고 관리할 수 있습니다."
      />

      {/* 예약 목록 (필터 포함) */}
      <ReservationListView initialReservations={initialReservations} />
    </div>
  );
}


