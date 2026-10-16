import Link from "next/link";

/*
 * Liên kết của banner do admin nhập (PLAN-0010): đường dẫn nội bộ đi qua `next/link`; trang ngoài sàn (http/https) mở tab mới với
 * `rel="noopener noreferrer"`. Giá trị `href` PHẢI đã qua `lienKetBanner()` — component này không tự kiểm.
 */
export function BannerLink({ href, ngoai, className, children }: { href: string; ngoai: boolean; className?: string; children: React.ReactNode }) {
  return ngoai ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  ) : (
    <Link href={href} className={className}>{children}</Link>
  );
}
