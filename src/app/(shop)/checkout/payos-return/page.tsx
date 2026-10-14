import type { Metadata } from "next";
import { PayosReturnScreen } from "@/features/payment/components/payos-return-screen";

export const metadata: Metadata = { title: "Kết quả thanh toán PayOS", robots: { index: false } };

const mot = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * PayOS đưa khách quay về đây kèm `?code=&id=&cancel=&status=&orderCode=` (cả khi thanh toán xong lẫn khi huỷ). Đọc bằng
 * `searchParams` (Promise ở Next 16) rồi chỉ giao cho màn hình đúng hai thứ nó cần; thiếu / sai tham số vẫn ra trang, không crash.
 */
export default async function PayosReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const orderCode = mot(sp.orderCode)?.trim().slice(0, 32) || null;
  const daHuy = mot(sp.cancel) === "true" || mot(sp.status)?.toUpperCase() === "CANCELLED";
  return <PayosReturnScreen orderCode={orderCode} daHuy={daHuy} />;
}
