import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "ldvwhgktacbwryeqebfz.supabase.co" },
    ],
  },
};

export default nextConfig;
