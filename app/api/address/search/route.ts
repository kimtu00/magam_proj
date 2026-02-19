import { NextRequest, NextResponse } from "next/server";

/**
 * 카카오 주소 검색 API 프록시
 *
 * CORS 이슈를 우회하기 위해 서버에서 카카오 API를 호출합니다.
 * 클라이언트에서 직접 호출하면 CORS 에러가 발생할 수 있습니다.
 *
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#address-coord
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;

    if (!apiKey) {
      console.error("❌ NEXT_PUBLIC_KAKAO_REST_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 카카오 주소 검색 API 호출
    const kakaoResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    );

    if (!kakaoResponse.ok) {
      console.error("❌ 카카오 API 호출 실패:", kakaoResponse.status);
      return NextResponse.json(
        { error: "주소 검색에 실패했습니다." },
        { status: kakaoResponse.status }
      );
    }

    const data = await kakaoResponse.json();

    // 검색 결과가 없는 경우
    if (!data.documents || data.documents.length === 0) {
      return NextResponse.json({
        documents: [],
        meta: { total_count: 0 },
      });
    }

    // 필요한 정보만 추출하여 반환
    const results = data.documents.map((doc: any) => ({
      address_name: doc.address_name,
      address_type: doc.address_type,
      x: parseFloat(doc.x), // 경도 (longitude)
      y: parseFloat(doc.y), // 위도 (latitude)
      road_address: doc.road_address
        ? {
            address_name: doc.road_address.address_name,
            building_name: doc.road_address.building_name,
            zone_no: doc.road_address.zone_no,
          }
        : null,
    }));

    return NextResponse.json({
      documents: results,
      meta: {
        total_count: data.meta.total_count,
        pageable_count: data.meta.pageable_count,
      },
    });
  } catch (error) {
    console.error("주소 검색 에러:", error);
    return NextResponse.json(
      { error: "주소 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


