import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 확인
  const admin = await isAdmin();
  
  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
