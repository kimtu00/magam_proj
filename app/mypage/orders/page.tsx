/**
 * @file app/mypage/orders/page.tsx
 * @description 주문 내역 페이지 - /buyer/orders로 리다이렉트
 * 
 * @deprecated 이 페이지는 /buyer/orders로 통합되었습니다.
 */

import { redirect } from "next/navigation";

export default async function MypageOrdersPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "all";
  
  redirect(`/buyer/orders?status=${status}`);
}
