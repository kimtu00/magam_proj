"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-2xl font-bold">
          오늘마감
        </Link>
        {/* 역할 전환 버튼 (로그인 상태일 때만 표시) */}
        <SignedIn>
          <Link href="/onboarding">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent">
              🔄 역할 전환
            </button>
          </Link>
        </SignedIn>
      </div>
      <div className="flex gap-4 items-center">
        {/* 로그인 버튼 제거: 온보딩 페이지에서만 역할 선택 후 로그인 가능 */}
        <SignedIn>
          <UserButton afterSignOutUrl="/onboarding" />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
