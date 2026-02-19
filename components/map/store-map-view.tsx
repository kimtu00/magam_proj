'use client';

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

type StoreMarker = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

interface StoreMapViewProps {
  stores: StoreMarker[];
  className?: string;
}

/**
 * 여러 가게를 지도에 표시하는 Kakao Map 뷰
 *
 * - 각 가게를 마커로 표시
 * - 마커 클릭 시 가게 이름/주소가 담긴 인포윈도우 표시
 */
export function StoreMapView({ stores, className = "w-full h-[420px]" }: StoreMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // Kakao Maps 스크립트 동적 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.kakao && window.kakao.maps) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com"]'
    );
    if (existingScript) {
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          setScriptLoaded(true);
          clearInterval(checkKakao);
        }
      }, 100);
      return () => clearInterval(checkKakao);
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, []);

  // 스크립트 로드 후 지도 및 마커 렌더링
  useEffect(() => {
    if (!scriptLoaded) return;
    if (!mapContainerRef.current) return;
    if (!stores || stores.length === 0) return;

    if (!window.kakao || !window.kakao.maps) {
      setScriptError(true);
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      // 기본 중심: 첫 번째 가게
      const first = stores[0];
      const center = new window.kakao.maps.LatLng(first.latitude, first.longitude);

      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center,
        level: 4,
      });

      const bounds = new window.kakao.maps.LatLngBounds();
      const infoWindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });

      stores.forEach((store) => {
        const position = new window.kakao.maps.LatLng(store.latitude, store.longitude);
        bounds.extend(position);

        const marker = new window.kakao.maps.Marker({
          position,
          title: store.name,
        });
        marker.setMap(map);

        const content = `
          <div style="padding:10px;min-width:180px;">
            <div style="font-weight:bold;margin-bottom:4px;">${store.name}</div>
            ${
              store.address
                ? `<div style="font-size:12px;color:#666;margin-bottom:6px;">${store.address}</div>`
                : ""
            }
            <div style="margin-top:4px;">
              <a
                href="/buyer/store/${store.id}"
                style="display:inline-block;font-size:12px;color:#2563eb;text-decoration:underline;"
              >
                이 가게 상품 보러가기
              </a>
            </div>
          </div>
        `;

        window.kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.setContent(content);
          infoWindow.open(map, marker);
        });
      });

      if (stores.length > 1) {
        map.setBounds(bounds);
      } else {
        map.setCenter(center);
      }
    });
  }, [scriptLoaded, stores]);

  if (scriptError) {
    return (
      <div
        className={`${className} bg-muted`}
        style={{
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-sm text-muted-foreground">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div
        className={`${className} bg-muted`}
        style={{
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div
        className={`${className} bg-muted`}
        style={{
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-sm text-muted-foreground">표시할 가게가 없습니다</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{ minHeight: "280px" }}
    />
  );
}

