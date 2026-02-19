import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@/components/ui/toaster";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { RoleRedirectProvider } from "@/components/providers/role-redirect-provider";
import { koreanLocalization } from "@/lib/clerk/localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 한국어 본문 폰트 — 브랜드 가이드라인에 따라 Noto Sans KR 적용 */
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "오늘마감",
  description: "지역 소상공인의 마감 임박 식품과 소비자를 연결하는 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        <body
          className={`${notoSansKR.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <RoleRedirectProvider>
              <Navbar />
              {children}
            </RoleRedirectProvider>
          </SyncUserProvider>
          <SonnerToaster />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
