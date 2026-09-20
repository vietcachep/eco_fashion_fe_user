import { IconBank, IconCard, IconCash } from "@/components/shared/icons";
import { TEN_PHUONG_THUC } from "@/features/order/hooks/order-status";
import type { BankTransferIntent, OrderResponse } from "@/features/order/types";

/*
 * Một dòng "trả bằng gì" của đơn: icon + tên phương thức + (thẻ) thương hiệu
 * và 4 số cuối. Dùng ở trang thành công và chi tiết đơn — một chỗ, một cách nói.
 */
const ICON = { cod: IconCash, bank_transfer: IconBank, card: IconCard, vnpay: IconCard } as const;
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

/*
 * Hướng dẫn chuyển khoản — hiện NGAY ở trang cảm ơn (lúc khách còn cầm điện
 * thoại) và ở chi tiết đơn khi chưa thanh toán. Nội dung là số phẳng, sao chép được.
 */
export function TransferInstructions({ intent, title = true }: { intent: BankTransferIntent; title?: boolean }) {
  const rows: [string, string][] = [
    ["Ngân hàng", intent.bank_code], ["Số tài khoản", intent.account_number], ["Chủ tài khoản", intent.account_name], ["Nội dung", intent.transfer_content],
  ];
  return (
    <div className="transfer-box">
      {title && (
        <>
          <p className="text-sm fw-medium text-primary">Chuyển khoản để hoàn tất đơn</p>
          <p className="text-xs text-main mb_12">Chuyển đúng nội dung bên dưới; đơn được xác nhận ngay khi tiền về.</p>
        </>
      )}
      <dl className="transfer-rows">
        {rows.map(([k, v]) => (
          <div key={k} className="d-flex justify-content-between gap-12 text-sm"><dt className="text-main">{k}</dt><dd className="fw-medium font-mono text-end">{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
