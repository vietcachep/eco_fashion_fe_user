import type { HeroSlide } from "@/features/catalog/components/home/hero";
import type { BannerResponse } from "@/features/catalog/types";

/*
 * Chuyển banner do admin quản (PLAN-0010) sang thứ trang chủ dựng được. Hàm thuần — không React, không gọi mạng.
 * Mọi giá trị từ API đi qua đây trước khi thành `href`/`src`: banner do con người nhập nên không tin — chặn `javascript:`, `//host`,
 * `/\host` (trình duyệt coi như `//host`) và ảnh từ host chưa khai báo trong `next.config.ts` (`next/image` ném lỗi làm vỡ cả trang chủ).
 */

export interface LienKet {
  href: string;
  /* true = trang ngoài sàn: mở tab mới, `rel="noopener noreferrer"`. */
  ngoai: boolean;
}

export function lienKetBanner(raw: string | null | undefined): LienKet | null {
  const s = raw?.trim();
  if (!s) return null;
  if (s.startsWith("/")) {
    // Đường dẫn nội bộ: không `//`, không `\`, không khoảng trắng/ký tự điều khiển (tab/CR/LF bị trình duyệt bỏ đi → thành `//host`).
    return s.startsWith("//") || /[\\\s\u0000-\u001f]/.test(s) ? null : { href: s, ngoai: false };
  }
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? { href: u.toString(), ngoai: true } : null;
  } catch {
    return null;
  }
}

/* Cùng danh sách host với `images.remotePatterns` của next.config.ts: Cloudinary, `/static/**` của API, localhost khi dev; hoặc ảnh nội bộ trong public/. */
export function anhBannerHopLe(url: string): boolean {
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    const u = new URL(url);
    if (u.protocol === "https:" && u.hostname === "res.cloudinary.com") return true;
    if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return true;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const a = new URL(api);
      return u.hostname === a.hostname && u.port === a.port && u.pathname.startsWith("/static/");
    }
  } catch {
    // URL hỏng ⇒ không hợp lệ
  }
  return false;
}

/* Banner `hero` → slide của `Hero`. Banner không có dòng "eyebrow" và chỉ có nút khi có link; màu nền xoay vòng 3 kiểu của mẫu. */
export function bannerSangSlide(b: BannerResponse, index: number): HeroSlide {
  const lk = lienKetBanner(b.link_url);
  return {
    id: b.id,
    imageUrl: b.image_url,
    bgType: `bg-type-${(index % 3) + 1}`,
    eyebrow: "",
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: "Khám phá ngay",
    ctaHref: lk?.href ?? null,
    ctaExternal: lk?.ngoai ?? false,
  };
}
