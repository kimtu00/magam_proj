import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

/**
 * Supabase 공식 문서 예시: instruments 페이지
 * https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 *
 * 이 페이지는 Supabase 공식 문서의 예시를 기반으로 작성되었습니다.
 * instruments 테이블의 데이터를 조회하여 표시합니다.
 */
async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    console.error("Error fetching instruments:", error);
    return (
      <div className="p-4 text-red-600">
        Error loading instruments: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Instruments</h1>
      {instruments && instruments.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {instruments.map((instrument) => (
            <li key={instrument.id} className="text-lg">
              {instrument.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No instruments found.</p>
      )}
    </div>
  );
}

export default function Instruments() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div className="p-4">Loading instruments...</div>}>
        <InstrumentsData />
      </Suspense>
    </div>
  );
}

