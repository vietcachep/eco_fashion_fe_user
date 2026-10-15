import { IconBank, IconCash } from "@/components/shared/icons";
import { tenPhuongThuc } from "@/features/order/hooks/order-status";
import type { OrderResponse } from "@/features/order/types";

/* Một dòng "trả bằng gì" của đơn: icon + tên phương thức. Mã đơn cũ (vnpay, chuyển khoản) vẫn hiện nhãn chung, không lỗi. */
export function PaymentSummary({ order }: { order: Pick<OrderResponse, "payment_method_code"> }) {
  const Icon = order.payment_method_code === "cod" ? IconCash : IconBank;
  return (
    <p className="pay-summary text-sm">
      <span className="pm-icon on-soft" aria-hidden><Icon /></span>
      <span>{tenPhuongThuc(order.payment_method_code)}</span>
    </p>
  );
}
