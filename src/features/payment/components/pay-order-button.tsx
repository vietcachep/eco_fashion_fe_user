"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { hasLivePaymentLink, usePayOrder, type PayableOrder } from "@/features/payment/hooks/use-pay-order";

/*
 * Nút "Thanh toán" cho một đơn CON chờ trả qua cổng online. Còn link thì mở thẳng cổng; link hết hạn thì nút đổi
 * thành "Tạo lại liên kết thanh toán" (xin link mới) và nói rõ vì sao — khách không bao giờ gặp trang lỗi của cổng.
 * `noiBat` = đơn cần trả TIẾP THEO (giỏ nhiều shop trả lần lượt): nút đặc, các đơn còn lại viền.
 */
export function PayOrderButton({ order, noiBat = true, className }: { order: PayableOrder; noiBat?: boolean; className?: string }) {
  const pay = usePayOrder();
  const conHan = hasLivePaymentLink(order);
  const cong = order.payment_method_code === "payos" ? "PayOS" : "VNPay";
  return (
    <div className={cn("d-flex flex-column align-items-start gap-6", className)}>
      <button type="button" className={cn("tf-btn animate-btn btn-small", !noiBat && "btn-out-line-dark")} disabled={pay.isPending} onClick={() => pay.mutate(order)}>
        {pay.isPending ? "Đang mở cổng thanh toán..." : conHan ? `Thanh toán qua ${cong}` : "Tạo lại liên kết thanh toán"}
      </button>
      <span className="text-xs text-main">
        {conHan
          ? order.payment_expires_at ? `Liên kết có hiệu lực đến ${formatDateTime(order.payment_expires_at)}.` : "Liên kết thanh toán đang có hiệu lực."
          : "Liên kết thanh toán cũ đã hết hạn — bấm để lấy liên kết mới."}
      </span>
    </div>
  );
}
