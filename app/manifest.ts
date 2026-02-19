import { MetadataRoute } from "next";

/**
 * PWA 매니페스트 설정
 * 
 * 모바일 앱처럼 보이도록 PWA 매니페스트를 설정합니다.
 * Mobile-First Web 환경에 최적화되어 있습니다.
 */
export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return {
    name: "오늘마감",
    short_name: "오늘마감",
    description: "지역 소상공인의 마감 임박 식품과 자취생을 연결하는 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

