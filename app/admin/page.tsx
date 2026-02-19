import { redirect } from "next/navigation";

/**
 * 관리자 홈 (리다이렉트)
 *
 * /admin 접근 시 자동으로 대시보드로 이동합니다.
 */
export default async function AdminPage() {
  redirect("/admin/dashboard");
}
