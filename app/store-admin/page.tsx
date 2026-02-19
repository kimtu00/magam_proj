import { redirect } from "next/navigation";

/**
 * 사장님 관리 홈 (리다이렉트)
 *
 * /store-admin 접근 시 자동으로 대시보드로 이동합니다.
 */
export default async function StoreAdminPage() {
  redirect("/store-admin/dashboard");
}
