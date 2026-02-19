'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  storeName: string;
  address?: string;
  className?: string;
}

export function KakaoMap({
  latitude,
  longitude,
  storeName,
  address,
  className = 'w-full h-64',
}: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // 1단계: Kakao Maps API 스크립트 동적 로드
  useEffect(() => {
    // 이미 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      console.log('✅ Kakao script already loaded');
      setScriptLoaded(true);
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      console.log('⏳ Kakao script tag exists, waiting for load...');
      
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          console.log('✅ Kakao API is now available');
          setScriptLoaded(true);
          clearInterval(checkKakao);
        }
      }, 100);

      return () => clearInterval(checkKakao);
    }

    // 스크립트 동적 생성
    console.log('📦 Loading Kakao Maps API script...');
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY}&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Kakao Maps API script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Kakao Maps API script');
      setScriptError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup은 하지 않음 (다른 컴포넌트에서도 사용할 수 있음)
    };
  }, []);

  // 2단계: 스크립트 로드 후 지도 렌더링
  useEffect(() => {
    if (!scriptLoaded) {
      return;
    }

    console.group('🗺️ Kakao Map Debug');
    console.log('Props:', { latitude, longitude, storeName, address });
    console.log('Container:', mapContainer.current);
    console.log('window.kakao:', window.kakao);
    console.groupEnd();

    const loadKakaoMap = () => {
      if (!window.kakao) {
        console.warn('⚠️ window.kakao is not defined');
        return;
      }

      if (!window.kakao.maps) {
        console.warn('⚠️ window.kakao.maps is not defined');
        return;
      }

      console.log('✅ Kakao Maps API is available');

      window.kakao.maps.load(() => {
        console.log('✅ kakao.maps.load() callback executed');
        
        if (!mapContainer.current) {
          console.error('❌ Map container not found');
          return;
        }

        try {
          console.log(`🎯 Creating map at lat=${latitude}, lng=${longitude}`);

          const options = {
            center: new window.kakao.maps.LatLng(latitude, longitude),
            level: 3,
          };

          const map = new window.kakao.maps.Map(mapContainer.current, options);
          console.log('✅ Map created:', map);

          const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
          
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            title: storeName,
          });

          marker.setMap(map);
          console.log('✅ Marker added to map');

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:10px;min-width:150px;">
                <div style="font-weight:bold;margin-bottom:5px;">${storeName}</div>
                ${address ? `<div style="font-size:12px;color:#666;">${address}</div>` : ''}
              </div>
            `,
          });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(map, marker);
          });

          infowindow.open(map, marker);
          console.log('✅ Map rendering complete!');
        } catch (error) {
          console.error('❌ Error creating map:', error);
        }
      });
    };

    loadKakaoMap();
  }, [scriptLoaded, latitude, longitude, storeName, address]);

  if (scriptError) {
    return (
      <div className={`${className} bg-muted`} style={{ minHeight: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-sm text-muted-foreground">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className={`${className} bg-muted`} style={{ minHeight: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={className}
      style={{ minHeight: '256px' }}
    />
  );
}

