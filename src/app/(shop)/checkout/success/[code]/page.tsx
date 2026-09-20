import type { Metadata } from "next";
import { CheckoutSuccessScreen } from "@/features/order/components/checkout/checkout-success-screen";

export const metadata: Metadata = { title: "Đặt hàng thành công" };

/* Trang cảm ơn dùng dải tiêu đề riêng của Vineta (`title-success-order`), không dùng PageTitle. */
export default async function CheckoutSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CheckoutSuccessScreen code={code} />;
}
