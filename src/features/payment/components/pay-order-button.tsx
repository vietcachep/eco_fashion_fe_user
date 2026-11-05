"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { hasLivePaymentLink, usePayOrder, type PayableOrder } from "@/features/payment/hooks/use-pay-order";

/*
 * Nút "Thanh toán" cho một đơn CON chờ trả qua cổng online. Ba trạng thái, mỗi trạng thái nói đúng chuyện của nó:
 *   · còn link còn hạn            → "Thanh toán qua PayOS" mở thẳng cổng, kèm hạn của liên kết;
 *   · CHƯA có link (`payment_link_retryable` — PayOS chậm/lỗi lúc đặt, PLAN-0040 Tầng 1.3) → đơn VẪN được tạo; "Thanh toán lại" tạo liên kết lần đầu;
 *   · link đã HẾT HẠN             → "Thanh toán lại" xin liên kết mới và BE GIA HẠN cả hạn thanh toán của đơn (PLAN-0040 Tầng 1.2).
 * Hạn hiển thị luôn là `payment_expires_at` server trả (không tính 30 phút ở FE — setting `order.vnpay_timeout_minutes` do sàn đổi được); sau khi gia hạn, đơn tải lại
 * sẽ mang hạn mới. Khách không bao giờ gặp trang lỗi của cổng.
 * `noiBat` = đơn cần trả TIẾP THEO (giỏ nhiều shop trả lần lượt): nút đặc, các đơn còn lại viền.
 */
export function PayOrderButton({ order, noiBat = true, className }: { order: PayableOrder; noiBat?: boolean; className?: string }) {
  const pay = usePayOrder();
  const conHan = hasLivePaymentLink(order);
  const cong = "PayOS";
  const han = order.payment_expires_at ? formatDateTime(order.payment_expires_at) : null;
  return (
    <div className={cn("d-flex flex-column align-items-start gap-6", className)}>
      <button type="button" className={cn("tf-btn animate-btn btn-small", !noiBat && "btn-out-line-dark")} disabled={pay.isPending} onClick={() => pay.mutate(order)}>
        {pay.isPending ? "Đang mở cổng thanh toán..." : conHan ? `Thanh toán qua ${cong}` : "Thanh toán lại"}
      </button>
      <span className="text-xs text-main">
        {conHan
          ? han ? `Liên kết có hiệu lực đến ${han}.` : "Liên kết thanh toán đang có hiệu lực."
          : order.payment_link_retryable
            ? `Đơn của bạn đã được ghi nhận nhưng cổng ${cong} chưa tạo được liên kết thanh toán — bấm “Thanh toán lại” để thử lần nữa.${han ? ` Đơn cần thanh toán trước ${han}.` : ""}`
            : `Liên kết thanh toán cũ đã hết hạn${han ? ` (${han})` : ""} — bấm “Thanh toán lại” để lấy liên kết mới, hạn thanh toán của đơn sẽ được gia hạn.`}
      </span>
    </div>
  );
}
