import type { Metadata } from "next";
import { CheckoutSuccessScreen } from "@/features/order/components/checkout/checkout-success-screen";

export const metadata: Metadata = { title: "Đặt hàng thành công" };

/*
 * Trang cảm ơn dùng dải tiêu đề riêng của Vineta (`title-success-order`), không dùng PageTitle.
 * `groupCode` là mã ĐƠN CHA (DHN…) — màn cũng nhận mã đơn con (DH…) và tự tìm ra nhóm chứa nó.
 */
export default async function CheckoutSuccessPage({ params }: { params: Promise<{ groupCode: string }> }) {
  const { groupCode } = await params;
  return <CheckoutSuccessScreen code={groupCode} />;
}
