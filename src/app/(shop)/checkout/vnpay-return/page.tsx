import type { Metadata } from "next";
import { Suspense } from "react";
import { VnpayReturnScreen } from "@/features/payment/components/vnpay-return-screen";

export const metadata: Metadata = { title: "Kết quả thanh toán VNPay" };

/* Cổng VNPay chuyển hướng về đây kèm query (vnp_*); màn hình đọc query ở client nên bọc Suspense. */
export default function VnpayReturnPage() {
  return <Suspense fallback={null}><VnpayReturnScreen /></Suspense>;
}
