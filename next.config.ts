import type { NextConfig } from "next";

/*
 * Ảnh sản phẩm/banner đến từ Cloudinary (seed + upload) hoặc ảnh tĩnh do API phục vụ (`/static/seed/...` khi
 * chưa cấu hình Cloudinary) — `next/image` chỉ tối ưu host có trong danh sách (PLAN-0006).
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.vietqr.io" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
