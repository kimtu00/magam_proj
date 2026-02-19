import { redirect } from "next/navigation";

/**
 * 예약 내역 페이지 - /buyer/orders로 리다이렉트
 *
 * @deprecated 이 페이지는 /buyer/orders로 통합되었습니다.
 */
export default async function BuyerReservationsPage() {
  redirect("/buyer/orders");
}
