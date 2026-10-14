import type { Metadata } from "next";
import { VnpayReturnScreen } from "@/features/payment/components/vnpay-return-screen";

export const metadata: Metadata = { title: "Kết quả thanh toán VNPay", robots: { index: false } };

/*
 * Cổng VNPay chuyển hướng về đây kèm query `vnp_*`. BE kiểm chữ ký trên đúng bộ tham số cổng gửi nên truyền NGUYÊN query
 * (mỗi khoá lấy giá trị đầu) cho màn hình — không lọc, không đổi tên.
 */
export default async function VnpayReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const gia = Array.isArray(v) ? v[0] : v;
    if (gia !== undefined) query[k] = gia;
  }
  return <VnpayReturnScreen query={query} />;
}
