import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/*
 * Logo chữ "FITLY." — thay `images/logo/logo.svg` của mẫu (logo Vineta). Vẽ
 * bằng chữ để dùng đúng font Playfair đã nạp qua next/font (SVG trong <img>
 * không thấy font của trang). Style `.logo-text` ở globals.scss.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href={ROUTES.home} className={cn("logo-text", className)} aria-label={APP_NAME}>
      {APP_NAME}<span className="text-primary">.</span>
    </Link>
  );
}
