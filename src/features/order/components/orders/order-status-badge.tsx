import { cn } from "@/lib/utils";
import { MAU_TRANG_THAI, TRANG_THAI_DON, TRANG_THAI_THANH_TOAN, nhanHoanTien } from "@/features/order/hooks/order-status";
import type { OrderStatus, PaymentStatus, RefundSummary } from "@/features/order/types";

/*
 * Nhãn trạng thái đơn / thanh toán. Màu chỉ ba nhóm: đang chạy tốt (xanh),
 * cần chú ý (cam), đã dừng (xám) — không dùng màu chủ đạo cho trạng thái,
 * màu đó dành cho giá và nút mua.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("status-badge", `is-${MAU_TRANG_THAI[status]}`)}>{TRANG_THAI_DON[status]}</span>;
}

/* Có khoản hoàn (`refund`) thì nhãn hoàn tiền THAY cho nhãn thanh toán: "Đang hoàn tiền X ₫" / "Đã hoàn X ₫". */
export function PaymentStatusBadge({ status, refund, carrierCodStatus }: { status: PaymentStatus; refund?: RefundSummary | null; carrierCodStatus?: string | null }) {
  if (refund) {
    const h = nhanHoanTien(refund, status);
    return <span className={cn("status-badge", `is-${h.mau}`)}>{h.label}</span>;
  }
  if (carrierCodStatus === "collected_pending_remittance") return <span className="status-badge is-ok">Đã trả tiền cho hãng giao hàng</span>;
  return <span className={cn("status-badge", status === "paid" ? "is-ok" : status === "refunded" ? "is-muted" : "is-warn")}>{TRANG_THAI_THANH_TOAN[status]}</span>;
}
