import { MetadataRoute } from "next";

/**
 * 동적 사이트맵 생성
 * 
 * SEO를 위한 사이트맵을 동적으로 생성합니다.
 * 주요 페이지 경로를 포함합니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  // 정적 페이지 경로
  const routes = [
    "",
    "/auth-test",
    "/storage-test",
    "/instruments",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}

