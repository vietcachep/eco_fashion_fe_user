import { IconBank, IconCard, IconCash } from "@/components/shared/icons";
import { TEN_PHUONG_THUC } from "@/features/order/hooks/order-status";
import type { OrderResponse } from "@/features/order/types";

/*
 * Một dòng "trả bằng gì" của đơn: icon + tên phương thức + (thẻ) thương hiệu
 * và 4 số cuối. Dùng ở chi tiết đơn — một chỗ, một cách nói. (Hướng dẫn chuyển khoản
 * có QR + số tiền + hạn nằm ở `payment/components/bank-transfer-panel`.)
 */
const ICON = { cod: IconCash, bank_transfer: IconBank, card: IconCard, vnpay: IconCard, payos: IconBank } as const;
const TEN_THE: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", jcb: "JCB" };

export function PaymentSummary({ order }: { order: Pick<OrderResponse, "payment_method_code" | "card_brand" | "card_last4"> }) {
  const Icon = ICON[order.payment_method_code];
  return (
    <p className="pay-summary text-sm">
      <span className="pm-icon on-soft" aria-hidden><Icon /></span>
      <span>
        {TEN_PHUONG_THUC[order.payment_method_code]}
        {order.card_last4 && <span className="text-main font-mono"> · {TEN_THE[order.card_brand ?? ""] ?? order.card_brand} •••• {order.card_last4}</span>}
      </span>
    </p>
  );
}
