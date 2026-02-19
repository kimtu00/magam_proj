import { redirect } from "next/navigation";

/**
 * 사장님 메인 페이지
 *
 * `/seller` 경로로 접근 시 `/seller/dashboard`로 리다이렉트합니다.
 * Phase 2-3에서 dashboard 페이지가 구현될 예정입니다.
 */
export default function SellerPage() {
  redirect("/seller/dashboard");
}

