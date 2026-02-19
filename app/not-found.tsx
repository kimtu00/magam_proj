import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 404 Not Found 페이지
 * 
 * Mobile-First 디자인을 적용한 커스텀 404 페이지입니다.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

