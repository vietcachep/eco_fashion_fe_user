import type { Metadata } from "next";
import { SellerLanding } from "@/features/seller/components/seller-landing";

/*
 * /sell — người bán tự đăng ký gian hàng (PLAN-0009 ↔ backend PLAN-0019): giới thiệu + form + trạng thái hồ sơ của tôi.
 * Trang tĩnh; phần cần đăng nhập nằm ở đảo client bên trong `SellerLanding`.
 */
export const metadata: Metadata = {
  title: "Bán hàng cùng FITLY",
  description: "Đăng ký mở gian hàng trên FITLY — sàn duyệt hồ sơ, bạn bắt đầu bán.",
};

export default function SellPage() {
  return <SellerLanding />;
}
