/**
 * @file app/mypage/profile/page.tsx
 * @description 프로필 설정 페이지
 * 
 * 프로필 편집 + 알림 설정 + 계좌 관리 + 회원 탈퇴
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/mypage/profile-form";
import { NotificationSettings } from "@/components/mypage/notification-settings";
import { BankAccountForm } from "@/components/mypage/bank-account-form";
import { DeleteAccountSection } from "@/components/mypage/delete-account-section";
import type { BankAccountData } from "@/types/consumer";

/**
 * 계좌 정보 조회 (직접 DB 조회)
 */
async function getBankAccount(userId: string): Promise<BankAccountData | null> {
  const supabase = await createClient();

  const { data: bankAccount, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  // 계좌가 없는 경우 (첫 등록 전)
  if (error && error.code === "PGRST116") {
    return null;
  }

  if (error) {
    console.error("Bank account query error:", error);
    return null;
  }

  return bankAccount;
}

/**
 * 프로필 설정 페이지
 */
export default async function MypageProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Clerk에서 사용자 정보 조회
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  // 계좌 정보 조회
  const bankAccount = await getBankAccount(userId);

  const profileData = {
    name:
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "사용자",
    phone: clerkUser.phoneNumbers[0]?.phoneNumber,
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[430px] mx-auto p-4 space-y-6">
        <PageHeader
          title="내 정보"
          description="프로필 및 설정을 관리하세요."
          showBackButton={true}
          backButtonFallback="/mypage"
        />

        {/* 프로필 편집 */}
        <ProfileForm initialData={profileData} />

        {/* 알림 설정 */}
        <NotificationSettings />

        {/* 계좌 관리 */}
        <BankAccountForm initialData={bankAccount} />

        {/* 회원 탈퇴 */}
        <DeleteAccountSection />
      </div>
    </div>
  );
}
