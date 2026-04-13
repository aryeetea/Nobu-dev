import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  transpilePackages: ["@guansss/pixi-live2d-display"],
  async headers() {
    const headers = [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];

    if (isDevelopment) {
      headers.push({
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
          {
            key: "Clear-Site-Data",
            value: '"cache"',
          },
        ],
      });
    }

    return headers;
  },
};

export default nextConfig;
