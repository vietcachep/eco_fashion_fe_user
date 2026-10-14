import type { NextConfig } from "next";

/*
 * Ảnh sản phẩm/banner/logo shop đến từ Cloudinary (seed + upload) hoặc ảnh tĩnh do API phục vụ
 * (`/static/seed/**`, `/static/uploads/**` khi chưa cấu hình Cloudinary) — `next/image` chỉ tối ưu host có trong
 * danh sách (PLAN-0006).
 *
 * Host của API lấy từ `NEXT_PUBLIC_API_URL` (không hard-code) và chỉ mở đúng thư mục tĩnh `/static/**`, để đổi môi
 * trường (staging/production) là ảnh vẫn đi qua bộ tối ưu mà không phải sửa file này.
 *
 * Next 16 CHẶN tối ưu ảnh từ IP nội bộ theo mặc định (`dangerouslyAllowLocalIP`): API chạy ở `localhost:4000` lúc dev
 * sẽ trả 400 cho `/_next/image?url=http://localhost:4000/static/...` dù host đã nằm trong `remotePatterns`. Chỉ bật
 * ngoài production — trên server thật ảnh nằm ở CDN/host công khai nên giữ chặn.
 */
function mauHostApi(): { protocol: "http" | "https"; hostname: string; port: string; pathname: string } | null {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { protocol: u.protocol === "https:" ? "https" : "http", hostname: u.hostname, port: u.port, pathname: "/static/**" };
  } catch {
    return null;
  }
}

const hostApi = mauHostApi();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.vietqr.io" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...(hostApi ? [hostApi] : []),
    ],
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
