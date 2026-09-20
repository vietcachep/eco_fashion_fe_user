import { cn } from "@/lib/utils";
import { MAU_TRANG_THAI, TRANG_THAI_DON, TRANG_THAI_THANH_TOAN } from "@/features/order/hooks/order-status";
import type { OrderStatus, PaymentStatus } from "@/features/order/types";

/*
 * Nhãn trạng thái đơn / thanh toán. Màu chỉ ba nhóm: đang chạy tốt (xanh),
 * cần chú ý (cam), đã dừng (xám) — không dùng màu chủ đạo cho trạng thái,
 * màu đó dành cho giá và nút mua.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("status-badge", `is-${MAU_TRANG_THAI[status]}`)}>{TRANG_THAI_DON[status]}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn("status-badge", status === "paid" ? "is-ok" : status === "refunded" ? "is-muted" : "is-warn")}>{TRANG_THAI_THANH_TOAN[status]}</span>;
}
