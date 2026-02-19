import { MetadataRoute } from "next";

/**
 * robots.txt 생성
 * 
 * SEO를 위한 robots.txt 파일을 동적으로 생성합니다.
 * 프로덕션 환경에서는 모든 크롤러를 허용하고,
 * 개발 환경에서는 크롤링을 제한할 수 있습니다.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProduction ? "/" : "/",
        disallow: isProduction ? [] : ["/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

